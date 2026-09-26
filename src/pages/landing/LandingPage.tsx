import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Icon } from '../../components/common/Icon';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'receipts' | 'deliveries' | 'transfers' | 'adjustments'>('receipts');

  return (
    <div className="relative min-h-screen bg-surface-container-low text-on-surface flex flex-col font-body-md select-none">
      {/* Fixed background video: stays in the same viewport position while the page scrolls. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/stocksense-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-white/55" />
        <div className="absolute inset-0 bg-blue-950/5" />
      </div>
      {/* Top B2B Operational Navigation Bar */}
      <header className="relative sticky top-0 z-50 h-14 bg-surface-container-lowest border-b border-outline-variant px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Logo className="h-7 w-auto" />
            <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider font-semibold border-l border-outline-variant pl-2.5 py-0.5">
              Enterprise IMS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-label-md font-label-md text-on-surface-variant">
            <a href="#core-capabilities" className="px-3 py-1.5 rounded hover:bg-surface-container hover:text-on-surface transition-colors">
              Capabilities
            </a>
            <a href="#workflow-preview" className="px-3 py-1.5 rounded hover:bg-surface-container hover:text-on-surface transition-colors">
              Operational Workbench
            </a>
            <a href="#facilities" className="px-3 py-1.5 rounded hover:bg-surface-container hover:text-on-surface transition-colors">
              Facilities &amp; Infrastructure
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant font-label-sm text-label-sm text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            <span>System Status: Operational</span>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="h-8 px-3 rounded hover:bg-surface-container text-on-surface font-title-sm text-title-sm flex items-center gap-1 transition-colors border border-outline-variant"
          >
            <Icon name="login" className="text-base text-outline" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="h-8 px-4 rounded bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm flex items-center gap-1.5 transition-colors shadow-2xs font-semibold"
          >
            <span>Get Started</span>
            <Icon name="arrow_forward" className="text-sm" />
          </button>
        </div>
      </header>

      {/* Hero Section: Enterprise Problem & Purpose */}
      <section className="relative z-10 px-6 pt-12 pb-10 bg-white/88 backdrop-blur-[2px] border-b border-outline-variant">
        <div className="max-w-5xl mx-auto space-y-5 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary-container text-on-secondary-fixed text-xs font-semibold uppercase tracking-wider border border-primary/20">
            <Icon name="precision_manufacturing" className="text-sm text-primary" />
            <span>Industrial Inventory Control &amp; Movement Ledger</span>
          </div>

          <h1 className="font-headline-lg text-3xl sm:text-4xl text-on-surface font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Precision Inventory Control for High-Density Multi-Facility Operations
          </h1>

          <p className="font-body-md text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            StockSense provides warehouse operators, inventory controllers, and logistics leads with complete real-time visibility across physical inventory: receiving dock verification, active dispatch guards, internal relocations, and immutable movement auditing.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/signup')}
              className="h-10 px-6 rounded bg-primary hover:bg-primary/90 text-on-primary font-title-md text-title-md flex items-center gap-2 transition-colors shadow-sm font-semibold"
            >
              <span>Get Started</span>
              <Icon name="arrow_forward" className="text-base" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="h-10 px-5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-title-md text-title-md flex items-center gap-2 transition-colors font-medium"
            >
              <Icon name="key" className="text-base text-outline" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Quick Domain Metrics Banner */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-surface-container-low rounded border border-outline-variant">
              <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">Inventory Governance</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold mt-0.5 block">Zero Phantom Stock</span>
              <span className="text-[11px] text-on-surface-variant">Rigorous reconciliation guards</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded border border-outline-variant">
              <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">Fulfillment Security</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold mt-0.5 block">Active Dispatch Guard</span>
              <span className="text-[11px] text-on-surface-variant">Prevents negative inventory</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded border border-outline-variant">
              <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">Relocation Principle</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold mt-0.5 block">Invariant Valuation</span>
              <span className="text-[11px] text-on-surface-variant">Continuous balance integrity</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded border border-outline-variant">
              <span className="font-label-sm text-label-sm text-outline uppercase font-semibold block">Accountability</span>
              <span className="font-title-sm text-title-sm text-on-surface font-bold mt-0.5 block">Cryptographic Ledger</span>
              <span className="text-[11px] text-on-surface-variant">Chronological audit log</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Operational Workbench Preview */}
      <section id="workflow-preview" className="relative z-10 px-6 py-10 bg-slate-100/82 backdrop-blur-[2px] border-b border-outline-variant">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                <span>System Architecture</span>
                <span>/</span>
                <span className="text-primary">Operational Workbenches</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
                The StockSense Desktop Execution Environment
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Engineered for desktop dual-monitor workstations: split-screen workbenches with instant commit verification.
              </p>
            </div>

            {/* Workflow Selector Tabs */}
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded border border-outline-variant">
              {[
                { id: 'receipts', label: 'Inbound Receipts', icon: 'call_received' },
                { id: 'deliveries', label: 'Outbound Deliveries', icon: 'local_shipping' },
                { id: 'transfers', label: 'Internal Transfers', icon: 'sync_alt' },
                { id: 'adjustments', label: 'Cycle Count Audits', icon: 'tune' },
              ].map((tab) => {
                const isActive = activeWorkflowTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveWorkflowTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded font-title-sm text-title-sm flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-primary-container text-on-primary font-bold shadow-2xs'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <Icon name={tab.icon} className="text-sm" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workbench Preview Card */}
          <div className="bg-surface-container-lowest rounded border border-outline-variant shadow-sm overflow-hidden">
            {/* Top Mock Window Toolbar */}
            <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <div className="h-3 w-px bg-outline-variant mx-1"></div>
                <span className="font-mono text-outline font-medium">StockSense Enterprise IMS · 1440x900 Desktop Workbench</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-on-surface-variant">
                <span>Facility: <strong className="text-on-surface">WH-01 Main</strong></span>
                <span>•</span>
                <span className="text-tertiary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  <span>Ledger Synchronized</span>
                </span>
              </div>
            </div>

            {/* Dynamic Workbench Content Based on Selected Tab */}
            <div className="p-5">
              {activeWorkflowTab === 'receipts' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                      <div className="flex items-center gap-2">
                        <span className="font-title-sm text-title-sm font-bold text-on-surface">PO Inbound Queue</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-xs font-mono">4 Shipments</span>
                      </div>
                      <span className="text-xs text-outline font-mono">Receiving Staging Bay 04</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded bg-primary/5 border border-primary/30 flex items-center justify-between">
                        <div>
                          <div className="font-title-sm text-title-sm font-bold text-primary font-mono">REC-2024-0989</div>
                          <div className="text-xs text-on-surface mt-0.5">PO-77834 · NexaMetals Industrial Corp</div>
                          <div className="text-[11px] text-outline font-mono">Carrier: FreightWay Express</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-semibold">Step 2: Count &amp; QC</span>
                          <div className="text-xs text-on-surface font-mono mt-1">400 m Copper Wire</div>
                        </div>
                      </div>

                      <div className="p-3 rounded bg-surface-container-low border border-outline-variant flex items-center justify-between opacity-80">
                        <div>
                          <div className="font-title-sm text-title-sm font-semibold text-on-surface font-mono">REC-2024-0990</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">PO-77912 · Titan Alloy Extrusions</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-mono">Arrived Gate 1</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 p-4 rounded bg-surface-container-low border border-outline-variant space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm text-title-sm font-bold text-on-surface">Putaway Validation</span>
                      <span className="text-xs text-tertiary font-semibold flex items-center gap-1">
                        <Icon name="verified" className="text-sm" /> QC Passed
                      </span>
                    </div>

                    <div className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant text-xs space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-outline">SKU:</span>
                        <span className="font-bold text-on-surface">SKU-CU-4410</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-outline">PO Expected:</span>
                        <span className="text-on-surface">400 m</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-outline">Verified Count:</span>
                        <span className="font-bold text-tertiary">400 m (100% Match)</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-outline">Assigned Target Bin:</span>
                        <span className="font-bold text-primary">WH-01 Bin E-12</span>
                      </div>
                    </div>

                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-800">
                      Committing will instantly credit on-hand catalog stock (+400 m) and log an immutable entry into the Stock Ledger.
                    </div>
                  </div>
                </div>
              )}

              {activeWorkflowTab === 'deliveries' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                      <div className="flex items-center gap-2">
                        <span className="font-title-sm text-title-sm font-bold text-on-surface">Fulfillment Orders</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-xs font-mono">Outbound Stage</span>
                      </div>
                      <span className="text-xs text-outline font-mono">Shipping Dock 04</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded bg-surface-container-low border border-outline-variant flex items-center justify-between">
                        <div>
                          <div className="font-title-sm text-title-sm font-bold text-on-surface font-mono">DEL-2024-1104</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">SO-88214 · Apex Industries Inc.</div>
                          <div className="text-[11px] text-tertiary font-semibold">Stock Allocation: RESERVED &amp; AVAILABLE</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-tertiary text-xs font-semibold">Ready to Dispatch</span>
                      </div>

                      <div className="p-3 rounded bg-red-50/60 border border-red-200 flex items-center justify-between">
                        <div>
                          <div className="font-title-sm text-title-sm font-bold text-error font-mono">DEL-2024-1092</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">SO-88201 · Metro Tech Systems</div>
                          <div className="text-[11px] text-error font-semibold">Dispatch Guard: INSUFFICIENT STOCK (0 on hand)</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-xs font-bold">LOCKED / ON HOLD</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 p-4 rounded bg-surface-container-low border border-outline-variant space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-title-sm text-title-sm font-bold text-on-surface">Dispatch Guard Engine</span>
                      <Icon name="shield" className="text-primary text-base" />
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Every line item is validated in real-time against physically available on-hand balances. If requested units exceed available stock, dispatch is hardware-locked to prevent negative inventory balance drift.
                    </p>

                    <div className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-outline">Safety Status:</span>
                        <span className="text-tertiary font-bold">Dispatch Guard ACTIVE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">Balance Drift:</span>
                        <span className="text-on-surface font-bold">0.00% Tolerated</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkflowTab === 'transfers' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                      <div className="font-title-sm text-title-sm font-bold text-on-surface">Physical Move Trajectory</div>
                      <span className="text-xs text-outline font-mono">TR-2024-0045</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-surface-container text-secondary">
                            <Icon name="output" className="text-base" />
                          </div>
                          <div>
                            <span className="text-[10px] text-outline uppercase font-semibold block">FROM SOURCE</span>
                            <span className="font-title-sm text-title-sm font-bold text-on-surface">WH-01 Bulk Storage Bay 02</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-on-surface">-500 kg Alloy</span>
                      </div>

                      <div className="px-4 py-1.5 bg-surface-container rounded flex items-center justify-between text-xs text-on-surface-variant font-mono">
                        <div className="flex items-center gap-1.5">
                          <Icon name="forklift" className="text-primary text-sm" />
                          <span>Transit: Forklift FL-04 (Dave Kowalski)</span>
                        </div>
                        <span>Ground Transfer</span>
                      </div>

                      <div className="p-3 bg-primary/5 rounded border border-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-primary/10 text-primary">
                            <Icon name="move_to_inbox" className="text-base" />
                          </div>
                          <div>
                            <span className="text-[10px] text-primary uppercase font-semibold block">TO DESTINATION</span>
                            <span className="font-title-sm text-title-sm font-bold text-on-surface">WH-01 Rack A-04 Aisle 2</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-primary">+500 kg Alloy</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 p-4 rounded bg-surface-container-low border border-outline-variant space-y-3">
                    <span className="font-title-sm text-title-sm font-bold text-on-surface block">
                      Stock Relocation Principle
                    </span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Internal relocations change physical coordinates between facilities and bays while enterprise valuation remains perfectly invariant.
                    </p>
                    <div className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-outline">Enterprise Balance:</span>
                        <span className="text-tertiary font-bold">Unchanged ($1,248,500)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">Ledger Delta:</span>
                        <span className="text-on-surface font-bold">Debit Source / Credit Dest</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkflowTab === 'adjustments' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                      <div className="font-title-sm text-title-sm font-bold text-on-surface">6-Step Reconciliation Workflow</div>
                      <span className="text-xs text-outline font-mono">ADJ-2024-0019</span>
                    </div>

                    <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant flex items-center justify-between text-xs font-mono">
                      <span className="text-tertiary font-bold">1. Recorded</span>
                      <Icon name="arrow_forward" className="text-xs text-outline" />
                      <span className="text-tertiary font-bold">2. Counted</span>
                      <Icon name="arrow_forward" className="text-xs text-outline" />
                      <span className="text-tertiary font-bold">3. Difference</span>
                      <Icon name="arrow_forward" className="text-xs text-outline" />
                      <span className="text-primary font-bold bg-primary-fixed px-1.5 py-0.5 rounded">4. Adjust</span>
                      <Icon name="arrow_forward" className="text-xs text-outline" />
                      <span className="text-outline">5. Update</span>
                      <Icon name="arrow_forward" className="text-xs text-outline" />
                      <span className="text-outline">6. Log</span>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded border border-outline-variant space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-on-surface">Aluminium Sheets 2mm 4x8ft (SKU-AL-5519)</span>
                        <span className="font-mono text-error font-bold">-3 sheets (-$162.00)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-2 rounded text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-outline block">Recorded:</span>
                          <span className="text-on-surface font-bold">42 sheets</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-outline block">Physical:</span>
                          <span className="text-on-surface font-bold">39 sheets</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-outline block">Variance:</span>
                          <span className="text-error font-bold">-3 sheets</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 p-4 rounded bg-surface-container-low border border-outline-variant space-y-3">
                    <span className="font-title-sm text-title-sm font-bold text-on-surface block">
                      Reconciliation Impact
                    </span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Reconcile discrepancies between physical cycle counts and digital inventory. Committing updates the catalog total stock directly to the physical count and logs an audit entry.
                    </p>
                    <div className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-outline">Audit Trail:</span>
                        <span className="text-tertiary font-bold">Immutable Stock Ledger</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">Valuation Adjustment:</span>
                        <span className="text-on-surface font-bold">Automatic Cost Basis</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="core-capabilities" className="relative z-10 px-6 py-12 bg-white/88 backdrop-blur-[2px] border-b border-outline-variant">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Core Enterprise Management Modules
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl mx-auto">
              Comprehensive inventory management modules built for granular stock oversight, high-throughput fulfillment, and regulatory compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded bg-surface-container-low border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="inventory_2" className="text-xl" />
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Master Catalog &amp; Reorder Points</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Centralized SKU directory tracking lead times, unit costs, supplier vendor IDs, and automated low-stock warnings when inventory drops below reorder thresholds.
              </p>
            </div>

            <div className="p-4 rounded bg-surface-container-low border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="call_received" className="text-xl" />
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Inbound PO Receiving &amp; QC</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                4-step dock intake workflow (Arrived &rarr; Count &amp; QC &rarr; Putaway &rarr; Posted) with line item shortage detection and target storage bin assignment.
              </p>
            </div>

            <div className="p-4 rounded bg-surface-container-low border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="local_shipping" className="text-xl" />
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Fulfillment &amp; Dispatch Guard</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Two-phase pick and pack execution backed by an active stock reservation guard that blocks outbound delivery dispatches if on-hand inventory is insufficient.
              </p>
            </div>

            <div className="p-4 rounded bg-surface-container-low border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="sync_alt" className="text-xl" />
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Stock Relocation Principle</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Intra-facility and inter-warehouse stock movement tickets that reallocate physical location bins while strictly maintaining balanced enterprise valuation.
              </p>
            </div>

            <div className="p-4 rounded bg-surface-container-low border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="tune" className="text-xl" />
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">6-Step Cycle Count Reconciliation</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Reconcile physical warehouse counts against system records, evaluate discrepancy cost impacts, and commit adjustments directly into catalog balances.
              </p>
            </div>

            <div className="p-4 rounded bg-surface-container-low border border-outline-variant space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="receipt_long" className="text-xl" />
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Immutable Stock Ledger</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Chronological movement audit log of every receipt, dispatch, transfer, and adjustment with operator attribution, balance-after metrics, and CSV export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities & Infrastructure Topology */}
      <section id="facilities" className="relative z-10 px-6 py-10 bg-slate-100/82 backdrop-blur-[2px] border-b border-outline-variant">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Multi-Facility Topology
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Manage physical storage facilities, high-bay cantilever racks, and bin weight capacities.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-outline">
              <span>3 Operational Facilities</span>
              <span>•</span>
              <span>1,420 Active Storage Bins</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm font-bold text-on-surface">WH-01 Main Facility</span>
                <span className="font-label-sm text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">Primary Hub</span>
              </div>
              <p className="text-xs text-on-surface-variant">Central distribution hub with multi-tier cantilever racking, temperature-controlled bays, and high-frequency pick lanes.</p>
              <div className="pt-2 border-t border-outline-variant flex justify-between text-xs font-mono">
                <span className="text-outline">Active Bins: 680</span>
                <span className="text-on-surface font-bold">84.6% Avg Load</span>
              </div>
            </div>

            <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm font-bold text-on-surface">WH-02 North Bay Annex</span>
                <span className="font-label-sm text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">Annex</span>
              </div>
              <p className="text-xs text-on-surface-variant">Secondary fulfillment annex dedicated to bulky items, packaging materials, and overflow production buffers.</p>
              <div className="pt-2 border-t border-outline-variant flex justify-between text-xs font-mono">
                <span className="text-outline">Active Bins: 420</span>
                <span className="text-on-surface font-bold">62.0% Avg Load</span>
              </div>
            </div>

            <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm font-bold text-on-surface">WH-03 Bulk High-Bay Hub</span>
                <span className="font-label-sm text-xs px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed font-mono font-bold">Bulk Storage</span>
              </div>
              <p className="text-xs text-on-surface-variant">Heavy industrial staging facility specialized in raw alloy extrusions, heavy copper spools, and palletized bulk units.</p>
              <div className="pt-2 border-t border-outline-variant flex justify-between text-xs font-mono">
                <span className="text-outline">Active Bins: 320</span>
                <span className="text-on-surface font-bold">92.0% Avg Load</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-10 px-6 py-12 bg-white/88 backdrop-blur-[2px] border-b border-outline-variant text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="font-headline-md text-2xl font-bold text-on-surface">
            Ready to Initialize Your Warehouse Workspace?
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Connect to the StockSense enterprise console to inspect master SKU records, manage inbound shipments, and audit inventory movements across your distribution network.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/signup')}
              className="h-10 px-6 rounded bg-primary hover:bg-primary/90 text-on-primary font-title-md text-title-md flex items-center gap-2 transition-colors shadow-sm font-semibold"
            >
              <span>Get Started</span>
              <Icon name="arrow_forward" className="text-base" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="h-10 px-5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-title-md text-title-md flex items-center gap-2 transition-colors"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* Simple B2B Footer */}
      <footer className="relative z-10 px-6 py-8 bg-white/90 backdrop-blur-[2px] mt-auto text-xs text-on-surface-variant">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-6 w-auto" />
            <span className="text-outline">|</span>
            <span className="font-mono text-[11px] text-outline">
              StockSense Enterprise IMS · Version 2.4.1 (Stable Build)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button onClick={() => navigate('/login')} className="hover:text-primary transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/signup')} className="hover:text-primary transition-colors">
              Request Operator Account
            </button>
            <span className="text-outline">•</span>
            <span className="text-outline font-mono">Internal Network Deployment</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-4 mt-4 border-t border-outline-variant text-[11px] text-outline text-center md:text-left flex flex-col md:flex-row justify-between gap-2">
          <span>© 2024–2026 StockSense Systems Inc. All rights reserved. Enterprise Logistics Engine.</span>
          <span className="font-mono">Nodes: WH-01 (Active) · WH-02 (Active) · WH-03 (Active)</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;