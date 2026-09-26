---
name: Precision Logistics
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#004f35'
  on-tertiary: '#ffffff'
  tertiary-container: '#006948'
  on-tertiary-container: '#76eab6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: 1.125rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  tabular-body:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: -0.005em
  tabular-kpi:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.125rem
  space-sm: 0.25rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

This design system is engineered for industrial-grade operational accuracy, high-frequency data ingestion, and mission-critical decision velocity. Built specifically for warehouse floor leads, logistics dispatchers, inventory controllers, and supply chain analysts, the interface establishes an uncompromising posture of precision, reliability, and calm authority.

The visual style is **Corporate / Modern High-Density Utility**. It strips away superficial ornamentation, gratuitous whitespace, and decorative transitions in favor of structured data layouts, crisp visual delineation, and instant status discernment. The emotional response is one of total operational control, trust, and frictionless execution during intense workflow cycles.

Key Tenets:
- **Density Over Decoration:** Screen real estate serves operational visibility. Interfaces prioritize high information bandwidth without visual noise or clutter.
- **Predictable Structural Rhythm:** Strict spatial hierarchies, rigid tabular structures, and precise hairline borders take precedence over ambiguous layering or ambient floating surfaces.
- **Functional Semantics:** Color serves strictly as a signaling mechanism. Chromatic expression is reserved for status indication, systemic alerts, and primary operational actions.

## Colors

The color palette is built on high-contrast neutrals and precise functional accents, engineered specifically to prevent eye fatigue across prolonged shift work while retaining instant scannability under warehouse lighting conditions.

### Surface and Canvas Tokens
- **Canvas Base:** `#F8FAFC` (Cool slate canvas that defines the workspace boundaries)
- **Surface Elevation 0 (Default Panel/Card):** `#FFFFFF` (Pristine, crisp ground for tabular grids, form controls, and cards)
- **Surface Subdued / Zebra Striping:** `#F1F5F9` (Subtle tint for alternating table rows, secondary header ribbons, and read-only inputs)
- **Surface Hover:** `#E2E8F0` (Interactive feedback state across rows, utility menu items, and list items)

### Border Tokens
- **Hairline Border (Standard):** `#E2E8F0` (Default 1px stroke separating cards, cells, input perimeters, and layout containers)
- **Border Structural / Accent:** `#CBD5E1` (Used for header divides, column sorting partitions, and active input borders)
- **Border Focus Ring:** `#93C5FD` (2px offset focus indicators for strict keyboard accessibility)

### Typography Colors
- **Text Primary:** `#0F172A` (Deep slate charcoal; minimum 12:1 contrast against `#FFFFFF` surfaces)
- **Text Secondary:** `#475569` (Medium slate for column headers, metadata, field labels, and contextual helpers)
- **Text Muted:** `#94A3B8` (Placeholders, disabled elements, and structural breadcrumb delimiters)

### Semantic & Status Tokens
Status colors are paired with high-tint backgrounds (10% opacity fills) for micro-badges and alert banners:
- **Operational / In-Stock / Verified:** `#059669` (Background: `#ECFDF5`, Border: `#A7F3D0`)
- **Warning / Low Stock / Pending Review:** `#D97706` (Background: `#FFFBEB`, Border: `#FDE68A`)
- **Critical / Out of Stock / Damaged / Error:** `#DC2626` (Background: `#FEF2F2`, Border: `#FECACA`)
- **Staged / In-Transit / Processing:** `#1D4ED8` (Background: `#EFF6FF`, Border: `#BFDBFE`)
- **Draft / Archived / Neutral Document:** `#475569` (Background: `#F1F5F9`, Border: `#CBD5E1`)

## Typography

The typographic hierarchy is calibrated strictly for high data density, tabular vertical alignment, and rapid optical processing. The system uses **Inter** across all display, body, and label roles.

### Numerical and Data Handling
All numeric metrics, currency values, bin numbers, SKU codes, and stock counts must apply `font-variant-numeric: tabular-nums lining-nums`. Monospace rendering is not permitted for standard tables; instead, proportional Inter characters backed by tabular figures guarantee that decimal points, unit indicators, and thousands separators align on exact vertical tracks without horizontal shifting during live data updates.

### Typographic Hierarchy Application
- **Tabular KPI (`tabular-kpi`):** Dedicated to warehouse-level dashboard metrics (e.g., total bay occupancy, pick rates, daily order volumes).
- **Headlines (`headline-lg` through `headline-sm`):** Reserved for module transitions, main view headings, and modal canvas anchors.
- **Titles (`title-md`, `title-sm`):** Structural table section headings, card group titles, and drawer headers.
- **Body (`body-md`, `body-sm`):** Primary interaction context, standard grid cell contents, drawer metadata, and inline descriptions.
- **Labels (`label-md`, `label-sm`):** Column sorting indicators, compact status tags, input captions, and form micro-labels (often rendered uppercase in table headers with `letter-spacing: 0.04em`).

## Layout & Spacing

This design system uses a strict **compact 4px baseline rhythm** engineered for dense multi-column analytical views and multi-pane warehouse logistics interfaces. 

### Grid and Shell Model
- **Workbench Shell Layout:** The core layout employs a 3-tier structure:
  1. A persistent, condensed navigation rail (collapsed width: 56px, expanded width: 220px).
  2. A condensed utility bar (height: 44px) fixed at the top for universal search, tenant/warehouse switcher, barcode listener status, and batch actions.
  3. A fluid-width multi-pane workspace with adjustable side inspection drawers (360px to 480px width) fixed along the right side of the screen for drill-down row inspections.
- **Column Grids:** Analytical dashboards use a 12-column responsive fluid grid with 12px (`0.75rem`) gutters. Data tables stretch 100% of their parent pane with horizontal scrolling constrained to internal container bounds.

### Responsive Breakpoints & Device Behavior
- **Desktop Primary (>= 1280px):** Full-bleed operational density. Data tables render all default columns without collapse. Split-view layouts allow concurrent visual scanning of pick lists and warehouse zone maps.
- **Compact Desktop / Rugged Tablet (1024px - 1279px):** Inspection drawers slide over tables as overlays rather than pushing layout margins. Secondary metadata columns automatically hide behind an expandable row trigger.
- **Mobile Handheld Barcode Scanners / Terminals (< 1024px):** Layout reflows to a single-column transactional mode. High-density grids convert to touch-friendly card lists; primary SKU verification and scan confirmations occupy fixed sticky action footers.

## Elevation & Depth

Visual hierarchy is maintained almost entirely through **low-contrast hairline outlines and tonal surface shifts**, completely avoiding blurred ambient dropshadows or skeuomorphic bevels.

### Structural Stratification Rules
- **Flat Ground (Layer 0):** Canvas backdrop (`#F8FAFC`). Provides contrast behind clean white cards, tables, and inspection panes.
- **Layer 1 (Card & Content Boundary):** Background `#FFFFFF`, constrained by a 1px border (`#E2E8F0`). No box-shadow is applied. Visual separation from the canvas is achieved strictly via the border line and surface contrast.
- **Layer 2 (Contextual Overlays & Dropdowns):** Used for filter menus, autocomplete suggestion menus, and nested column customizers. Background `#FFFFFF`, 1px border (`#CBD5E1`), with a minimal, crisp, low-diffusion shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)`.
- **Layer 3 (Modal Shells & Flyout Drawers):** Used for transaction confirmation dialogs and right-hand batch edit sheets. Background `#FFFFFF`, bordered by `#CBD5E1`, with a directed directional shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)`. Backdrops employ a neutral slate curtain at 40% opacity (`rgba(15, 23, 42, 0.40)`). No backdrop blur is permitted.

## Shapes

The design system implements a **Soft (Level 1)** geometric standard. All interactive containers, inputs, buttons, and badges use a baseline radius of 4px (`0.25rem`).

### Geometry Application
- **Buttons, Text Inputs, and Badges:** `0.25rem` (4px). Provides a slight, engineered softening of corners that avoids visual harshness without degrading the utilitarian enterprise feel.
- **Cards, Table Shells, and Modals:** `0.375rem` (6px) to `0.5rem` (8px). Structural outer containers retain concise, squared framing to align seamlessly along coordinate grids.
- **Checkboxes & Indicators:** `0.125rem` (2px) to `0.25rem` (4px).
- **Pill Shapes:** Strictly prohibited for functional buttons, cards, and input fields. Micro-badges indicating status may use `0.25rem` (4px) rounded tags; full pill rounding is disallowed to maintain technical rigor.

## Components

### Buttons & Interactive Triggers
- **Primary Button:** Height 32px (Compact) or 36px (Default). Fill `#1D4ED8`, text `#FFFFFF`, font-size `0.8125rem`, weight 500, padding 0 12px, border-radius 4px. Hover state: `#1E40AF`. Active: `#1E3A8A`. Focus: 2px offset ring in `#93C5FD`.
- **Secondary / Outlined Button:** Height 32px. Fill `#FFFFFF`, border 1px solid `#CBD5E1`, text `#0F172A`. Hover: Background `#F1F5F9`, border `#94A3B8`.
- **Destructive Button:** Fill `#DC2626`, text `#FFFFFF`. Hover: `#B91C1C`.
- **Icon / Utility Button:** 32x32px square. Transparent fill, 1px hairline border `#E2E8F0` on `#FFFFFF` ground. Icon color `#475569`. Hover: Background `#F1F5F9`, icon `#0F172A`.

### High-Density Data Tables
- **Header Cells:** Height 32px. Background `#F8FAFC`, bottom border 1px solid `#CBD5E1`, font-size `0.6875rem`, weight 600, uppercase, color `#475569`, tracking `0.04em`. Vertical divider lines between resizable columns use 1px solid `#E2E8F0`.
- **Body Rows:** Height 36px (compact data entry mode) or 44px (default operational mode). Background `#FFFFFF`, bottom border 1px solid `#F1F5F9`. Hover state on entire row: `#F8FAFC`. Selected state: `#EFF6FF` with a 2px left border accent in `#1D4ED8`.
- **Cell Content:** Padding 0 8px. Text uses `tabular-nums` for quantities, serial numbers, rack/shelf coordinates, and timestamps.

### Status Micro-Badges
- **Structure:** Height 20px, inline-flex, items-center, border-radius 4px, padding 0 6px, font-size `0.6875rem`, font-weight 600.
- **Visual Mapping:**
  - *Allocated / Completed:* Text `#059669`, background `#ECFDF5`, border 1px solid `#A7F3D0`. Includes a 4x4px solid emerald dot.
  - *Low Stock / Pending:* Text `#D97706`, background `#FFFBEB`, border 1px solid `#FDE68A`. Includes a 4x4px solid amber dot.
  - *Depleted / Discrepancy:* Text `#DC2626`, background `#FEF2F2`, border 1px solid `#FECACA`. Includes a 4x4px solid red dot.
  - *Staged:* Text `#1D4ED8`, background `#EFF6FF`, border 1px solid `#BFDBFE`.

### Input Fields & Search Bars
- **Text Inputs:** Height 32px. Background `#FFFFFF`, border 1px solid `#CBD5E1`, border-radius 4px, padding 0 8px, font-size `0.8125rem`, color `#0F172A`. Placeholder `#94A3B8`. Active/Focus: Border 1px solid `#1D4ED8`, box-shadow `0 0 0 1px #1D4ED8`.
- **Integrated Scanner Input:** Enhanced with a trailing icon indicator that pulses green (`#059669`) when an active hardware barcode wedge listener is engaged.

### Checkboxes & Bulk Selectors
- **Control Sizing:** 14x14px square, border 1px solid `#94A3B8`, border-radius 2px, background `#FFFFFF`.
- **Checked State:** Background `#1D4ED8`, border-color `#1D4ED8`, check icon stroke `#FFFFFF`.
- **Indeterminate State (Partial Column Select):** Background `#1D4ED8`, horizontal dash indicator in `#FFFFFF`.

### Cards & Metrics Tiles
- **Structure:** Surface `#FFFFFF`, border 1px solid `#E2E8F0`, border-radius 6px, padding 12px 16px.
- **Content Flow:** Small label (`label-sm`, color `#475569`), followed by large tabular metric value (`tabular-kpi`, color `#0F172A`), terminating in a secondary delta row displaying trend indicators (`+4.2% vs yesterday`) colored strictly by functional status.

### Operational Drawers (Item Inspector)
- **Structure:** Fixed right sidebar, border-left 1px solid `#CBD5E1`, background `#FFFFFF`. Header contains persistent SKU identifier, quick barcode print trigger, and modal close action. Tabbed interior organizes inventory splits: "On-Hand", "Reserved", "In-Transit", and "Audit Log".