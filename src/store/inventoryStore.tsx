import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Product,
  Warehouse,
  Location,
  Receipt,
  Delivery,
  Transfer,
  StockAdjustment,
  StockMovement,
  ReceiptItem,
  DeliveryItem,
  TransferItem,
  AdjustmentItem,
  Category,
  ProductStatus,
} from '../types';
import {
  authApi,
  productsApi,
  categoriesApi,
  warehousesApi,
  locationsApi,
  inventoryApi,
  receiptsApi,
  deliveriesApi,
  transfersApi,
  adjustmentsApi,
  ledgerApi,
  ApiError,
} from '../lib/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface InventoryContextType {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, role: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<User>) => void;

  // Selected facility
  selectedWarehouseCode: string;
  setSelectedWarehouseCode: (code: string) => void;

  // Domain data from MySQL Backend
  warehouses: Warehouse[];
  locations: Location[];
  products: Product[];
  receipts: Receipt[];
  deliveries: Delivery[];
  transfers: Transfer[];
  adjustments: StockAdjustment[];
  movements: StockMovement[];
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Business Logic Actions (backed by transactional API endpoints)
  // 1. Receipts
  validateReceipt: (receiptId: string) => Promise<{ success: boolean; message: string }>;
  createReceipt: (newReceipt: Omit<Receipt, 'id' | 'receiptNumber'>) => Promise<Receipt>;

  // 2. Deliveries
  pickDelivery: (deliveryId: string) => Promise<{ success: boolean; message: string }>;
  dispatchDelivery: (deliveryId: string) => Promise<{ success: boolean; message: string }>;
  createDelivery: (newDelivery: Omit<Delivery, 'id' | 'deliveryNumber'>) => Promise<Delivery>;

  // 3. Transfers
  completeTransfer: (transferId: string) => Promise<{ success: boolean; message: string }>;
  createTransfer: (newTransfer: Omit<Transfer, 'id' | 'transferNumber' | 'status' | 'createdDate'>) => Promise<Transfer>;

  // 4. Adjustments
  applyAdjustment: (adjustmentId: string) => Promise<{ success: boolean; message: string }>;
  createAdjustment: (newAdj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'status' | 'createdDate' | 'workflowStep'>) => Promise<StockAdjustment>;

  // 5. Products & Facilities
  createProduct: (newProduct: any) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addWarehouse: (newWh: Omit<Warehouse, 'id'>) => Promise<Warehouse>;
  addLocation: (newLoc: Omit<Location, 'id'>) => Promise<Location>;

  // Global Command Palette state
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Selected warehouse code
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState<string>('WH-01');

  // Authoritative Domain Data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Map Backend Entities to Frontend Models
  const mapBackendProduct = (p: any): Product => {
    const totalStock = parseFloat(p.total_stock) || 0;
    const reorderPoint = parseFloat(p.reorder_level) || 0;
    let status: ProductStatus = 'Available';
    if (totalStock === 0) status = 'Out of Stock';
    else if (totalStock <= reorderPoint) status = 'Low Stock';

    return {
      id: String(p.id),
      sku: p.sku,
      name: p.name,
      description: `${p.name} - ${p.category_name || 'Standard Item'}`,
      category: (p.category_name || 'Raw Materials') as Category,
      unit: p.unit_of_measure || 'units',
      totalStock,
      reorderPoint,
      maxCapacity: Math.max(reorderPoint * 5, 200),
      unitCost: 15.0,
      status,
      primaryLocation: p.locations?.[0]?.code || 'BIN-A-01',
      barcode: `SKU-${p.sku}`,
      vendorName: 'Direct Supplier',
      vendorId: 'VEN-01',
      leadTimeDays: 3,
    };
  };

  const mapBackendWarehouse = (w: any): Warehouse => ({
    id: String(w.id),
    code: w.code,
    name: w.name,
    address: w.address || 'Industrial District, Dock 1',
    status: w.status === 'ACTIVE' ? 'Operational' : 'Maintenance',
    totalCapacityCbm: 10000,
    utilizedCapacityCbm: 4200,
    totalBins: 40,
    activeBinsCount: 36,
    activeCapacityPercent: 42,
    zonesCount: 3,
    stagingBaysCount: 4,
    zones: ['Zone A', 'Zone B', 'Zone C'],
  });

  const mapBackendLocation = (l: any): Location => ({
    id: String(l.id),
    warehouseId: String(l.warehouse_id),
    warehouseCode: l.warehouse_code || 'WH-01',
    zone: 'Zone A',
    rack: l.code,
    code: l.code,
    locationType: 'Pallet Rack',
    maxWeightKg: 1500,
    currentWeightKg: 350,
    utilizationPercentage: 45,
    status: l.status === 'ACTIVE' ? 'Available' : 'Locked',
    storedItems: [],
  });

  const mapBackendReceipt = (r: any): Receipt => {
    let status: any = 'Draft';
    let step: 1 | 2 | 3 | 4 = 1;
    if (r.status === 'DONE') {
      status = 'Done';
      step = 4;
    } else if (r.status === 'READY') {
      status = 'Ready';
      step = 3;
    } else if (r.status === 'WAITING') {
      status = 'Waiting';
      step = 2;
    }

    const items = (r.items || []).map((it: any) => ({
      id: String(it.id || `ritm-${Math.random()}`),
      productId: String(it.product_id),
      sku: it.sku || '',
      productName: it.product_name || 'Product Item',
      unit: it.unit_of_measure || 'units',
      expectedQty: parseFloat(it.quantity) || 0,
      receivedQty: r.status === 'DONE' ? parseFloat(it.quantity) || 0 : 0,
      targetBin: it.location_code || r.location_code || 'BIN-A-01',
      status: (r.status === 'DONE' ? 'Matched' : 'Pending') as any,
    }));

    const totalQty = items.reduce((sum: number, it: any) => sum + it.expectedQty, 0);

    return {
      id: String(r.id),
      receiptNumber: r.receipt_number,
      poNumber: `PO-${r.receipt_number.replace(/[^0-9]/g, '') || r.id}`,
      supplier: r.supplier_name || 'Industrial Vendor',
      carrier: 'National Freight',
      bolNumber: `BOL-${r.id}`,
      stagedBay: r.location_code || 'Inbound Bay',
      warehouseId: String(r.warehouse_id),
      status,
      expectedDate: new Date(r.created_at).toLocaleDateString(),
      items,
      totalExpectedUnits: totalQty,
      totalReceivedUnits: r.status === 'DONE' ? totalQty : 0,
      step,
    };
  };

  const mapBackendDelivery = (d: any): Delivery => {
    let status: any = 'Draft';
    if (d.status === 'DONE') {
      status = 'Dispatched';
    } else if (d.stage === 'PACKED') {
      status = 'Packing & Staged';
    } else if (d.stage === 'PICKED') {
      status = 'In Picking';
    } else if (d.stage === 'PENDING') {
      status = 'Ready to Pick';
    }

    const items = (d.items || []).map((it: any) => ({
      id: String(it.id || `ditm-${Math.random()}`),
      productId: String(it.product_id),
      sku: it.sku || '',
      productName: it.product_name || 'Product Item',
      unit: it.unit_of_measure || 'units',
      requestedQty: parseFloat(it.quantity) || 0,
      pickedQty: d.stage === 'PICKED' || d.stage === 'PACKED' || d.status === 'DONE' ? parseFloat(it.quantity) || 0 : 0,
      allocatedBin: it.location_code || 'BIN-A-01',
      status: (d.status === 'DONE' ? 'Picked' : 'Pending') as any,
    }));

    const totalUnits = items.reduce((sum: number, it: any) => sum + it.requestedQty, 0);

    return {
      id: String(d.id),
      deliveryNumber: d.delivery_number,
      soNumber: `SO-${d.delivery_number.replace(/[^0-9]/g, '') || d.id}`,
      customerName: d.customer_name || 'Commercial Client',
      deliveryAddress: d.shipping_address || 'Distribution Terminal',
      carrier: 'Express Carrier',
      stagingBay: d.warehouse_code || 'Outbound Dock',
      warehouseId: String(d.warehouse_id),
      priority: 'Standard',
      status,
      createdDate: new Date(d.created_at).toLocaleDateString(),
      items,
      totalUnits,
    };
  };

  const mapBackendTransfer = (t: any): Transfer => {
    const items = (t.items || []).map((it: any) => ({
      id: String(it.id || `titm-${Math.random()}`),
      productId: String(it.product_id),
      sku: it.sku || '',
      productName: it.product_name || 'Product Item',
      unit: it.unit_of_measure || 'units',
      quantity: parseFloat(it.quantity) || 0,
      sourceLocation: t.source_location_code || `Location #${t.source_location_id}`,
      destinationLocation: t.destination_location_code || `Location #${t.destination_location_id}`,
      status: t.status === 'DONE' ? 'Completed' : 'Pending',
    }));

    const totalUnits = items.reduce((sum: number, it: any) => sum + it.quantity, 0);

    return {
      id: String(t.id),
      transferNumber: t.transfer_number,
      sourceWarehouseId: String(t.source_warehouse_id),
      destinationWarehouseId: String(t.destination_warehouse_id),
      sourceLocation: t.source_location_code || `Location #${t.source_location_id}`,
      destinationLocation: t.destination_location_code || `Location #${t.destination_location_id}`,
      status: t.status === 'DONE' ? 'Completed' : 'Draft',
      createdDate: new Date(t.created_at).toLocaleDateString(),
      priority: 'Normal',
      transferType: t.source_warehouse_id === t.destination_warehouse_id ? 'Intra-Warehouse' : 'Inter-Facility',
      items,
      totalUnits,
      reason: t.reason || '',
    };
  };

  const mapBackendAdjustment = (a: any): StockAdjustment => ({
    id: String(a.id),
    adjustmentNumber: a.adjustment_number,
    warehouseName: a.warehouse_name || 'North Hub',
    createdDate: new Date(a.created_at).toLocaleDateString(),
    status: a.status === 'APPLIED' ? 'Validated' : (a.status === 'CANCELED' ? 'Rejected' : 'Draft'),
    workflowStep: a.status === 'APPLIED' ? 6 : 1,
    reason: a.reason || 'Cycle count reconciliation',
    items: [
      {
        id: `aitm-${a.id}`,
        productId: String(a.product_id),
        sku: a.sku || '',
        productName: a.product_name || 'Product Item',
        location: a.location_code || 'BIN-A-01',
        recordedQty: parseFloat(a.recorded_quantity) || 0,
        physicalQty: parseFloat(a.counted_quantity) || 0,
        difference: parseFloat(a.difference) || 0,
        unit: a.unit_of_measure || 'units',
        reason: a.reason || 'Audit Reconciliation',
      },
    ],
  });

  const mapBackendMovement = (m: any): StockMovement => {
    let type: any = 'Transfer';
    if (m.movement_type === 'RECEIPT') type = 'Receipt';
    else if (m.movement_type === 'DELIVERY') type = 'Delivery';
    else if (m.movement_type === 'ADJUSTMENT') type = 'Adjustment';

    return {
      id: String(m.id),
      timestamp: new Date(m.created_at).toLocaleString(),
      type,
      referenceNumber:
        m.metadata?.receipt_number ||
        m.metadata?.delivery_number ||
        m.metadata?.adjustment_number ||
        `${m.reference_type}-${m.reference_id}`,
      productId: String(m.product_id),
      sku: m.sku || '',
      productName: m.product_name || 'Product Item',
      fromLocation: m.movement_type === 'RECEIPT' ? 'Vendor Delivery' : m.location_code,
      toLocation: m.movement_type === 'DELIVERY' ? 'Customer Gate' : m.location_code,
      quantityDelta: parseFloat(m.quantity_change) || 0,
      unit: m.unit_of_measure || 'units',
      balanceAfter: parseFloat(m.quantity_after) || 0,
      operator: m.user_name || 'Operator',
      notes: m.movement_type,
    };
  };

  // Re-fetch all domain datasets from real MySQL APIs
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        productsRes,
        warehousesRes,
        locationsRes,
        receiptsRes,
        deliveriesRes,
        transfersRes,
        adjustmentsRes,
        ledgerRes,
      ] = await Promise.all([
        productsApi.getAll().catch(() => []),
        warehousesApi.getAll().catch(() => []),
        locationsApi.getAll().catch(() => []),
        receiptsApi.getAll().catch(() => []),
        deliveriesApi.getAll().catch(() => []),
        transfersApi.getAll().catch(() => []),
        adjustmentsApi.getAll().catch(() => []),
        ledgerApi.getAll().catch(() => []),
      ]);

      setProducts((productsRes || []).map(mapBackendProduct));
      const mappedWarehouses = (warehousesRes || []).map(mapBackendWarehouse);
      setWarehouses(mappedWarehouses);
      if (mappedWarehouses.length > 0) {
        setSelectedWarehouseCode((prev) => {
          if (!prev || !mappedWarehouses.some((w: any) => w.code === prev)) {
            return mappedWarehouses[0].code;
          }
          return prev;
        });
      }
      setLocations((locationsRes || []).map(mapBackendLocation));
      setReceipts((receiptsRes || []).map(mapBackendReceipt));
      setDeliveries((deliveriesRes || []).map(mapBackendDelivery));
      setTransfers((transfersRes || []).map(mapBackendTransfer));
      setAdjustments((adjustmentsRes || []).map(mapBackendAdjustment));
      setMovements((ledgerRes || []).map(mapBackendMovement));
    } catch (err) {
      console.error('[StockSense Refresh Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Authentication Initialization on App Start
  useEffect(() => {
    let mounted = true;
    authApi
      .getMe()
      .then(async (res) => {
        if (mounted && res && res.user) {
          setUser({
            id: String(res.user.id),
            name: res.user.name,
            email: res.user.email,
            role: res.user.role === 'INVENTORY_MANAGER' ? 'Operations Manager' : 'Inventory Controller',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            facility: 'Main Logistics Hub',
            assignedWarehouse: 'WH-01',
          });
          await refreshData();
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsAuthLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [refreshData]);

  // Auth Actions
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authApi.login({ email, password: pass });
      const u = res?.user || { id: 1, name: 'Operator', email, role: 'INVENTORY_MANAGER' };
      setUser({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role === 'INVENTORY_MANAGER' ? 'Operations Manager' : 'Inventory Controller',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        facility: 'Main Logistics Hub',
        assignedWarehouse: 'WH-01',
      });
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Authentication failed.' };
    }
  };

  const signup = async (
    name: string,
    email: string,
    role: string,
    password = 'enterprise2024'
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authApi.signup({
        name,
        email,
        password,
        role: role.toUpperCase().includes('STAFF') ? 'WAREHOUSE_STAFF' : 'INVENTORY_MANAGER',
      });
      const u = res?.user || { id: 2, name, email, role: 'INVENTORY_MANAGER' };
      setUser({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role === 'INVENTORY_MANAGER' ? 'Operations Manager' : 'Inventory Controller',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        facility: 'Main Logistics Hub',
        assignedWarehouse: 'WH-01',
      });
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    }
    setUser(null);
    setProducts([]);
    setWarehouses([]);
    setLocations([]);
    setReceipts([]);
    setDeliveries([]);
    setTransfers([]);
    setAdjustments([]);
    setMovements([]);
  };

  const updateProfile = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  // =========================================================================
  // Transactional Inventory Actions
  // =========================================================================

  // 1. Inbound Receipts
  const validateReceipt = async (receiptId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await receiptsApi.validate(receiptId);
      await refreshData();
      return { success: true, message: res?.message || 'Receipt validated and inventory posted.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Receipt validation failed.' };
    }
  };

  const createReceipt = async (newReceipt: Omit<Receipt, 'id' | 'receiptNumber'>): Promise<Receipt> => {
    const targetWh = warehouses.find((w) => w.id === newReceipt.warehouseId || w.code === newReceipt.warehouseId) || warehouses[0];
    const targetLoc = locations.find((l) => l.warehouseId === targetWh?.id) || locations[0];

    const items = (newReceipt.items || []).map((it) => {
      const prod = products.find((p) => p.id === it.productId || p.sku === it.sku) || products[0];
      return {
        product_id: parseInt(prod?.id || '1', 10),
        quantity: it.expectedQty || 1,
      };
    });

    const res = await receiptsApi.create({
      supplier_name: newReceipt.supplier,
      warehouse_id: parseInt(targetWh?.id || '1', 10),
      location_id: parseInt(targetLoc?.id || '1', 10),
      items: items.length > 0 ? items : [{ product_id: parseInt(products[0]?.id || '1', 10), quantity: 10 }],
    });

    await refreshData();
    return mapBackendReceipt(res);
  };

  // 2. Deliveries
  const pickDelivery = async (deliveryId: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deliveriesApi.pick(deliveryId);
      await refreshData();
      return { success: true, message: 'Delivery moved to PICKED stage.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Pick action failed.' };
    }
  };

  const dispatchDelivery = async (deliveryId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // If delivery is in PENDING, advance through pick & pack first
      const d = deliveries.find((x) => x.id === deliveryId);
      if (d && d.status === 'Ready to Pick') {
        await deliveriesApi.pick(deliveryId);
        await deliveriesApi.pack(deliveryId);
      } else if (d && d.status === 'In Picking') {
        await deliveriesApi.pack(deliveryId);
      }

      const res = await deliveriesApi.validate(deliveryId);
      await refreshData();
      return { success: true, message: res?.message || 'Delivery validated and dispatched.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Fulfillment validation failed.' };
    }
  };

  const createDelivery = async (newDelivery: Omit<Delivery, 'id' | 'deliveryNumber'>): Promise<Delivery> => {
    const targetWh = warehouses.find((w) => w.id === newDelivery.warehouseId || w.code === newDelivery.warehouseId) || warehouses[0];
    const targetLoc = locations.find((l) => l.warehouseId === targetWh?.id) || locations[0];

    const items = (newDelivery.items || []).map((it) => {
      const prod = products.find((p) => p.id === it.productId || p.sku === it.sku) || products[0];
      return {
        product_id: parseInt(prod.id, 10),
        location_id: parseInt(targetLoc?.id || '1', 10),
        quantity: it.requestedQty || 1,
      };
    });

    const res = await deliveriesApi.create({
      customer_name: newDelivery.customerName,
      shipping_address: newDelivery.deliveryAddress,
      warehouse_id: parseInt(targetWh?.id || '1', 10),
      items: items.length > 0 ? items : [{ product_id: parseInt(products[0]?.id || '1', 10), location_id: parseInt(targetLoc?.id || '1', 10), quantity: 5 }],
    });

    await refreshData();
    return mapBackendDelivery(res);
  };

  // 3. Transfers
  const completeTransfer = async (transferId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await transfersApi.validate(transferId);
      await refreshData();
      return { success: true, message: res?.message || 'Transfer completed successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Transfer validation failed.' };
    }
  };

  const createTransfer = async (
    newTransfer: Omit<Transfer, 'id' | 'transferNumber' | 'status' | 'createdDate'>
  ): Promise<Transfer> => {
    const srcLoc = locations.find((l) => l.code === newTransfer.sourceLocation || l.id === newTransfer.sourceLocation) || locations[0];
    const destLoc = locations.find((l) => l.code === newTransfer.destinationLocation || l.id === newTransfer.destinationLocation) || locations[1] || locations[0];

    const items = (newTransfer.items || []).map((it) => {
      const prod = products.find((p) => p.id === it.productId || p.sku === it.sku) || products[0];
      return {
        product_id: parseInt(prod.id, 10),
        quantity: it.quantity || 1,
      };
    });

    const res = await transfersApi.create({
      source_location_id: parseInt(srcLoc?.id || '1', 10),
      destination_location_id: parseInt(destLoc?.id || '2', 10),
      reason: newTransfer.reason || 'Rebalance',
      items: items.length > 0 ? items : [{ product_id: parseInt(products[0]?.id || '1', 10), quantity: 5 }],
    });

    await refreshData();
    return mapBackendTransfer(res);
  };

  // 4. Adjustments
  const applyAdjustment = async (adjustmentId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await adjustmentsApi.apply(adjustmentId);
      await refreshData();
      return { success: true, message: res?.message || 'Stock adjustment applied. Inventory reconciled.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Adjustment application failed.' };
    }
  };

  const createAdjustment = async (
    newAdj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'status' | 'createdDate' | 'workflowStep'>
  ): Promise<StockAdjustment> => {
    const firstItem = newAdj.items?.[0];
    const prod = products.find((p) => p.id === firstItem?.productId || p.sku === firstItem?.sku) || products[0];
    const loc = locations.find((l) => l.code === firstItem?.location || l.id === firstItem?.location) || locations[0];

    const res = await adjustmentsApi.create({
      product_id: parseInt(prod?.id || '1', 10),
      location_id: parseInt(loc?.id || '1', 10),
      counted_quantity: firstItem?.physicalQty !== undefined ? firstItem.physicalQty : 100,
      reason: newAdj.reason || firstItem?.reason || 'Physical cycle count',
    });

    await refreshData();
    return mapBackendAdjustment(res);
  };

  // 5. Products & Facilities
  const createProduct = async (newProduct: any): Promise<Product> => {
    const categories = await categoriesApi.getAll().catch(() => []);
    let categoryId = categories[0]?.id || 1;
    if (newProduct.category) {
      const match = categories.find((c: any) => c.name.toLowerCase() === newProduct.category.toLowerCase());
      if (match) categoryId = match.id;
    }

    const firstLoc = locations[0];

    const res = await productsApi.create({
      name: newProduct.name,
      sku: newProduct.sku,
      category_id: categoryId,
      unit_of_measure: newProduct.unit || 'units',
      reorder_level: Number(newProduct.reorderPoint) || 0,
      initial_stock: Number(newProduct.totalStock) || 0,
      initial_location_id: firstLoc ? parseInt(firstLoc.id, 10) : undefined,
    });

    await refreshData();
    return mapBackendProduct(res);
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    await productsApi.update(id, {
      name: updates.name,
      unit_of_measure: updates.unit,
      reorder_level: updates.reorderPoint,
      status: updates.status === 'Out of Stock' ? 'OUT_OF_STOCK' : 'ACTIVE',
    });
    await refreshData();
  };

  const addWarehouse = async (newWh: Omit<Warehouse, 'id'>): Promise<Warehouse> => {
    const res = await warehousesApi.create({
      name: newWh.name,
      code: newWh.code,
      address: newWh.address,
    });
    await refreshData();
    return mapBackendWarehouse(res);
  };

  const addLocation = async (newLoc: Omit<Location, 'id'>): Promise<Location> => {
    const targetWh = warehouses.find((w) => w.code === newLoc.warehouseCode || w.id === newLoc.warehouseId) || warehouses[0];
    const res = await locationsApi.create({
      warehouse_id: parseInt(targetWh?.id || '1', 10),
      name: newLoc.code,
      code: newLoc.code,
    });
    await refreshData();
    return mapBackendLocation(res);
  };

  return (
    <InventoryContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAuthLoading,
        login,
        signup,
        logout,
        updateProfile,

        selectedWarehouseCode,
        setSelectedWarehouseCode,

        warehouses,
        locations,
        products,
        receipts,
        deliveries,
        transfers,
        adjustments,
        movements,
        isLoading,
        refreshData,

        toasts,
        addToast,
        removeToast,

        validateReceipt,
        createReceipt,

        pickDelivery,
        dispatchDelivery,
        createDelivery,

        completeTransfer,
        createTransfer,

        applyAdjustment,
        createAdjustment,

        createProduct,
        updateProduct,
        addWarehouse,
        addLocation,

        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
