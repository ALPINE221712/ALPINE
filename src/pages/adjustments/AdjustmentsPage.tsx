import React, { useState, useMemo } from 'react';
import { useInventory } from '../../store/inventoryStore';
import { StockAdjustment, AdjustmentItem } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export const AdjustmentsPage: React.FC = () => {
  const {
    adjustments,
    applyAdjustment,
    createAdjustment,
    products,
    warehouses,
    user,
    addToast,
  } = useInventory();

  // State
  const [selectedAdjId, setSelectedAdjId] = useState<string>(
    adjustments[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'All' | 'Draft' | 'Pending Approval' | 'Validated' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [isNewAdjModalOpen, setIsNewAdjModalOpen] = useState(false);

  // New Adjustment Form State
  const [newWarehouse, setNewWarehouse] = useState('WH-01');
  const [newLocation, setNewLocation] = useState('WH-01 Rack A-08');
  const [newReason, setNewReason] = useState('Damaged during forklift relocation');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [physicalCountInput, setPhysicalCountInput] = useState<number>(
    products[0]?.totalStock || 0
  );

  // Filter Adjustments
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adj) => {
      if (activeTab !== 'All') {
        if (activeTab === 'Validated' && adj.status !== 'Validated') return false;
        if (activeTab === 'Pending Approval' && adj.status !== 'Pending Approval') return false;
        if (activeTab === 'Draft' && adj.status !== 'Draft') return false;
        if (activeTab === 'Rejected' && adj.status !== 'Rejected') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = adj.adjustmentNumber.toLowerCase().includes(q);
        const matchesReason = adj.reason.toLowerCase().includes(q);
        const matchesWh = adj.warehouseName.toLowerCase().includes(q);
        const matchesItems = adj.items.some(
          (i) => i.sku.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q)
        );
        if (!matchesId && !matchesReason && !matchesWh && !matchesItems) return false;
      }
      if (selectedWarehouse !== 'ALL' && adj.warehouseCode !== selectedWarehouse) return false;
      return true;
    });
  }, [adjustments, activeTab, searchQuery, selectedWarehouse]);

  // Selected Adjustment
  const selectedAdj = useMemo(() => {
    return adjustments.find((a) => a.id === selectedAdjId) || filteredAdjustments[0] || adjustments[0];
  }, [adjustments, selectedAdjId, filteredAdjustments]);

  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply Adjustment
  const handleApply = async (id: string) => {
    try {
      setIsApplying(true);
      const res = await applyAdjustment(id);
      if (!res.success) {
        addToast({
          type: 'error',
          title: 'Adjustment Failed',
          message: res.message,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Adjustment Failed',
        message: err.message || 'Failed to apply adjustment.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Selected Product in modal
  const modalProd = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const liveDifference = useMemo(() => {
    if (!modalProd) return 0;
    return physicalCountInput - modalProd.totalStock;
  }, [modalProd, physicalCountInput]);

  // Handle Create Adjustment
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalProd) return;

    const item: AdjustmentItem = {
      id: `AITM-${Date.now()}`,
      productId: modalProd.id,
      sku: modalProd.sku,
      productName: modalProd.name,
      location: newLocation,
      recordedQty: modalProd.totalStock,
      physicalQty: Number(physicalCountInput),
      difference: liveDifference,
      unit: modalProd.unit,
      costImpact: liveDifference * modalProd.unitCost,
      reason: newReason,
    };

    const wh = warehouses.find((w) => w.code === newWarehouse);

    try {
      setIsSubmitting(true);
      const created = await createAdjustment({
        warehouseCode: newWarehouse,
        warehouseName: wh ? `${wh.code} ${wh.name}` : newWarehouse,
        reason: newReason,
        operator: user?.name || 'Marcus Vance',
        items: [item],
      });

      setIsNewAdjModalOpen(false);
      if (created?.id) {
        setSelectedAdjId(created.id);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to create adjustment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute stats
  const pendingCount = adjustments.filter((a) => a.status === 'Pending Approval').length;
  const validatedCount = adjustments.filter((a) => a.status === 'Validated').length;
  const totalDifferenceUnits = adjustments.reduce(
    (sum, a) => sum + a.items.reduce((s, i) => s + i.difference, 0),
    0
  );
  const criticalDiscrepancies = adjustments.filter((a) =>
    a.items.some((i) => Math.abs(i.difference) > 10)
  ).length;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Screen Header */}
      <section className="px-6 py-4 bg-surface-container-lowest border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
              Stock Adjustments
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm tracking-wide font-medium">
              RECONCILIATION &amp; INVENTORY UPDATE
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
            Reconcile recorded catalog stock with physical warehouse counts, review discrepancies, and commit adjustments to update on-hand inventory and the stock ledger.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,Adjustment ID,Warehouse,Status,Difference\n' +
                adjustments
                  .map(
                    (a) =>
                      `"${a.adjustmentNumber}","${a.warehouseName}","${a.status}","${a.items.reduce((s, i) => s + i.difference, 0)}"`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'StockSense_Adjustments.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="h-8 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm flex items-center gap-1.5 transition-colors border border-outline-variant"
            type="button"
          >
            <Icon name="file_download" className="text-base text-secondary" />
            <span>Export Adjustments</span>
          </button>
          <button
            onClick={() => setIsNewAdjModalOpen(true)}
            className="h-8 px-3.5 rounded bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm flex items-center gap-1.5 shadow-sm transition-colors"
            type="button"
          >
            <Icon name="add" className="text-base" />
            <span>Create Adjustment</span>
          </button>
        </div>
      </section>

      {/* KPI Metrics Strip: 4 Utility Cards */}
      <section className="px-6 py-3 bg-surface-container-low border-b border-outline-variant">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded bg-surface-container-lowest flex items-start justify-between shadow-2xs border border-outline-variant">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Pending Adjustments
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-tabular-kpi text-tabular-kpi text-on-surface font-mono">
                  {pendingCount} Pending
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Awaiting review & validation
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary shrink-0">
              <Icon name="pending_actions" className="text-lg" />
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-container-lowest flex items-start justify-between shadow-2xs border border-outline-variant">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Total Difference
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`font-tabular-kpi text-tabular-kpi font-mono ${totalDifferenceUnits < 0 ? 'text-error' : 'text-tertiary'}`}>
                  {totalDifferenceUnits > 0 ? `+${totalDifferenceUnits}` : totalDifferenceUnits} units
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Physical count vs recorded
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-secondary shrink-0">
              <Icon name="trending_down" className="text-lg" />
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-container-lowest flex items-start justify-between shadow-2xs border border-outline-variant">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Validated / Posted
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-tabular-kpi text-tabular-kpi text-tertiary font-mono">
                  {validatedCount} Completed
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Updated in stock ledger
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-secondary-container flex items-center justify-center text-tertiary shrink-0">
              <Icon name="check_circle" className="text-lg" />
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-container-lowest flex items-start justify-between shadow-2xs border border-outline-variant">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Discrepancies Flagged
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-tabular-kpi text-tabular-kpi text-error font-mono">
                  {criticalDiscrepancies} Significant
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Variance &gt; 10 units
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-error-container flex items-center justify-center text-error shrink-0">
              <Icon name="warning" className="text-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Status Tabs & Filter Bar */}
      <section className="px-6 pt-3 bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {(['All', 'Pending Approval', 'Validated', 'Draft'] as const).map((tab) => {
            const count = tab === 'All' ? adjustments.length : adjustments.filter((a) => a.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded font-title-sm text-title-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-2xs'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
                type="button"
              >
                {tab} <span className="ml-1 text-outline font-mono text-xs">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[320px]">
            <div className="relative w-72">
              <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
              <input
                type="text"
                placeholder="Search Adjustment ID, SKU, Product, or Reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="relative">
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="h-8 pl-2.5 pr-7 rounded bg-surface-container-low border border-outline-variant text-on-surface font-body-sm text-body-sm appearance-none focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Facilities</option>
                {warehouses.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} {w.name}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" className="absolute right-1.5 top-2 text-sm text-outline pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedWarehouse('ALL');
                setActiveTab('All');
              }}
              className="h-8 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm flex items-center gap-1 transition-colors"
              type="button"
            >
              <Icon name="filter_alt_off" className="text-sm" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </section>

      {/* Two-Column Workbench Split View */}
      <main className="px-6 py-4 flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Column: Adjustments Ledger Table (7 cols ~58%) */}
          <div className="xl:col-span-7 flex flex-col bg-surface-container-lowest rounded shadow-2xs border border-outline-variant overflow-hidden">
            <div className="p-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Active Adjustment Sessions
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-label-sm">
                  {filteredAdjustments.length} sessions
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedAdjId(filteredAdjustments[0]?.id || '')}
                  className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
                  title="First session"
                  type="button"
                >
                  <Icon name="first_page" className="text-base" />
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                    <th className="py-2.5 px-3 font-semibold">Adjustment ID</th>
                    <th className="py-2.5 px-3 font-semibold">Warehouse / Location</th>
                    <th className="py-2.5 px-3 font-semibold">Products</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Recorded vs Physical</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Difference</th>
                    <th className="py-2.5 px-3 font-semibold">Reason</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                        No adjustment records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdjustments.map((adj) => {
                      const isSelected = selectedAdj?.id === adj.id;
                      const recordedTotal = adj.items.reduce((s, i) => s + i.recordedQty, 0);
                      const physicalTotal = adj.items.reduce((s, i) => s + i.physicalQty, 0);
                      const diffTotal = physicalTotal - recordedTotal;

                      return (
                        <tr
                          key={adj.id}
                          onClick={() => setSelectedAdjId(adj.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container-low'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {isSelected && <span className="w-1.5 h-6 rounded-full bg-primary-container"></span>}
                              <span className={`font-title-sm text-title-sm font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                {adj.adjustmentNumber}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-title-sm text-title-sm font-medium">{adj.warehouseName}</span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                                {adj.items[0]?.location || 'Bay Staging'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-body-sm text-body-sm text-on-surface font-mono">
                              {adj.items.length} {adj.items.length === 1 ? 'Product' : 'Products'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-tabular-body text-tabular-body text-on-surface-variant font-mono">
                            <span className="text-on-surface font-medium">{recordedTotal.toLocaleString()}</span> →{' '}
                            <span className="text-on-surface font-medium">{physicalTotal.toLocaleString()}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded font-tabular-body text-tabular-body font-semibold ${
                                diffTotal === 0
                                  ? 'bg-surface-container-high text-on-surface-variant'
                                  : diffTotal < 0
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-secondary-container text-tertiary'
                              }`}
                            >
                              {diffTotal > 0 ? `+${diffTotal}` : diffTotal} units
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-body-sm text-body-sm text-on-surface truncate max-w-[130px] inline-block">
                              {adj.reason}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={adj.status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>
                Showing {filteredAdjustments.length} of {adjustments.length} adjustments
              </span>
              <span>Reconciliation Engine Active</span>
            </div>
          </div>

          {/* Right Column: Selected Adjustment Detail & Live Form (5 cols ~42%) */}
          {selectedAdj && (
            <div className="xl:col-span-5 flex flex-col bg-surface-container-lowest rounded shadow-2xs border border-outline-variant overflow-hidden">
              {/* Inspector Header */}
              <div className="p-4 bg-surface-container-low border-b border-outline-variant flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {selectedAdj.adjustmentNumber}
                      </span>
                      <StatusBadge status={selectedAdj.status} />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      {selectedAdj.warehouseName}
                    </span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                    title="Print adjustment sheet"
                    type="button"
                  >
                    <Icon name="print" className="text-base" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 text-label-sm text-on-surface-variant pt-1 font-body-sm">
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon name="person" className="text-sm text-outline" />
                    <span className="truncate">
                      Initiated by: <strong className="text-on-surface font-medium">{selectedAdj.operator}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon name="schedule" className="text-sm text-outline" />
                    <span>
                      Date: <strong className="text-on-surface font-medium">{selectedAdj.createdDate}</strong>
                    </span>
                  </div>
                </div>

                {/* Workflow Sequence Indicator: 6-Step Standard Flow */}
                <div className="mt-2 p-2.5 bg-surface-container-lowest rounded flex flex-col gap-1.5 border border-outline-variant">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
                    <span className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Reconciliation Workflow
                    </span>
                    <span className="text-primary font-medium">
                      Step {selectedAdj.workflowStep || (selectedAdj.status === 'Validated' ? 6 : 4)} of 6:{' '}
                      {selectedAdj.status === 'Validated' ? 'Logged' : 'Ready to Adjust'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium overflow-x-auto py-1">
                    <div className="flex items-center gap-1 text-tertiary shrink-0">
                      <Icon name="check_circle" className="text-sm" />
                      <span>Recorded</span>
                    </div>
                    <Icon name="arrow_forward" className="text-xs text-outline shrink-0" />
                    <div className="flex items-center gap-1 text-tertiary shrink-0">
                      <Icon name="check_circle" className="text-sm" />
                      <span>Counted</span>
                    </div>
                    <Icon name="arrow_forward" className="text-xs text-outline shrink-0" />
                    <div className="flex items-center gap-1 text-tertiary shrink-0">
                      <Icon name="check_circle" className="text-sm" />
                      <span>Difference</span>
                    </div>
                    <Icon name="arrow_forward" className="text-xs text-outline shrink-0" />
                    <div
                      className={`flex items-center gap-1 shrink-0 font-bold px-1.5 py-0.5 rounded ${
                        selectedAdj.status === 'Validated'
                          ? 'text-tertiary'
                          : 'text-primary bg-primary-fixed'
                      }`}
                    >
                      <Icon name={selectedAdj.status === 'Validated' ? 'check_circle' : 'pending'} className="text-sm" />
                      <span>Adjust Stock</span>
                    </div>
                    <Icon name="arrow_forward" className="text-xs text-outline shrink-0" />
                    <div className={`flex items-center gap-1 shrink-0 ${selectedAdj.status === 'Validated' ? 'text-tertiary' : 'text-outline'}`}>
                      {selectedAdj.status === 'Validated' && <Icon name="check_circle" className="text-sm" />}
                      <span>Updated</span>
                    </div>
                    <Icon name="arrow_forward" className="text-xs text-outline shrink-0" />
                    <div className={`flex items-center gap-1 shrink-0 ${selectedAdj.status === 'Validated' ? 'text-tertiary' : 'text-outline'}`}>
                      {selectedAdj.status === 'Validated' && <Icon name="check_circle" className="text-sm" />}
                      <span>Logged</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Item Discrepancies */}
              <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
                {selectedAdj.items.map((item, idx) => {
                  const isMatch = item.difference === 0;
                  const isNegative = item.difference < 0;

                  return (
                    <div key={idx} className="p-3 rounded bg-surface-container-low flex flex-col gap-2.5 border border-outline-variant">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                            {item.productName}
                          </span>
                          <span className="font-label-sm text-label-sm text-outline font-mono">
                            {item.sku} · Location: {item.location}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-bold shrink-0 font-mono ${
                            isMatch
                              ? 'bg-secondary-container text-tertiary'
                              : isNegative
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-emerald-100 text-tertiary'
                          }`}
                        >
                          {item.difference > 0 ? `+${item.difference}` : item.difference} {item.unit}
                          {item.costImpact !== undefined && item.costImpact !== 0 && ` ($${Math.abs(item.costImpact || 0).toFixed(2)})`}
                        </span>
                      </div>

                      {/* 3-column metric comparison */}
                      <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-2 rounded items-center border border-outline-variant font-mono">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-outline font-sans">Recorded Stock</span>
                          <span className="font-tabular-body text-tabular-body text-on-surface font-semibold">
                            {item.recordedQty} {item.unit}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-outline font-sans">Physical Count</span>
                          <span className="font-tabular-body text-tabular-body text-on-surface font-semibold">
                            {item.physicalQty} {item.unit}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="font-label-sm text-label-sm text-outline font-sans">Difference</span>
                          <span
                            className={`font-tabular-body text-tabular-body font-bold ${
                              isMatch ? 'text-tertiary' : isNegative ? 'text-error' : 'text-tertiary'
                            }`}
                          >
                            {item.difference > 0 ? `+${item.difference}` : item.difference} {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-body-sm">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                          Adjustment Reason:
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant">
                          {item.reason}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary & Actions Pane */}
              <div className="p-4 bg-surface-container-low flex flex-col gap-3 border-t border-outline-variant mt-auto">
                <div className="p-3 rounded bg-surface-container-lowest flex flex-col gap-1.5 border border-outline-variant">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Recorded Items Impacted:</span>
                    <span className="font-tabular-body text-tabular-body text-on-surface font-medium font-mono">
                      {selectedAdj.items.length} Line Items (
                      {selectedAdj.items.reduce((s, i) => s + i.recordedQty, 0).toLocaleString()} units)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Physical Count Result:</span>
                    <span className="font-tabular-body text-tabular-body text-on-surface font-medium font-mono">
                      {selectedAdj.items.reduce((s, i) => s + i.physicalQty, 0).toLocaleString()} total units
                    </span>
                  </div>
                  <div className="pt-1.5 flex items-center justify-between font-title-sm text-title-sm border-t border-outline-variant">
                    <span className="text-on-surface font-semibold">Total Discrepancy Difference:</span>
                    <span className="font-tabular-body text-tabular-body text-error font-bold font-mono">
                      {selectedAdj.items.reduce((s, i) => s + i.difference, 0)} units
                    </span>
                  </div>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-lowest p-2.5 rounded border border-outline-variant">
                  <span className="font-semibold text-on-surface">Note:</span> Applying this adjustment will immediately calibrate on-hand catalog stock balances to physical counts and log an immutable entry in the Stock Ledger.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  {selectedAdj.status !== 'Validated' ? (
                    <button
                      onClick={() => handleApply(selectedAdj.id)}
                      disabled={isApplying}
                      className="h-10 w-full rounded bg-primary-container hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-title-sm text-title-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      type="button"
                    >
                      <Icon name={isApplying ? "sync" : "check_circle"} className={`text-base ${isApplying ? "animate-spin" : ""}`} />
                      <span>{isApplying ? "Applying Adjustment..." : "Apply Adjustment & Update Stock"}</span>
                    </button>
                  ) : (
                    <div className="h-10 w-full rounded bg-emerald-100 text-tertiary font-title-sm text-title-sm flex items-center justify-center gap-1.5 border border-emerald-300">
                      <Icon name="verified" className="text-base" />
                      <span>Adjustment Applied &amp; Balances Synchronized</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Adjustment Modal */}
      <Modal
        isOpen={isNewAdjModalOpen}
        onClose={() => setIsNewAdjModalOpen(false)}
        title="Create Cycle Count Adjustment"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Facility
              </label>
              <select
                value={newWarehouse}
                onChange={(e) => setNewWarehouse(e.target.value)}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              >
                {warehouses.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Rack / Bin Location
              </label>
              <input
                type="text"
                required
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-3 space-y-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Select Product to Count
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = products.find((pr) => pr.id === e.target.value);
                  if (p) setPhysicalCountInput(p.totalStock);
                }}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-surface-container-low p-3 rounded border border-outline-variant items-center">
              <div>
                <span className="font-label-sm text-label-sm text-outline uppercase block">Recorded Qty</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-mono font-bold">
                  {modalProd?.totalStock} {modalProd?.unit}
                </span>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-primary uppercase block font-semibold mb-1">
                  Physical Count
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={physicalCountInput}
                  onChange={(e) => setPhysicalCountInput(Number(e.target.value))}
                  className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary font-mono font-bold"
                />
              </div>

              <div className="text-right">
                <span className="font-label-sm text-label-sm text-outline uppercase block">Computed Diff</span>
                <span
                  className={`font-headline-sm text-headline-sm font-mono font-bold ${
                    liveDifference === 0
                      ? 'text-tertiary'
                      : liveDifference < 0
                      ? 'text-error'
                      : 'text-tertiary'
                  }`}
                >
                  {liveDifference > 0 ? `+${liveDifference}` : liveDifference} {modalProd?.unit}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
              Discrepancy Reason / Audit Explanation
            </label>
            <input
              type="text"
              required
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="e.g. Broken packaging / Handling shrinkage / Routine spot count"
              className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => setIsNewAdjModalOpen(false)}
              className="h-8 px-3 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-sm text-title-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-title-sm text-title-sm transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting && <Icon name="sync" className="text-sm animate-spin" />}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Adjustment Session'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdjustmentsPage;
