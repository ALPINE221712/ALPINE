import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../common/Icon';

export const TopHeader: React.FC = () => {
  const {
    selectedWarehouseCode,
    setSelectedWarehouseCode,
    warehouses,
    setIsCommandPaletteOpen,
  } = useInventory();

  const navigate = useNavigate();
  const [isWhDropdownOpen, setIsWhDropdownOpen] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);

  const currentWh = warehouses.find((w) => w.code === selectedWarehouseCode) || warehouses[0];
  const whName = currentWh?.name || 'Active Warehouse';

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-surface-container-lowest border-b border-outline-variant z-30 px-6 flex items-center justify-between">
      {/* Location / Context Breadcrumb */}
      <div className="flex items-center gap-space-lg">
        <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
          <Icon name="domain" className="text-sm text-outline" />
          <span className="text-outline">StockSense</span>
          <span className="text-outline">/</span>

          {/* Facility Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsWhDropdownOpen(!isWhDropdownOpen)}
              className="flex items-center gap-1 font-title-sm text-title-sm text-on-surface hover:text-primary transition-colors py-1 px-1.5 rounded hover:bg-surface-container-low"
            >
              <span>{whName}</span>
              <Icon name="expand_more" className="text-sm text-outline" />
            </button>

            {isWhDropdownOpen && (
              <div
                className="absolute left-0 mt-1 w-64 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsWhDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-outline border-b border-outline-variant">
                  Switch Active Warehouse
                </div>
                {warehouses.map((wh) => (
                  <button
                    key={wh.code}
                    onClick={() => setSelectedWarehouseCode(wh.code)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface-container-low transition-colors ${
                      wh.code === selectedWarehouseCode ? 'bg-primary-container/10 text-primary font-semibold' : 'text-on-surface'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{wh.name}</div>
                      <div className="text-[10px] text-outline font-mono">{wh.totalBins} Bins · {wh.activeCapacityPercent}% Loaded</div>
                    </div>
                    {wh.code === selectedWarehouseCode && (
                      <Icon name="check" className="text-sm text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Central Command Bar Trigger */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full h-8 pl-8 pr-12 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface hover:border-slate-300 hover:bg-surface-container-lowest transition-colors flex items-center justify-between relative text-left shadow-xs"
        >
          <Icon name="search" className="absolute left-2.5 text-base text-outline pointer-events-none" />
          <span className="text-outline truncate">Search SKU, Product, PO#, or Delivery...</span>
          <div className="absolute right-2 flex items-center gap-1 pointer-events-none">
            <kbd className="font-label-sm text-[10px] bg-surface-container px-1 py-0.5 rounded text-on-surface-variant border border-outline-variant font-mono">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-space-md">
        {/* Sync Status Telemetry */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container font-label-sm text-label-sm text-tertiary font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sync: Live 1s ago</span>
        </div>

        <div className="h-4 w-px bg-outline-variant" />

        {/* Notifications */}
        <button
          className="relative p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
          title="Notifications"
          type="button"
          onClick={() => navigate('/ledger')}
        >
          <Icon name="notifications" className="text-base" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest"></span>
        </button>

        {/* Primary New Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
            className="h-8 px-3 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded flex items-center gap-1 transition-colors shadow-sm"
            type="button"
          >
            <Icon name="add" className="text-base" />
            <span>New Action</span>
            <Icon name="arrow_drop_down" className="text-xs" />
          </button>

          {isActionDropdownOpen && (
            <div
              className="absolute right-0 mt-1 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setIsActionDropdownOpen(false)}
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-outline border-b border-outline-variant">
                Create Inventory Document
              </div>
              <button
                onClick={() => navigate('/receipts/new')}
                className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                <Icon name="call_received" className="text-sm text-primary" />
                <div>
                  <div className="font-semibold">New PO Receipt</div>
                  <div className="text-[10px] text-outline">Inbound shipment verify</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/deliveries/new')}
                className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                <Icon name="local_shipping" className="text-sm text-secondary" />
                <div>
                  <div className="font-semibold">New Delivery Order</div>
                  <div className="text-[10px] text-outline">Outbound picking & pack</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/transfers/new')}
                className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                <Icon name="sync_alt" className="text-sm text-primary" />
                <div>
                  <div className="font-semibold">Internal Transfer</div>
                  <div className="text-[10px] text-outline">Bay-to-bay relocation</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/adjustments/new')}
                className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                <Icon name="tune" className="text-sm text-amber-600" />
                <div>
                  <div className="font-semibold">Stock Adjustment</div>
                  <div className="text-[10px] text-outline">Physical count reconcile</div>
                </div>
              </button>
              <div className="border-t border-outline-variant my-1" />
              <button
                onClick={() => navigate('/products?new=1')}
                className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                <Icon name="inventory_2" className="text-sm text-tertiary" />
                <span className="font-semibold">Add New Product / SKU</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
