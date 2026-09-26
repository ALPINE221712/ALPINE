export type Role = 'Operations Manager' | 'Warehouse Lead' | 'Inventory Controller' | 'Logistics Dispatcher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  avatarUrl: string;
  facility: string;
  assignedWarehouse?: string;
}

export type Category = 'Raw Materials' | 'Electrical' | 'Fasteners' | 'Safety Equipment' | 'Finished Goods' | 'Packaging';

export type ProductStatus = 'Available' | 'Low Stock' | 'Out of Stock' | 'On Order';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: Category;
  unit: string;
  totalStock: number;
  reorderPoint: number;
  maxCapacity: number;
  unitCost: number;
  status: ProductStatus;
  primaryLocation: string;
  barcode: string;
  vendorName: string;
  vendorId: string;
  leadTimeDays: number;
  imageUrl?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string;
  totalBins?: number;
  activeCapacityPercent?: number;
  zonesCount?: number;
  stagingBaysCount?: number;
  address: string;
  status?: 'Operational' | 'Maintenance';
  totalCapacityCbm: number;
  utilizedCapacityCbm: number;
  manager?: string;
  contact?: string;
  type?: string;
  zones?: string[];
  activeBinsCount?: number;
}

export interface LocationStoredItem {
  sku: string;
  productName: string;
  quantity: number;
}

export interface Location {
  id: string;
  warehouseId?: string;
  warehouseCode: string;
  zone: string;
  aisle?: string;
  rack: string;
  shelf?: string;
  shelfTier?: string;
  bin?: string;
  code: string; // e.g. WH-01-A-01-B01
  binCode?: string;
  type?: string;
  locationType: string;
  maxWeightKg: number;
  currentWeightKg: number;
  capacityLoadPercent?: number;
  utilizationPercentage: number;
  status: 'Optimal' | 'Near Limit' | 'Critical' | 'Empty' | 'Available' | 'Locked';
  assignedProductIds?: string[];
  storedItems: LocationStoredItem[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  binCode: string;
  onHand: number;
  reserved: number;
  available: number;
  lotNumber?: string;
  lastUpdated: string;
}

export type ReceiptStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export interface ReceiptItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  expectedQty: number;
  receivedQty: number;
  targetBin: string;
  status: 'Pending' | 'Matched' | 'Shortage' | 'Over';
  lotNumber?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. REC-2024-0989
  poNumber: string;      // e.g. PO-77834
  supplier: string;
  carrier: string;
  bolNumber: string;
  stagedBay: string;
  warehouseId: string;
  status: ReceiptStatus;
  expectedDate: string;
  receivedDate?: string;
  receivedBy?: string;
  items: ReceiptItem[];
  totalExpectedUnits: number;
  totalReceivedUnits: number;
  step: 1 | 2 | 3 | 4; // 1: Arrived, 2: Count & QC, 3: Putaway, 4: Posted
  notes?: string;
  hasDiscrepancy?: boolean;
}

export type DeliveryStatus = 'Draft' | 'Ready to Pick' | 'In Picking' | 'Packing & Staged' | 'Dispatched' | 'On Hold' | 'Canceled';

export interface DeliveryItem {
  id?: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  requestedQty: number;
  pickedQty: number;
  allocatedBin: string;
  status: 'Pending' | 'Picked' | 'Insufficient Stock';
}

export interface Delivery {
  id: string;
  deliveryNumber: string; // e.g. DEL-2024-1104
  soNumber: string;       // e.g. SO-88214
  customerName: string;
  deliveryAddress: string;
  carrier: string;
  carrierTracking?: string;
  stagingBay: string;
  warehouseId: string;
  priority: 'Standard' | 'Rush Priority' | 'Urgent';
  status: DeliveryStatus;
  createdDate: string;
  dispatchDate?: string;
  items: DeliveryItem[];
  totalUnits: number;
  notes?: string;
}

export type TransferStatus = 'Draft' | 'Ready to Move' | 'In-Transit' | 'Completed' | 'Canceled';

export interface TransferItem {
  id?: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  quantity: number;
  sourceLocation: string;
  destinationLocation: string;
  status?: string;
}

export interface Transfer {
  id: string;
  transferNumber: string; // e.g. TR-2024-0044
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  sourceLocation: string;
  destinationLocation: string;
  status: TransferStatus;
  createdDate: string;
  completedDate?: string;
  initiatedBy?: string;
  items: TransferItem[];
  totalUnits?: number;
  notes?: string;
  reason?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  transferType: 'Intra-Warehouse' | 'Inter-Facility';
  vehicleMethod?: string;
  assignedHandler?: string;
}

export type AdjustmentStatus = 'Draft' | 'Pending Approval' | 'Validated' | 'Rejected';

export interface AdjustmentItem {
  id?: string;
  productId: string;
  sku: string;
  productName: string;
  location: string;
  recordedQty: number;
  physicalQty: number;
  difference: number;
  unit: string;
  unitCost?: number;
  differenceValuation?: number;
  costImpact?: number;
  reason: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string; // e.g. ADJ-2024-0019
  warehouseId?: string;
  warehouseCode?: string;
  warehouseName: string;
  locationArea?: string;
  initiatedBy?: string;
  operator?: string;
  createdDate: string;
  status: AdjustmentStatus;
  items: AdjustmentItem[];
  totalRecordedQty?: number;
  totalPhysicalQty?: number;
  netDifferenceQty?: number;
  netDifferenceValuation?: number;
  workflowStep: number; // 1-6
  notes?: string;
  reason: string;
}

export type MovementType = 'Receipt' | 'Delivery' | 'Transfer' | 'Adjustment' | 'Scrap';

export interface StockMovement {
  id: string;
  timestamp: string;
  type: MovementType;
  referenceNumber: string; // e.g. REC-2024-0891, DEL-2024-1104
  productId: string;
  sku: string;
  productName: string;
  fromLocation: string;
  toLocation: string;
  quantityDelta: number; // +400, -220, etc.
  unit: string;
  balanceAfter: number;
  operator: string;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
