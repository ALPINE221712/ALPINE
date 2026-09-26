import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';
import { StatusBadge } from '../../components/common/StatusBadge';
import { KpiCard } from '../../components/common/KpiCard';

export const DashboardPage: React.FC = () => {
  const {
    products,
    receipts,
    deliveries,
    transfers,
    adjustments,
    movements,
    warehouses,
    selectedWarehouseCode,
    setSelectedWarehouseCode,
    addToast,
  } = useInventory();

  const navigate = useNavigate();

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'receipts' | 'deliveries' | 'transfers' | 'adjustments'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 7;

  // Real-time calculations
  const totalSkus = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.totalStock, 0);
  const lowStockCount = products.filter((p) => p.status === 'Low Stock').length;
  const depletedCount = products.filter((p) => p.status === 'Out of Stock').length;

  const pendingReceiptsCount = receipts.filter((r) => r.status !== 'Done' && r.status !== 'Canceled').length;
  const pendingDeliveriesCount = deliveries.filter((d) => d.status !== 'Dispatched' && d.status !== 'Canceled').length;
  const activeTransfersCount = transfers.filter((t) => t.status !== 'Completed' && t.status !== 'Canceled').length;

  // Filtered inventory table items
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.primaryLocation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Draft' ? false : p.status.toLowerCase().includes(statusFilter.toLowerCase()));

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['SKU,Name,Category,Stock,Unit,ReorderPoint,Status,Location']
        .concat(
          products.map(
            (p) =>
              `"${p.sku}","${p.name}","${p.category}",${p.totalStock},"${p.unit}",${p.reorderPoint},"${p.status}","${p.primaryLocation}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({
      type: 'success',
      title: 'Export Complete',
      message: 'Master inventory manifest downloaded as CSV.',
    });
  };

  return (
    <div className="p-6 space-y-5 flex-1">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">Inventory Dashboard</h1>
            <span className="font-label-sm text-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold tracking-wide">
              ENTERPRISE CORE
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Monitor real-time stock levels, warehouse capacity, and inbound/outbound fulfillment pipelines across facilities.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Warehouse Filter */}
          <div className="relative">
            <select
              value={selectedWarehouseCode}
              onChange={(e) => setSelectedWarehouseCode(e.target.value)}
              className="h-8 pl-3 pr-8 bg-surface-container-lowest text-on-surface font-title-sm text-title-sm rounded border border-outline-variant shadow-xs appearance-none cursor-pointer focus:outline-none"
            >
              <option value="WH-01">WH-01 Main Facility</option>
              <option value="WH-02">WH-02 North Bay Annex</option>
              <option value="WH-03">WH-03 Bulk High-Bay Hub</option>
            </select>
            <Icon name="expand_more" className="material-symbols-outlined absolute right-2 top-2 text-sm text-outline pointer-events-none" />
          </div>

          <button
            onClick={handleExportCsv}
            className="h-8 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm rounded border border-outline-variant shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Icon name="download" className="text-sm text-secondary" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => addToast({ type: 'info', title: 'Data Refreshed', message: 'All warehouse balances synced.' })}
            className="h-8 px-3 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Icon name="refresh" className="text-sm" />
            <span>Refresh Data</span>
            <span className="font-label-sm text-label-sm bg-white/20 text-white px-1.5 py-0.2 rounded ml-1">
              Just now
            </span>
          </button>
        </div>
      </div>

      {/* 5 KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <KpiCard
          label="Total in Stock"
          value={totalSkus.toLocaleString()}
          subtext="SKUs"
          icon="inventory_2"
        >
          <div className="pt-2 bg-surface-container-low px-2 py-1 rounded flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              {totalUnits.toLocaleString()} Total Units
            </span>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center">
              <Icon name="trending_up" className="text-xs mr-0.5" />+3.2%
            </span>
          </div>
        </KpiCard>

        {/* KPI 2 */}
        <KpiCard
          label="Low Stock / Critical"
          value={lowStockCount + depletedCount}
          subtext="Items Alert"
          icon="warning"
        >
          <div className="flex items-center gap-1.5 pt-1">
            <span className="font-label-sm text-label-sm bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> {lowStockCount} Low
            </span>
            <span className="font-label-sm text-label-sm bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> {depletedCount} Depleted
            </span>
          </div>
        </KpiCard>

        {/* KPI 3 */}
        <KpiCard
          label="Pending Receipts"
          value={pendingReceiptsCount}
          subtext="Active POs"
          icon="move_to_inbox"
        >
          <div className="pt-2 bg-surface-container-low px-2 py-1 rounded flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Est. 4,850 units</span>
            <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1">
              <Icon name="schedule" className="text-xs" /> Today
            </span>
          </div>
        </KpiCard>

        {/* KPI 4 */}
        <KpiCard
          label="Pending Deliveries"
          value={pendingDeliveriesCount}
          subtext="Orders"
          icon="local_shipping"
        >
          <div className="grid grid-cols-3 gap-1 text-center font-label-sm text-label-sm pt-1">
            <div className="bg-surface-container px-1 py-0.5 rounded text-on-surface">
              <span className="font-semibold font-mono">1</span> Pick
            </div>
            <div className="bg-surface-container px-1 py-0.5 rounded text-on-surface">
              <span className="font-semibold font-mono">1</span> Pack
            </div>
            <div className="bg-secondary-container px-1 py-0.5 rounded text-on-secondary-container">
              <span className="font-semibold font-mono">1</span> Stage
            </div>
          </div>
        </KpiCard>

        {/* KPI 5 */}
        <KpiCard
          label="Internal Transfers"
          value={activeTransfersCount}
          subtext="Active"
          icon="swap_horiz"
        >
          <div className="pt-2 bg-surface-container-low px-2 py-1 rounded flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">WH-01 ➔ WH-02</span>
            <span className="font-label-sm text-label-sm bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">
              In-Transit
            </span>
          </div>
        </KpiCard>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant shadow-sm space-y-2.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Segmented Underline Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => { setActiveTab('all'); setStatusFilter('All'); }}
              className={`h-7 px-3 font-title-sm text-title-sm rounded flex items-center gap-1.5 shadow-xs transition-colors ${
                activeTab === 'all'
                  ? 'bg-primary-container text-on-primary font-semibold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span>All Items</span>
            </button>
            <button
              onClick={() => navigate('/receipts')}
              className="h-7 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors"
            >
              <span>Receipts</span>
              <span className="font-label-sm text-label-sm bg-surface-container-lowest text-on-surface px-1.5 rounded font-mono">
                {receipts.length}
              </span>
            </button>
            <button
              onClick={() => navigate('/deliveries')}
              className="h-7 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors"
            >
              <span>Deliveries</span>
              <span className="font-label-sm text-label-sm bg-surface-container-lowest text-on-surface px-1.5 rounded font-mono">
                {deliveries.length}
              </span>
            </button>
            <button
              onClick={() => navigate('/transfers')}
              className="h-7 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors"
            >
              <span>Transfers</span>
              <span className="font-label-sm text-label-sm bg-surface-container-lowest text-on-surface px-1.5 rounded font-mono">
                {transfers.length}
              </span>
            </button>
            <button
              onClick={() => navigate('/adjustments')}
              className="h-7 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors"
            >
              <span>Adjustments</span>
              <span className="font-label-sm text-label-sm bg-surface-container-lowest text-on-surface px-1.5 rounded font-mono">
                {adjustments.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm self-end md:self-auto">
            <span className="flex items-center gap-1 text-tertiary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
            </span>
            <span className="text-outline">|</span>
            <span className="text-on-surface font-semibold font-mono">{products.length} Master SKUs</span>
          </div>
        </div>

        {/* Dropdown Selectors Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Filter by SKU, description, or storage location..."
              className="w-full h-8 pl-8 pr-8 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <Icon name="close" className="text-xs" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full h-8 pl-2.5 pr-7 bg-surface-container-low border border-outline-variant text-on-surface font-body-sm text-body-sm rounded appearance-none cursor-pointer focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-outline pointer-events-none" />
          </div>

          {/* Category Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full h-8 pl-2.5 pr-7 bg-surface-container-low border border-outline-variant text-on-surface font-body-sm text-body-sm rounded appearance-none cursor-pointer focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Fasteners">Fasteners</option>
              <option value="Electrical">Electrical</option>
              <option value="Packaging">Packaging</option>
              <option value="Safety Equipment">Safety Equipment</option>
              <option value="Finished Goods">Finished Goods</option>
            </select>
            <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-outline pointer-events-none" />
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setCategoryFilter('All');
                setPage(1);
              }}
              className="h-8 px-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md rounded flex items-center gap-1 transition-colors"
            >
              <Icon name="filter_alt_off" className="text-sm" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Left Column: Inventory Overview Table (8 Cols) */}
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          {/* Table Header Bar */}
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">Inventory Items Overview</span>
              <span className="font-label-sm text-label-sm bg-surface-container-lowest border border-outline-variant px-2 py-0.5 rounded text-on-surface-variant font-mono">
                Showing {paginatedProducts.length} of {filteredProducts.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>View Full Master Catalog</span>
              <Icon name="arrow_forward" className="text-xs" />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm tabular-nums">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none border-b border-outline-variant">
                  <th className="py-2.5 px-3">SKU / Code</th>
                  <th className="py-2.5 px-3">Product &amp; Category</th>
                  <th className="py-2.5 px-3">Location &amp; Bin</th>
                  <th className="py-2.5 px-3 text-right">Current</th>
                  <th className="py-2.5 px-2">Unit</th>
                  <th className="py-2.5 px-3 text-right">Reorder</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-on-surface divide-y divide-slate-100">
                {paginatedProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <td className="py-2.5 px-3 font-semibold text-primary font-mono text-xs">
                      {p.sku}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-title-sm text-title-sm text-on-surface leading-tight font-medium">
                        {p.name}
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">{p.category}</div>
                    </td>
                    <td className="py-2.5 px-3 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="bg-surface-container px-1.5 py-0.5 rounded text-on-surface font-medium text-xs">
                        {p.primaryLocation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-title-sm text-title-sm text-on-surface font-mono font-bold">
                      {p.totalStock.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 font-label-sm text-label-sm text-on-surface-variant">
                      {p.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-body-sm text-body-sm text-on-surface-variant font-mono">
                      {p.reorderPoint.toLocaleString()} {p.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/products/${p.id}`)}
                          className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"
                          title="Quick View / Inspect"
                        >
                          <Icon name="visibility" className="text-sm" />
                        </button>
                        <button
                          onClick={() => navigate('/adjustments/new')}
                          className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-amber-700 transition-colors"
                          title="Adjust Stock"
                        >
                          <Icon name="tune" className="text-sm" />
                        </button>
                        <button
                          onClick={() => navigate('/transfers/new')}
                          className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-blue-700 transition-colors"
                          title="Initiate Transfer"
                        >
                          <Icon name="sync_alt" className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
            <div className="flex items-center gap-2">
              <span>Showing {paginatedProducts.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length} entries</span>
              <span className="text-outline">·</span>
              <span className="text-outline">Rows per page: {pageSize}</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-6 w-6 rounded bg-surface-container-lowest text-on-surface disabled:opacity-40 flex items-center justify-center border border-outline-variant shadow-xs hover:bg-surface-container"
              >
                <Icon name="chevron_left" className="text-xs" />
              </button>
              <span className="px-2 font-semibold text-on-surface">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-6 w-6 rounded bg-surface-container-lowest text-on-surface disabled:opacity-40 flex items-center justify-center border border-outline-variant shadow-xs hover:bg-surface-container"
              >
                <Icon name="chevron_right" className="text-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Operations Log & Facility Capacity (4 Cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Facility Capacity Utilization */}
          <div className="bg-surface-container-lowest p-3.5 rounded-lg border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Icon name="pie_chart" className="text-sm text-primary" />
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">Facility Utilization</span>
              </div>
              <span className="font-label-sm text-label-sm text-tertiary bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                Optimal
              </span>
            </div>
            <div className="space-y-3">
              {warehouses.map((wh) => {
                const cap = wh.activeCapacityPercent ?? Math.round((wh.utilizedCapacityCbm / wh.totalCapacityCbm) * 100);
                let barColor = 'bg-primary';
                let statusLabel = `${cap}% Capacity`;
                if (cap > 90) {
                  barColor = 'bg-error';
                  statusLabel = `${cap}% (Near Max)`;
                } else if (cap < 70) {
                  barColor = 'bg-secondary';
                }

                return (
                  <div key={wh.code}>
                    <div className="flex justify-between font-label-sm text-label-sm mb-1">
                      <span className="text-on-surface font-medium truncate max-w-[200px]">{wh.name}</span>
                      <span className="text-on-surface font-bold font-mono">{statusLabel}</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${wh.activeCapacityPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Operations Log */}
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            <div className="px-3.5 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon name="history" className="text-sm text-secondary" />
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">Recent Operations Log</span>
              </div>
              <button
                onClick={() => navigate('/ledger')}
                className="font-label-sm text-label-sm text-primary hover:underline font-semibold"
              >
                View Complete Ledger
              </button>
            </div>
            <div className="p-2 space-y-2 max-h-[380px] overflow-y-auto">
              {movements.slice(0, 5).map((mov) => {
                let badgeClass = 'bg-primary/10 text-primary';
                let deltaClass = 'text-tertiary font-bold';

                if (mov.type === 'Delivery') {
                  badgeClass = 'bg-secondary-container text-secondary';
                  deltaClass = 'text-error font-bold';
                } else if (mov.type === 'Adjustment') {
                  badgeClass = 'bg-red-50 text-error';
                  deltaClass = 'text-error font-bold';
                } else if (mov.type === 'Transfer') {
                  badgeClass = 'bg-surface-container-high text-on-surface';
                  deltaClass = 'text-on-surface font-bold';
                }

                return (
                  <div
                    key={mov.id}
                    onClick={() => navigate('/ledger')}
                    className="p-2 bg-surface-container-low rounded border border-outline-variant flex flex-col gap-1 hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-label-sm text-[10px] px-1 rounded font-semibold uppercase ${badgeClass}`}>
                          {mov.type}
                        </span>
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface font-mono">
                          {mov.referenceNumber}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline font-mono">{mov.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface font-medium truncate max-w-[180px]">{mov.productName}</span>
                      <span className={`font-mono text-xs ${deltaClass}`}>
                        {mov.quantityDelta > 0 ? `+${mov.quantityDelta}` : mov.quantityDelta} {mov.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-[11px]">
                      <span className="truncate max-w-[200px] text-outline">
                        {mov.fromLocation} ➔ {mov.toLocation}
                      </span>
                      <span className="text-on-surface-variant font-medium">By {mov.operator.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
