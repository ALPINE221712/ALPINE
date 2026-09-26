import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useInventory } from '../store/inventoryStore';
import { Logo } from '../components/common/Logo';
import { ToastContainer } from '../components/common/ToastContainer';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useInventory();

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col justify-center items-center p-6">
      {/* Container Card */}
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo className="h-8 w-auto mb-2" />
          <div className="text-center">
            <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider font-semibold">
              Enterprise Inventory Management System
            </span>
          </div>
        </div>

        <Outlet />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-outline font-mono">
        StockSense IMS · High-Density Multi-Facility Logistics
      </div>

      <ToastContainer />
    </div>
  );
};
