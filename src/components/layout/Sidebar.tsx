import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Logo } from '../common/Logo';
import { Icon } from '../common/Icon';

export const Sidebar: React.FC = () => {
  const { user, logout, selectedWarehouseCode, setSelectedWarehouseCode, warehouses } = useInventory();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-space-md px-space-md py-space-sm rounded font-title-sm text-title-sm transition-colors ${
      isActive
        ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`;

  const currentWh = warehouses.find((w) => w.code === selectedWarehouseCode) || warehouses[0];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant z-40 flex flex-col justify-between select-none">
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-2 min-w-0">
            <Logo className="h-7 w-auto" />
            <div className="flex flex-col min-w-0 -mt-0.5">
              <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider font-semibold">
                Enterprise IMS
              </span>
            </div>
          </div>
        </div>

        {/* Facility Scope Indicator */}
        <div className="px-4 py-2 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon name="warehouse" className="text-sm text-primary" />
              <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                {currentWh.code}
              </span>
            </div>
            <span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-medium truncate max-w-[120px]">
              {currentWh.name.split('(')[0].trim()}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Dashboard */}
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <Icon name="dashboard" className="text-base" />
              <span>Dashboard</span>
            </NavLink>
          </nav>

          {/* Inventory */}
          <div className="space-y-1">
            <div className="px-space-md py-0.5 font-label-sm text-label-sm uppercase text-outline tracking-wider font-semibold">
              Inventory
            </div>
            <nav className="space-y-1">
              <NavLink to="/products" end className={navLinkClass}>
                <Icon name="inventory_2" className="text-base" />
                <span>Products</span>
              </NavLink>
            </nav>
          </div>

          {/* Operations */}
          <div className="space-y-1">
            <div className="px-space-md py-0.5 font-label-sm text-label-sm uppercase text-outline tracking-wider font-semibold">
              Operations
            </div>
            <nav className="space-y-1">
              <NavLink to="/receipts" className={navLinkClass}>
                <Icon name="call_received" className="text-base" />
                <span>Receipts</span>
              </NavLink>
              <NavLink to="/deliveries" className={navLinkClass}>
                <Icon name="local_shipping" className="text-base" />
                <span>Deliveries</span>
              </NavLink>
              <NavLink to="/transfers" className={navLinkClass}>
                <Icon name="sync_alt" className="text-base" />
                <span>Transfers</span>
              </NavLink>
              <NavLink to="/adjustments" className={navLinkClass}>
                <Icon name="tune" className="text-base" />
                <span>Adjustments</span>
              </NavLink>
              <NavLink to="/ledger" className={navLinkClass}>
                <Icon name="receipt_long" className="text-base" />
                <span>Move History</span>
              </NavLink>
            </nav>
          </div>

          {/* Settings */}
          <div className="space-y-1">
            <div className="px-space-md py-0.5 font-label-sm text-label-sm uppercase text-outline tracking-wider font-semibold">
              Settings
            </div>
            <nav className="space-y-1">
              <NavLink to="/warehouses" className={navLinkClass}>
                <Icon name="store" className="text-base" />
                <span>Warehouses</span>
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                <Icon name="account_circle" className="text-base" />
                <span>Profile</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between gap-space-sm p-1.5 rounded hover:bg-surface-container-low transition-colors">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-300"
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'}
            />
            <div className="flex flex-col min-w-0">
              <span className="font-title-sm text-title-sm text-on-surface truncate leading-tight">
                {user?.name || 'Marcus Vance'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                {user?.role || 'Operations Manager'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded transition-colors"
            title="Sign out"
            type="button"
          >
            <Icon name="logout" className="text-base" />
          </button>
        </div>
      </div>
    </aside>
  );
};
