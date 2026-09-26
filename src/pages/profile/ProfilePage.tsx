import React, { useState } from 'react';
import { useInventory } from '../../store/inventoryStore';
import Icon from '../../components/common/Icon';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, warehouses, addToast } = useInventory();

  const [name, setName] = useState(user?.name || 'Marcus Vance');
  const [email, setEmail] = useState(user?.email || 'marcus.vance@stocksense.internal');
  const [role, setRole] = useState(user?.role || 'Operations Manager');
  const [assignedFacility, setAssignedFacility] = useState(user?.assignedWarehouse || 'WH-01');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [discrepancyAlerts, setDiscrepancyAlerts] = useState(true);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      role,
      assignedWarehouse: assignedFacility,
    });
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Operator preferences and facility assignment saved.',
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast({ type: 'error', title: 'Error', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 8) {
      addToast({ type: 'error', title: 'Error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Error', message: 'New passwords do not match.' });
      return;
    }

    addToast({
      type: 'success',
      title: 'Password Changed',
      message: 'Operator authentication credentials updated successfully.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Header */}
      <div className="px-6 py-5 bg-surface-container-lowest border-b border-outline-variant flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Icon name="manage_accounts" className="text-primary text-xl" />
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
            Operator Profile &amp; Facility Settings
          </h1>
          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-mono">
            ID: #OP-8821
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
          Manage operations manager credentials, physical warehouse facility assignment, and inventory exception alert preferences.
        </p>
      </div>

      <div className="p-6 max-w-6xl space-y-6">
        {/* Top Profile Summary Card */}
        <div className="bg-surface-container-lowest rounded shadow-2xs border border-outline-variant p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKDUZgZKMdPT-CFzSWlMKR8BQuTj8Qz1Myp8wtqRRXc-TqrhEvbdgyIqXc0kWrZvJk9qN9Sq7SUfTnBqij8gdVYegsqoAtqbz1eS0HdThiILORSSe7kakWdPvOSFRHVy3d6IGs3sQAC6FOh3XhlT94iEGd4vXGyriMfPgKRSXyhWVt0FAyTa2Di5Fz-n6IXQjKQLrrL0SNHJMjygeYOuLvzdMUWGdRjzdoxx4C4Uw5PqP-bpHU4yIe"
              alt="Marcus Vance"
              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{user?.name || name}</h2>
                <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">
                  {user?.role || role}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant font-mono">{user?.email || email}</p>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1">
                <span className="flex items-center gap-1">
                  <Icon name="warehouse" className="text-sm text-primary" />
                  <span>Assigned: <strong>{user?.assignedWarehouse || assignedFacility} Main Facility</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-tertiary">
                  <Icon name="verified_user" className="text-sm" />
                  <span>Security Clearance: Enterprise Lead</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <div className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-right">
              <div className="font-label-sm text-label-sm text-outline uppercase font-semibold">Active Session</div>
              <div className="font-mono text-xs font-bold text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span>Desktop Station · 10.240.12.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid for Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Profile Details & Facility (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container-lowest rounded shadow-2xs border border-outline-variant p-5">
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold border-b border-outline-variant pb-2 mb-4">
                Operator Information
              </h3>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                      Job Title / Role
                    </label>
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                      Primary Assigned Facility
                    </label>
                    <select
                      value={assignedFacility}
                      onChange={(e) => setAssignedFacility(e.target.value)}
                      className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                    >
                      {warehouses.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="h-8 px-4 rounded bg-primary text-on-primary hover:bg-primary/90 font-title-sm text-title-sm transition-colors shadow-sm"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Notification & Threshold Preferences */}
            <div className="bg-surface-container-lowest rounded shadow-2xs border border-outline-variant p-5">
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold border-b border-outline-variant pb-2 mb-4">
                Operational Alert Preferences
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-2.5 bg-surface-container-low rounded border border-outline-variant cursor-pointer">
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold block">
                      Low Stock Threshold Alerts
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Instant notification when SKU stock drops to or below defined reorder point.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={lowStockAlerts}
                    onChange={(e) => setLowStockAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-primary cursor-pointer accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-surface-container-low rounded border border-outline-variant cursor-pointer">
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold block">
                      Physical Count Discrepancy Warnings
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Alerts when cycle count variance exceeds 5% or $500 valuation impact.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={discrepancyAlerts}
                    onChange={(e) => setDiscrepancyAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-primary cursor-pointer accent-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-surface-container-low rounded border border-outline-variant cursor-pointer">
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold block">
                      Daily Ledger Movement Digest
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Summary of receipts, dispatches, and transfers sent to registered email.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-primary cursor-pointer accent-primary"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Security & Role Permissions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Password Change Form */}
            <div className="bg-surface-container-lowest rounded shadow-2xs border border-outline-variant p-5">
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold border-b border-outline-variant pb-2 mb-4">
                Authentication &amp; Security
              </h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="h-8 px-4 rounded bg-surface-container-high hover:bg-surface-container text-on-surface font-title-sm text-title-sm transition-colors border border-outline-variant"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Operator Roles & Privileges */}
            <div className="bg-surface-container-lowest rounded shadow-2xs border border-outline-variant p-5">
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold border-b border-outline-variant pb-2 mb-3">
                Granted System Permissions
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-tertiary">
                  <Icon name="check_circle" className="text-sm" />
                  <span className="text-on-surface">PO Receipt Inbound Verification &amp; Putaway</span>
                </div>
                <div className="flex items-center gap-2 text-tertiary">
                  <Icon name="check_circle" className="text-sm" />
                  <span className="text-on-surface">Outbound Pick/Pack Fulfillment &amp; Dispatch Guard</span>
                </div>
                <div className="flex items-center gap-2 text-tertiary">
                  <Icon name="check_circle" className="text-sm" />
                  <span className="text-on-surface">Internal Warehouse Relocation Execution</span>
                </div>
                <div className="flex items-center gap-2 text-tertiary">
                  <Icon name="check_circle" className="text-sm" />
                  <span className="text-on-surface">Physical Cycle Count Reconciliation &amp; Write-Off</span>
                </div>
                <div className="flex items-center gap-2 text-tertiary">
                  <Icon name="check_circle" className="text-sm" />
                  <span className="text-on-surface">Immutable Stock Ledger Export &amp; Auditing</span>
                </div>
                <div className="flex items-center gap-2 text-tertiary">
                  <Icon name="check_circle" className="text-sm" />
                  <span className="text-on-surface">Multi-Facility Infrastructure Configuration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
