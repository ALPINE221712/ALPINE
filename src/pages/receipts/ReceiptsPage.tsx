import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ReceiptItem } from '../../types';

export const ReceiptsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { receipts, products, validateReceipt, createReceipt, addToast } = useInventory();

  const [selectedReceiptId, setSelectedReceiptId] = useState<string>(id || receipts[0]?.id || 'REC-001');

  useEffect(() => {
    if (id) {
      setSelectedReceiptId(id);
    }
  }, [id]);

  // Is "new" route or query parameter
  const isNewRoute = location.pathname.endsWith('/new');
  const [isNewModalOpen, setIsNewModalOpen] = useState(isNewRoute);

  useEffect(() => {
    if (isNewRoute) setIsNewModalOpen(true);
  }, [isNewRoute]);

  // Filters
  const [statusTab, setStatusTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected receipt
  const selectedReceipt = useMemo(
    () => receipts.find((r) => r.id === selectedReceiptId) || receipts[0],
    [receipts, selectedReceiptId]
  );

  // Editable item counts in the active inspector
  const [itemCounts, setItemCounts] = useState<{ [itemId: string]: number }>({});

  useEffect(() => {
    if (selectedReceipt) {
      const counts: { [itemId: string]: number } = {};
      selectedReceipt.items.forEach((it) => {
        counts[it.id] = it.receivedQty || it.expectedQty;
      });
      setItemCounts(counts);
    }
  }, [selectedReceipt]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch =
        !searchTerm ||
        r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.bolNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusTab === 'All' ||
        (statusTab === 'Waiting' ? r.status === 'Waiting' : r.status === statusTab);

      return matchSearch && matchStatus;
    });
  }, [receipts, searchTerm, statusTab]);

  // Summary Metrics
  const awaitingCount = receipts.filter((r) => r.status === 'Waiting').length;
  const inInspectionCount = receipts.filter((r) => r.status === 'Ready').length;
  const completedCount = receipts.filter((r) => r.status === 'Done').length;
  const discrepancyCount = receipts.filter((r) => r.hasDiscrepancy).length;

  // New Receipt Form State
  const [newPoForm, setNewPoForm] = useState({
    poNumber: 'PO-78900',
    supplier: 'NexaMetals Industrial Corp',
    carrier: 'FreightWay Express',
    bolNumber: 'FW-992310',
    stagedBay: 'Main WH / Dock 02',
    warehouseId: 'WH-01',
    expectedDate: 'Today, 15:00',
    notes: 'Regular scheduled inbound supplier manifest.',
    items: [
      {
        productId: 'PRD-001',
        expectedQty: 200,
        targetBin: 'WH-01 Bin E-12',
      },
    ],
  });

  const handleValidate = () => {
    if (!selectedReceipt) return;
    const res = validateReceipt(selectedReceipt.id);
    if (!res.success) {
      addToast({ type: 'warning', title: 'Action Warning', message: res.message });
    }
  };

  const handleCreateReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lineItems: ReceiptItem[] = newPoForm.items.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId) || products[0];
      return {
        id: `RITM-${Date.now()}-${idx}`,
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        unit: prod.unit,
        expectedQty: Number(it.expectedQty),
        receivedQty: Number(it.expectedQty),
        targetBin: it.targetBin || prod.primaryLocation,
        status: 'Matched',
      };
    });

    const totalUnits = lineItems.reduce((acc, it) => acc + it.expectedQty, 0);

    const created = createReceipt({
      poNumber: newPoForm.poNumber,
      supplier: newPoForm.supplier,
      carrier: newPoForm.carrier,
      bolNumber: newPoForm.bolNumber,
      stagedBay: newPoForm.stagedBay,
      warehouseId: newPoForm.warehouseId,
      status: 'Ready',
      expectedDate: newPoForm.expectedDate,
      notes: newPoForm.notes,
      totalExpectedUnits: totalUnits,
      totalReceivedUnits: totalUnits,
      items: lineItems,
      step: 2,
    });

    setIsNewModalOpen(false);
    setSelectedReceiptId(created.id);
    navigate('/receipts');
  };

  return (
    <div className="flex flex-col gap-space-lg p-6 w-full flex-1">
      {/* Screen Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant shadow-sm">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              <Icon name="inventory_2" className="text-xs" />
              Purchase Orders &amp; Receiving
            </span>
            <span className="font-label-sm text-label-sm text-outline">Terminal ID: INB-STATION-04</span>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              EDI Sync: Ready
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Receipts &amp; Inbound Shipments
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
            Process incoming vendor shipments, verify physical quantities against POs, inspect quality, and allocate goods to warehouse bins.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap self-start md:self-auto">
          <button
            onClick={() => {
              const csv = 'Receipt,PO,Supplier,Carrier,Units,Status\n' + receipts.map(r => `"${r.receiptNumber}","${r.poNumber}","${r.supplier}","${r.carrier}",${r.totalExpectedUnits},"${r.status}"`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'inbound_manifests.csv';
              a.click();
              addToast({ type: 'success', title: 'Manifest Downloaded', message: 'Inbound PO manifests exported.' });
            }}
            className="h-8 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm rounded flex items-center gap-space-xs transition-colors border border-outline-variant shadow-xs"
          >
            <Icon name="download" className="text-base text-outline" />
            <span>Export Manifest</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="h-8 px-space-lg bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded flex items-center gap-space-xs transition-colors shadow-sm"
          >
            <Icon name="add" className="text-base" />
            <span>+ Create Receipt</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Workflow Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Awaiting Arrival
              </span>
              <span className="font-tabular-kpi text-tabular-kpi text-on-surface mt-1 font-mono">
                {awaitingCount} Shipments
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <Icon name="local_shipping" className="text-lg" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between font-body-sm text-body-sm pt-2 border-t border-slate-100">
            <span className="text-on-surface-variant">Expected units</span>
            <span className="font-label-sm text-label-sm text-primary font-semibold bg-primary-fixed px-1.5 py-0.5 rounded">
              Active Inbound
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                In Inspection / Staging
              </span>
              <span className="font-tabular-kpi text-tabular-kpi text-on-surface mt-1 font-mono">
                {inInspectionCount} Shipments
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-secondary-container flex items-center justify-center text-primary-container">
              <Icon name="fact_check" className="text-lg" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between font-body-sm text-body-sm pt-2 border-t border-slate-100">
            <span className="text-on-surface-variant">Active Docks</span>
            <span className="font-mono text-on-surface font-semibold text-xs">Dock 02 &amp; Dock 04</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Completed Today
              </span>
              <span className="font-tabular-kpi text-tabular-kpi text-tertiary mt-1 font-mono font-bold">
                {completedCount} Receipts
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-tertiary">
              <Icon name="check_circle" className="text-lg" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between font-body-sm text-body-sm pt-2 border-t border-slate-100">
            <span className="text-on-surface-variant">Stock ledger status</span>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold">
              Updated in Ledger
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-error uppercase tracking-wider font-semibold">
                Variance / Discrepancies
              </span>
              <span className="font-tabular-kpi text-tabular-kpi text-error mt-1 font-mono font-bold">
                {discrepancyCount} Flagged
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-error-container flex items-center justify-center text-on-error-container">
              <Icon name="warning" className="text-lg" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between font-body-sm text-body-sm pt-2 border-t border-slate-100">
            <span className="text-on-surface-variant">Active investigation</span>
            <span className="font-label-sm text-label-sm text-error font-semibold bg-error-container px-1.5 py-0.5 rounded">
              PO-77834 short 2 units
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Operational Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-space-md flex flex-col gap-space-md">
        {/* Top Tab Row */}
        <div className="flex items-center justify-between gap-space-md flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {['All', 'Waiting', 'Ready', 'Done', 'Draft'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`h-7 px-3 rounded font-title-sm text-title-sm transition-colors ${
                  statusTab === tab
                    ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {tab === 'All' ? 'All Receipts' : tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Auto-sync ASN EDI
            </span>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="relative flex items-center">
          <Icon name="search" className="absolute left-2.5 text-base text-outline pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Receipt #, PO, Supplier, BOL, or SKU..."
            className="w-full h-8 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 text-outline">
              <Icon name="close" className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Split Master Table & Active Receiving Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* LEFT: Primary Inbound Receipts Table (6-7 cols) */}
        <div className="lg:col-span-6 2xl:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-space-md py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                Incoming Manifests &amp; Staged POs
              </span>
              <span className="font-label-sm text-label-sm bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded text-on-surface-variant font-mono">
                {filteredReceipts.length} manifests
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-2.5 px-3 font-semibold">Receipt / PO</th>
                  <th className="py-2.5 px-3 font-semibold">Supplier</th>
                  <th className="py-2.5 px-3 font-semibold">Expected Time</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Units</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body-sm text-body-sm">
                {filteredReceipts.map((r) => {
                  const isSelected = r.id === selectedReceipt?.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReceiptId(r.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 font-medium border-l-4 border-primary'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-title-sm text-title-sm text-primary font-bold font-mono">
                          {r.receiptNumber}
                        </div>
                        <div className="font-label-sm text-label-sm text-outline font-mono">{r.poNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-on-surface truncate max-w-[150px]">{r.supplier}</div>
                        <div className="text-xs text-outline truncate">{r.carrier}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-on-surface-variant font-mono">
                        {r.expectedDate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {r.totalExpectedUnits.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Active Receipt Inspector & Multi-Line Receiving Form (5-6 cols) */}
        {selectedReceipt && (
          <div className="lg:col-span-6 2xl:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-md flex flex-col overflow-hidden">
            {/* Inspector Header */}
            <div className="p-space-md bg-surface-container-low border-b border-outline-variant flex flex-col gap-space-sm">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold font-mono">
                      {selectedReceipt.receiptNumber}
                    </span>
                    <StatusBadge status={selectedReceipt.status} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Source Document: <strong className="text-primary font-mono">{selectedReceipt.poNumber}</strong> · Supplier: <strong className="text-on-surface">{selectedReceipt.supplier}</strong>
                  </span>
                </div>
              </div>

              {/* BOL Meta Ribbon */}
              <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-2 rounded border border-outline-variant text-xs">
                <div>
                  <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Carrier</span>
                  <span className="font-medium text-on-surface truncate block">{selectedReceipt.carrier}</span>
                </div>
                <div>
                  <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">BOL Manifest</span>
                  <span className="font-mono text-on-surface truncate block">{selectedReceipt.bolNumber}</span>
                </div>
                <div>
                  <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Staged Bay</span>
                  <span className="font-medium text-on-surface truncate block">{selectedReceipt.stagedBay}</span>
                </div>
              </div>

              {/* Step Progression Bar */}
              <div className="mt-1 pt-2 flex flex-col gap-1.5 border-t border-slate-200">
                <div className="flex items-center justify-between font-label-sm text-[11px]">
                  <span className={`flex items-center gap-1 font-semibold ${selectedReceipt.step >= 1 ? 'text-tertiary' : 'text-outline'}`}>
                    <Icon name="check_circle" className="text-xs" /> 1. Arrived
                  </span>
                  <span className={`flex items-center gap-1 font-semibold ${selectedReceipt.step >= 2 ? 'text-primary' : 'text-outline'}`}>
                    <Icon name={selectedReceipt.step === 2 ? 'radio_button_checked' : 'check_circle'} className="text-xs" /> 2. Count &amp; QC
                  </span>
                  <span className={`flex items-center gap-1 font-semibold ${selectedReceipt.step >= 3 ? 'text-primary' : 'text-outline'}`}>
                    <Icon name="radio_button_unchecked" className="text-xs" /> 3. Putaway Binning
                  </span>
                  <span className={`flex items-center gap-1 font-semibold ${selectedReceipt.step >= 4 ? 'text-tertiary' : 'text-outline'}`}>
                    <Icon name="lock" className="text-xs" /> 4. Post &amp; Stock
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all ${selectedReceipt.status === 'Done' ? 'bg-tertiary w-full' : 'bg-primary w-2/4'}`}
                  />
                </div>
              </div>
            </div>

            {/* Line Items Verification Section */}
            <div className="p-space-md flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-title-md text-title-md text-on-surface font-semibold">
                    Manifest Line Items ({selectedReceipt.items.length} Lines)
                  </h4>
                  <p className="font-label-sm text-label-sm text-outline">
                    Verify physical quantities and confirm target putaway bin.
                  </p>
                </div>
                {selectedReceipt.status !== 'Done' && (
                  <button
                    onClick={() => {
                      const updatedCounts: { [id: string]: number } = {};
                      selectedReceipt.items.forEach((it) => {
                        updatedCounts[it.id] = it.expectedQty;
                      });
                      setItemCounts(updatedCounts);
                      addToast({ type: 'info', title: 'Quantities Synced', message: 'Counted units matched to expected PO qty.' });
                    }}
                    className="h-6 px-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-xs rounded flex items-center gap-1 border border-outline-variant"
                  >
                    <Icon name="select_all" className="text-xs" />
                    <span>Match All Qty</span>
                  </button>
                )}
              </div>

              {/* Line items list */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {selectedReceipt.items.map((it) => {
                  const countedVal = itemCounts[it.id] !== undefined ? itemCounts[it.id] : it.expectedQty;
                  const isShortage = countedVal < it.expectedQty;

                  return (
                    <div
                      key={it.id}
                      className={`rounded p-3 flex flex-col gap-2 border ${
                        isShortage ? 'bg-red-50/50 border-red-200' : 'bg-surface-container-low border-outline-variant'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                              {it.productName}
                            </span>
                            <span className="font-label-sm text-label-sm bg-surface-container px-1 rounded text-on-surface font-mono">
                              {it.sku}
                            </span>
                          </div>
                          {isShortage && (
                            <span className="font-label-sm text-error font-medium block mt-0.5">
                              Shortage recorded ({countedVal - it.expectedQty} {it.unit} vs PO manifest)
                            </span>
                          )}
                        </div>
                        <StatusBadge status={isShortage ? 'Shortage' : 'Matched'} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center bg-surface-container-lowest p-2 rounded border border-outline-variant text-xs">
                        <div>
                          <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">PO Expected</span>
                          <span className="font-mono font-bold text-on-surface">{it.expectedQty} {it.unit}</span>
                        </div>
                        <div>
                          <label className="font-label-sm text-[10px] text-primary uppercase block font-semibold">Counted Qty</label>
                          <input
                            type="number"
                            disabled={selectedReceipt.status === 'Done'}
                            value={countedVal}
                            onChange={(e) =>
                              setItemCounts({
                                ...itemCounts,
                                [it.id]: Number(e.target.value),
                              })
                            }
                            className="h-6 w-20 px-1.5 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-center text-xs focus:outline-none focus:bg-surface-container-lowest"
                          />
                        </div>
                        <div>
                          <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Target Bin</span>
                          <span className="font-mono text-on-surface font-semibold truncate block">{it.targetBin}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Validation Commit Button Bar */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between gap-3">
              <div className="text-xs text-on-surface-variant font-mono">
                {selectedReceipt.status === 'Done' ? (
                  <span className="text-tertiary flex items-center gap-1 font-semibold">
                    <Icon name="check_circle" className="text-sm" /> Verified &amp; Posted to Stock Ledger
                  </span>
                ) : (
                  <span>Click to validate and commit inventory balances</span>
                )}
              </div>
              {selectedReceipt.status !== 'Done' && (
                <button
                  onClick={handleValidate}
                  className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Icon name="check_circle" className="text-base" />
                  <span>Approve &amp; Putaway All Lines</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create PO Receipt */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Register Inbound PO Receipt"
        subtitle="Schedule a purchase order delivery arriving at dock staging."
      >
        <form onSubmit={handleCreateReceiptSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                PO Reference Number *
              </label>
              <input
                type="text"
                required
                value={newPoForm.poNumber}
                onChange={(e) => setNewPoForm({ ...newPoForm, poNumber: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded font-mono font-semibold text-xs text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Supplier / Vendor *
              </label>
              <input
                type="text"
                required
                value={newPoForm.supplier}
                onChange={(e) => setNewPoForm({ ...newPoForm, supplier: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Logistics Carrier
              </label>
              <input
                type="text"
                value={newPoForm.carrier}
                onChange={(e) => setNewPoForm({ ...newPoForm, carrier: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                BOL Manifest #
              </label>
              <input
                type="text"
                value={newPoForm.bolNumber}
                onChange={(e) => setNewPoForm({ ...newPoForm, bolNumber: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Staged Dock Bay
              </label>
              <input
                type="text"
                value={newPoForm.stagedBay}
                onChange={(e) => setNewPoForm({ ...newPoForm, stagedBay: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-surface-container-low border border-outline-variant rounded">
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-2 font-semibold">
              Inbound Item &amp; Allocation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="font-label-sm text-[10px] text-outline block mb-1">Select Product</span>
                <select
                  value={newPoForm.items[0].productId}
                  onChange={(e) => {
                    const next = [...newPoForm.items];
                    next[0].productId = e.target.value;
                    setNewPoForm({ ...newPoForm, items: next });
                  }}
                  className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="font-label-sm text-[10px] text-outline block mb-1">Expected Qty</span>
                <input
                  type="number"
                  min="1"
                  value={newPoForm.items[0].expectedQty}
                  onChange={(e) => {
                    const next = [...newPoForm.items];
                    next[0].expectedQty = Number(e.target.value);
                    setNewPoForm({ ...newPoForm, items: next });
                  }}
                  className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-xs font-mono text-on-surface"
                />
              </div>
              <div>
                <span className="font-label-sm text-[10px] text-outline block mb-1">Target Putaway Bin</span>
                <input
                  type="text"
                  value={newPoForm.items[0].targetBin}
                  onChange={(e) => {
                    const next = [...newPoForm.items];
                    next[0].targetBin = e.target.value;
                    setNewPoForm({ ...newPoForm, items: next });
                  }}
                  className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-xs font-mono text-on-surface"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="h-8 px-3 border border-outline-variant rounded text-xs text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-4 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center gap-1.5"
            >
              <Icon name="check" className="text-sm" />
              <span>Register Inbound Manifest</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
