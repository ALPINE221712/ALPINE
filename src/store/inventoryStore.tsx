import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types';
import {
  mockCurrentUser,
  mockWarehouses,
  mockLocations,
  mockProducts,
  mockReceipts,
  mockDeliveries,
  mockTransfers,
  mockAdjustments,
  mockStockMovements,
} from '../data/mockData';

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
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, role: string) => boolean;
  logout: () => void;
  updateProfile: (updated: Partial<User>) => void;

  // Selected facility
  selectedWarehouseCode: string;
  setSelectedWarehouseCode: (code: string) => void;

  // Domain data
  warehouses: Warehouse[];
  locations: Location[];
  products: Product[];
  receipts: Receipt[];
  deliveries: Delivery[];
  transfers: Transfer[];
  adjustments: StockAdjustment[];
  movements: StockMovement[];

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Business Logic Actions
  // 1. Receipts
  validateReceipt: (receiptId: string) => { success: boolean; message: string };
  createReceipt: (newReceipt: Omit<Receipt, 'id' | 'receiptNumber'>) => Receipt;

  // 2. Deliveries
  pickDelivery: (deliveryId: string) => { success: boolean; message: string };
  dispatchDelivery: (deliveryId: string) => { success: boolean; message: string };
  createDelivery: (newDelivery: Omit<Delivery, 'id' | 'deliveryNumber'>) => Delivery;

  // 3. Transfers
  completeTransfer: (transferId: string) => { success: boolean; message: string };
  createTransfer: (newTransfer: Omit<Transfer, 'id' | 'transferNumber' | 'status' | 'createdDate'>) => Transfer;

  // 4. Adjustments
  applyAdjustment: (adjustmentId: string) => { success: boolean; message: string };
  createAdjustment: (newAdj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'status' | 'createdDate' | 'workflowStep'>) => StockAdjustment;

  // 5. Products & Facilities
  createProduct: (newProduct: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addWarehouse: (newWh: Omit<Warehouse, 'id'>) => Warehouse;
  addLocation: (newLoc: Omit<Location, 'id'>) => Location;

  // Global Command Palette state
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEYS = {
  USER: 'stocksense_user',
  PRODUCTS: 'stocksense_products',
  WAREHOUSES: 'stocksense_warehouses',
  LOCATIONS: 'stocksense_locations',
  RECEIPTS: 'stocksense_receipts',
  DELIVERIES: 'stocksense_deliveries',
  TRANSFERS: 'stocksense_transfers',
  ADJUSTMENTS: 'stocksense_adjustments',
  MOVEMENTS: 'stocksense_movements',
  SELECTED_WH: 'stocksense_selected_wh',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : mockCurrentUser;
  });

  const isAuthenticated = Boolean(user);

  // Selected warehouse
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_WH) || 'WH-01';
  });

  // Entities
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : mockWarehouses;
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return saved ? JSON.parse(saved) : mockLocations;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : mockProducts;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    return saved ? JSON.parse(saved) : mockReceipts;
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    return saved ? JSON.parse(saved) : mockDeliveries;
  });

  const [transfers, setTransfers] = useState<Transfer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return saved ? JSON.parse(saved) : mockTransfers;
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    return saved ? JSON.parse(saved) : mockAdjustments;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : mockStockMovements;
  });

  // Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_WH, selectedWarehouseCode);
  }, [selectedWarehouseCode]);

  // Auth operations
  const login = (email: string, pass: string): boolean => {
    if (!email || !pass) return false;
    const authedUser: User = {
      ...mockCurrentUser,
      email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    };
    setUser(authedUser);
    addToast({
      type: 'success',
      title: 'Authenticated Successfully',
      message: `Welcome back, ${authedUser.name}. Connected to ${authedUser.facility}.`,
    });
    return true;
  };

  const signup = (name: string, email: string, role: string): boolean => {
    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role: (role as any) || 'Operations Manager',
      avatarUrl: mockCurrentUser.avatarUrl,
      facility: 'WH-01 Main Facility',
    };
    setUser(newUser);
    addToast({
      type: 'success',
      title: 'Account Created',
      message: `StockSense workspace initialized for ${newUser.name}.`,
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    addToast({
      type: 'info',
      title: 'Session Ended',
      message: 'You have been securely signed out of StockSense IMS.',
    });
  };

  const updateProfile = (updated: Partial<User>) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'User credentials and notification preferences saved.',
    });
  };

  // Helper to re-evaluate product status based on stock & threshold
  const evaluateProductStatus = (stock: number, reorderPoint: number): 'Available' | 'Low Stock' | 'Out of Stock' => {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorderPoint) return 'Low Stock';
    return 'Available';
  };

  // 1. BUSINESS LOGIC: Receipts
  const validateReceipt = (receiptId: string): { success: boolean; message: string } => {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) return { success: false, message: 'Receipt not found' };
    if (receipt.status === 'Done') return { success: false, message: 'Receipt is already validated and posted' };

    const newMovements: StockMovement[] = [];
    const updatedProducts = [...products];

    // For each item in receipt, update product inventory and create movement log
    for (const item of receipt.items) {
      const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId || p.sku === item.sku);
      const unitsToAdd = item.receivedQty || item.expectedQty;

      if (prodIndex >= 0) {
        const prod = updatedProducts[prodIndex];
        const newStock = prod.totalStock + unitsToAdd;
        const newStatus = evaluateProductStatus(newStock, prod.reorderPoint);

        updatedProducts[prodIndex] = {
          ...prod,
          totalStock: newStock,
          status: newStatus,
        };

        newMovements.push({
          id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: 'Just now',
          type: 'Receipt',
          referenceNumber: receipt.receiptNumber,
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          fromLocation: `Vendor: ${receipt.supplier}`,
          toLocation: item.targetBin || prod.primaryLocation,
          quantityDelta: unitsToAdd,
          unit: prod.unit,
          balanceAfter: newStock,
          operator: user?.name || 'Marcus Vance',
          notes: `PO: ${receipt.poNumber} verified and stocked into ${item.targetBin || prod.primaryLocation}`,
        });
      }
    }

    setProducts(updatedProducts);
    setMovements((prev) => [...newMovements, ...prev]);

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId
          ? {
              ...r,
              status: 'Done',
              step: 4,
              receivedDate: 'Just now',
              receivedBy: user?.name || 'Marcus Vance',
            }
          : r
      )
    );

    addToast({
      type: 'success',
      title: 'Receipt Validated & Stock Updated',
      message: `${receipt.receiptNumber} inventory allocated. ${newMovements.length} ledger movements recorded.`,
    });

    return { success: true, message: 'Receipt validated and posted to stock ledger' };
  };

  const createReceipt = (newReceipt: Omit<Receipt, 'id' | 'receiptNumber'>): Receipt => {
    const nextId = `REC-${String(receipts.length + 1).padStart(3, '0')}`;
    const nextNum = `REC-2024-${String(990 + receipts.length).padStart(4, '0')}`;
    const created: Receipt = {
      ...newReceipt,
      id: nextId,
      receiptNumber: nextNum,
      step: 1,
      status: 'Ready',
    };

    setReceipts((prev) => [created, ...prev]);
    addToast({
      type: 'success',
      title: 'Receipt Created',
      message: `Inbound shipment ${created.receiptNumber} registered under PO ${created.poNumber}.`,
    });
    return created;
  };

  // 2. BUSINESS LOGIC: Delivery Orders & Dispatch Guard
  const pickDelivery = (deliveryId: string): { success: boolean; message: string } => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return { success: false, message: 'Delivery order not found' };

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: 'Packing & Staged',
              items: d.items.map((it) => ({ ...it, pickedQty: it.requestedQty, status: 'Picked' })),
            }
          : d
      )
    );

    addToast({
      type: 'info',
      title: 'Picking Complete',
      message: `Order ${delivery.deliveryNumber} moved to packing and staged for carrier loading.`,
    });

    return { success: true, message: 'Order picked and staged' };
  };

  const dispatchDelivery = (deliveryId: string): { success: boolean; message: string } => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return { success: false, message: 'Delivery not found' };
    if (delivery.status === 'Dispatched') return { success: false, message: 'Order already dispatched' };

    // DISPATCH GUARD: check for sufficient inventory to prevent negative stock!
    const updatedProducts = [...products];
    const newMovements: StockMovement[] = [];

    for (const item of delivery.items) {
      const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId || p.sku === item.sku);
      if (prodIndex >= 0) {
        const prod = updatedProducts[prodIndex];
        if (prod.totalStock < item.requestedQty) {
          // DISPATCH GUARD VIOLATION!
          addToast({
            type: 'error',
            title: 'Dispatch Guard Blocked Order',
            message: `Insufficient stock for ${prod.sku} (${prod.name}). Available: ${prod.totalStock}, Requested: ${item.requestedQty}. Negative stock prevented!`,
          });
          return {
            success: false,
            message: `Dispatch Guard: Insufficient stock for ${prod.sku}. Available: ${prod.totalStock}`,
          };
        }

        const newStock = prod.totalStock - item.requestedQty;
        const newStatus = evaluateProductStatus(newStock, prod.reorderPoint);

        updatedProducts[prodIndex] = {
          ...prod,
          totalStock: newStock,
          status: newStatus,
        };

        newMovements.push({
          id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: 'Just now',
          type: 'Delivery',
          referenceNumber: delivery.deliveryNumber,
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          fromLocation: item.allocatedBin || prod.primaryLocation,
          toLocation: `${delivery.customerName} (${delivery.stagingBay})`,
          quantityDelta: -item.requestedQty,
          unit: prod.unit,
          balanceAfter: newStock,
          operator: user?.name || 'Marcus Vance',
          notes: `SO: ${delivery.soNumber} outbound dispatch. Carrier: ${delivery.carrier}`,
        });
      }
    }

    setProducts(updatedProducts);
    setMovements((prev) => [...newMovements, ...prev]);

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              status: 'Dispatched',
              dispatchDate: 'Just now',
            }
          : d
      )
    );

    addToast({
      type: 'success',
      title: 'Order Dispatched Successfully',
      message: `${delivery.deliveryNumber} dispatched. Inventory deducted and logged in Move History.`,
    });

    return { success: true, message: 'Order dispatched successfully' };
  };

  const createDelivery = (newDelivery: Omit<Delivery, 'id' | 'deliveryNumber'>): Delivery => {
    const nextId = `DEL-${String(deliveries.length + 1).padStart(3, '0')}`;
    const nextNum = `DEL-2024-${String(1105 + deliveries.length).padStart(4, '0')}`;
    const created: Delivery = {
      ...newDelivery,
      id: nextId,
      deliveryNumber: nextNum,
      status: 'Ready to Pick',
      createdDate: 'Just now',
    };

    setDeliveries((prev) => [created, ...prev]);
    addToast({
      type: 'success',
      title: 'Delivery Order Created',
      message: `Outbound order ${created.deliveryNumber} queued for customer ${created.customerName}.`,
    });
    return created;
  };

  // 3. BUSINESS LOGIC: Internal Transfers (Stock Relocation Principle)
  const completeTransfer = (transferId: string): { success: boolean; message: string } => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return { success: false, message: 'Transfer not found' };
    if (transfer.status === 'Completed') return { success: false, message: 'Transfer already completed' };

    const newMovements: StockMovement[] = [];

    // The Stock Relocation Principle:
    // Move from source location to destination location.
    // Total enterprise inventory units & valuation remain identical!
    for (const item of transfer.items) {
      const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
      newMovements.push({
        id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: 'Just now',
        type: 'Transfer',
        referenceNumber: transfer.transferNumber,
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        fromLocation: item.sourceLocation,
        toLocation: item.destinationLocation,
        quantityDelta: item.quantity,
        unit: item.unit,
        balanceAfter: prod ? prod.totalStock : 0, // Unchanged enterprise balance
        operator: user?.name || 'Marcus Vance',
        notes: `Relocation from ${item.sourceLocation} to ${item.destinationLocation}. Net enterprise stock unchanged.`,
      });
    }

    setMovements((prev) => [...newMovements, ...prev]);

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'Completed',
              completedDate: 'Just now',
            }
          : t
      )
    );

    addToast({
      type: 'success',
      title: 'Transfer Completed',
      message: `${transfer.transferNumber} items successfully relocated to ${transfer.destinationLocation}.`,
    });

    return { success: true, message: 'Transfer completed and logged' };
  };

  const createTransfer = (newTransfer: Omit<Transfer, 'id' | 'transferNumber' | 'status' | 'createdDate'>): Transfer => {
    const nextId = `TR-${String(transfers.length + 1).padStart(3, '0')}`;
    const nextNum = `TR-2024-${String(46 + transfers.length).padStart(4, '0')}`;
    const created: Transfer = {
      ...newTransfer,
      id: nextId,
      transferNumber: nextNum,
      status: 'Ready to Move',
      createdDate: 'Just now',
    };

    setTransfers((prev) => [created, ...prev]);
    addToast({
      type: 'success',
      title: 'Transfer Order Created',
      message: `Relocation ticket ${created.transferNumber} scheduled from ${created.sourceLocation}.`,
    });
    return created;
  };

  // 4. BUSINESS LOGIC: Stock Adjustments (Cycle Counts & Reconciliation)
  const applyAdjustment = (adjustmentId: string): { success: boolean; message: string } => {
    const adj = adjustments.find((a) => a.id === adjustmentId);
    if (!adj) return { success: false, message: 'Adjustment not found' };
    if (adj.status === 'Validated') return { success: false, message: 'Adjustment is already applied and validated' };

    const updatedProducts = [...products];
    const newMovements: StockMovement[] = [];

    for (const item of adj.items) {
      const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId || p.sku === item.sku);
      if (prodIndex >= 0) {
        const prod = updatedProducts[prodIndex];
        // Apply adjustment: set totalStock to the physical count!
        const newStock = item.physicalQty;
        const newStatus = evaluateProductStatus(newStock, prod.reorderPoint);

        updatedProducts[prodIndex] = {
          ...prod,
          totalStock: newStock,
          status: newStatus,
        };

        newMovements.push({
          id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: 'Just now',
          type: 'Adjustment',
          referenceNumber: adj.adjustmentNumber,
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          fromLocation: item.location,
          toLocation: 'Inventory Reconciliation',
          quantityDelta: item.difference, // e.g. -3 or +15
          unit: prod.unit,
          balanceAfter: newStock,
          operator: user?.name || 'Marcus Vance',
          notes: `Physical cycle count adjustment: ${item.reason}. Difference: ${item.difference} ${prod.unit}`,
        });
      }
    }

    setProducts(updatedProducts);
    setMovements((prev) => [...newMovements, ...prev]);

    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjustmentId
          ? {
              ...a,
              status: 'Validated',
              workflowStep: 6, // Step 6 of 6: Logged
            }
          : a
      )
    );

    addToast({
      type: 'success',
      title: 'Stock Adjustment Applied',
      message: `${adj.adjustmentNumber} reconciled. On-hand balances updated to physical count.`,
    });

    return { success: true, message: 'Adjustment applied and balances updated' };
  };

  const createAdjustment = (newAdj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'status' | 'createdDate' | 'workflowStep'>): StockAdjustment => {
    const nextId = `ADJ-${String(adjustments.length + 1).padStart(3, '0')}`;
    const nextNum = `ADJ-2024-${String(20 + adjustments.length).padStart(4, '0')}`;
    const created: StockAdjustment = {
      ...newAdj,
      id: nextId,
      adjustmentNumber: nextNum,
      status: 'Pending Approval',
      workflowStep: 4,
      createdDate: 'Just now',
    };

    setAdjustments((prev) => [created, ...prev]);
    addToast({
      type: 'success',
      title: 'Cycle Count Recorded',
      message: `Adjustment session ${created.adjustmentNumber} submitted for manager verification.`,
    });
    return created;
  };

  // 5. Products & Facilities
  const createProduct = (newProduct: Omit<Product, 'id'>): Product => {
    const nextId = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    const created: Product = {
      ...newProduct,
      id: nextId,
      status: evaluateProductStatus(newProduct.totalStock, newProduct.reorderPoint),
    };

    setProducts((prev) => [created, ...prev]);
    addToast({
      type: 'success',
      title: 'Product Added to Catalog',
      message: `${created.sku} (${created.name}) successfully registered.`,
    });
    return created;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          updated.status = evaluateProductStatus(updated.totalStock, updated.reorderPoint);
          return updated;
        }
        return p;
      })
    );
    addToast({
      type: 'success',
      title: 'Product Updated',
      message: 'Master specifications and threshold parameters saved.',
    });
  };

  const addWarehouse = (newWh: Omit<Warehouse, 'id'>): Warehouse => {
    const id = newWh.code;
    const created: Warehouse = { ...newWh, id };
    setWarehouses((prev) => [...prev, created]);
    addToast({
      type: 'success',
      title: 'Warehouse Facility Added',
      message: `${created.code} (${created.name}) operational node registered.`,
    });
    return created;
  };

  const addLocation = (newLoc: Omit<Location, 'id'>): Location => {
    const id = `LOC-${String(locations.length + 1).padStart(2, '0')}`;
    const created: Location = { ...newLoc, id };
    setLocations((prev) => [...prev, created]);
    addToast({
      type: 'success',
      title: 'Storage Location Configured',
      message: `Bin coordinate ${created.binCode} added to ${created.warehouseCode}.`,
    });
    return created;
  };

  return (
    <InventoryContext.Provider
      value={{
        user,
        isAuthenticated,
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
