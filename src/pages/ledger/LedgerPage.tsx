import React, { useState, useMemo } from 'react';
import { useInventory } from '../../store/inventoryStore';
import { StockMovement } from '../../types';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export const LedgerPage: React.FC = () => {
  const { movements, warehouses } = useInventory();

  // State
  const [activeTypeFilter, setActiveTypeFilter] = useState<'All' | 'Receipt' | 'Delivery' | 'Transfer' | 'Adjustment' | 'Scrap'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');
  const [inspectMovement, setInspectMovement] = useState<StockMovement | null>(null);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Type filter
      if (activeTypeFilter !== 'All' && m.type !== activeTypeFilter) return false;

      // Warehouse filter
      if (selectedWarehouseFilter !== 'ALL') {
        const matchesFrom = m.fromLocation.includes(selectedWarehouseFilter);
        const matchesTo = m.toLocation.includes(selectedWarehouseFilter);
        if (!matchesFrom && !matchesTo) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = m.referenceNumber.toLowerCase().includes(q);
        const matchesSku = m.sku.toLowerCase().includes(q);
        const matchesProd = m.productName.toLowerCase().includes(q);
        const matchesOp = m.operator.toLowerCase().includes(q);
        const matchesNotes = m.notes ? m.notes.toLowerCase().includes(q) : false;
        if (!matchesRef && !matchesSku && !matchesProd && !matchesOp && !matchesNotes) return false;
      }

      return true;
    });
  }, [movements, activeTypeFilter, selectedWarehouseFilter, searchQuery]);

  // Compute summary stats
  const totalMovementsCount = movements.length;
  const inboundUnits = movements
    .filter((m) => m.type === 'Receipt')
    .reduce((sum, m) => sum + Math.abs(m.quantityDelta), 0);
  const outboundUnits = movements
    .filter((m) => m.type === 'Delivery')
    .reduce((sum, m) => sum + Math.abs(m.quantityDelta), 0);
  const transfersCount = movements.filter((m) => m.type === 'Transfer').length;
  const netDiscrepancy = movements
    .filter((m) => m.type === 'Adjustment')
    .reduce((sum, m) => sum + m.quantityDelta, 0);

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Page Header Area */}
      <div className="px-6 py-5 bg-surface-container-lowest shadow-2xs border-b border-outline-variant flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon name="receipt_long" className="text-primary text-xl" />
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
                Stock Ledger &amp; Movement Audit
              </h1>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-mono">
                Immutable Log
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
              Chronological immutable audit log of all inbound receipts, outbound delivery dispatches, internal relocations, and physical cycle count adjustments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="h-8 px-2.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-title-sm text-title-sm flex items-center gap-1.5 transition-colors border border-outline-variant"
              title="Print Report"
              type="button"
            >
              <Icon name="print" className="text-base text-on-surface-variant" />
              <span>Print</span>
            </button>
            <button
              onClick={() => {
                const csvContent =
                  'data:text/csv;charset=utf-8,Timestamp,Type,Reference,SKU,Product,Quantity Delta,Unit,From,To,Operator,Balance After\n' +
                  movements
                    .map(
                      (m) =>
                        `"${m.timestamp}","${m.type}","${m.referenceNumber}","${m.sku}","${m.productName}","${m.quantityDelta}","${m.unit}","${m.fromLocation}","${m.toLocation}","${m.operator}","${m.balanceAfter}"`
                    )
                    .join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', 'StockSense_Audit_Ledger.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="h-8 px-3 rounded bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm flex items-center gap-1.5 transition-colors shadow-sm"
              type="button"
            >
              <Icon name="file_download" className="text-base" />
              <span>Export Audit Ledger</span>
            </button>
          </div>
        </div>

        {/* Audit Summary Bar: 5 KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <div className="bg-surface-container-low p-3 rounded flex flex-col justify-between border border-outline-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Total Movements
              </span>
              <Icon name="history_toggle_off" className="text-primary text-sm" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-tabular-kpi text-tabular-kpi text-on-surface font-mono font-bold">
                {totalMovementsCount}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">events</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Total Recorded
            </span>
          </div>

          <div className="bg-surface-container-low p-3 rounded flex flex-col justify-between border border-outline-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-semibold">
                Inbound Volume
              </span>
              <Icon name="arrow_downward" className="text-tertiary text-sm" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-tabular-kpi text-tabular-kpi text-tertiary font-mono font-bold">
                +{inboundUnits.toLocaleString()}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">units</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Receipts Verified
            </span>
          </div>

          <div className="bg-surface-container-low p-3 rounded flex flex-col justify-between border border-outline-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                Outbound Volume
              </span>
              <Icon name="arrow_upward" className="text-secondary text-sm" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-tabular-kpi text-tabular-kpi text-on-surface font-mono font-bold">
                -{outboundUnits.toLocaleString()}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">units</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Fulfillment Dispatches
            </span>
          </div>

          <div className="bg-surface-container-low p-3 rounded flex flex-col justify-between border border-outline-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Relocations
              </span>
              <Icon name="sync_alt" className="text-primary text-sm" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-tabular-kpi text-tabular-kpi text-on-surface font-mono font-bold">
                {transfersCount}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">transfers</span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold mt-0.5 flex items-center gap-0.5">
              <Icon name="check_circle" className="text-xs" />
              Balanced Valuation
            </span>
          </div>

          <div className="bg-surface-container-low p-3 rounded flex flex-col justify-between border border-outline-variant col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Discrepancy Net
              </span>
              <Icon name="balance" className="text-error text-sm" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`font-tabular-kpi text-tabular-kpi font-mono font-bold ${netDiscrepancy < 0 ? 'text-error' : 'text-tertiary'}`}>
                {netDiscrepancy > 0 ? `+${netDiscrepancy}` : netDiscrepancy}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">units</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Reconciled adjustments
            </span>
          </div>
        </div>
      </div>

      {/* Content Workspace */}
      <div className="p-6 flex flex-col gap-4">
        {/* Filters Card */}
        <div className="bg-surface-container-lowest p-3 rounded shadow-2xs border border-outline-variant flex flex-col gap-3">
          {/* Quick Type Filter Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'All', label: 'All Movements', count: movements.length, color: 'bg-primary' },
              { id: 'Receipt', label: 'Receipts (Inbound)', count: movements.filter((m) => m.type === 'Receipt').length, color: 'bg-tertiary' },
              { id: 'Delivery', label: 'Deliveries (Outbound)', count: movements.filter((m) => m.type === 'Delivery').length, color: 'bg-secondary' },
              { id: 'Transfer', label: 'Internal Transfers', count: movements.filter((m) => m.type === 'Transfer').length, color: 'bg-primary-container' },
              { id: 'Adjustment', label: 'Stock Adjustments', count: movements.filter((m) => m.type === 'Adjustment').length, color: 'bg-amber-600' },
            ].map((tab) => {
              const isActive = activeTypeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTypeFilter(tab.id as any)}
                  className={`px-3 py-1 rounded font-title-sm text-title-sm flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-bold shadow-2xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                  type="button"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tab.color}`}></span>
                  <span>{tab.label}</span>
                  <span className="font-mono text-xs opacity-75">{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Warehouse Filter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1">
            <div className="md:col-span-8 relative flex items-center">
              <Icon name="search" className="absolute left-2.5 text-base text-outline pointer-events-none" />
              <input
                type="text"
                placeholder="Search SKU, Product Name, Reference Document, Operator, or Notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>

            <div className="md:col-span-3 relative">
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="w-full h-8 px-2 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Facilities</option>
                {warehouses.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
              <Icon name="arrow_drop_down" className="absolute right-2 top-2 text-sm text-outline pointer-events-none" />
            </div>

            <div className="md:col-span-1 flex items-center">
              <button
                onClick={() => {
                  setActiveTypeFilter('All');
                  setSearchQuery('');
                  setSelectedWarehouseFilter('ALL');
                }}
                className="h-8 px-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm rounded flex items-center justify-center gap-1 transition-colors w-full"
                type="button"
                title="Reset Filters"
              >
                <Icon name="refresh" className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-surface-container-lowest rounded shadow-2xs border border-outline-variant overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low h-9 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="px-3 font-semibold">Date &amp; Time</th>
                  <th className="px-3 font-semibold">Event Type</th>
                  <th className="px-3 font-semibold">Reference Document</th>
                  <th className="px-3 font-semibold">Product SKU &amp; Name</th>
                  <th className="px-3 font-semibold text-right">Qty Change</th>
                  <th className="px-3 font-semibold">Unit</th>
                  <th className="px-3 font-semibold">From Location</th>
                  <th className="px-3 font-semibold">To Location</th>
                  <th className="px-3 font-semibold">Logged By</th>
                  <th className="px-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-on-surface font-body-sm text-body-sm">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-on-surface-variant">
                      No stock movements found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => {
                    const isPositive = m.quantityDelta > 0;
                    const isZero = m.quantityDelta === 0;

                    let typeBg = 'bg-primary/10 text-primary';
                    let typeIcon = 'sync_alt';

                    if (m.type === 'Receipt') {
                      typeBg = 'bg-emerald-50 text-tertiary';
                      typeIcon = 'call_received';
                    } else if (m.type === 'Delivery') {
                      typeBg = 'bg-amber-50 text-amber-800';
                      typeIcon = 'local_shipping';
                    } else if (m.type === 'Adjustment') {
                      typeBg = 'bg-purple-50 text-purple-700';
                      typeIcon = 'tune';
                    }

                    return (
                      <tr key={m.id} className="h-11 hover:bg-surface-container-low transition-colors group">
                        <td className="px-3 whitespace-nowrap font-tabular-body text-tabular-body text-on-surface-variant font-mono">
                          {m.timestamp}
                        </td>
                        <td className="px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-title-sm text-title-sm ${typeBg}`}>
                            <Icon name={typeIcon} className="text-xs" />
                            <span>{m.type}</span>
                          </span>
                        </td>
                        <td className="px-3 whitespace-nowrap">
                          <span className="font-title-sm text-title-sm text-primary font-mono font-semibold">
                            {m.referenceNumber}
                          </span>
                        </td>
                        <td className="px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-title-sm text-title-sm text-on-surface font-medium truncate max-w-xs">
                              {m.productName}
                            </span>
                            <span className="font-label-sm text-label-sm text-outline font-mono">
                              {m.sku}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`px-3 text-right font-tabular-body text-tabular-body font-bold font-mono ${
                            isPositive ? 'text-tertiary' : isZero ? 'text-on-surface-variant' : 'text-error'
                          }`}
                        >
                          {isPositive ? `+${m.quantityDelta.toLocaleString()}` : m.quantityDelta.toLocaleString()}
                        </td>
                        <td className="px-3 text-on-surface-variant font-label-md text-label-md font-mono">
                          {m.unit}
                        </td>
                        <td className="px-3 whitespace-nowrap text-on-surface-variant text-xs">
                          {m.fromLocation}
                        </td>
                        <td className="px-3 whitespace-nowrap text-on-surface text-xs font-medium">
                          {m.toLocation}
                        </td>
                        <td className="px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center font-bold">
                              {m.operator.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="font-title-sm text-title-sm">{m.operator}</span>
                          </div>
                        </td>
                        <td className="px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setInspectMovement(m)}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                            title="Inspect ledger entry"
                            type="button"
                          >
                            <Icon name="visibility" className="text-base" />
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
          <div className="px-4 py-2.5 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
            <span>
              Showing {filteredMovements.length} of {movements.length} movement records
            </span>
            <span className="flex items-center gap-1 text-tertiary">
              <Icon name="lock" className="text-xs" />
              <span>Immutable cryptographic hash ledger</span>
            </span>
          </div>
        </div>
      </div>

      {/* Movement Detail Inspection Modal */}
      {inspectMovement && (
        <Modal
          isOpen={true}
          onClose={() => setInspectMovement(null)}
          title={`Ledger Audit Record: ${inspectMovement.referenceNumber}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex items-center justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-outline uppercase block">Movement ID</span>
                <span className="font-mono text-sm font-semibold text-on-surface">{inspectMovement.id}</span>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-bold">
                {inspectMovement.type.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-body-sm">
              <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant">
                <span className="text-outline font-label-sm text-label-sm uppercase block font-semibold">Product SKU</span>
                <span className="font-mono font-bold text-on-surface">{inspectMovement.sku}</span>
                <span className="text-xs text-on-surface-variant block mt-0.5">{inspectMovement.productName}</span>
              </div>

              <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant">
                <span className="text-outline font-label-sm text-label-sm uppercase block font-semibold">Quantity Delta</span>
                <span className={`font-mono text-base font-bold ${inspectMovement.quantityDelta >= 0 ? 'text-tertiary' : 'text-error'}`}>
                  {inspectMovement.quantityDelta > 0 ? `+${inspectMovement.quantityDelta}` : inspectMovement.quantityDelta} {inspectMovement.unit}
                </span>
                <span className="text-xs text-on-surface-variant block mt-0.5 font-mono">
                  Balance After: {inspectMovement.balanceAfter} {inspectMovement.unit}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline uppercase font-semibold">Origin</span>
                <span className="font-medium text-on-surface">{inspectMovement.fromLocation}</span>
              </div>
              <div className="h-px bg-outline-variant"></div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline uppercase font-semibold">Destination</span>
                <span className="font-medium text-on-surface">{inspectMovement.toLocation}</span>
              </div>
            </div>

            <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant">
              <span className="text-outline font-label-sm text-label-sm uppercase block font-semibold mb-1">
                Operator &amp; Context Notes
              </span>
              <div className="text-xs text-on-surface-variant mb-1">
                Operator: <strong className="text-on-surface">{inspectMovement.operator}</strong> · {inspectMovement.timestamp}
              </div>
              <p className="text-xs text-on-surface italic bg-surface-container-lowest p-2 rounded border border-outline-variant">
                "{inspectMovement.notes}"
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectMovement(null)}
                className="h-8 px-4 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-sm text-title-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LedgerPage;
