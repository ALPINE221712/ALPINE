import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../common/Icon';
import { StatusBadge } from '../common/StatusBadge';

type ScopeCategory = 'all' | 'products' | 'receipts' | 'deliveries' | 'transfers' | 'adjustments' | 'ledger';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    products,
    receipts,
    deliveries,
    transfers,
    adjustments,
    selectedWarehouseCode,
  } = useInventory();

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeScope, setActiveScope] = useState<ScopeCategory>('all');

  // Global Keyboard Shortcuts (⌘K, ⌥R, ⌥T, ⌥C, ⌥L, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }

      // Quick action triggers when Alt / Option key is pressed
      if (e.altKey) {
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          navigate('/receipts/new');
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          navigate('/transfers/new');
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          navigate('/adjustments/new');
        } else if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          navigate('/ledger');
        }
      }

      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, navigate]);

  // Search logic across entities
  const filteredResults = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const matchedProducts = products.filter(
      (p) =>
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.primaryLocation.toLowerCase().includes(term)
    );

    const matchedReceipts = receipts.filter(
      (r) =>
        !term ||
        r.receiptNumber.toLowerCase().includes(term) ||
        r.poNumber.toLowerCase().includes(term) ||
        r.supplier.toLowerCase().includes(term)
    );

    const matchedDeliveries = deliveries.filter(
      (d) =>
        !term ||
        d.deliveryNumber.toLowerCase().includes(term) ||
        d.soNumber.toLowerCase().includes(term) ||
        d.customerName.toLowerCase().includes(term)
    );

    const matchedTransfers = transfers.filter(
      (t) =>
        !term ||
        t.transferNumber.toLowerCase().includes(term) ||
        t.sourceLocation.toLowerCase().includes(term) ||
        t.destinationLocation.toLowerCase().includes(term)
    );

    const matchedAdjustments = adjustments.filter(
      (a) =>
        !term ||
        (a.locationArea ? a.locationArea.toLowerCase().includes(term) : false) ||
        a.warehouseName.toLowerCase().includes(term)
    );

    return {
      products: matchedProducts,
      receipts: matchedReceipts,
      deliveries: matchedDeliveries,
      transfers: matchedTransfers,
      adjustments: matchedAdjustments,
      totalCount:
        matchedProducts.length +
        matchedReceipts.length +
        matchedDeliveries.length +
        matchedTransfers.length +
        matchedAdjustments.length,
    };
  }, [searchTerm, products, receipts, deliveries, transfers, adjustments]);

  if (!isCommandPaletteOpen) return null;

  const handleSelect = (path: string) => {
    setIsCommandPaletteOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 top-14 left-64 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-start pt-10 px-4 overflow-y-auto">
      <div className="w-full max-w-[760px] bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden flex flex-col mb-12 border border-outline-variant animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Header */}
        <div className="relative flex items-center px-4 py-3.5 bg-surface-container-lowest border-b border-outline-variant">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container text-primary mr-3 shrink-0">
            <Icon name="search" className="text-xl" />
          </div>
          <div className="flex-1 flex items-center min-w-0">
            <input
              autoFocus
              autoComplete="off"
              className="w-full bg-transparent font-title-md text-title-md text-on-surface placeholder:text-outline focus:outline-none tracking-tight"
              placeholder="Search SKUs, Purchase Orders, Delivery Orders, Transfers, Bins, or Actions..."
              spellCheck="false"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-surface-container-high rounded text-on-surface font-label-sm">
              <Icon name="warehouse" className="text-xs text-primary" />
              <span>{selectedWarehouseCode} Main</span>
            </div>
            <button
              onClick={() => {
                if (searchTerm) setSearchTerm('');
                else setIsCommandPaletteOpen(false);
              }}
              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-sm font-mono transition-colors"
              title="Close or Clear"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Category Scope Tabs */}
        <div className="px-4 py-2 bg-surface-container-low flex items-center gap-1.5 overflow-x-auto border-b border-outline-variant">
          <button
            onClick={() => setActiveScope('all')}
            className={`px-2.5 py-1 rounded font-label-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeScope === 'all'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span>All Results</span>
            <span className="px-1.5 py-0.2 rounded-full bg-on-primary/20 text-on-primary font-mono text-[10px]">
              {filteredResults.totalCount}
            </span>
          </button>
          <button
            onClick={() => setActiveScope('products')}
            className={`px-2.5 py-1 rounded font-label-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeScope === 'products'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <Icon name="inventory_2" className="text-xs" />
            <span>Products</span>
            <span className="text-outline font-mono text-[10px]">{filteredResults.products.length}</span>
          </button>
          <button
            onClick={() => setActiveScope('receipts')}
            className={`px-2.5 py-1 rounded font-label-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeScope === 'receipts'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <Icon name="call_received" className="text-xs" />
            <span>Receipts</span>
            <span className="text-outline font-mono text-[10px]">{filteredResults.receipts.length}</span>
          </button>
          <button
            onClick={() => setActiveScope('deliveries')}
            className={`px-2.5 py-1 rounded font-label-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeScope === 'deliveries'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <Icon name="local_shipping" className="text-xs" />
            <span>Deliveries</span>
            <span className="text-outline font-mono text-[10px]">{filteredResults.deliveries.length}</span>
          </button>
          <button
            onClick={() => setActiveScope('transfers')}
            className={`px-2.5 py-1 rounded font-label-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeScope === 'transfers'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <Icon name="sync_alt" className="text-xs" />
            <span>Transfers</span>
            <span className="text-outline font-mono text-[10px]">{filteredResults.transfers.length}</span>
          </button>
          <button
            onClick={() => setActiveScope('adjustments')}
            className={`px-2.5 py-1 rounded font-label-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeScope === 'adjustments'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <Icon name="tune" className="text-xs" />
            <span>Adjustments</span>
            <span className="text-outline font-mono text-[10px]">{filteredResults.adjustments.length}</span>
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[480px] overflow-y-auto px-4 py-3 space-y-4">
          {/* Quick Operational Actions */}
          {!searchTerm && activeScope === 'all' && (
            <div>
              <div className="px-1 py-1 flex items-center justify-between text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
                <span className="flex items-center gap-1 text-primary">
                  <Icon name="bolt" className="text-sm" />
                  Quick Actions
                </span>
                <span className="text-outline font-normal lowercase text-[10px]">Instant Keyboard Trigger</span>
              </div>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  onClick={() => handleSelect('/receipts/new')}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-xs">
                      <Icon name="call_received" className="text-base" />
                    </div>
                    <div className="truncate">
                      <div className="font-title-sm text-title-sm text-on-surface truncate">New PO Receipt</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Inbound dock receiving</div>
                    </div>
                  </div>
                  <span className="font-label-sm text-outline font-mono bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant">
                    ⌥R
                  </span>
                </div>

                <div
                  onClick={() => handleSelect('/transfers/new')}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-xs">
                      <Icon name="sync_alt" className="text-base" />
                    </div>
                    <div className="truncate">
                      <div className="font-title-sm text-title-sm text-on-surface truncate">Create Internal Transfer</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Rack-to-rack relocation</div>
                    </div>
                  </div>
                  <span className="font-label-sm text-outline font-mono bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant">
                    ⌥T
                  </span>
                </div>

                <div
                  onClick={() => handleSelect('/adjustments/new')}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-surface-container-lowest flex items-center justify-center text-secondary shrink-0 shadow-xs">
                      <Icon name="tune" className="text-base" />
                    </div>
                    <div className="truncate">
                      <div className="font-title-sm text-title-sm text-on-surface truncate">Start Cycle Count</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Reconcile physical variance</div>
                    </div>
                  </div>
                  <span className="font-label-sm text-outline font-mono bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant">
                    ⌥C
                  </span>
                </div>

                <div
                  onClick={() => handleSelect('/ledger')}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-surface-container-lowest flex items-center justify-center text-secondary shrink-0 shadow-xs">
                      <Icon name="receipt_long" className="text-base" />
                    </div>
                    <div className="truncate">
                      <div className="font-title-sm text-title-sm text-on-surface truncate">Stock Ledger Audit</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Immutable movement log</div>
                    </div>
                  </div>
                  <span className="font-label-sm text-outline font-mono bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant">
                    ⌥L
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Live Matched Entities */}
          <div className="space-y-3">
            {/* Products */}
            {(activeScope === 'all' || activeScope === 'products') && filteredResults.products.length > 0 && (
              <div>
                <div className="px-1 py-1 text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
                  Products &amp; SKUs ({filteredResults.products.length})
                </div>
                <div className="mt-1 space-y-1">
                  {filteredResults.products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect(`/products/${p.id}`)}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-outline-variant"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-primary-container text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          SKU
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-title-sm text-title-sm text-primary font-bold font-mono">
                              {p.sku}
                            </span>
                            <span className="font-title-sm text-title-sm text-on-surface truncate font-semibold">
                              {p.name}
                            </span>
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            {p.category} · On-Hand: <strong className="text-on-surface font-mono">{p.totalStock} {p.unit}</strong> ({p.primaryLocation})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={p.status} />
                        <Icon name="chevron_right" className="text-outline text-base" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Receipts */}
            {(activeScope === 'all' || activeScope === 'receipts') && filteredResults.receipts.length > 0 && (
              <div>
                <div className="px-1 py-1 text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
                  Inbound Receipts ({filteredResults.receipts.length})
                </div>
                <div className="mt-1 space-y-1">
                  {filteredResults.receipts.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelect(`/receipts/${r.id}`)}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-outline-variant"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                          <Icon name="call_received" className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-title-sm text-title-sm text-on-surface font-bold font-mono">
                              {r.receiptNumber}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              PO: {r.poNumber} · {r.supplier}
                            </span>
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            Dock: {r.stagedBay} · {r.items.length} Line items ({r.totalExpectedUnits} units expected)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={r.status} />
                        <Icon name="chevron_right" className="text-outline text-base" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliveries */}
            {(activeScope === 'all' || activeScope === 'deliveries') && filteredResults.deliveries.length > 0 && (
              <div>
                <div className="px-1 py-1 text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
                  Delivery Orders ({filteredResults.deliveries.length})
                </div>
                <div className="mt-1 space-y-1">
                  {filteredResults.deliveries.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleSelect(`/deliveries/${d.id}`)}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-outline-variant"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-surface-container text-secondary flex items-center justify-center shrink-0">
                          <Icon name="local_shipping" className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-title-sm text-title-sm text-on-surface font-bold font-mono">
                              {d.deliveryNumber}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface truncate">
                              {d.customerName} (SO: {d.soNumber})
                            </span>
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            {d.stagingBay} · Carrier: {d.carrier} · {d.totalUnits} Units
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={d.status} />
                        <Icon name="chevron_right" className="text-outline text-base" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transfers */}
            {(activeScope === 'all' || activeScope === 'transfers') && filteredResults.transfers.length > 0 && (
              <div>
                <div className="px-1 py-1 text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
                  Internal Transfers ({filteredResults.transfers.length})
                </div>
                <div className="mt-1 space-y-1">
                  {filteredResults.transfers.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelect(`/transfers/${t.id}`)}
                      className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-outline-variant"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-surface-container text-primary flex items-center justify-center shrink-0">
                          <Icon name="sync_alt" className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-title-sm text-title-sm text-on-surface font-bold font-mono">
                              {t.transferNumber}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {t.sourceLocation} ➔ {t.destinationLocation}
                            </span>
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">
                            {t.totalUnits} units relocation · Initiator: {t.initiatedBy}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={t.status} />
                        <Icon name="chevron_right" className="text-outline text-base" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredResults.totalCount === 0 && (
              <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg">
                <Icon name="search_off" className="text-3xl text-outline mb-2" />
                <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">
                  No matching inventory records found
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                  No SKUs, receipts, deliveries, or relocation tickets matched "{searchTerm}".
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-surface-container-lowest rounded border border-outline-variant">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-surface-container-lowest rounded border border-outline-variant">↵</kbd> Inspect
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-surface-container-lowest rounded border border-outline-variant">ESC</kbd> Close
            </span>
          </div>
          <span>StockSense Universal Search</span>
        </div>
      </div>
    </div>
  );
};
