# StockSense Enterprise IMS — Design System Specification (DESIGN.md)

**Version:** 1.0.0  
**Classification:** Enterprise Inventory Management System (IMS) Single Source of Truth  
**Target Platform:** Desktop-First Web Application (1440px baseline, fluid 1280px–1920px+)  
**Theme:** Light Mode, High-Density Information Architecture, Industrial Rigor  

---

## 1. Brand Identity & Principles

### 1.1 Brand Essence
* **Brand Name:** StockSense
* **Tagline / Value Proposition:** Enterprise Precision Inventory & Multi-Facility Warehouse Orchestration.
* **Personality:** Authoritative, utilitarian, predictable, fast, and engineered for high-throughput warehouse logistics and supply chain operators.
* **Visual Tenet:** Maximum information density without cognitive fatigue. Clean lines, zero visual clutter, crisp contrast, standard industrial data hierarchy.

### 1.2 Core Design Principles
1. **Utility First:** Screen real estate belongs to operational inventory data (SKUs, bins, lots, PO lines, variances), never to gratuitous whitespace or decorative fluff.
2. **Deterministic Layouts:** Predictable positioning across all modules. If an operator understands the *Receipts* table, they immediately understand *Internal Transfers* and *Stock Adjustments*.
3. **High Contrast Data Legibility:** Critical status indicators (e.g., `Out of Stock`, `Variance Detected`, `Near Limit`) must be instantly recognizable on the warehouse floor under variable lighting conditions.
4. **Speed & Ergonomics:** Optimized for keyboard shortcuts (`⌘K`, `⌥+Key`), rapid tabular scanning, and minimal multi-click workflows.

---

## 2. Layout Architecture

### 2.1 Master Layout Structure
StockSense uses a rigid, desktop-first ERP grid comprising:
* **Persistent Left Sidebar:** Fixed width `240px` (collapsible to `64px` icon rail on tablet viewports). Fixed left, full viewport height (`100vh`).
* **Persistent Top Header:** Fixed height `56px` (`h-14`), sticky top, full width spanning content area (`calc(100vw - 240px)`).
* **Main Content Area:** Fluid width (`calc(100% - 240px)`), `overflow-y-auto`, standard horizontal page padding `px-8` (`32px`) and vertical padding `py-6` (`24px`).
* **Split Inspection Panels (Master-Detail Pattern):** For operational screens (e.g., *Warehouse Bins*, *Stock Adjustments*, *Products*), the workspace splits into:
  * **Master Workspace (Left / Center):** `flex-1` (min width `60%–68%`) containing KPIs, filters, batch tabs, and primary data table / schematic grid.
  * **Detail / Inspection Drawer (Right):** Fixed width `380px` to `420px`, sticky or independent scroll, providing deep item parameters, real-time formula math, and operational action triggers.

### 2.2 Z-Index Layering
* `z-0`: Main Canvas / Background Surface
* `z-10`: Sticky Table Headers & Sub-toolbars
* `z-20`: Persistent Top Header Bar
* `z-30`: Persistent Left Sidebar
* `z-40`: Flyout Drawers & Dropdown Overlays
* `z-50`: Global Search (`⌘K`) Scrim & Modal Dialogs
* `z-60`: Global Notification Toasts & Alerts

---

## 3. Typography System

### 3.1 Font Family
* **Primary Sans-Serif:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`
* **Tabular / Monospace:** `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `"Liberation Mono"`, `"Courier New"`, `monospace`
  * *Mandatory Usage:* All SKU codes (`SKU-ST-9921`), Lot numbers (`LOT-2024-C02`), Bin location identifiers (`WH-01-ZA-RK04-B01`), Barcode strings, PO numbers (`PO-2024-089`), monetary amounts (`$18,450.00`), and numeric discrepancies (`-15 kg`).

### 3.2 Type Hierarchy & Scale

| Style / Token | Size (px / rem) | Weight | Line Height | Tracking | Standard Tailwind Class | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Section Header** | 20px / 1.25rem | 700 (Bold) | 28px (1.4) | `-0.015em` | `text-xl font-bold tracking-tight text-slate-900` | Screen titles (*"Warehouses & Bay Layout Settings"*) |
| **Eyebrow / Breadcrumb** | 11px / 0.6875rem | 600 (Semibold)| 16px (1.45) | `+0.05em` | `text-[11px] font-semibold uppercase tracking-wider text-slate-500` | Section hierarchy (*"SETTINGS / WAREHOUSES & LOCATIONS"*) |
| **Panel / Subsection Title** | 14px / 0.875rem | 700 (Bold) | 20px (1.42) | `+0.025em` | `text-sm font-bold uppercase tracking-wider text-slate-800` | Inspector panels (*"LOCATION INSPECTOR"*, *"PHYSICAL SPECS"*) |
| **KPI Metric Value** | 24px / 1.5rem | 700 (Bold) | 32px (1.33) | `-0.02em` | `text-2xl font-bold text-slate-900` | KPI card hero numbers (*"1,420 Bins"*, *"84.6%"*) |
| **Body Standard** | 13px / 0.8125rem | 400 (Regular) | 18px (1.38) | `0` | `text-[13px] font-normal text-slate-600` | Operational descriptions, notes, instructions |
| **Body Semibold** | 13px / 0.8125rem | 600 (Semibold)| 18px (1.38) | `0` | `text-[13px] font-semibold text-slate-800` | Highlighted values, primary row text |
| **Table Header** | 11px / 0.6875rem | 700 (Bold) | 16px (1.45) | `+0.05em` | `text-[11px] font-bold uppercase tracking-wider text-slate-600` | Table column headers (*"LOCATION CODE"*, *"CURRENT SKUS"*) |
| **Table Data (Standard)** | 12px / 0.75rem | 500 (Medium) | 16px (1.33) | `0` | `text-xs font-medium text-slate-800` | Table rows, cell values, secondary metadata |
| **Table Data (Mono)** | 12px / 0.75rem | 600 (Semibold)| 16px (1.33) | `0` | `font-mono text-xs font-semibold text-slate-900` | SKUs, Bins, Serial numbers, Lot numbers |
| **Field Label** | 11px / 0.6875rem | 600 (Semibold)| 14px (1.27) | `+0.025em` | `text-[11px] font-semibold text-slate-600 uppercase` | Form field labels, input headers |
| **Badge / Pill Text** | 11px / 0.6875rem | 600 (Semibold)| 14px (1.27) | `0` | `text-[11px] font-semibold` | Status pills, count indicators, tag chips |
| **Keyboard Shortcut Tag** | 10px / 0.625rem | 600 (Semibold)| 12px (1.2) | `0` | `font-mono text-[10px] font-semibold text-slate-500` | Keyboard helpers (`⌘K`, `⌥R`, `ESC`) |

---

## 4. Color Palette & Semantic Tokens

### 4.1 Foundations & Neutral Surface System
StockSense is calibrated with a clinical, high-contrast cool-slate palette:

* **Canvas Background:** `#faf8ff` / `#f8fafc` (Tailwind `bg-slate-50` / `bg-surface`)
* **Surface Lowest (Pure Card Base):** `#ffffff` (Tailwind `bg-white`)
* **Surface Low (Subtle Tint):** `#f1f5f9` (Tailwind `bg-slate-100`)
* **Surface Container / Hover Fill:** `#e2e8f0` (Tailwind `bg-slate-200`)
* **Borders / Hairlines:** `#e2e8f0` (Tailwind `border-slate-200`) — crisp, sharp 1px lines
* **Borders Strong / Active Dividers:** `#cbd5e1` (Tailwind `border-slate-300`)

### 4.2 Brand & Primary Accent
* **Brand Primary:** `#1d4ed8` (Tailwind `blue-700`)
* **Primary Hover:** `#1e40af` (Tailwind `blue-800`)
* **Primary Active / Pressed:** `#172554` (Tailwind `blue-950`)
* **Primary Light / Selection Background:** `#eff6ff` (Tailwind `blue-50`)
* **Primary Border Subtle:** `#bfdbfe` (Tailwind `blue-200`)

### 4.3 Typography Neutrals
* **Text High-Contrast (Headings, Primary Identifiers):** `#0f172a` (Tailwind `text-slate-900`)
* **Text Body / Standard Readability:** `#334155` (Tailwind `text-slate-700`)
* **Text Muted / Secondary Labels:** `#64748b` (Tailwind `text-slate-500`)
* **Text Disabled / Placeholder:** `#94a3b8` (Tailwind `text-slate-400`)

### 4.4 Semantic Status Colors

| Semantic State | Primary Hex | Background Pill Hex | Text Hex | Border Hex | Tailwind Equivalent | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Success / Validated / Done** | `#16a34a` | `#f0fdf4` | `#15803d` | `#bbf7d0` | `bg-emerald-50 text-emerald-700 border-emerald-200` | *Done, Validated, In Stock, Optimal (<75%)* |
| **Warning / Near Limit / Waiting** | `#d97706` | `#fffbeb` | `#b45309` | `#fde68a` | `bg-amber-50 text-amber-700 border-amber-200` | *Waiting, Near Limit (75–90%), Pending Review* |
| **Error / Critical / Out of Stock** | `#dc2626` | `#fef2f2` | `#b91c1c` | `#fecaca` | `bg-red-50 text-red-700 border-red-200` | *Out of Stock, Critical (>90%), Rejected, Over-allocated* |
| **Info / Scheduled / In Progress** | `#2563eb` | `#eff6ff` | `#1d4ed8` | `#bfdbfe` | `bg-blue-50 text-blue-700 border-blue-200` | *Ready, In Progress, Count Scheduled* |
| **Neutral / Draft / Canceled** | `#64748b` | `#f8fafc` | `#475569` | `#e2e8f0` | `bg-slate-50 text-slate-700 border-slate-200` | *Draft, Canceled, Decommissioned, Archive* |

---

## 5. Spacing, Radii & Elevation Rules

### 5.1 Spacing Scale
* `4px` (`gap-1`, `p-1`): Tag chips, button icon gaps, micro badges.
* `8px` (`gap-2`, `p-2`): Input padding, compact table cell padding, dropdown items.
* `12px` (`gap-3`, `p-3`): Card sub-sections, button groups, toolbar element spacing.
* `16px` (`gap-4`, `p-4`): Standard KPI card padding, inspector section gaps.
* `20px` (`gap-5`, `p-5`): Drawer internal margins, modal body padding.
* `24px` (`gap-6`, `p-6`): Main content vertical padding, major panel separations.
* `32px` (`p-8`): Primary page left/right edge padding.

### 5.2 Corner Radii
StockSense enforces an industrial, compact corner curvature:
* **Inputs, Buttons, Badges, Tabs:** `rounded` (`4px` / `0.25rem`) or `rounded-md` (`6px` / `0.375rem`).
* **KPI Cards, Inspector Panels, Modals:** `rounded-lg` (`8px` / `0.5rem`).
* **Strict Prohibition:** Never use `rounded-2xl`, `rounded-3xl`, or `rounded-full` for cards or containers (except circular user avatar).

### 5.3 Elevation & Shadows
* **Default Card / Table / Surface:** `border border-slate-200 shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
* **Dropdowns / Command Palette / Modals:** `shadow-lg border border-slate-200` (`0 10px 15px -3px rgb(0 0 0 / 0.1)`).
* **Strict Prohibition:** No colored glow drop-shadows, no diffused multi-layer neo-brutalist shadows.

---

## 6. Component Library Specifications

### 6.1 Persistent Sidebar
* **Dimensions:** Width `240px`, height `100vh`, fixed left border (`border-r border-slate-200 bg-white`).
* **Header / Brand Unit:** Height `56px`, `px-4 flex items-center gap-2.5 border-b border-slate-200`.
  * Brand Logo: `w-6 h-6` blue geometric icon + `"StockSense"` (`font-bold text-slate-900 tracking-tight`).
  * Facility Scope Chip: `WH-01 Main Facility` pill beneath header.
* **Navigation Section Headers:** `px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600`.
* **Navigation Item:**
  * Height `32px`, `px-3 mx-2 rounded flex items-center justify-between text-xs font-medium`.
  * **Default State:** `text-slate-600 hover:text-slate-900 hover:bg-slate-100`.
  * **Active State:** `bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-700`.
  * Icon: `w-4 h-4 mr-2.5 stroke-[1.75] text-slate-500` (or `text-blue-700` when active).
* **Footer / User Profile:** Sticky bottom `p-3 border-t border-slate-200 flex items-center justify-between`.
  * User avatar (`w-7 h-7 rounded-full object-cover`), User name (`text-xs font-semibold text-slate-900`), Role (`text-[10px] text-slate-500`), and quick logout icon.

### 6.2 Top Header
* **Dimensions:** Height `56px`, `px-6 bg-white border-b border-slate-200 flex items-center justify-between`.
* **Location / Context Breadcrumb:** Left-aligned facility switcher dropdown (`WH-01 Main Warehouse` with caret).
* **Command Bar Search Trigger:** Central quick-search input `w-96 h-8 px-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-400 hover:border-slate-300 cursor-pointer`.
  * Includes keyboard badge `⌘K`.
* **Right Controls:**
  * Sync status indicator (`Sync: Live 1s ago` with green pulse dot).
  * Notification bell icon with unread badge dot.
  * Primary Action Dropdown (`+ New Action` with chevron).

### 6.3 Buttons & Actions
* **Primary Button:**
  * Style: `h-8 px-3.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-semibold rounded shadow-sm flex items-center gap-1.5 transition-colors`.
* **Secondary / Outline Button:**
  * Style: `h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded shadow-sm flex items-center gap-1.5 transition-colors`.
* **Destructive Button:**
  * Style: `h-8 px-3 bg-white hover:bg-red-50 border border-red-200 text-red-600 hover:text-red-700 text-xs font-semibold rounded flex items-center gap-1.5`.
* **Icon-Only Utility Button:**
  * Style: `w-8 h-8 rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600`.

### 6.4 Inputs, Selects & Filters
* **Standard Form Input / Select:**
  * Style: `h-8 px-2.5 text-xs bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700`.
* **Filter Toolbar:**
  * Container: `flex items-center gap-2 py-3 border-b border-slate-200 bg-white`.
  * Includes search input with magnifying glass, facility dropdown, category dropdown, and status pills.

### 6.5 KPI Metric Cards
* **Container:** `bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between`.
* **Header:** `flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5`.
* **Value Display:** `text-2xl font-bold text-slate-900 tracking-tight font-mono`.
* **Footer / Trend:** `text-xs text-slate-600 flex items-center gap-1.5 mt-1`.
  * E.g., `+15.4% free capacity` or `94.2% Indexed with barcodes`.

### 6.6 Tab Bars
* **Underline Segmented Tabs:**
  * Border bottom container `border-b border-slate-200 flex gap-6`.
  * Tab item: `pb-2.5 text-xs font-semibold transition-colors flex items-center gap-1.5`.
  * **Inactive:** `text-slate-500 hover:text-slate-800 border-b-2 border-transparent`.
  * **Active:** `text-blue-700 border-b-2 border-blue-700 font-bold`.
  * Count badge: `px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600` (or `bg-blue-100 text-blue-700` when active).

### 6.7 Modals & Global Command Palette (⌘K)
* **Scrim / Backdrop:** `fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24`.
* **Modal Frame:** `w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden`.
* **Header / Search Box:** `h-14 px-4 border-b border-slate-200 flex items-center gap-3 bg-white`.
  * Large input `text-sm font-medium text-slate-900 placeholder:text-slate-400`.
* **Result Groups:** Section header `px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200`.
* **Active Result Row:** `bg-blue-50 text-blue-900 border-l-2 border-blue-700`.
* **Keyboard Navigation Footer:** `px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono`.

---

## 7. Data Tables (The Operational Engine)

Data tables represent the central workhorse of the StockSense application.

### 7.1 Table Architecture
* **Table Wrapper:** `w-full overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm`.
* **Header Row (`<thead>`):**
  * Height: `36px` (`h-9`).
  * Background: `bg-slate-50 border-b border-slate-200`.
  * Typography: `text-[11px] font-bold uppercase tracking-wider text-slate-600 text-left px-3.5 py-2`.
* **Data Rows (`<tbody>`):**
  * Height: `44px` compact standard (`h-11`).
  * Border: `border-b border-slate-100 last:border-b-0`.
  * Alternating Fills: Clean white rows with subtle hover `hover:bg-slate-50/80 transition-colors`.
  * **Selected Row State:** `bg-blue-50/60 border-l-2 border-blue-700`.
* **Cell Formatting Rules:**
  * **Text / Name:** `text-xs font-semibold text-slate-900 px-3.5 py-2.5`.
  * **Codes (SKU, PO, Location):** `font-mono text-xs font-semibold text-slate-800 px-3.5 py-2.5`.
  * **Quantities / Numbers:** Right-aligned or tab-aligned `font-mono text-xs text-slate-800`.
  * **Negative Variances:** `font-mono text-xs font-bold text-red-600`.
  * **Checkboxes:** Left-aligned `w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700`.

### 7.2 Sorting & Pagination
* **Sort Controls:** Subtle up/down arrows next to sortable columns (`text-slate-400 hover:text-slate-700`).
* **Pagination Footer:** Height `40px` (`h-10`), `px-4 flex items-center justify-between border-t border-slate-200 bg-white text-xs text-slate-600`.
  * Item counts: *"Showing 1–25 of 1,420 items"*.
  * Page buttons: Compact outlined controls (`Previous`, `1`, `2`, `3`, `Next`).

---

## 8. Complete Status & Badge Matrix

| Status Token | Badge Presentation | Meaning / Trigger |
| :--- | :--- | :--- |
| **Draft** | `bg-slate-100 text-slate-700 border border-slate-200` | Uncommitted order, transfer, or count session in formulation. |
| **Waiting** | `bg-amber-50 text-amber-700 border border-amber-200` | Awaiting supervisor validation, dock gate, or QC approval. |
| **Ready** | `bg-blue-50 text-blue-700 border border-blue-200` | Staged and verified; ready for forklift pick or outbound loading. |
| **Done / Validated** | `bg-emerald-50 text-emerald-700 border border-emerald-200` | Reconciled, confirmed, stock balances updated in ledger. |
| **Canceled** | `bg-slate-100 text-slate-500 border border-slate-200 line-through` | Voided before dispatch or receipt verification. |
| **Available / Optimal** | `bg-emerald-50 text-emerald-700 border border-emerald-200` | SKU above safety threshold; bin occupancy under 75%. |
| **Low Stock / Near Limit**| `bg-amber-50 text-amber-700 border border-amber-200` | SKU at or near reorder point; bin load between 75% and 90%. |
| **Out of Stock / Critical**| `bg-red-50 text-red-700 border border-red-200` | SKU zero balance; bin load >90% or overweight violation. |
| **Pending** | `bg-blue-50 text-blue-700 border border-blue-200` | Inbound transport in transit; cycle count scheduled. |
| **Rejected** | `bg-red-50 text-red-700 border border-red-200` | PO line QC defect; cycle count discrepancy unapproved. |

---

## 9. Official Navigation Taxonomy

The persistent left sidebar adheres strictly to this hierarchical structure:

```text
StockSense (Root)
│
├── DASHBOARD
│   └── Overview (Multi-facility KPI telemetry, stock value, recent moves)
│
├── INVENTORY
│   ├── Products (Master SKU catalog, safety stock thresholds, categories)
│   └── Stock Overview (Granular inventory balances across all locations)
│
├── OPERATIONS
│   ├── Receipts (Inbound PO verification, dock receiving, discrepancy QC)
│   ├── Deliveries (Outbound customer sales fulfillment, picking & packing)
│   ├── Transfers (Internal warehouse rack-to-rack / bay-to-bay relocations)
│   ├── Adjustments (Physical cycle counts, recorded vs counted variance reconciliation)
│   └── Move History (Stock ledger, immutable chronological movement log)
│
└── SETTINGS
    └── Warehouses (Multi-facility hubs, zone layout, 2D rack schematics & bin parameters)
```

---

## 10. Interaction States & Transitions

* **Default / Idle:** Crisp 1px border `border-slate-200`, pure white surface `bg-white`.
* **Hover:** Immediate, subtle feedback `bg-slate-50`, border shifts to `border-slate-300`. Transition duration `150ms ease-in-out`.
* **Active / Selected:** `bg-blue-50`, text `text-blue-700`, accent border `border-blue-700` or `ring-1 ring-blue-700`.
* **Disabled:** `opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200`.
* **Loading State:**
  * Tables / Cards: Subtle skeleton shimmer `bg-slate-200 animate-pulse rounded` in place of text strings.
  * Buttons: Spinner icon replacing leading icon, text remains unchanged, button locked.
* **Empty State Pattern:**
  * Clean slate box with subtle dashed border `border border-dashed border-slate-300 rounded-lg p-12 text-center`.
  * Neutral icon in slate circle (`w-12 h-12 bg-slate-100 text-slate-400 rounded-full mx-auto mb-3 flex items-center justify-center`).
  * Clear heading (`text-sm font-bold text-slate-800`), descriptive helper sentence (`text-xs text-slate-500 max-w-sm mx-auto mb-4`), and primary action button (`+ Create New`).

---

## 11. Responsive Adaptation Matrix

While StockSense is desktop-first (primary warehouse dispatch consoles and supervisory desktops), it gracefully scales across viewports:

* **Desktop Wide (≥1440px — Primary Benchmark):** Full persistent sidebar (`240px`), full header, multi-column master-detail layout (Master table + permanent `400px` Inspector panel side-by-side).
* **Desktop Standard (1280px–1439px):** Sidebar remains `240px`. Inspector drawer collapses to a toggleable flyout panel or reduces to `340px`.
* **Tablet Landscape / Rugged Warehouse Tablets (1024px–1279px):**
  * Sidebar automatically collapses to an icon-only navigation rail (`w-16` / `64px`). Tooltips show module names on hover.
  * Tables prioritize SKU, Location, Quantity, and Status; secondary metadata columns hide behind a column picker.
* **Tablet Portrait / Mobile Rugged Barcode Terminals (<1024px):**
  * Sidebar hidden behind standard off-canvas hamburger drawer.
  * Inspector panels convert to bottom-sheet modals (`bottom-0 rounded-t-xl`).
  * Action buttons remain large (`min-h-10`) for glove-friendly warehouse touchscreens.

---

## 12. Strict Design Constraints (Negative Boundaries)

To protect the enterprise rigor of StockSense, all screens and future components must respect these non-negotiable constraints:

1. **NO Unnecessary Gradients:** Avoid trendy hero gradients, glowing button borders, or multi-color backgrounds. Surfaces must remain solid white or neutral slate.
2. **NO Excessive Glassmorphism:** Scrims may use light backdrop blur (`backdrop-blur-sm`), but cards and panels must NEVER use transparent glassy backgrounds that degrade text legibility.
3. **NO Decorative Blobs or Abstract Illustrations:** StockSense is an industrial operational tool. Use real data, technical 2D rack schematics, and clean vector UI icons.
4. **NO Giant Rounded Cards:** Maximum border radius is `8px` (`rounded-lg`). Never use `rounded-2xl` or `rounded-3xl`.
5. **NO Oversized Marketing Typography:** Page headers must not exceed `20px` (`text-xl font-bold`). Do not use landing page headline scales (`48px`+).
6. **NO Unnecessary 3D Elements:** Warehouse layouts are displayed as precise 2D orthogonal structural schematics, never slow or distorted 3D perspective models.
7. **NO Unjustified Color Additions:** Strict adherence to the semantic status palette. Never invent random purple, pink, or cyan tags.

---

## 13. Scope Boundary

StockSense is strictly an Inventory Management System (IMS). The design system covers:
* Inventory Dashboard & KPI Telemetry
* Products & Master SKU Management
* Inbound PO Verification & Receipts
* Outbound Order Fulfillment & Deliveries
* Internal Bay-to-Bay & Rack-to-Rack Transfers
* Physical Cycle Counts & Discrepancy Adjustments
* Stock Ledger & Movement History
* Multi-Facility Warehouses & Storage Location Layouts
* Global Search (`⌘K`) Command Palette

*Hardware-specific workflows (e.g. raw thermal ZPL queue firmware, proprietary barcode generation engines, and external logistics freight rate checkers) are strictly excluded from the core UI framework.*
