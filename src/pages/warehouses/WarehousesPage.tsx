import React, { useState, useMemo } from 'react';
import { useInventory } from '../../store/inventoryStore';
import { Warehouse, Location } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export const WarehousesPage: React.FC = () => {
  const {
    warehouses,
    locations,
    products,
    addWarehouse,
    addLocation,
    addToast,
  } = useInventory();

  // State
  const [selectedFacilityCode, setSelectedFacilityCode] = useState<string>(
    warehouses[0]?.code || 'WH-01'
  );
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedLocation, setInspectedLocation] = useState<Location | null>(null);

  // Modals
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);

  // Add Facility Form
  const [facilityForm, setFacilityForm] = useState({
    code: '',
    name: '',
    address: '',
    manager: 'Marcus Vance',
    contact: 'ops@stocksense.internal',
    type: 'Distribution Hub' as const,
    totalCapacityCbm: 15000,
    zones: ['Zone A', 'Zone B', 'Zone C'],
  });

  // Add Location Form
  const [locationForm, setLocationForm] = useState({
    code: '',
    zone: 'Zone A',
    rack: 'Rack A-01',
    shelfTier: 'Tier 1',
    bin: 'B01',
    maxWeightKg: 1000,
    currentWeightKg: 0,
    locationType: 'Heavy Beam Rack' as const,
  });

  // Selected Warehouse Object
  const currentWarehouse = useMemo(() => {
    return warehouses.find((w) => w.code === selectedFacilityCode) || warehouses[0];
  }, [warehouses, selectedFacilityCode]);

  // Filtered Locations
  const facilityLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (loc.warehouseCode !== selectedFacilityCode) return false;
      if (selectedZone !== 'ALL' && loc.zone !== selectedZone) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = loc.code.toLowerCase().includes(q);
        const matchesRack = loc.rack.toLowerCase().includes(q);
        const matchesItems = loc.storedItems.some(
          (i) => i.sku.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q)
        );
        if (!matchesCode && !matchesRack && !matchesItems) return false;
      }
      return true;
    });
  }, [locations, selectedFacilityCode, selectedZone, searchQuery]);

  // Unique zones for the current warehouse
  const availableZones = useMemo(() => {
    const list = locations
      .filter((loc) => loc.warehouseCode === selectedFacilityCode)
      .map((loc) => loc.zone);
    return Array.from(new Set(list));
  }, [locations, selectedFacilityCode]);

  // Handle Add Facility
  const handleAddFacilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityForm.code.trim() || !facilityForm.name.trim()) {
      addToast({ type: 'error', title: 'Invalid Facility', message: 'Code and Name are required.' });
      return;
    }
    const created = addWarehouse({
      code: facilityForm.code.toUpperCase(),
      name: facilityForm.name,
      address: facilityForm.address,
      manager: facilityForm.manager,
      contact: facilityForm.contact,
      type: facilityForm.type,
      totalCapacityCbm: facilityForm.totalCapacityCbm,
      utilizedCapacityCbm: 0,
      activeBinsCount: 0,
      zones: facilityForm.zones,
    });
    setIsAddFacilityModalOpen(false);
    setSelectedFacilityCode(created.code);
    setFacilityForm({
      code: '',
      name: '',
      address: '',
      manager: 'Marcus Vance',
      contact: 'ops@stocksense.internal',
      type: 'Distribution Hub',
      totalCapacityCbm: 15000,
      zones: ['Zone A', 'Zone B'],
    });
  };

  // Handle Add Location
  const handleAddLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.code.trim()) {
      addToast({ type: 'error', title: 'Invalid Location', message: 'Location Code is required.' });
      return;
    }

    const created = addLocation({
      warehouseCode: selectedFacilityCode,
      code: locationForm.code.toUpperCase(),
      zone: locationForm.zone,
      rack: locationForm.rack,
      shelfTier: locationForm.shelfTier,
      bin: locationForm.bin,
      maxWeightKg: Number(locationForm.maxWeightKg),
      currentWeightKg: Number(locationForm.currentWeightKg),
      utilizationPercentage: Math.round((Number(locationForm.currentWeightKg) / Number(locationForm.maxWeightKg)) * 100),
      status: 'Empty',
      storedItems: [],
      locationType: locationForm.locationType,
    });

    setIsAddLocationModalOpen(false);
    setLocationForm({
      code: '',
      zone: 'Zone A',
      rack: 'Rack A-01',
      shelfTier: 'Tier 1',
      bin: 'B01',
      maxWeightKg: 1000,
      currentWeightKg: 0,
      locationType: 'Heavy Beam Rack',
    });
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Sub-header / Breadcrumbs & Page Actions Bar */}
      <div className="bg-surface-container-lowest px-6 py-4 border-b border-outline-variant">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">
              <span>Settings</span>
              <span>/</span>
              <span className="text-primary font-bold">Warehouses &amp; Locations</span>
            </div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Warehouse Infrastructure &amp; Storage Locations
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-4xl">
              Configure multi-facility physical hierarchies, warehouse sectors, aisles, and storage bins with real-time stock availability, load metrics, and capacity constraints.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button
              onClick={() => {
                const csvContent =
                  'data:text/csv;charset=utf-8,Code,Warehouse,Zone,Rack,Tier,Bin,Max Weight (kg),Current Load (kg),Utilization %,Status\n' +
                  locations
                    .map(
                      (l) =>
                        `"${l.code}","${l.warehouseCode}","${l.zone}","${l.rack}","${l.shelfTier}","${l.bin}","${l.maxWeightKg}","${l.currentWeightKg}","${l.utilizationPercentage}%","${l.status}"`
                    )
                    .join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', 'StockSense_Storage_Locations.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="h-8 px-3 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant rounded font-title-sm text-title-sm flex items-center gap-1.5 transition-colors"
              type="button"
            >
              <Icon name="file_download" className="text-base text-secondary" />
              <span>Export Layout (CSV)</span>
            </button>
            <button
              onClick={() => setIsAddLocationModalOpen(true)}
              className="h-8 px-3 bg-secondary-container hover:bg-surface-container-high text-on-secondary-fixed font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors"
              type="button"
            >
              <Icon name="domain_add" className="text-base" />
              <span>+ Add Location / Bin</span>
            </button>
            <button
              onClick={() => setIsAddFacilityModalOpen(true)}
              className="h-8 px-3.5 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors shadow-sm"
              type="button"
            >
              <Icon name="add_business" className="text-base" />
              <span>+ Add New Facility</span>
            </button>
          </div>
        </div>

        {/* Facility Overview Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-outline-variant">
          <div className="bg-surface-container-low p-3 rounded border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Active Facilities</span>
              <Icon name="domain" className="text-base text-primary" />
            </div>
            <div className="mt-2">
              <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {warehouses.length} Facilities
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span className="truncate">{warehouses.map((w) => w.code).join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Total Storage Locations</span>
              <Icon name="shelves" className="text-base text-primary" />
            </div>
            <div className="mt-2">
              <div className="font-headline-sm text-headline-sm text-on-surface font-bold font-mono">
                {locations.length} Bins
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="text-tertiary font-semibold font-mono">100%</span>
                <span>Active &amp; indexed</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Volumetric Utilization</span>
              <Icon name="pie_chart" className="text-base text-primary" />
            </div>
            <div className="mt-2">
              <div className="font-headline-sm text-headline-sm text-on-surface font-bold font-mono">
                {Math.round((currentWarehouse.utilizedCapacityCbm / currentWarehouse.totalCapacityCbm) * 100)}% Avg Load
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="text-primary font-medium">Optimal storage buffer</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Controlled Enclosures</span>
              <Icon name="severe_cold" className="text-base text-secondary" />
            </div>
            <div className="mt-2">
              <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                2 ISO · 1 Vault
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span>Telemetry active</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Active Staging Bays</span>
              <Icon name="forklift" className="text-base text-secondary" />
            </div>
            <div className="mt-2">
              <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                8 Dedicated Bays
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span>Inbound &amp; outbound active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-5">
        {/* Facility Selector Tabs */}
        <div className="bg-surface-container-lowest rounded border border-outline-variant p-2 flex items-center gap-2 overflow-x-auto shadow-2xs">
          {warehouses.map((wh) => {
            const isSelected = wh.code === selectedFacilityCode;
            const binCount = locations.filter((l) => l.warehouseCode === wh.code).length;
            return (
              <button
                key={wh.code}
                onClick={() => {
                  setSelectedFacilityCode(wh.code);
                  setSelectedZone('ALL');
                }}
                className={`h-9 px-4 rounded font-title-sm text-title-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'hover:bg-surface-container text-on-surface-variant'
                }`}
                type="button"
              >
                <Icon name="warehouse" className="text-base" />
                <span>
                  {wh.code} - {wh.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                    isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  {binCount} Bins
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Facility Details Card */}
        {currentWarehouse && (
          <div className="bg-surface-container-lowest rounded border border-outline-variant p-4 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-outline-variant">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                    {currentWarehouse.code} — {currentWarehouse.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                    {currentWarehouse.type}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant mt-1">
                  <span>Address: <strong className="text-on-surface">{currentWarehouse.address}</strong></span>
                  <span>•</span>
                  <span>Facility Manager: <strong className="text-on-surface">{currentWarehouse.manager}</strong></span>
                  <span>•</span>
                  <span>Contact: <strong className="text-on-surface">{currentWarehouse.contact}</strong></span>
                </div>
              </div>

              {/* Volumetric Capacity Bar */}
              <div className="w-full md:w-64">
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-outline uppercase font-semibold">Capacity Utilization</span>
                  <span className="font-mono font-bold text-on-surface">
                    {Math.round((currentWarehouse.utilizedCapacityCbm / currentWarehouse.totalCapacityCbm) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (currentWarehouse.utilizedCapacityCbm / currentWarehouse.totalCapacityCbm) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="text-[11px] text-outline font-mono mt-1 text-right">
                  {currentWarehouse.utilizedCapacityCbm.toLocaleString()} / {currentWarehouse.totalCapacityCbm.toLocaleString()} m³
                </div>
              </div>
            </div>

            {/* Zone Filter Navigation & Search */}
            <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="font-label-sm text-label-sm text-outline uppercase font-semibold shrink-0">
                  Zones:
                </span>
                <button
                  onClick={() => setSelectedZone('ALL')}
                  className={`h-7 px-2.5 rounded font-label-md text-label-md transition-colors whitespace-nowrap ${
                    selectedZone === 'ALL'
                      ? 'bg-secondary-container text-on-secondary-fixed font-bold border border-primary/20'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  All Zones
                </button>
                {availableZones.map((zone) => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`h-7 px-2.5 rounded font-label-md text-label-md transition-colors whitespace-nowrap ${
                      selectedZone === zone
                        ? 'bg-secondary-container text-on-secondary-fixed font-bold border border-primary/20'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                    type="button"
                  >
                    {zone}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter bins, racks, SKUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest"
                />
              </div>
            </div>
          </div>
        )}

        {/* High-Density Storage Locations & Bins Table */}
        <div className="bg-surface-container-lowest rounded shadow-2xs border border-outline-variant overflow-hidden flex flex-col">
          <div className="p-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                Storage Locations &amp; Bin Stock Availability
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-label-sm">
                {facilityLocations.length} locations
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-outline font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span> &lt;75% Optimal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 75-90% Near Limit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error"></span> &gt;90% Critical
              </span>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-2.5 px-3 font-semibold">Location Code</th>
                  <th className="py-2.5 px-3 font-semibold">Zone</th>
                  <th className="py-2.5 px-3 font-semibold">Rack / Tier</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Load / Max Capacity</th>
                  <th className="py-2.5 px-3 font-semibold w-40">Load Utilization</th>
                  <th className="py-2.5 px-3 font-semibold">Stored Inventory</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {facilityLocations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-on-surface-variant">
                      No storage locations found for this facility and zone.
                    </td>
                  </tr>
                ) : (
                  facilityLocations.map((loc) => {
                    const isOptimal = loc.utilizationPercentage < 75;
                    const isNearLimit = loc.utilizationPercentage >= 75 && loc.utilizationPercentage < 90;
                    const isCritical = loc.utilizationPercentage >= 90;

                    let barColor = 'bg-tertiary';
                    if (isNearLimit) barColor = 'bg-amber-500';
                    if (isCritical) barColor = 'bg-error';

                    return (
                      <tr key={loc.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-primary font-title-sm text-title-sm">
                            {loc.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-on-surface font-medium">{loc.zone}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-on-surface-variant font-mono text-xs">
                            {loc.rack} · {loc.shelfTier}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-on-surface text-xs bg-surface-container px-2 py-0.5 rounded">
                            {loc.locationType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs">
                          <span className="font-bold text-on-surface">{loc.currentWeightKg}</span> / {loc.maxWeightKg} kg
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface-container h-1.5 rounded overflow-hidden">
                              <div
                                className={`h-full ${barColor}`}
                                style={{ width: `${Math.min(100, loc.utilizationPercentage)}%` }}
                              ></div>
                            </div>
                            <span className="font-mono font-bold text-xs text-on-surface w-9 text-right">
                              {loc.utilizationPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {loc.storedItems.length === 0 ? (
                            <span className="text-outline text-xs italic">Empty Location</span>
                          ) : (
                            <div className="flex flex-col">
                              {loc.storedItems.map((item, i) => (
                                <span key={i} className="text-xs text-on-surface truncate max-w-xs font-mono">
                                  <strong className="text-primary">{item.sku}</strong>: {item.quantity} units
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={loc.status} />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setInspectedLocation(loc)}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                            title="Inspect bin stock"
                            type="button"
                          >
                            <Icon name="visibility" className="text-base" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
            <span>
              Showing {facilityLocations.length} locations in {currentWarehouse.code}
            </span>
            <span className="text-outline">Physical Inventory Topology</span>
          </div>
        </div>
      </div>

      {/* Location Stock Inspection Modal */}
      {inspectedLocation && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedLocation(null)}
          title={`Bin Availability: ${inspectedLocation.code}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex items-center justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-outline uppercase block">Warehouse Zone</span>
                <span className="font-title-sm text-title-sm font-bold text-on-surface">
                  {inspectedLocation.warehouseCode} — {inspectedLocation.zone}
                </span>
                <span className="text-xs text-on-surface-variant block font-mono">
                  {inspectedLocation.rack} · {inspectedLocation.shelfTier} · {inspectedLocation.bin}
                </span>
              </div>
              <StatusBadge status={inspectedLocation.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant">
                <span className="text-outline font-label-sm text-label-sm uppercase block">Weight Capacity</span>
                <span className="font-mono font-bold text-base text-on-surface">
                  {inspectedLocation.currentWeightKg} / {inspectedLocation.maxWeightKg} kg
                </span>
                <div className="w-full bg-surface-container h-1.5 rounded overflow-hidden mt-1.5">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${Math.min(100, inspectedLocation.utilizationPercentage)}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant">
                <span className="text-outline font-label-sm text-label-sm uppercase block">Location Type</span>
                <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                  {inspectedLocation.locationType}
                </span>
                <span className="text-xs text-on-surface-variant block mt-1">Ground pallet / heavy bay</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">
                Stored Inventory In This Bin ({inspectedLocation.storedItems.length})
              </h4>
              {inspectedLocation.storedItems.length === 0 ? (
                <div className="p-4 bg-surface-container-low rounded border border-outline-variant text-center text-on-surface-variant text-xs">
                  This storage bin is currently empty and available for replenishment putaway.
                </div>
              ) : (
                <div className="space-y-2">
                  {inspectedLocation.storedItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-surface-container-low rounded border border-outline-variant flex items-center justify-between">
                      <div>
                        <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                          {item.productName}
                        </div>
                        <div className="font-label-sm text-label-sm text-outline font-mono">
                          {item.sku}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-base text-primary">
                          {item.quantity.toLocaleString()} units
                        </div>
                        <div className="text-[11px] text-tertiary">Verified On-Hand</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectedLocation(null)}
                className="h-8 px-4 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-sm text-title-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Facility Modal */}
      <Modal
        isOpen={isAddFacilityModalOpen}
        onClose={() => setIsAddFacilityModalOpen(false)}
        title="Add New Warehouse Facility"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddFacilitySubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Facility Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WH-04"
                value={facilityForm.code}
                onChange={(e) => setFacilityForm({ ...facilityForm, code: e.target.value })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest font-mono"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Facility Type
              </label>
              <select
                value={facilityForm.type}
                onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value as any })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              >
                <option value="Distribution Hub">Distribution Hub</option>
                <option value="Annex Facility">Annex Facility</option>
                <option value="Bulk Storage">Bulk Storage</option>
                <option value="Cold Storage">Cold Storage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
              Facility Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. South Logistics Center"
              value={facilityForm.name}
              onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
              className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 740 Logistics Blvd, Dock 10-18, Austin, TX"
              value={facilityForm.address}
              onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })}
              className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Manager In Charge
              </label>
              <input
                type="text"
                required
                value={facilityForm.manager}
                onChange={(e) => setFacilityForm({ ...facilityForm, manager: e.target.value })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Total Capacity (m³)
              </label>
              <input
                type="number"
                min="1000"
                required
                value={facilityForm.totalCapacityCbm}
                onChange={(e) => setFacilityForm({ ...facilityForm, totalCapacityCbm: Number(e.target.value) })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => setIsAddFacilityModalOpen(false)}
              className="h-8 px-3 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-sm text-title-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded bg-primary text-on-primary hover:bg-primary/90 font-title-sm text-title-sm transition-colors shadow-sm"
            >
              Create Facility
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Location / Bin Modal */}
      <Modal
        isOpen={isAddLocationModalOpen}
        onClose={() => setIsAddLocationModalOpen(false)}
        title={`Add Storage Bin to ${selectedFacilityCode}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddLocationSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
              Location Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. WH-01-A-08-B01"
              value={locationForm.code}
              onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
              className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Zone
              </label>
              <input
                type="text"
                required
                value={locationForm.zone}
                onChange={(e) => setLocationForm({ ...locationForm, zone: e.target.value })}
                placeholder="e.g. Zone A"
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Rack
              </label>
              <input
                type="text"
                required
                value={locationForm.rack}
                onChange={(e) => setLocationForm({ ...locationForm, rack: e.target.value })}
                placeholder="e.g. Rack A-08"
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Shelf Tier
              </label>
              <input
                type="text"
                required
                value={locationForm.shelfTier}
                onChange={(e) => setLocationForm({ ...locationForm, shelfTier: e.target.value })}
                placeholder="e.g. Tier 1"
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Bin Code
              </label>
              <input
                type="text"
                required
                value={locationForm.bin}
                onChange={(e) => setLocationForm({ ...locationForm, bin: e.target.value })}
                placeholder="e.g. B01"
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Rack / Location Type
              </label>
              <select
                value={locationForm.locationType}
                onChange={(e) => setLocationForm({ ...locationForm, locationType: e.target.value as any })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest"
              >
                <option value="Heavy Beam Rack">Heavy Beam Rack</option>
                <option value="Cantilever Bay">Cantilever Bay</option>
                <option value="Standard Shelving">Standard Shelving</option>
                <option value="Staging Buffer">Staging Buffer</option>
              </select>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
                Max Weight (kg)
              </label>
              <input
                type="number"
                min="10"
                required
                value={locationForm.maxWeightKg}
                onChange={(e) => setLocationForm({ ...locationForm, maxWeightKg: Number(e.target.value) })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => setIsAddLocationModalOpen(false)}
              className="h-8 px-3 rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-sm text-title-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded bg-primary text-on-primary hover:bg-primary/90 font-title-sm text-title-sm transition-colors shadow-sm"
            >
              Add Storage Location
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WarehousesPage;
