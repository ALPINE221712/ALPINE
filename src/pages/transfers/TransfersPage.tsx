import React, { useState, useMemo } from 'react';
import { useInventory } from '../../store/inventoryStore';
import { Transfer, TransferItem } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export const TransfersPage: React.FC = () => {
  const {
    transfers,
    completeTransfer,
    createTransfer,
    products,
    warehouses,
    locations,
    user,
    addToast,
  } = useInventory();

  // State
  const [selectedTransferId, setSelectedTransferId] = useState<string>(
    transfers[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'All' | 'Draft' | 'Ready to Move' | 'In-Transit' | 'Completed' | 'Canceled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromFacility, setFromFacility] = useState('ALL');
  const [toFacility, setToFacility] = useState('ALL');
  const [isNewTransferModalOpen, setIsNewTransferModalOpen] = useState(false);

  // New Transfer Form State
  const [formData, setFormData] = useState({
    sourceWarehouse: 'WH-01',
    sourceLocation: 'WH-01 Bulk Storage Bay 02',
    destinationWarehouse: 'WH-01',
    destinationLocation: 'WH-01 Rack A-04 Aisle 2',
    priority: 'Normal' as 'Normal' | 'High' | 'Urgent',
    transferType: 'Intra-Warehouse' as 'Intra-Warehouse' | 'Inter-Facility',
    vehicleMethod: 'Forklift FL-04',
    assignedHandler: user?.name || 'Marcus Vance',
    productId: products[0]?.id || '',
    quantity: 100,
    notes: 'Assembly Line Replenishment & Reorder Threshold Buffer',
  });

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Tab filter
      if (activeTab !== 'All' && t.status !== activeTab) return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = t.transferNumber.toLowerCase().includes(q);
        const matchesSource = t.sourceLocation.toLowerCase().includes(q);
        const matchesDest = t.destinationLocation.toLowerCase().includes(q);
        const matchesItem = t.items.some(
          (i) => i.sku.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q)
        );
        if (!matchesRef && !matchesSource && !matchesDest && !matchesItem) return false;
      }
      // From facility filter
      if (fromFacility !== 'ALL' && !t.sourceLocation.includes(fromFacility)) return false;
      // To facility filter
      if (toFacility !== 'ALL' && !t.destinationLocation.includes(toFacility)) return false;
      return true;
    });
  }, [transfers, activeTab, searchQuery, fromFacility, toFacility]);

  // Selected Transfer
  const selectedTransfer = useMemo(() => {
    return transfers.find((t) => t.id === selectedTransferId) || filteredTransfers[0] || transfers[0];
  }, [transfers, selectedTransferId, filteredTransfers]);

  // Handle Complete Transfer
  const handleComplete = (id: string) => {
    const res = completeTransfer(id);
    if (!res.success) {
      addToast({
        type: 'error',
        title: 'Transfer Failed',
        message: res.message,
      });
    }
  };

  // Handle Create Transfer Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === formData.productId);
    if (!prod) {
      addToast({ type: 'error', title: 'Invalid Product', message: 'Selected product not found.' });
      return;
    }

    if (formData.quantity <= 0) {
      addToast({ type: 'error', title: 'Invalid Quantity', message: 'Quantity must be greater than 0.' });
      return;
    }

    const item: TransferItem = {
      id: `TITM-${Date.now()}`,
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      sourceLocation: formData.sourceLocation,
      destinationLocation: formData.destinationLocation,
      quantity: Number(formData.quantity),
      unit: prod.unit,
      status: 'Pending',
    };

    const newTransfer = createTransfer({
      sourceLocation: `${formData.sourceWarehouse} (${formData.sourceLocation})`,
      destinationLocation: `${formData.destinationWarehouse} (${formData.destinationLocation})`,
      transferType: formData.transferType,
      priority: formData.priority,
      items: [item],
      vehicleMethod: formData.vehicleMethod,
      assignedHandler: formData.assignedHandler,
      notes: formData.notes,
    });

    setIsNewTransferModalOpen(false);
    setSelectedTransferId(newTransfer.id);
  };

  // KPIs
  const pendingCount = transfers.filter((t) => t.status === 'Ready to Move').length;
  const inTransitCount = transfers.filter((t) => t.status === 'In-Transit').length;
  const completedCount = transfers.filter((t) => t.status === 'Completed').length;
  const totalUnitsRelocated = transfers
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Banner & Header */}
      <div className="p-6 space-y-5 bg-surface-container-low border-b border-outline-variant">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Internal Stock Transfers
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container-high text-on-surface-variant font-medium">
                WH Relocation System
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
              Relocate inventory between warehouses, bays, racks, and bin locations with instantaneous ledger balance tracking. Overall enterprise inventory valuation remains unchanged.
            </p>
          </div>
          {/* Action Button Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const csvContent =
                  'data:text/csv;charset=utf-8,Transfer #,Source,Destination,Type,Status\n' +
                  transfers.map((t) => `"${t.transferNumber}","${t.sourceLocation}","${t.destinationLocation}","${t.transferType}","${t.status}"`).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', 'StockSense_Transfers_Manifest.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="h-8 px-3 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container font-title-sm text-title-sm flex items-center gap-1.5 transition-colors shadow-2xs border border-outline-variant"
              type="button"
            >
              <Icon name="download" className="text-sm text-secondary" />
              <span>Export Manifests</span>
            </button>
            <button
              onClick={() => setIsNewTransferModalOpen(true)}
              className="h-8 px-3.5 rounded bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm flex items-center gap-1.5 transition-colors shadow-sm"
              type="button"
            >
              <Icon name="add" className="text-sm" />
              <span>+ New Transfer Order</span>
            </button>
          </div>
        </div>

        {/* Operational Concept Banner: Stock Relocation Principle */}
        <div className="bg-surface-container-highest/70 rounded p-3 flex items-start gap-3 border border-outline-variant">
          <div className="p-1 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
            <Icon name="swap_horiz" className="text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-title-sm text-title-sm text-on-surface font-semibold">Stock Relocation Principle</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Internal transfers reallocate physical inventory locations (<span className="font-medium text-on-surface">From WH / Location → To WH / Location</span>). Total enterprise on-hand stock and ledger valuation remain balanced.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm text-tertiary self-center shrink-0 border border-outline-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            <span>Ledger Integrity Verified</span>
          </div>
        </div>

        {/* KPI Strip: 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="bg-surface-container-lowest p-3.5 rounded shadow-2xs border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Pending Transfers
              </span>
              <span className="p-1 rounded bg-amber-50 text-amber-700">
                <Icon name="pending_actions" className="text-sm" />
              </span>
            </div>
            <div className="mt-2">
              <div className="font-tabular-kpi text-tabular-kpi text-on-surface leading-none">{pendingCount} Orders</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Awaiting bay relocation</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded shadow-2xs border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                In-Transit
              </span>
              <span className="p-1 rounded bg-blue-50 text-primary-container">
                <Icon name="local_shipping" className="text-sm" />
              </span>
            </div>
            <div className="mt-2">
              <div className="font-tabular-kpi text-tabular-kpi text-on-surface leading-none">{inTransitCount} Active</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                <span>Inter-facility move in progress</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded shadow-2xs border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Completed
              </span>
              <span className="p-1 rounded bg-emerald-50 text-tertiary">
                <Icon name="task_alt" className="text-sm" />
              </span>
            </div>
            <div className="mt-2">
              <div className="font-tabular-kpi text-tabular-kpi text-on-surface leading-none">{completedCount} Orders</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span>{totalUnitsRelocated.toLocaleString()} units relocated safely</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded shadow-2xs border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Route Bottleneck
              </span>
              <span className="p-1 rounded bg-emerald-50 text-tertiary">
                <Icon name="check_circle" className="text-sm" />
              </span>
            </div>
            <div className="mt-2">
              <div className="font-tabular-kpi text-tabular-kpi text-on-surface leading-none">0 Flagged</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span>All warehouse pathways clear</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-surface-container-lowest p-3 rounded shadow-2xs border border-outline-variant space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded overflow-x-auto">
              {(['All', 'Ready to Move', 'In-Transit', 'Completed', 'Draft'] as const).map((tab) => {
                const count = tab === 'All' ? transfers.length : transfers.filter((t) => t.status === tab).length;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded text-label-md font-label-md transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    {tab} <span className="ml-1 text-outline font-normal font-mono">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
              <Icon name="schedule" className="text-sm" />
              <span>Real-time bay movement queue</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative w-full max-w-sm">
                <Icon name="search" className="absolute left-2.5 top-2 text-sm text-outline pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Transfer ID, SKU, Product, or Location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest"
                />
              </div>

              <div className="relative">
                <select
                  value={fromFacility}
                  onChange={(e) => setFromFacility(e.target.value)}
                  className="h-8 pl-2.5 pr-7 bg-surface-container-low border border-outline-variant rounded font-title-sm text-title-sm text-on-surface appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="ALL">From: All Facilities</option>
                  <option value="WH-01">From: WH-01 Main</option>
                  <option value="WH-02">From: WH-02 Annex</option>
                  <option value="WH-03">From: WH-03 Bulk</option>
                </select>
                <Icon name="expand_more" className="absolute right-1.5 top-2 text-sm text-outline pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={toFacility}
                  onChange={(e) => setToFacility(e.target.value)}
                  className="h-8 pl-2.5 pr-7 bg-surface-container-low border border-outline-variant rounded font-title-sm text-title-sm text-on-surface appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="ALL">To: All Facilities</option>
                  <option value="WH-01">To: WH-01 Main</option>
                  <option value="WH-02">To: WH-02 Annex</option>
                  <option value="WH-03">To: WH-03 Bulk</option>
                </select>
                <Icon name="expand_more" className="absolute right-1.5 top-2 text-sm text-outline pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setFromFacility('ALL');
                setToFacility('ALL');
                setActiveTab('All');
              }}
              className="h-8 px-2.5 text-on-surface-variant hover:text-on-surface font-title-sm text-title-sm flex items-center gap-1 transition-colors"
              type="button"
            >
              <Icon name="restart_alt" className="text-sm" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Split 2-Column Grid */}
      <div className="px-6 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 60% (7 of 12 cols) - Transfer Orders Queue */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded shadow-2xs border border-outline-variant overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">Transfer Orders Queue</span>
              <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container-highest text-on-surface-variant font-mono">
                {filteredTransfers.length} orders
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTransferId(filteredTransfers[0]?.id || '')}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Select first"
                type="button"
              >
                <Icon name="first_page" className="text-sm" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/70 h-8 font-label-sm text-label-sm uppercase tracking-wider text-outline select-none border-b border-outline-variant">
                  <th className="px-3 py-1 font-semibold">TRANSFER # / REF</th>
                  <th className="px-3 py-1 font-semibold">SOURCE LOCATION</th>
                  <th className="px-3 py-1 font-semibold">DESTINATION</th>
                  <th className="px-3 py-1 font-semibold">ITEMS / UNITS</th>
                  <th className="px-3 py-1 font-semibold">VEHICLE</th>
                  <th className="px-3 py-1 font-semibold">STATUS</th>
                  <th className="w-10 px-2 py-1 text-right">ACT</th>
                </tr>
              </thead>
              <tbody className="font-tabular-body text-tabular-body divide-y divide-outline-variant/60">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                      No internal transfer orders found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((t) => {
                    const isSelected = selectedTransfer?.id === t.id;
                    const totalUnits = t.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTransferId(t.id)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className={`font-title-sm text-title-sm font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                            {t.transferNumber}
                          </div>
                          <div className="font-label-sm text-label-sm text-outline font-mono">
                            {t.priority.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-title-sm text-title-sm text-on-surface">{t.sourceLocation}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-title-sm text-title-sm text-on-surface">{t.destinationLocation}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-on-surface font-semibold font-mono">
                            {t.items.length} {t.items.length === 1 ? 'Line' : 'Lines'}
                          </div>
                          <div className="font-label-sm text-label-sm text-outline font-mono">
                            {totalUnits.toLocaleString()} units
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-on-surface flex items-center gap-1">
                            <Icon name="forklift" className="text-xs text-primary" />
                            <span className="truncate max-w-[110px]">{t.vehicleMethod || 'Forklift'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container transition-colors"
                            type="button"
                          >
                            <Icon name="chevron_right" className="text-base" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-2.5 bg-surface-container-low border-t border-outline-variant flex items-center justify-between mt-auto">
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{filteredTransfers.length}</span> of{' '}
              <span className="font-semibold text-on-surface">{transfers.length}</span> transfers
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Queue: Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: 40% (5 of 12 cols) - Active Transfer Detail */}
        {selectedTransfer && (
          <div className="lg:col-span-5 bg-surface-container-lowest rounded shadow-2xs border border-outline-variant overflow-hidden flex flex-col space-y-4 p-4">
            {/* Detail Panel Top Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {selectedTransfer.transferNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-primary/10 text-primary font-semibold">
                    {selectedTransfer.transferType.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                  <span>
                    Priority: <strong className="text-on-surface">{selectedTransfer.priority}</strong>
                  </span>
                  <span>•</span>
                  <span>Created: {selectedTransfer.createdDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Print Move Slip"
                  type="button"
                >
                  <Icon name="print" className="text-base" />
                </button>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant">
              <div className="flex items-center justify-between text-label-sm font-label-sm mb-2">
                <div className="flex items-center gap-1 text-tertiary font-bold">
                  <Icon name="check_circle" className="text-xs" />
                  <span>1. Manifest Scheduled</span>
                </div>
                <div
                  className={`flex items-center gap-1 font-bold ${
                    selectedTransfer.status === 'Completed' ? 'text-tertiary' : 'text-primary'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedTransfer.status === 'Completed' ? 'bg-tertiary' : 'bg-primary animate-pulse'
                    }`}
                  ></span>
                  <span>2. In Relocation</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    selectedTransfer.status === 'Completed' ? 'text-tertiary font-bold' : 'text-outline'
                  }`}
                >
                  {selectedTransfer.status === 'Completed' ? (
                    <Icon name="check_circle" className="text-xs text-tertiary" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                  )}
                  <span>3. Putaway Confirmed</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: selectedTransfer.status === 'Completed' ? '100%' : '66%' }}
                ></div>
              </div>
            </div>

            {/* Visual Transfer Route Diagram */}
            <div className="bg-surface-container-low/60 p-3 rounded border border-outline-variant space-y-2.5">
              <div className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Physical Move Trajectory
              </div>
              <div className="space-y-2">
                {/* Source Node */}
                <div className="flex items-start gap-2.5 bg-surface-container-lowest p-2.5 rounded border border-outline-variant">
                  <div className="p-1.5 rounded bg-surface-container text-secondary shrink-0 mt-0.5">
                    <Icon name="output" className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                        FROM SOURCE
                      </span>
                    </div>
                    <div className="font-title-sm text-title-sm text-on-surface font-bold mt-0.5">
                      {selectedTransfer.sourceLocation}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      Origin Bay & Staging Platform
                    </div>
                  </div>
                </div>

                {/* Transit Method Indicator */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-surface-container-lowest rounded border border-outline-variant font-label-sm text-label-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <Icon name="forklift" className="text-sm text-primary" />
                    <span>
                      Method: <strong>{selectedTransfer.vehicleMethod || 'Standard Forklift'}</strong>
                    </span>
                  </div>
                  <div>
                    Handler: <strong>{selectedTransfer.assignedHandler || 'Marcus Vance'}</strong>
                  </div>
                </div>

                {/* Destination Node */}
                <div className="flex items-start gap-2.5 bg-surface-container-lowest p-2.5 rounded border border-outline-variant">
                  <div className="p-1.5 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Icon name="move_to_inbox" className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary uppercase font-semibold">
                        TO DESTINATION
                      </span>
                    </div>
                    <div className="font-title-sm text-title-sm text-on-surface font-bold mt-0.5">
                      {selectedTransfer.destinationLocation}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      Target Rack & Feed Buffer
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Reservation & Availability Check */}
            <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="verified" className="text-base text-tertiary" />
                <div>
                  <div className="font-title-sm text-title-sm text-tertiary font-bold">
                    Stock Balance Check: PASS
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    Allocations pre-reserved in source bin. Ledger balanced.
                  </div>
                </div>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-emerald-100 text-tertiary font-semibold">
                Zero Variance
              </span>
            </div>

            {/* Relocation Line Items (Manifest) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm text-on-surface font-bold">
                  Relocation Line Items ({selectedTransfer.items.length})
                </span>
                <span className="font-label-sm text-label-sm text-outline font-mono">Verified Manifest</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedTransfer.items.map((item, idx) => (
                  <div key={idx} className="bg-surface-container-low p-2.5 rounded border border-outline-variant space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                          {item.productName}
                        </div>
                        <div className="font-label-sm text-label-sm text-outline font-mono">{item.sku}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-tertiary bg-emerald-50 px-2 py-0.5 rounded font-semibold shrink-0">
                        <Icon name="check" className="text-xs" />
                        <span>Ready</span>
                      </span>
                    </div>

                    {/* Metric comparison strip */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-label-sm font-label-sm bg-surface-container-lowest p-2 rounded border border-outline-variant">
                      <div>
                        <div className="text-primary uppercase text-[0.625rem] font-bold">Transfer Qty</div>
                        <div className="font-tabular-body text-tabular-body font-bold text-primary mt-0.5 font-mono">
                          {item.quantity.toLocaleString()} {item.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-outline uppercase text-[0.625rem]">Destination Unit</div>
                        <div className="font-tabular-body text-tabular-body font-semibold text-on-surface mt-0.5 font-mono">
                          Credit to {item.destinationLocation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedTransfer.notes && (
              <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant space-y-1 text-body-sm font-body-sm">
                <span className="text-outline text-label-sm font-label-sm block uppercase tracking-wider font-semibold">
                  Transfer Notes
                </span>
                <span className="text-on-surface">{selectedTransfer.notes}</span>
              </div>
            )}

            {/* Execution Action Buttons */}
            <div className="pt-2 space-y-2 mt-auto">
              {selectedTransfer.status !== 'Completed' ? (
                <button
                  onClick={() => handleComplete(selectedTransfer.id)}
                  className="w-full h-10 px-4 rounded bg-primary hover:bg-primary/90 text-on-primary font-title-md text-title-md flex items-center justify-center gap-2 transition-colors shadow-sm"
                  type="button"
                >
                  <Icon name="check_circle" className="text-base" />
                  <span>Validate Transfer &amp; Update Bin Locations</span>
                </button>
              ) : (
                <div className="w-full h-10 px-4 rounded bg-emerald-100 text-tertiary font-title-md text-title-md flex items-center justify-center gap-2 border border-emerald-300">
                  <Icon name="verified" className="text-base" />
                  <span>Transfer Completed &amp; Audited</span>
                </div>
              )}
              <div className="text-center font-label-sm text-label-sm text-outline">
                Executing immediately credits destination location and debits source location in Stock Ledger.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Transfer Modal */}
      <Modal
        isOpen={isNewTransferModalOpen}
        onClose={() => setIsNewTransferModalOpen(false)}
        title="Create Internal Transfer Order"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Source Warehouse
              </label>
              <select
                value={formData.sourceWarehouse}
                onChange={(e) => setFormData({ ...formData, sourceWarehouse: e.target.value })}
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
                Source Bay / Location
              </label>
              <input
                type="text"
                required
                value={formData.sourceLocation}
                onChange={(e) => setFormData({ ...formData, sourceLocation: e.target.value })}
                placeholder="e.g. WH-01 Bulk Storage Bay 02"
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Destination Warehouse
              </label>
              <select
                value={formData.destinationWarehouse}
                onChange={(e) => setFormData({ ...formData, destinationWarehouse: e.target.value })}
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
                Destination Bay / Rack
              </label>
              <input
                type="text"
                required
                value={formData.destinationLocation}
                onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
                placeholder="e.g. WH-01 Rack A-04 Aisle 2"
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-3">
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold mb-2">Item to Move</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                  Product / SKU
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} ({p.totalStock} {p.unit} avail)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                  Transfer Qty
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-outline-variant pt-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              >
                <option value="Normal">Normal Replenishment</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Line-Stop</option>
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Transport Unit
              </label>
              <input
                type="text"
                value={formData.vehicleMethod}
                onChange={(e) => setFormData({ ...formData, vehicleMethod: e.target.value })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Handler / Operator
              </label>
              <input
                type="text"
                value={formData.assignedHandler}
                onChange={(e) => setFormData({ ...formData, assignedHandler: e.target.value })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
              Internal Reason / Dispatch Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => setIsNewTransferModalOpen(false)}
              className="h-8 px-3 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-sm text-title-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded bg-primary text-on-primary hover:bg-primary/90 font-title-sm text-title-sm transition-colors shadow-sm"
            >
              Schedule Transfer Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransfersPage;
