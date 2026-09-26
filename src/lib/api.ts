/**
 * StockSense Enterprise IMS — Unified API Client
 *
 * Centralized communication layer interfacing with the Express/MySQL backend.
 * Uses VITE_API_URL and enforces credentials: 'include' for HttpOnly cookie sessions.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Send HttpOnly session cookie
  });

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      `HTTP error ${response.status}: ${response.statusText || 'Request failed'}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return (data?.data !== undefined ? data.data : data) as T;
}

export const api = {
  get<T>(endpoint: string, params?: RequestOptions['params']) {
    return request<T>(endpoint, { method: 'GET', params });
  },

  post<T>(endpoint: string, body?: any) {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any) {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

// ==========================================
// Domain-Specific API Services
// ==========================================

export const authApi = {
  login(credentials: { email: string; password: string }) {
    return api.post<{ user: any }>('/auth/login', credentials);
  },

  signup(userData: { name: string; email: string; password: string; role?: string }) {
    return api.post<{ user: any }>('/auth/signup', userData);
  },

  logout() {
    return api.post('/auth/logout');
  },

  getMe() {
    return api.get<{ user: any }>('/auth/me');
  },

  forgotPassword(email: string) {
    return api.post<{ message: string; dev_otp?: string }>('/auth/forgot-password', { email });
  },

  verifyOtp(email: string, otp: string) {
    return api.post('/auth/verify-otp', { email, otp });
  },

  resetPassword(payload: { email: string; otp: string; new_password: string }) {
    return api.post('/auth/reset-password', payload);
  },
};

export const productsApi = {
  getAll(params?: { category_id?: number; search?: string; status?: string }) {
    return api.get<any[]>('/products', params);
  },

  getById(id: string | number) {
    return api.get<any>(`/products/${id}`);
  },

  create(payload: {
    name: string;
    sku: string;
    category_id: number;
    unit_of_measure?: string;
    reorder_level?: number;
    initial_stock?: number;
    initial_location_id?: number;
  }) {
    return api.post<any>('/products', payload);
  },

  update(id: string | number, payload: Partial<{
    name: string;
    category_id: number;
    unit_of_measure: string;
    reorder_level: number;
    status: string;
  }>) {
    return api.put<any>(`/products/${id}`, payload);
  },

  delete(id: string | number) {
    return api.delete<any>(`/products/${id}`);
  },
};

export const categoriesApi = {
  getAll() {
    return api.get<any[]>('/categories');
  },

  create(payload: { name: string; description?: string }) {
    return api.post<any>('/categories', payload);
  },

  update(id: string | number, payload: { name: string; description?: string }) {
    return api.put<any>(`/categories/${id}`, payload);
  },

  delete(id: string | number) {
    return api.delete<any>(`/categories/${id}`);
  },
};

export const warehousesApi = {
  getAll() {
    return api.get<any[]>('/warehouses');
  },

  getById(id: string | number) {
    return api.get<any>(`/warehouses/${id}`);
  },

  create(payload: { name: string; code: string; address?: string }) {
    return api.post<any>('/warehouses', payload);
  },

  update(id: string | number, payload: { name?: string; code?: string; address?: string; status?: string }) {
    return api.put<any>(`/warehouses/${id}`, payload);
  },

  delete(id: string | number) {
    return api.delete<any>(`/warehouses/${id}`);
  },
};

export const locationsApi = {
  getAll(params?: { warehouse_id?: number; status?: string }) {
    return api.get<any[]>('/locations', params);
  },

  getById(id: string | number) {
    return api.get<any>(`/locations/${id}`);
  },

  create(payload: { warehouse_id: number; name: string; code: string }) {
    return api.post<any>('/locations', payload);
  },

  update(id: string | number, payload: { name?: string; code?: string; status?: string }) {
    return api.put<any>(`/locations/${id}`, payload);
  },

  delete(id: string | number) {
    return api.delete<any>(`/locations/${id}`);
  },
};

export const inventoryApi = {
  getAll() {
    return api.get<any[]>('/inventory');
  },

  getByProduct(productId: string | number) {
    return api.get<any>(`/inventory/product/${productId}`);
  },

  getByLocation(locationId: string | number) {
    return api.get<any>(`/inventory/location/${locationId}`);
  },

  getLowStock() {
    return api.get<any[]>('/inventory/low-stock');
  },
};

export const receiptsApi = {
  getAll(params?: { warehouse_id?: number; status?: string; search?: string }) {
    return api.get<any[]>('/receipts', params);
  },

  getById(id: string | number) {
    return api.get<any>(`/receipts/${id}`);
  },

  create(payload: {
    receipt_number?: string;
    supplier_name: string;
    warehouse_id: number;
    location_id: number;
    items: Array<{ product_id: number; quantity: number }>;
  }) {
    return api.post<any>('/receipts', payload);
  },

  update(id: string | number, payload: { status?: string }) {
    return api.put<any>(`/receipts/${id}`, payload);
  },

  validate(id: string | number) {
    return api.post<any>(`/receipts/${id}/validate`);
  },
};

export const deliveriesApi = {
  getAll(params?: { warehouse_id?: number; status?: string; stage?: string; search?: string }) {
    return api.get<any[]>('/deliveries', params);
  },

  getById(id: string | number) {
    return api.get<any>(`/deliveries/${id}`);
  },

  create(payload: {
    delivery_number?: string;
    customer_name: string;
    shipping_address?: string;
    warehouse_id: number;
    source_location_id?: number;
    items: Array<{ product_id: number; location_id?: number; quantity: number }>;
  }) {
    return api.post<any>('/deliveries', payload);
  },

  update(id: string | number, payload: any) {
    return api.put<any>(`/deliveries/${id}`, payload);
  },

  pick(id: string | number) {
    return api.post<any>(`/deliveries/${id}/pick`);
  },

  pack(id: string | number) {
    return api.post<any>(`/deliveries/${id}/pack`);
  },

  validate(id: string | number) {
    return api.post<any>(`/deliveries/${id}/validate`);
  },
};

export const transfersApi = {
  getAll(params?: { source_warehouse_id?: number; status?: string; search?: string }) {
    return api.get<any[]>('/transfers', params);
  },

  getById(id: string | number) {
    return api.get<any>(`/transfers/${id}`);
  },

  create(payload: {
    transfer_number?: string;
    source_location_id: number;
    destination_location_id: number;
    reason?: string;
    items: Array<{ product_id: number; quantity: number }>;
  }) {
    return api.post<any>('/transfers', payload);
  },

  update(id: string | number, payload: any) {
    return api.put<any>(`/transfers/${id}`, payload);
  },

  validate(id: string | number) {
    return api.post<any>(`/transfers/${id}/validate`);
  },
};

export const adjustmentsApi = {
  getAll(params?: { location_id?: number; product_id?: number; status?: string; search?: string }) {
    return api.get<any[]>('/adjustments', params);
  },

  getById(id: string | number) {
    return api.get<any>(`/adjustments/${id}`);
  },

  create(payload: {
    adjustment_number?: string;
    product_id: number;
    location_id: number;
    counted_quantity: number;
    reason?: string;
  }) {
    return api.post<any>('/adjustments', payload);
  },

  update(id: string | number, payload: any) {
    return api.put<any>(`/adjustments/${id}`, payload);
  },

  apply(id: string | number) {
    return api.post<any>(`/adjustments/${id}/apply`);
  },
};

export const ledgerApi = {
  getAll(params?: {
    movement_type?: string;
    product_id?: number;
    warehouse_id?: number;
    location_id?: number;
    reference_type?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  }) {
    return api.get<any[]>('/ledger', params);
  },

  getById(id: string | number) {
    return api.get<any>(`/ledger/${id}`);
  },
};
