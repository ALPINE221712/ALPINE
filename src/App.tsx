import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useInventory } from './store/inventoryStore';

// Layouts
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// App Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ReceiptsPage } from './pages/receipts/ReceiptsPage';
import { DeliveriesPage } from './pages/deliveries/DeliveriesPage';
import { TransfersPage } from './pages/transfers/TransfersPage';
import { AdjustmentsPage } from './pages/adjustments/AdjustmentsPage';
import { LedgerPage } from './pages/ledger/LedgerPage';
import { WarehousesPage } from './pages/warehouses/WarehousesPage';
import { ProfilePage } from './pages/profile/ProfilePage';

import { LandingPage } from './pages/landing/LandingPage';

// Common Components
import { CommandPalette } from './components/search/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';

export const App: React.FC = () => {
  const { isAuthenticated, isAuthLoading } = useInventory();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex flex-col justify-center items-center select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-mono text-xs text-outline tracking-wider uppercase font-semibold">
            Connecting to StockSense Engine...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected App Routes */}
        <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductsPage />} />
          <Route path="/stock-overview" element={<Navigate to="/products" replace />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/receipts/new" element={<ReceiptsPage />} />
          <Route path="/receipts/:id" element={<ReceiptsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/deliveries/new" element={<DeliveriesPage />} />
          <Route path="/deliveries/:id" element={<DeliveriesPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/transfers/new" element={<TransfersPage />} />
          <Route path="/transfers/:id" element={<TransfersPage />} />
          <Route path="/adjustments" element={<AdjustmentsPage />} />
          <Route path="/adjustments/new" element={<AdjustmentsPage />} />
          <Route path="/adjustments/:id" element={<AdjustmentsPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/move-history" element={<Navigate to="/ledger" replace />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
        </Route>

        {/* Catch-all: send to dashboard if authenticated, else landing page */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
      </Routes>

      {/* Global Modals & Notifications */}
      <CommandPalette />
      <ToastContainer />
    </>
  );
};

export default App;
