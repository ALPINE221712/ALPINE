import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useInventory } from '../../store/inventoryStore';
import { Icon } from '../../components/common/Icon';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Product, Category } from '../../types';

export const ProductsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { products, movements, createProduct, updateProduct, addToast } = useInventory();

  // Selected item for 40% Inspector drawer
  const [selectedProductId, setSelectedProductId] = useState<string>(id || products[0]?.id || 'PRD-001');

  useEffect(() => {
    if (id) {
      setSelectedProductId(id);
    }
  }, [id]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  // Modal states
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(searchParams.get('new') === '1');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New Product Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Electrical' as Category,
    unit: 'units',
    totalStock: 100,
    reorderPoint: 50,
    maxCapacity: 500,
    unitCost: 10.0,
    primaryLocation: 'WH-01 Bin E-12',
    vendorName: 'Global Industrial Supply',
    vendorId: 'VEN-0099',
    leadTimeDays: 5,
    barcode: '78201948999',
  });

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Low Stock'
          ? p.status === 'Low Stock'
          : statusFilter === 'Out of Stock'
          ? p.status === 'Out of Stock'
          : p.status === statusFilter);

      const matchWarehouse =
        warehouseFilter === 'All' || p.primaryLocation.toLowerCase().includes(warehouseFilter.toLowerCase());

      return matchSearch && matchCategory && matchStatus && matchWarehouse;
    });
  }, [products, searchTerm, categoryFilter, statusFilter, warehouseFilter]);

  // Catalog Valuation & Low Stock Count
  const totalValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + p.totalStock * p.unitCost, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
  }, [products]);

  // Product Move History
  const productMovements = useMemo(() => {
    if (!selectedProduct) return [];
    return movements.filter((m) => m.productId === selectedProduct.id || m.sku === selectedProduct.sku);
  }, [movements, selectedProduct]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const created = await createProduct({
        ...formData,
        status: 'Available',
      });
      setIsNewProductModalOpen(false);
      if (created?.id) {
        setSelectedProductId(created.id);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Product Creation Failed',
        message: err.message || 'Failed to create product.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setIsSubmitting(true);
      await updateProduct(selectedProduct.id, {
        reorderPoint: formData.reorderPoint,
        maxCapacity: formData.maxCapacity,
        unitCost: formData.unitCost,
        primaryLocation: formData.primaryLocation,
        vendorName: formData.vendorName,
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Product Update Failed',
        message: err.message || 'Failed to update product.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full flex-1">
      {/* Sub-header / Command Bar */}
      <div className="bg-surface-container-lowest px-6 py-4 border-b border-outline-variant shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Products &amp; Stock Catalog
              </h1>
              <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-mono">
                {products.length} Total SKUs
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Centralized master catalog for SKUs, inventory tracking, valuation, reorder thresholds, and bin allocations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const csv = 'SKU,Name,Category,Stock,UnitCost,Valuation\n' + products.map(p => `"${p.sku}","${p.name}","${p.category}",${p.totalStock},${p.unitCost},${p.totalStock*p.unitCost}`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'products_catalog.csv';
                a.click();
                addToast({ type: 'success', title: 'Export Generated', message: 'Products catalog exported.' });
              }}
              className="h-8 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors border border-outline-variant"
            >
              <Icon name="file_download" className="text-base text-outline" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsNewProductModalOpen(true)}
              className="h-8 px-4 bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Icon name="add" className="text-base" />
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {/* Live Search */}
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-outline pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by SKU, product name, barcode..."
                className="w-full h-8 pl-8 pr-8 bg-surface-container-low border border-outline-variant rounded font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="close" className="text-xs" />
                </button>
              )}
            </div>

            {/* Filter Dropdown 1: Category */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 pl-2.5 pr-7 bg-surface-container-low border border-outline-variant text-on-surface font-body-sm text-body-sm rounded appearance-none cursor-pointer focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Electrical">Electrical</option>
                <option value="Fasteners">Fasteners</option>
                <option value="Safety Equipment">Safety Equipment</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Packaging">Packaging</option>
              </select>
              <Icon name="arrow_drop_down" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
            </div>

            {/* Filter Dropdown 2: Stock Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 pl-2.5 pr-7 bg-surface-container-low border border-outline-variant text-on-surface font-body-sm text-body-sm rounded appearance-none cursor-pointer focus:outline-none"
              >
                <option value="All">All Stock Statuses</option>
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock (&lt; Threshold)</option>
                <option value="Out of Stock">Out of Stock (0 units)</option>
              </select>
              <Icon name="arrow_drop_down" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
            </div>

            {/* Filter Dropdown 3: Warehouse */}
            <div className="relative">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="h-8 pl-2.5 pr-7 bg-surface-container-low border border-outline-variant text-on-surface font-body-sm text-body-sm rounded appearance-none cursor-pointer focus:outline-none"
              >
                <option value="All">All Warehouses</option>
                <option value="WH-01">WH-01 Main Facility</option>
                <option value="WH-02">WH-02 North Bay Annex</option>
                <option value="WH-03">WH-03 Bulk High-Bay</option>
              </select>
              <Icon name="arrow_drop_down" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none" />
            </div>
          </div>

          {/* Quick Metrics Mini Banner */}
          <div className="flex items-center gap-3 text-right shrink-0">
            <div className="bg-surface-container-low border border-outline-variant px-3 py-1 rounded">
              <div className="font-label-sm text-[10px] text-outline uppercase tracking-wider font-semibold">
                Catalog Valuation
              </div>
              <div className="font-title-sm text-title-sm text-on-surface font-bold font-mono">
                ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-surface-container-low border border-outline-variant px-3 py-1 rounded">
              <div className="font-label-sm text-[10px] text-outline uppercase tracking-wider font-semibold">
                Alerts
              </div>
              <div className="font-title-sm text-title-sm text-error font-bold font-mono">
                {lowStockCount} Critical / Low
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Pills */}
        {(searchTerm || categoryFilter !== 'All' || statusFilter !== 'All' || warehouseFilter !== 'All') && (
          <div className="mt-3 flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
            <span className="font-label-sm text-label-sm text-outline font-semibold">Active Filters:</span>
            {categoryFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-surface-container text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded border border-outline-variant">
                <span>Category: {categoryFilter}</span>
                <button onClick={() => setCategoryFilter('All')} className="hover:text-error">
                  <Icon name="close" className="text-xs" />
                </button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-surface-container text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded border border-outline-variant">
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter('All')} className="hover:text-error">
                  <Icon name="close" className="text-xs" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-surface-container text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded border border-outline-variant">
                <span>Query: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm('')} className="hover:text-error">
                  <Icon name="close" className="text-xs" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('All');
                setStatusFilter('All');
                setWarehouseFilter('All');
              }}
              className="font-label-sm text-label-sm text-primary hover:underline ml-1 font-semibold"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Split Layout: 60% Master Table / 40% Operational Inspector */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left Column: Master Table (xl:col-span-7 ~ 58-60%) */}
          <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 py-3 flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant">
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Filtered Items ({filteredProducts.length} of {products.length})
                </span>
                <div className="flex items-center gap-1 font-label-sm text-outline">
                  <span>Click any row to inspect deep parameters</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant">
                      <th className="px-3.5 py-2 font-semibold">Product &amp; SKU</th>
                      <th className="px-3.5 py-2 font-semibold">Category</th>
                      <th className="px-3.5 py-2 font-semibold text-right">Total Stock</th>
                      <th className="px-3.5 py-2 font-semibold text-right">Valuation</th>
                      <th className="px-3.5 py-2 font-semibold text-center">Status</th>
                      <th className="px-3.5 py-2 font-semibold text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const isSelected = p.id === selectedProduct?.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedProductId(p.id)}
                          className={`transition-colors cursor-pointer group ${
                            isSelected
                              ? 'bg-blue-50/80 font-medium border-l-4 border-primary'
                              : 'hover:bg-surface-container-low'
                          }`}
                        >
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-outline-variant">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Icon name="inventory_2" className="text-sm text-outline" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-title-sm text-title-sm text-on-surface font-semibold truncate leading-tight">
                                  {p.name}
                                </div>
                                <div className="font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px]">
                                  {p.sku} • {p.primaryLocation}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                            <span className={p.totalStock <= 0 ? 'text-error' : 'text-on-surface'}>
                              {p.totalStock.toLocaleString()}
                            </span>{' '}
                            <span className="text-xs font-normal text-outline">{p.unit}</span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-on-surface">
                            ${(p.totalStock * p.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-3.5 py-2.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedProductId(p.id)}
                                className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
                                title="Inspect in Drawer"
                              >
                                <Icon name="visibility" className="text-base" />
                              </button>
                              <button
                                onClick={() => navigate('/transfers/new')}
                                className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
                                title="Transfer Stock"
                              >
                                <Icon name="sync_alt" className="text-base" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-2.5 bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>Showing {filteredProducts.length} items</span>
              <span className="font-mono text-outline">Industrial Density Display</span>
            </div>
          </div>

          {/* Right Column: Deep Product Details Drawer / Inspector (xl:col-span-5 ~ 40%) */}
          {selectedProduct && (
            <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-md flex flex-col justify-between overflow-hidden">
              <div>
                {/* Drawer Top Action Bar */}
                <div className="px-5 py-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1">
                      <Icon name="data_object" className="text-sm text-primary" />
                      Item Inspector
                    </span>
                    <span className="h-3 w-px bg-outline-variant" />
                    <span className="font-label-sm text-label-sm font-mono text-outline font-semibold">
                      {selectedProduct.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          reorderPoint: selectedProduct.reorderPoint,
                          maxCapacity: selectedProduct.maxCapacity,
                          unitCost: selectedProduct.unitCost,
                          primaryLocation: selectedProduct.primaryLocation,
                          vendorName: selectedProduct.vendorName,
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
                      title="Edit Master Specs"
                    >
                      <Icon name="edit" className="text-base" />
                    </button>
                    <button
                      onClick={() => navigate('/ledger')}
                      className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
                      title="View Ledger Audit"
                    >
                      <Icon name="history" className="text-base" />
                    </button>
                  </div>
                </div>

                {/* Identity & Barcode Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg bg-surface-container shrink-0 overflow-hidden shadow-sm border border-outline-variant">
                      {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline">
                          <Icon name="inventory_2" className="text-3xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono font-bold">
                          {selectedProduct.sku}
                        </span>
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                          {selectedProduct.category}
                        </span>
                        <StatusBadge status={selectedProduct.status} />
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug">
                        {selectedProduct.name}
                      </h3>
                      <p className="font-body-sm text-body-sm text-outline mt-0.5 truncate">
                        Supplier: {selectedProduct.vendorName} • Vendor ID: {selectedProduct.vendorId}
                      </p>
                    </div>
                  </div>

                  {/* Visual Barcode & Inventory Level */}
                  <div className="mt-4 p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* Inline Barcode Graphic */}
                        <div className="bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant flex items-center">
                          <svg className="h-5 w-24 text-on-surface" fill="currentColor" viewBox="0 0 100 24">
                            <rect x="0" y="0" width="3" height="24" />
                            <rect x="5" y="0" width="1.5" height="24" />
                            <rect x="8" y="0" width="4" height="24" />
                            <rect x="14" y="0" width="2" height="24" />
                            <rect x="18" y="0" width="5" height="24" />
                            <rect x="25" y="0" width="2" height="24" />
                            <rect x="32" y="0" width="4" height="24" />
                            <rect x="38" y="0" width="2" height="24" />
                            <rect x="43" y="0" width="5" height="24" />
                            <rect x="50" y="0" width="3" height="24" />
                            <rect x="58" y="0" width="4" height="24" />
                            <rect x="64" y="0" width="2" height="24" />
                            <rect x="68" y="0" width="4" height="24" />
                            <rect x="74" y="0" width="2" height="24" />
                            <rect x="78" y="0" width="6" height="24" />
                            <rect x="86" y="0" width="2" height="24" />
                            <rect x="90" y="0" width="3" height="24" />
                            <rect x="95" y="0" width="4" height="24" />
                          </svg>
                        </div>
                        <span className="font-label-sm text-label-sm font-mono text-outline font-semibold">
                          {selectedProduct.barcode}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        Capacity: {Math.round((selectedProduct.totalStock / selectedProduct.maxCapacity) * 100)}%
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden flex">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          selectedProduct.totalStock <= selectedProduct.reorderPoint ? 'bg-error' : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((selectedProduct.totalStock / selectedProduct.maxCapacity) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 font-label-sm text-label-sm text-outline font-mono">
                      <span>0 {selectedProduct.unit}</span>
                      <span className={selectedProduct.totalStock <= selectedProduct.reorderPoint ? 'text-error font-bold' : 'text-on-surface font-semibold'}>
                        Current: {selectedProduct.totalStock} {selectedProduct.unit}
                      </span>
                      <span>Threshold: {selectedProduct.reorderPoint} {selectedProduct.unit}</span>
                      <span>Max: {selectedProduct.maxCapacity} {selectedProduct.unit}</span>
                    </div>
                  </div>

                  {/* 5 Quick Stats Tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                    <div className="bg-surface-container-low border border-outline-variant p-2 rounded">
                      <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Current</span>
                      <span className="font-title-md text-title-md text-on-surface font-bold font-mono">
                        {selectedProduct.totalStock} {selectedProduct.unit}
                      </span>
                      <span className="font-label-sm text-[10px] text-outline block mt-0.5">On-hand</span>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant p-2 rounded">
                      <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Reorder</span>
                      <span className="font-title-md text-title-md text-on-surface font-bold font-mono">
                        {selectedProduct.reorderPoint}
                      </span>
                      <span className="font-label-sm text-[10px] text-outline block mt-0.5">Safety floor</span>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant p-2 rounded">
                      <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Unit Cost</span>
                      <span className="font-title-md text-title-md text-on-surface font-bold font-mono">
                        ${selectedProduct.unitCost.toFixed(2)}
                      </span>
                      <span className="font-label-sm text-[10px] text-tertiary block mt-0.5">FIFO base</span>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant p-2 rounded">
                      <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Valuation</span>
                      <span className="font-title-md text-title-md text-primary font-bold font-mono">
                        ${(selectedProduct.totalStock * selectedProduct.unitCost).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="font-label-sm text-[10px] text-outline block mt-0.5">Book value</span>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant p-2 rounded col-span-2 md:col-span-1">
                      <span className="font-label-sm text-[10px] text-outline uppercase block font-semibold">Lead Time</span>
                      <span className="font-title-md text-title-md text-on-surface font-bold font-mono">
                        {selectedProduct.leadTimeDays} Days
                      </span>
                      <span className="font-label-sm text-[10px] text-outline block mt-0.5">Standard</span>
                    </div>
                  </div>

                  {/* Section 1: Stock by Location & Warehouse */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface tracking-wider flex items-center gap-1.5">
                        <Icon name="warehouse" className="text-sm text-secondary" />
                        Stock Location Allocations
                      </span>
                      <button
                        onClick={() => navigate('/warehouses')}
                        className="font-label-sm text-label-sm text-primary hover:underline font-semibold"
                      >
                        Warehouse Settings
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <div className="bg-surface-container-low border border-outline-variant p-2.5 rounded flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div>
                            <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                              Primary Warehouse Slot
                            </div>
                            <div className="font-label-sm text-label-sm text-outline font-mono">
                              {selectedProduct.primaryLocation}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-title-sm text-title-sm text-on-surface font-mono font-bold">
                            {selectedProduct.totalStock} {selectedProduct.unit}
                          </div>
                          <span className="font-label-sm text-[11px] text-tertiary font-semibold">Available for Pick</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Recent Movement History */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface tracking-wider flex items-center gap-1.5">
                        <Icon name="receipt_long" className="text-sm text-secondary" />
                        Recent Movement History
                      </span>
                      <button
                        onClick={() => navigate('/ledger')}
                        className="font-label-sm text-label-sm text-primary hover:underline font-semibold"
                      >
                        View Full Ledger
                      </button>
                    </div>
                    <div className="space-y-2">
                      {productMovements.length > 0 ? (
                        productMovements.slice(0, 3).map((m) => (
                          <div
                            key={m.id}
                            className="p-2.5 bg-surface-container-low border border-outline-variant rounded flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded bg-surface-container text-primary flex items-center justify-center shrink-0">
                                <Icon name="sync_alt" className="text-sm" />
                              </div>
                              <div>
                                <div className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-1.5">
                                  <span>{m.type}: {m.referenceNumber}</span>
                                  <span className={`font-mono text-xs font-bold ${m.quantityDelta > 0 ? 'text-tertiary' : 'text-error'}`}>
                                    {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                                  </span>
                                </div>
                                <div className="font-label-sm text-label-sm text-outline text-[11px]">
                                  {m.fromLocation} ➔ {m.toLocation}
                                </div>
                              </div>
                            </div>
                            <span className="font-label-sm text-label-sm font-mono text-outline shrink-0">
                              {m.timestamp}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-surface-container-low border border-dashed border-slate-300 rounded text-center text-xs text-outline">
                          No recent movement transactions logged for this SKU.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Operational Inspector Footer Action Buttons */}
              <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => navigate('/receipts/new')}
                    className="h-8 px-3 bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm rounded flex items-center justify-center gap-1.5 flex-1 transition-colors shadow-sm"
                  >
                    <Icon name="add_shopping_cart" className="text-sm" />
                    <span>Create PO Receipt</span>
                  </button>
                  <button
                    onClick={() => navigate('/transfers/new')}
                    className="h-8 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm rounded flex items-center justify-center gap-1.5 flex-1 transition-colors border border-outline-variant shadow-xs"
                  >
                    <Icon name="sync_alt" className="text-sm text-outline" />
                    <span>Transfer</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/adjustments/new')}
                    className="h-8 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm rounded flex items-center justify-center gap-1 transition-colors border border-outline-variant shadow-xs"
                    title="Physical Inventory Count Cycle"
                  >
                    <Icon name="tune" className="text-sm text-outline" />
                    <span>Adjust Count</span>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        reorderPoint: selectedProduct.reorderPoint,
                        maxCapacity: selectedProduct.maxCapacity,
                        unitCost: selectedProduct.unitCost,
                        primaryLocation: selectedProduct.primaryLocation,
                        vendorName: selectedProduct.vendorName,
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="h-8 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-sm text-title-sm rounded flex items-center justify-center gap-1 transition-colors border border-outline-variant shadow-xs"
                    title="Edit Master Specifications"
                  >
                    <Icon name="edit" className="text-sm text-outline" />
                    <span>Edit Specs</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Product */}
      <Modal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        title="Add New SKU / Product"
        subtitle="Register an enterprise inventory item in the centralized StockSense catalog."
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                SKU Identifier *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="SKU-BR-7710"
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded font-mono font-semibold text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full h-8 px-2.5 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              >
                <option value="Raw Materials">Raw Materials</option>
                <option value="Electrical">Electrical</option>
                <option value="Fasteners">Fasteners</option>
                <option value="Safety Equipment">Safety Equipment</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
              Product Description / Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Precision Brass Fittings 1/2-inch"
              className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.totalStock}
                onChange={(e) => setFormData({ ...formData, totalStock: Number(e.target.value) })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Unit Measure
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="units, kg, m, pcs"
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Reorder Point
              </label>
              <input
                type="number"
                min="1"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Unit Cost ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Max Bay Capacity
              </label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Primary Location Slot
              </label>
              <input
                type="text"
                value={formData.primaryLocation}
                onChange={(e) => setFormData({ ...formData, primaryLocation: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewProductModalOpen(false)}
              className="h-8 px-3 border border-outline-variant rounded text-xs text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 bg-primary-container hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center gap-1.5"
            >
              <Icon name={isSubmitting ? "sync" : "check"} className={`text-sm ${isSubmitting ? "animate-spin" : ""}`} />
              <span>{isSubmitting ? "Saving..." : "Save & Index Product"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Specs */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Master Specs: ${selectedProduct?.sku}`}
        subtitle="Adjust safety stock thresholds, unit valuation, and default storage allocation."
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Reorder Threshold ({selectedProduct?.unit})
              </label>
              <input
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Max Capacity ({selectedProduct?.unit})
              </label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Unit Valuation ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
                Primary Allocation Slot
              </label>
              <input
                type="text"
                value={formData.primaryLocation}
                onChange={(e) => setFormData({ ...formData, primaryLocation: e.target.value })}
                className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-1 font-semibold">
              Preferred Supplier Name
            </label>
            <input
              type="text"
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              className="w-full h-8 px-3 bg-surface-container-low border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="h-8 px-3 border border-outline-variant rounded text-xs text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 bg-primary-container hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-title-sm text-title-sm rounded shadow-sm flex items-center gap-1.5"
            >
              <Icon name={isSubmitting ? "sync" : "save"} className={`text-sm ${isSubmitting ? "animate-spin" : ""}`} />
              <span>{isSubmitting ? "Updating..." : "Update Specifications"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
