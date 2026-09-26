# StockSense Enterprise IMS — Desktop/PC Application

A professional, high-density inventory management system (IMS) frontend built with **React 18 + TypeScript + Vite + Tailwind CSS**, based on the Google Stitch UI/UX design export.

---

## 🌟 Features & Implemented Workflows

1. **Dashboard (`/dashboard`)**:
   - 5 KPI summary cards (Total Inventory Valuation, Active SKUs, Low Stock Thresholds, Pending Inbound Receipts, Staged Outbound Orders).
   - Real-time warehouse capacity utilization bars for WH-01 Main, WH-02 Annex, and WH-03 Bulk.
   - Catalog overview table with reorder alerts and recent stock operations activity log.
   - Single-click CSV export.

2. **Master Product Catalog (`/products`)**:
   - High-density SKU table with color-coded status badges (`Available`, `Low Stock`, `Out of Stock`).
   - 40% deep Item Inspector drawer displaying reorder progress bars, item specs, and warehouse locations.
   - "+ New Product" registration modal and "Edit Master Specs" dialog.

3. **Inbound Receipts & PO Receiving (`/receipts`)**:
   - Purchase order receiving workbench with 4-step workflow indicator.
   - Real-time line item quantity counters with PO discrepancy/shortage detection.
   - Putaway validation commit: increases catalog on-hand stock and appends immutable records to Move History.

4. **Outbound Fulfillment & Dispatch Guard (`/deliveries`)**:
   - Two-phase fulfillment: Pick line items -> Validate & Dispatch.
   - **Active Dispatch Guard**: Automatically detects insufficient on-hand stock, locks the order in `On Hold`, displays error toasts, and prevents negative inventory.
   - Dispatch execution reduces on-hand stock and logs records to Move History.

5. **Internal Stock Transfers (`/transfers`)**:
   - Stock Relocation Principle workbench with physical move trajectory diagram (`FROM SOURCE` → `TO DESTINATION`).
   - Validating transfers moves items between bays and bins while keeping overall enterprise valuation balanced.

6. **Stock Adjustments & Cycle Counts (`/adjustments`)**:
   - 6-step reconciliation workflow: `Recorded -> Counted -> Difference -> Adjust Stock -> Updated -> Logged`.
   - Live variance calculator computing item discrepancies and net valuation impact.
   - Committing adjustments sets catalog `totalStock` to the physical count and logs an audit record in the Stock Ledger.

7. **Stock Ledger & Movement Audit (`/ledger`)**:
   - Chronological immutable audit trail of all receipts, dispatches, relocations, and count adjustments.
   - Event filter chips, free-text search, and full audit ledger CSV export.

8. **Warehouses & Storage Locations (`/warehouses`)**:
   - Multi-facility management (WH-01 Main Distribution, WH-02 North Bay Annex, WH-03 Bulk Storage Hub).
   - Storage bins table with load metrics, weight capacity, and stock availability inspectors (without 2D rack schematics or heatmaps).
   - Create new facility and add storage bin modals.

9. **Global Command Palette (`⌘K` / `Ctrl+K`)**:
   - Universal search dialog across SKUs, POs, deliveries, transfers, and warehouse bins.
   - Quick action shortcuts: `⌥R` New Receipt, `⌥T` New Transfer, `⌥C` New Count, `⌥L` View Ledger.

10. **Operator Profile & Settings (`/profile`)**:
    - Marcus Vance (Operations Manager) profile, facility assignment, and alert threshold preferences.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (custom tokens matching Stitch DESIGN.md)
- **Icons**: Google Material Symbols Outlined
- **Typography**: Inter (Google Fonts)
- **State Management**: React Context (`useInventory`) with `localStorage` persistence

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser at http://localhost:3000
```

### Production Build

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
├── dist/                          # Production build output
├── public/                        # Static assets
├── src/
│   ├── components/
│   │   ├── common/                # Icon, Logo, StatusBadge, KpiCard, Modal, ToastContainer
│   │   ├── layout/                # Sidebar, TopHeader
│   │   └── search/                # CommandPalette
│   ├── data/                      # mockData.ts (Stitch-aligned mock dataset)
│   ├── layouts/                   # AppLayout, AuthLayout
│   ├── pages/
│   │   ├── adjustments/           # AdjustmentsPage.tsx
│   │   ├── auth/                  # LoginPage, SignupPage, ForgotPasswordPage, VerifyOtpPage, ResetPasswordPage
│   │   ├── dashboard/             # DashboardPage.tsx
│   │   ├── deliveries/            # DeliveriesPage.tsx
│   │   ├── ledger/                # LedgerPage.tsx
│   │   ├── products/              # ProductsPage.tsx
│   │   ├── profile/               # ProfilePage.tsx
│   │   ├── receipts/              # ReceiptsPage.tsx
│   │   ├── transfers/             # TransfersPage.tsx
│   │   └── warehouses/            # WarehousesPage.tsx
│   ├── store/
│   │   └── inventoryStore.tsx     # Reactive inventory context with business logic
│   ├── types/
│   │   └── index.ts               # Domain types
│   ├── App.tsx                    # Route definitions and global wrappers
│   ├── index.css                  # Tailwind styles and desktop scrollbars
│   └── main.tsx                   # React root entry
├── stitch_stocksense_enterprise_ims/ # Original Google Stitch export (preserved)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
