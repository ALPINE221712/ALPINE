import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { DeliveryItem } from '../../types';

export const DeliveriesPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { deliveries, products, pickDelivery, dispatchDelivery, createDelivery, addToast } = useInventory();

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(id || deliveries[0]?.id || 'DEL-001');

  useEffect(() => {
    if (id) {
      setSelectedDeliveryId(id);
    }
  }, [id]);

  // Is "new" route
  const isNewRoute = location.pathname.endsWith('/new');
  const [isNewModalOpen, setIsNewModalOpen] = useState(isNewRoute);

  useEffect(() => {
    if (isNewRoute) setIsNewModalOpen(true);
  }, [isNewRoute]);

  // Filters
  const [statusTab, setStatusTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected delivery
  const selectedDelivery = useMemo(
    () => deliveries.find((d) => d.id === selectedDeliveryId) || deliveries[0],
    [deliveries, selectedDeliveryId]
  );

  // Dispatch Guard check: check if any item in selected delivery has insufficient stock in warehouse
  const dispatchGuardIssues = useMemo(() => {
    if (!selectedDelivery) return [];
    const issues: { sku: string; name: string; requested: number; available: number }[] = [];

    for (const item of selectedDelivery.items) {
      const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
      const onHand = prod ? prod.totalStock : 0;
      if (onHand < item.requestedQty && selectedDelivery.status !== 'Dispatched') {
        issues.push({
          sku: item.sku,
          name: item.productName,
          requested: item.requestedQty,
          available: onHand,
        });
      }
    }
    return issues;
  }, [selectedDelivery, products]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchSearch =
        !searchTerm ||
        d.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.carrier.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusTab === 'All' || d.status === statusTab;
      return matchSearch && matchStatus;
    });
  }, [deliveries, searchTerm, statusTab]);

  // Summary Metrics
  const readyToPickCount = deliveries.filter((d) => d.status === 'Ready to Pick').length;
  const inPickingCount = deliveries.filter((d) => d.status === 'In Picking' || d.status === 'Packing & Staged').length;
  const dispatchedCount = deliveries.filter((d) => d.status === 'Dispatched').length;
  const holdCount = deliveries.filter((d) => d.status === 'On Hold').length;

  // New Delivery Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    soNumber: 'SO-88290',
    customerName: 'AeroDynamics Aerospace',
    deliveryAddress: '100 Runway Boulevard, Long Beach, CA',
    carrier: 'FreightWay Express',
    stagingBay: 'Outbound Staging Bay 02',
    warehouseId: 'WH-01',
    priority: 'Standard' as const,
    notes: 'Outbound fulfillment for production assembly.',
    items: [
      {
        productId: 'PRD-002',
        requestedQty: 100,
      },
    ],
  });

  const [isDispatching, setIsDispatching] = useState(false);

  const handlePick = async () => {
    if (!selectedDelivery) return;
    await pickDelivery(selectedDelivery.id);
  };

  const handleDispatch = async () => {
    if (!selectedDelivery || isDispatching) return;
    setIsDispatching(true);
    const res = await dispatchDelivery(selectedDelivery.id);
    setIsDispatching(false);
    if (!res.success) {
      addToast({
        type: 'error',
        title: 'Dispatch Blocked',
        message: res.message,
      });
    }
  };

  const handleCreateDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lineItems: DeliveryItem[] = newOrderForm.items.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId) || products[0];
      return {
        id: `DITM-${Date.now()}-${idx}`,
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        unit: prod.unit,
        requestedQty: Number(it.requestedQty),
        pickedQty: 0,
        allocatedBin: prod.primaryLocation,
        status: 'Pending',
      };
    });

    const totalUnits = lineItems.reduce((acc, it) => acc + it.requestedQty, 0);

    const created = await createDelivery({
      soNumber: newOrderForm.soNumber,
      customerName: newOrderForm.customerName,
      deliveryAddress: newOrderForm.deliveryAddress,
      carrier: newOrderForm.carrier,
      stagingBay: newOrderForm.stagingBay,
      warehouseId: newOrderForm.warehouseId,
      priority: newOrderForm.priority,
      status: 'Ready to Pick',
      createdDate: 'Just now',
      notes: newOrderForm.notes,
      totalUnits,
      items: lineItems,
    });

    setIsNewModalOpen(false);
    setSelectedDeliveryId(created.id);
    navigate('/deliveries');
  };

  return (
    <div className="flex flex-col gap-space-lg p-6 w-full flex-1">
      {/* Sub-header / Operational Context Bar */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline uppercase tracking-wider">
            <span>StockSense</span>
            <span>/</span>
            <span>Operations</span>
            <span>/</span>
            <span className="text-primary font-semibold">Deliveries &amp; Outbound</span>
          </div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
            Delivery Orders &amp; Outbound Shipments
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Manage outbound picking, packing, shipping staging, and real-time inventory deductions with active dispatch protection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => {
              const csv = 'Delivery,SO,Customer,Carrier,TotalUnits,Status\n' + deliveries.map(d => `"${d.deliveryNumber}","${d.soNumber}","${d.customerName}","${d.carrier}",${d.totalUnits},"${d.status}"`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'outbound_deliveries.csv';
              a.click();
              addToast({ type: 'success', title: 'Manifest Downloaded', message: 'Delivery manifest exported as CSV.' });
            }}
            className="h-8 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors border border-outline-variant shadow-xs"
          >
            <Icon name="download" className="text-base text-outline" />
            <span>Export Manifests</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="h-8 px-3.5 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Icon name="add" className="text-base" />
            <span>+ New Delivery Order</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* KPI 1 */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider font-semibold">
              Ready to Pick
            </span>
            <span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-mono">
              {readyToPickCount} Orders
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-tabular-kpi text-tabular-kpi text-on-surface font-mono">
              {readyToPickCount}
            </span>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-1">
              <Icon name="check_circle" className="text-xs" /> Pre-reserved in WH-01
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider font-semibold">
              In Picking / Packing
            </span>
            <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-mono">
              {inPickingCount} Orders
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-tabular-kpi text-tabular-kpi text-on-surface font-mono">
              {inPickingCount}
            </span>
            <span className="font-label-sm text-label-sm text-primary font-semibold">
              Staging Bay 01 &amp; 03
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider font-semibold">
              Dispatched Today
            </span>
            <span className="font-label-sm text-label-sm bg-emerald-50 text-tertiary border border-emerald-200 px-2 py-0.5 rounded font-mono">
              {dispatchedCount} Shipments
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-tabular-kpi text-tabular-kpi text-tertiary font-mono font-bold">
              {dispatchedCount}
            </span>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold">
              Ledger synced
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-error tracking-wider font-semibold">
              Insufficient Stock / Hold
            </span>
            <span className="font-label-sm text-label-sm bg-error-container text-on-error-container px-2 py-0.5 rounded font-mono">
              {holdCount} Flagged
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-tabular-kpi text-tabular-kpi text-error font-mono font-bold">
              {holdCount}
            </span>
            <span className="font-label-sm text-label-sm text-error font-semibold flex items-center gap-1">
              <Icon name="gpp_bad" className="text-xs" /> Dispatch Guard Active
            </span>
          </div>
        </div>
      </div>

      {/* Filter Strip & Tabs */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {['All', 'Ready to Pick', 'In Picking', 'Packing & Staged', 'Dispatched', 'On Hold'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1 rounded font-title-sm text-title-sm transition-colors whitespace-nowrap ${
                statusTab === tab
                  ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {tab === 'All' ? 'All Deliveries' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Delivery #, SO#, Customer Name, or Carrier..."
            className="w-full h-8 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest"
          />
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* Left: Deliveries Master Table (6-7 cols) */}
        <div className="lg:col-span-6 2xl:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
              Outbound Fulfillment Queue ({filteredDeliveries.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-2.5 px-3 font-semibold">Delivery / SO</th>
                  <th className="py-2.5 px-3 font-semibold">Customer &amp; Carrier</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Units</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Priority</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body-sm text-body-sm">
                {filteredDeliveries.map((d) => {
                  const isSelected = d.id === selectedDelivery?.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDeliveryId(d.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 font-medium border-l-4 border-primary'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-title-sm text-title-sm text-primary font-bold font-mono">
                          {d.deliveryNumber}
                        </div>
                        <div className="font-label-sm text-label-sm text-outline font-mono">{d.soNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-on-surface truncate max-w-[160px]">
                          {d.customerName}
                        </div>
                        <div className="text-xs text-outline truncate">{d.carrier}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {d.totalUnits.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            d.priority === 'Rush Priority'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {d.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Outbound Staging & Dispatch Inspection Workbench (5-6 cols) */}
        {selectedDelivery && (
          <div className="lg:col-span-6 2xl:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-md flex flex-col overflow-hidden">
            {/* Workbench Header */}
            <div className="p-space-md bg-surface-container-low border-b border-outline-variant flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold font-mono">
                      {selectedDelivery.deliveryNumber}
                    </span>
                    <StatusBadge status={selectedDelivery.status} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 block">
                    Sales Order: <strong className="text-primary font-mono">{selectedDelivery.soNumber}</strong> · Customer: <strong className="text-on-surface">{selectedDelivery.customerName}</strong>
                  </span>
                </div>
              </div>

              {/* Destination & Logistics */}
              <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-2.5 rounded border border-outline-variant text-xs">
                <div>
                  <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Shipping Address</span>
                  <span className="text-on-surface font-medium truncate block">{selectedDelivery.deliveryAddress}</span>
                </div>
                <div>
                  <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Staged Bay</span>
                  <span className="text-on-surface font-mono font-medium truncate block">{selectedDelivery.stagingBay}</span>
                </div>
              </div>

              {/* DISPATCH GUARD WARNING BANNER */}
              {dispatchGuardIssues.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
                  <Icon name="gpp_bad" className="text-error text-xl shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-red-900 uppercase tracking-wide">
                      Dispatch Guard Warning: Negative Stock Prevention
                    </div>
                    <div className="text-red-700 mt-0.5">
                      This order cannot be dispatched. Insufficient warehouse stock:
                      <ul className="list-disc list-inside mt-1 font-mono font-semibold">
                        {dispatchGuardIssues.map((issue) => (
                          <li key={issue.sku}>
                            {issue.sku} ({issue.name}): Requested {issue.requested}, On-Hand: {issue.available}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Picking List Lines */}
            <div className="p-space-md flex flex-col gap-3 flex-1">
              <h4 className="font-title-md text-title-md text-on-surface font-semibold">
                Picking &amp; Packing List ({selectedDelivery.items.length} Lines)
              </h4>

              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {selectedDelivery.items.map((it) => {
                  const prod = products.find((p) => p.id === it.productId || p.sku === it.sku);
                  const onHand = prod ? prod.totalStock : 0;
                  const isDeficit = onHand < it.requestedQty && selectedDelivery.status !== 'Dispatched';

                  return (
                    <div
                      key={it.id}
                      className={`p-3 rounded border flex flex-col gap-2 ${
                        isDeficit
                          ? 'bg-red-50/60 border-red-200'
                          : 'bg-surface-container-low border-outline-variant'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                              {it.productName}
                            </span>
                            <span className="font-label-sm text-label-sm bg-surface-container px-1 rounded text-on-surface font-mono">
                              {it.sku}
                            </span>
                          </div>
                          <span className="text-xs text-outline block mt-0.5 font-mono">
                            Allocated Bin: {it.allocatedBin}
                          </span>
                        </div>
                        <StatusBadge
                          status={
                            selectedDelivery.status === 'Dispatched'
                              ? 'Dispatched'
                              : isDeficit
                              ? 'Insufficient Stock'
                              : it.status
                          }
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-2 rounded border border-outline-variant text-xs font-mono">
                        <div>
                          <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Requested</span>
                          <span className="font-bold text-on-surface">{it.requestedQty} {it.unit}</span>
                        </div>
                        <div>
                          <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Available Stock</span>
                          <span className={isDeficit ? 'text-error font-bold' : 'text-on-surface font-semibold'}>
                            {onHand} {it.unit}
                          </span>
                        </div>
                        <div>
                          <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Picked Qty</span>
                          <span className="text-primary font-bold">{it.pickedQty} {it.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workbench Actions Footer */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between gap-3">
              <div className="text-xs text-on-surface-variant font-mono">
                {selectedDelivery.status === 'Dispatched' ? (
                  <span className="text-tertiary flex items-center gap-1 font-semibold">
                    <Icon name="check_circle" className="text-sm" /> Dispatched &amp; Deducted from Ledger
                  </span>
                ) : (
                  <span>Status: {selectedDelivery.status}</span>
                )}
              </div>

              {selectedDelivery.status !== 'Dispatched' && (
                <div className="flex items-center gap-2">
                  {selectedDelivery.status === 'Ready to Pick' && (
                    <button
                      onClick={handlePick}
                      className="h-8 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm rounded border border-outline-variant transition-colors"
                    >
                      <Icon name="checklist" className="text-sm mr-1" />
                      <span>Confirm Pick &amp; Pack</span>
                    </button>
                  )}

                  <button
                    onClick={handleDispatch}
                    disabled={isDispatching || dispatchGuardIssues.length > 0}
                    className="h-9 px-4 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      dispatchGuardIssues.length > 0
                        ? 'Blocked by dispatch guard: Insufficient inventory'
                        : 'Confirm Outbound Dispatch'
                    }
                  >
                    <Icon name={isDispatching ? 'sync' : 'local_shipping'} className={`text-base ${isDispatching ? 'animate-spin' : ''}`} />
                    <span>{isDispatching ? 'Dispatching...' : 'Validate & Dispatch Order'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Delivery Order */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Outbound Delivery Order"
        subtitle="Initiate customer order picking with automated dispatch guard validation."
      >
        <form onSubmit={handleCreateDeliverySubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Sales Order (SO#) *
              </label>
              <input
                type="text"
                required
                value={newOrderForm.soNumber}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, soNumber: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded font-mono font-semibold text-xs text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={newOrderForm.customerName}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
              Destination Delivery Address *
            </label>
            <input
              type="text"
              required
              value={newOrderForm.deliveryAddress}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, deliveryAddress: e.target.value })}
              className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Carrier
              </label>
              <input
                type="text"
                value={newOrderForm.carrier}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, carrier: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Staging Bay
              </label>
              <input
                type="text"
                value={newOrderForm.stagingBay}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, stagingBay: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Priority
              </label>
              <select
                value={newOrderForm.priority}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, priority: e.target.value as any })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              >
                <option value="Standard">Standard</option>
                <option value="Rush Priority">Rush Priority</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-surface-container-low border border-outline-variant rounded">
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-2 font-semibold">
              Order Item &amp; Requested Quantity
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-label-sm text-[10px] text-outline block mb-1">Select Product</span>
                <select
                  value={newOrderForm.items[0].productId}
                  onChange={(e) => {
                    const next = [...newOrderForm.items];
                    next[0].productId = e.target.value;
                    setNewOrderForm({ ...newOrderForm, items: next });
                  }}
                  className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} (Stock: {p.totalStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="font-label-sm text-[10px] text-outline block mb-1">Requested Qty</span>
                <input
                  type="number"
                  min="1"
                  value={newOrderForm.items[0].requestedQty}
                  onChange={(e) => {
                    const next = [...newOrderForm.items];
                    next[0].requestedQty = Number(e.target.value);
                    setNewOrderForm({ ...newOrderForm, items: next });
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
              <span>Queue Outbound Order</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
