import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useInventory } from '../store/inventoryStore';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { ToastContainer } from '../components/common/ToastContainer';
import { CommandPalette } from '../components/search/CommandPalette';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useInventory();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-low font-sans text-on-surface">
      {/* Desktop Persistent Sidebar (240px) */}
      <Sidebar />

      {/* Desktop Persistent Top Header (56px) */}
      <TopHeader />

      {/* Main Content Pane */}
      <main className="pl-64 pt-14 min-h-screen bg-surface-container-low flex flex-col w-full">
        <Outlet />
      </main>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
