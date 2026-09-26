/**
 * StockSense Enterprise IMS - Backend Automated Verification Suite
 * Tests Phase 1 (Auth), Phase 2 (Catalog, Warehouses, Locations, Inventory),
 * and Phase 3 (Receipts, Deliveries, Transfers, Adjustments, Immutable Ledger, Atomicity)
 */

const BASE_URL = 'http://localhost:5000/api';

let authCookie = '';
let managerCookie = '';
let staffCookie = '';
let createdCategoryId = null;
let createdWarehouseId = null;
let createdLocationId = null;
let createdLocationId2 = null;
let createdProductId = null;
let testOtp = null;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const setCookie = response.headers.get('set-cookie');
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // Non-json response
  }

  return {
    status: response.status,
    headers: response.headers,
    setCookie,
    data,
  };
}

async function runTests() {
  console.log('================================================================');
  console.log('STOCKSENSE ENTERPRISE IMS — BACKEND INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. Health Check
  // -------------------------------------------------------------------------
  console.log('--- 1. System Health ---');
  const healthRes = await request('/health');
  assert(healthRes.status === 200 && healthRes.data?.data?.status === 'ONLINE', 'GET /api/health returns 200 ONLINE');

  // -------------------------------------------------------------------------
  // 2. Authentication: Signup
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Auth: Operator Registration (Signup) ---');
  const testManagerEmail = `manager_${Date.now()}@stocksense.corp`;
  const signupRes = await request('/auth/signup', {
    method: 'POST',
    body: {
      name: 'Marcus Vance',
      email: testManagerEmail,
      password: 'enterprise2024',
      role: 'INVENTORY_MANAGER',
    },
  });

  assert(signupRes.status === 201, 'POST /api/auth/signup returns 201 Created');
  assert(signupRes.data?.success === true, 'Signup returns success: true');
  assert(signupRes.data?.data?.user?.email === testManagerEmail, 'User email matches registered email');
  assert(signupRes.data?.data?.user?.role === 'INVENTORY_MANAGER', 'User role is INVENTORY_MANAGER');
  assert(!signupRes.data?.data?.user?.password_hash, 'Password hash is NOT exposed in API response');
  assert(signupRes.setCookie && signupRes.setCookie.includes('stocksense_token='), 'HttpOnly auth cookie set on signup');
  managerCookie = signupRes.setCookie.split(';')[0];

  // Test duplicate email
  const dupSignup = await request('/auth/signup', {
    method: 'POST',
    body: {
      name: 'Duplicate Vance',
      email: testManagerEmail,
      password: 'differentpassword',
      role: 'INVENTORY_MANAGER',
    },
  });
  assert(dupSignup.status === 409, 'Duplicate email registration rejected with 409 Conflict');

  // Register a secondary staff user for RBAC tests
  const testStaffEmail = `staff_${Date.now()}@stocksense.corp`;
  const staffSignup = await request('/auth/signup', {
    method: 'POST',
    body: {
      name: 'Elena Rostova',
      email: testStaffEmail,
      password: 'staffpassword2024',
      role: 'WAREHOUSE_STAFF',
    },
  });
  assert(staffSignup.status === 201, 'Secondary WAREHOUSE_STAFF user registered successfully');
  staffCookie = staffSignup.setCookie.split(';')[0];

  // -------------------------------------------------------------------------
  // 3. Validation Guards
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Auth: Input Validation Guards ---');
  const shortPassRes = await request('/auth/signup', {
    method: 'POST',
    body: { name: 'Shorty', email: `short_${Date.now()}@test.com`, password: '123' },
  });
  assert(shortPassRes.status === 400, 'Password shorter than 6 characters rejected with 400');

  const invalidEmailRes = await request('/auth/signup', {
    method: 'POST',
    body: { name: 'Invalid', email: 'not-an-email', password: 'validpassword' },
  });
  assert(invalidEmailRes.status === 400, 'Invalid email format rejected with 400');

  // -------------------------------------------------------------------------
  // 4. Authentication: Signin
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Auth: Operator Authentication (Login) ---');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: testManagerEmail, password: 'enterprise2024' },
  });
  assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
  assert(loginRes.data?.data?.user?.email === testManagerEmail, 'Login returns authenticated user');
  assert(loginRes.setCookie && loginRes.setCookie.includes('stocksense_token='), 'HttpOnly auth cookie received on login');
  managerCookie = loginRes.setCookie.split(';')[0];

  // Test invalid password
  const badLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: testManagerEmail, password: 'wrongpassword' },
  });
  assert(badLogin.status === 401, 'Invalid password returns 401 Unauthorized');

  // Test session verification endpoint (/auth/me)
  const meRes = await request('/auth/me', { cookie: managerCookie });
  assert(meRes.status === 200, 'GET /api/auth/me returns 200 for active session');
  assert(meRes.data?.data?.user?.email === testManagerEmail, 'Current session belongs to logged in operator');

  // Test unauthenticated access to /auth/me
  const unauthMe = await request('/auth/me');
  assert(unauthMe.status === 401, 'Unauthenticated GET /api/auth/me rejected with 401');

  // -------------------------------------------------------------------------
  // 5. Password Reset (OTP Flow)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Auth: Password Reset / OTP Lifecycle ---');
  const forgotRes = await request('/auth/forgot-password', {
    method: 'POST',
    body: { email: testManagerEmail },
  });
  assert(forgotRes.status === 200, 'POST /api/auth/forgot-password returns 200 OK');
  testOtp = forgotRes.data?.data?.dev_otp;
  assert(testOtp && testOtp.length === 6, '6-digit OTP preview returned in dev mode');

  // Test invalid OTP verification
  const badOtpRes = await request('/auth/verify-otp', {
    method: 'POST',
    body: { email: testManagerEmail, otp: '000000' },
  });
  assert(badOtpRes.status === 400, 'Invalid OTP rejected with 400 Bad Request');

  // Test valid OTP
  const validOtpRes = await request('/auth/verify-otp', {
    method: 'POST',
    body: { email: testManagerEmail, otp: testOtp },
  });
  assert(validOtpRes.status === 200, 'Valid OTP confirmed with 200 OK');

  // Test reset password
  const resetRes = await request('/auth/reset-password', {
    method: 'POST',
    body: {
      email: testManagerEmail,
      otp: testOtp,
      new_password: 'new_enterprise_password_2026',
    },
  });
  assert(resetRes.status === 200, 'POST /api/auth/reset-password returns 200 OK');

  // Verify new password works
  const newLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: testManagerEmail,
      password: 'new_enterprise_password_2026',
    },
  });
  assert(newLogin.status === 200, 'Login with new password succeeded');
  managerCookie = newLogin.setCookie.split(';')[0];

  // -------------------------------------------------------------------------
  // 6. Categories CRUD
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Categories CRUD ---');
  const unauthCatCreate = await request('/categories', {
    method: 'POST',
    body: { name: 'Raw Metals' },
  });
  assert(unauthCatCreate.status === 401, 'Unauthenticated category creation rejected with 401');

  const catCreateRes = await request('/categories', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: `Alloy Extrusions ${Date.now()}`,
      description: 'Industrial grade structural aluminum and copper spools',
    },
  });
  assert(catCreateRes.status === 201, 'POST /api/categories returns 201 Created');
  createdCategoryId = catCreateRes.data?.data?.id;

  const catListRes = await request('/categories');
  assert(catListRes.status === 200 && Array.isArray(catListRes.data?.data), 'GET /api/categories returns list');
  const foundCat = catListRes.data.data.find((c) => c.id === createdCategoryId);
  assert(foundCat !== undefined, 'Created category exists in category list');

  const catUpdateRes = await request(`/categories/${createdCategoryId}`, {
    method: 'PUT',
    cookie: managerCookie,
    body: {
      name: `${foundCat.name} (Updated)`,
      description: 'Updated industrial metal specifications',
    },
  });
  assert(catUpdateRes.status === 200, 'PUT /api/categories/:id updates category');

  // -------------------------------------------------------------------------
  // 7. Warehouses CRUD
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Warehouses CRUD ---');
  const whCode = `WH-${Math.floor(10 + Math.random() * 89)}`;
  const whCreateRes = await request('/warehouses', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: 'North Logistics Hub',
      code: whCode,
      address: '742 Industrial Pkwy, Sector 4',
      status: 'ACTIVE',
    },
  });
  assert(whCreateRes.status === 201, 'POST /api/warehouses returns 201 Created');
  createdWarehouseId = whCreateRes.data?.data?.id;

  // Duplicate warehouse code
  const dupWhRes = await request('/warehouses', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: 'Duplicate Hub',
      code: whCode,
    },
  });
  assert(dupWhRes.status === 409, 'Duplicate warehouse code returns 409 Conflict');

  const whListRes = await request('/warehouses');
  assert(whListRes.status === 200, 'GET /api/warehouses returns 200 OK');

  // -------------------------------------------------------------------------
  // 8. Storage Locations CRUD
  // -------------------------------------------------------------------------
  console.log('\n--- 8. Storage Locations CRUD ---');
  const locCode = 'BIN-A-01';
  const locCreateRes = await request('/locations', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      warehouse_id: createdWarehouseId,
      name: 'Cantilever Rack A Bay 01',
      code: locCode,
      status: 'ACTIVE',
    },
  });
  assert(locCreateRes.status === 201, 'POST /api/locations returns 201 Created');
  createdLocationId = locCreateRes.data?.data?.id;

  // Create second location in same warehouse for transfer tests
  const locCode2 = 'BIN-B-02';
  const locCreateRes2 = await request('/locations', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      warehouse_id: createdWarehouseId,
      name: 'Pallet Staging Area 02',
      code: locCode2,
      status: 'ACTIVE',
    },
  });
  assert(locCreateRes2.status === 201, 'Second storage location created for transfer testing');
  createdLocationId2 = locCreateRes2.data?.data?.id;

  // Duplicate location code in same warehouse
  const dupLocRes = await request('/locations', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      warehouse_id: createdWarehouseId,
      name: 'Another Rack',
      code: locCode,
    },
  });
  assert(dupLocRes.status === 409, 'Duplicate location code in same warehouse returns 409 Conflict');

  // Filter locations by warehouse
  const filteredLocs = await request(`/locations?warehouse_id=${createdWarehouseId}`);
  assert(filteredLocs.status === 200 && filteredLocs.data?.data?.length >= 2, 'GET /api/locations?warehouse_id=... filters correctly');

  // -------------------------------------------------------------------------
  // 9. Products CRUD + Initial Stock + Search
  // -------------------------------------------------------------------------
  console.log('\n--- 9. Products & Location Inventory Integration ---');
  const testSku = `SKU-AL-${Date.now().toString().slice(-6)}`;
  const prodCreateRes = await request('/products', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: 'Aluminium Structural Angle 40x40mm',
      sku: testSku,
      category_id: createdCategoryId,
      unit_of_measure: 'Meters',
      reorder_level: 50,
      status: 'ACTIVE',
      initial_stock: 120,
      initial_location_id: createdLocationId,
    },
  });
  assert(prodCreateRes.status === 201, 'POST /api/products creates product with initial stock');
  createdProductId = prodCreateRes.data?.data?.id;
  assert(prodCreateRes.data?.data?.total_stock === 120, 'Product total stock computed as 120 from inventory');

  // Verify inventory allocation record was created
  const invProductRes = await request(`/inventory/product/${createdProductId}`);
  assert(invProductRes.status === 200, 'GET /api/inventory/product/:id returns inventory');
  assert(invProductRes.data?.data?.total_stock === 120, 'Inventory matches product allocation');
  assert(invProductRes.data?.data?.locations?.length === 1, 'Location breakdown has 1 allocated location');
  assert(invProductRes.data?.data?.locations[0]?.quantity === 120, 'Allocated quantity is 120');

  // Duplicate SKU test
  const dupSkuRes = await request('/products', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: 'Duplicate Item',
      sku: testSku,
      category_id: createdCategoryId,
    },
  });
  assert(dupSkuRes.status === 409, 'Duplicate SKU rejected with 409 Conflict');

  // Search product by term
  const searchRes = await request('/products?search=Aluminium');
  assert(searchRes.status === 200 && searchRes.data?.data?.length > 0, 'GET /api/products?search=Aluminium matches product');

  // Search by SKU
  const searchSkuRes = await request(`/products?search=${testSku}`);
  assert(searchSkuRes.status === 200 && searchSkuRes.data?.data?.length === 1, 'GET /api/products?search=<SKU> matches SKU');

  // -------------------------------------------------------------------------
  // 10. Low-Stock Endpoint
  // -------------------------------------------------------------------------
  console.log('\n--- 10. Low-Stock Detection ---');
  const lowSku = `SKU-LOW-${Date.now().toString().slice(-4)}`;
  const lowProd = await request('/products', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: 'Critical Copper Terminals',
      sku: lowSku,
      category_id: createdCategoryId,
      unit_of_measure: 'Pieces',
      reorder_level: 20,
      initial_stock: 5,
      initial_location_id: createdLocationId,
    },
  });
  assert(lowProd.status === 201, 'Created product with low stock (5 units on hand, reorder at 20)');

  const outSku = `SKU-OUT-${Date.now().toString().slice(-4)}`;
  const outProd = await request('/products', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: 'Out of Stock Hydraulic Seal',
      sku: outSku,
      category_id: createdCategoryId,
      unit_of_measure: 'Pieces',
      reorder_level: 10,
      initial_stock: 0,
    },
  });
  assert(outProd.status === 201, 'Created out-of-stock product');

  const lowStockRes = await request('/inventory/low-stock');
  assert(lowStockRes.status === 200, 'GET /api/inventory/low-stock returns 200 OK');
  const foundLow = lowStockRes.data?.data?.find((p) => p.sku === lowSku);
  const foundOut = lowStockRes.data?.data?.find((p) => p.sku === outSku);
  assert(foundLow !== undefined && foundLow.stock_status === 'LOW_STOCK', 'Identified LOW_STOCK product correctly');
  assert(foundOut !== undefined && foundOut.stock_status === 'OUT_OF_STOCK', 'Identified OUT_OF_STOCK product correctly');

  // -------------------------------------------------------------------------
  // 11. Role-Based Access Control (RBAC)
  // -------------------------------------------------------------------------
  console.log('\n--- 11. Role-Based Access Control (RBAC) ---');
  const staffDeleteCat = await request(`/categories/${createdCategoryId}`, {
    method: 'DELETE',
    cookie: staffCookie,
  });
  assert(staffDeleteCat.status === 403, 'WAREHOUSE_STAFF deleting category rejected with 403 Forbidden');

  // -------------------------------------------------------------------------
  // 12. Foreign Key & Integrity Safety Checks
  // -------------------------------------------------------------------------
  console.log('\n--- 12. Integrity & Deletion Constraint Guards ---');
  const deleteRefCat = await request(`/categories/${createdCategoryId}`, {
    method: 'DELETE',
    cookie: managerCookie,
  });
  assert(deleteRefCat.status === 400, 'Deleting category referenced by products prevented (400 Bad Request)');

  const deleteRefLoc = await request(`/locations/${createdLocationId}`, {
    method: 'DELETE',
    cookie: managerCookie,
  });
  assert(deleteRefLoc.status === 400, 'Deleting location with active stock prevented (400 Bad Request)');

  const deleteRefProd = await request(`/products/${createdProductId}`, {
    method: 'DELETE',
    cookie: managerCookie,
  });
  assert(deleteRefProd.status === 400, 'Deleting product with active inventory prevented (400 Bad Request)');

  // =========================================================================
  // PHASE 3: REAL INVENTORY TRANSACTION ENGINE + IMMUTABLE STOCK LEDGER
  // =========================================================================

  // -------------------------------------------------------------------------
  // 13. Inbound Receipts Workflow & Inventory Increment
  // -------------------------------------------------------------------------
  console.log('\n--- 13. Inbound Receipts: Draft -> Validate & Inventory Increment ---');

  // 13.1 Create draft receipt with 2 items
  const receiptNum = `REC-TEST-${Date.now().toString().slice(-4)}`;
  const createReceiptRes = await request('/receipts', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      receipt_number: receiptNum,
      supplier_name: 'Apex Industrial Supply Co.',
      destination_warehouse_id: createdWarehouseId,
      destination_location_id: createdLocationId,
      notes: 'Initial Q4 restocking shipment',
      items: [
        { product_id: createdProductId, quantity_expected: 30 },
        { product_id: lowProd.data.data.id, quantity_expected: 25 },
      ],
    },
  });

  assert(createReceiptRes.status === 201, 'POST /api/receipts creates receipt in DRAFT status');
  const createdReceiptId = createReceiptRes.data?.data?.id;
  assert(createReceiptRes.data?.data?.status === 'DRAFT', 'Receipt initial status is DRAFT');
  assert(createReceiptRes.data?.data?.line_count === 2, 'Receipt line count is 2');
  assert(createReceiptRes.data?.data?.total_quantity === 55, 'Receipt total quantity expected is 55');

  // 13.2 Verify inventory NOT modified while in DRAFT
  const preCheckInv = await request(`/inventory/product/${createdProductId}`);
  assert(preCheckInv.data?.data?.locations[0]?.quantity === 120, 'Inventory NOT changed while receipt is DRAFT');

  // 13.3 Update receipt to WAITING, then READY
  const updateRecRes = await request(`/receipts/${createdReceiptId}`, {
    method: 'PUT',
    cookie: managerCookie,
    body: { status: 'READY' },
  });
  assert(updateRecRes.status === 200, 'PUT /api/receipts/:id advances status to READY');

  // Verify inventory still unchanged in READY state
  const readyCheckInv = await request(`/inventory/product/${createdProductId}`);
  assert(readyCheckInv.data?.data?.locations[0]?.quantity === 120, 'Inventory NOT changed while receipt is READY');

  // 13.4 Validate receipt (Atomic execution)
  const validateRecRes = await request(`/receipts/${createdReceiptId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(validateRecRes.status === 200, 'POST /api/receipts/:id/validate returns 200 OK');
  assert(validateRecRes.data?.data?.status === 'DONE', 'Receipt status changed to DONE upon validation');

  // 13.5 Verify inventory increased correctly
  const postRecInv1 = await request(`/inventory/product/${createdProductId}`);
  const postRecInv2 = await request(`/inventory/product/${lowProd.data.data.id}`);
  assert(postRecInv1.data?.data?.locations[0]?.quantity === 150, 'Product 1 inventory increased from 120 to 150 (+30)');
  assert(postRecInv2.data?.data?.locations[0]?.quantity === 30, 'Product 2 inventory increased from 5 to 30 (+25)');

  // 13.6 Duplicate validation rejection
  const dupRecValidate = await request(`/receipts/${createdReceiptId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(dupRecValidate.status === 409, 'Duplicate validation rejected with 409 Conflict');

  // -------------------------------------------------------------------------
  // 14. Outbound Delivery Orders & Negative Stock Prevention
  // -------------------------------------------------------------------------
  console.log('\n--- 14. Outbound Delivery Orders: Pick -> Pack -> Validate & Negative Stock Guard ---');

  // 14.1 Create draft delivery order
  const delivNum = `DEL-TEST-${Date.now().toString().slice(-4)}`;
  const createDelivRes = await request('/deliveries', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      delivery_number: delivNum,
      customer_name: 'Metro Aerospace Fabrication',
      shipping_address: 'Gate 4, Cargo Bay West',
      source_warehouse_id: createdWarehouseId,
      source_location_id: createdLocationId,
      items: [{ product_id: createdProductId, quantity_ordered: 20 }],
    },
  });

  assert(createDelivRes.status === 201, 'POST /api/deliveries creates delivery in DRAFT status');
  const createdDeliveryId = createDelivRes.data?.data?.id;
  assert(createDelivRes.data?.data?.stage === 'PENDING' || createDelivRes.data?.data?.stage === 'DRAFT', 'Delivery initial stage is PENDING');

  // 14.2 Advance delivery stages: Pick -> Pack
  const pickRes = await request(`/deliveries/${createdDeliveryId}/pick`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(pickRes.status === 200 && pickRes.data?.data?.stage === 'PICKED', 'POST /api/deliveries/:id/pick advances stage to PICKED');

  const packRes = await request(`/deliveries/${createdDeliveryId}/pack`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(packRes.status === 200 && packRes.data?.data?.stage === 'PACKED', 'POST /api/deliveries/:id/pack advances stage to PACKED');

  // 14.3 Test Negative Stock Prevention Guard
  console.log('  Testing negative stock prevention guard...');
  const excessDelivRes = await request('/deliveries', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      delivery_number: `DEL-EXCESS-${Date.now().toString().slice(-4)}`,
      customer_name: 'Overdraft Industries',
      shipping_address: 'Nowhere',
      source_warehouse_id: createdWarehouseId,
      source_location_id: createdLocationId,
      items: [{ product_id: createdProductId, quantity_ordered: 999999 }], // Exceeds available 150
    },
  });
  const excessDelivId = excessDelivRes.data?.data?.id;
  await request(`/deliveries/${excessDelivId}/pick`, { method: 'POST', cookie: managerCookie });
  await request(`/deliveries/${excessDelivId}/pack`, { method: 'POST', cookie: managerCookie });

  const failValidateDeliv = await request(`/deliveries/${excessDelivId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(failValidateDeliv.status === 400, 'Delivery exceeding available stock rejected with 400 Bad Request');
  assert(
    failValidateDeliv.data?.error?.includes('Insufficient stock') || failValidateDeliv.data?.message?.includes('Insufficient stock'),
    'Error message explicitly reports insufficient stock'
  );

  // Verify stock was NOT deducted during failed delivery validation
  const postFailInv = await request(`/inventory/product/${createdProductId}`);
  assert(postFailInv.data?.data?.locations[0]?.quantity === 150, 'Stock strictly preserved at 150 after rejected delivery');

  // 14.4 Validate legitimate delivery order
  const validateDelivRes = await request(`/deliveries/${createdDeliveryId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(validateDelivRes.status === 200, 'Legitimate delivery validated with 200 OK');
  assert(validateDelivRes.data?.data?.status === 'DONE', 'Delivery status is DONE');
  assert(validateDelivRes.data?.data?.stage === 'DISPATCHED' || validateDelivRes.data?.data?.stage === 'SHIPPED', 'Delivery stage is DISPATCHED');

  // 14.5 Verify inventory deduction
  const postDelivInv = await request(`/inventory/product/${createdProductId}`);
  assert(postDelivInv.data?.data?.locations[0]?.quantity === 130, 'Inventory deducted from 150 to 130 (-20)');

  // 14.6 Duplicate validation rejection
  const dupDelivVal = await request(`/deliveries/${createdDeliveryId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(dupDelivVal.status === 409, 'Duplicate delivery validation rejected with 409 Conflict');

  // -------------------------------------------------------------------------
  // 15. Internal Transfers & Stock Conservation Invariant
  // -------------------------------------------------------------------------
  console.log('\n--- 15. Internal Transfers: Dual-Movement & Stock Invariant ---');

  // 15.1 Test insufficient stock rejection on transfer
  const failTransferRes = await request('/transfers', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      transfer_number: `TRF-FAIL-${Date.now().toString().slice(-4)}`,
      source_location_id: createdLocationId,
      destination_location_id: createdLocationId2,
      reason: 'Attempting invalid excess transfer',
      items: [{ product_id: createdProductId, quantity: 5000 }],
    },
  });
  const failTrfId = failTransferRes.data?.data?.id;
  const failTrfValidate = await request(`/transfers/${failTrfId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(failTrfValidate.status === 400, 'Transfer with insufficient source stock rejected with 400 Bad Request');

  // 15.2 Legitimate transfer: Move 30 units from Location 1 to Location 2
  const trfNum = `TRF-${Date.now().toString().slice(-4)}`;
  const validTransferRes = await request('/transfers', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      transfer_number: trfNum,
      source_location_id: createdLocationId,
      destination_location_id: createdLocationId2,
      reason: 'Rebalancing inventory to pallet staging bay',
      items: [{ product_id: createdProductId, quantity: 30 }],
    },
  });
  assert(validTransferRes.status === 201, 'POST /api/transfers creates transfer in DRAFT status');
  const validTrfId = validTransferRes.data?.data?.id;

  // Validate transfer
  const validateTrfRes = await request(`/transfers/${validTrfId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(validateTrfRes.status === 200, 'POST /api/transfers/:id/validate returns 200 OK');
  assert(validateTrfRes.data?.data?.status === 'DONE', 'Transfer status is DONE');

  // 15.3 Verify location balances and system-wide stock invariant
  const trfInvCheck = await request(`/inventory/product/${createdProductId}`);
  const loc1 = trfInvCheck.data?.data?.locations?.find((l) => l.location_id === createdLocationId);
  const loc2 = trfInvCheck.data?.data?.locations?.find((l) => l.location_id === createdLocationId2);
  assert(loc1?.quantity === 100, 'Source location inventory decreased from 130 to 100 (-30)');
  assert(loc2?.quantity === 30, 'Destination location inventory increased from 0 to 30 (+30)');
  assert(
    trfInvCheck.data?.data?.total_stock === 130,
    'Total company stock remains exactly invariant at 130 (100 + 30)'
  );

  // 15.4 Duplicate validation rejection
  const dupTrfValidate = await request(`/transfers/${validTrfId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(dupTrfValidate.status === 409, 'Duplicate transfer validation rejected with 409 Conflict');

  // -------------------------------------------------------------------------
  // 16. Stock Adjustments (Cycle Counting Reconciliation)
  // -------------------------------------------------------------------------
  console.log('\n--- 16. Stock Adjustments: Physical Count Reconciliation ---');

  // 16.1 Create draft stock adjustment: recorded is 30 at loc2, physical count is 35 (discrepancy +5)
  const adjNum = `ADJ-${Date.now().toString().slice(-4)}`;
  const createAdjRes = await request('/adjustments', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      adjustment_number: adjNum,
      product_id: createdProductId,
      location_id: createdLocationId2,
      counted_quantity: 35,
      reason: 'Physical count identified 5 unopened boxes in upper rack',
    },
  });
  assert(createAdjRes.status === 201, 'POST /api/adjustments creates adjustment in DRAFT status');
  const createdAdjId = createAdjRes.data?.data?.id;
  assert(createAdjRes.data?.data?.recorded_quantity === 30, 'Adjustment recorded_quantity correctly captured as 30');
  assert(createAdjRes.data?.data?.counted_quantity === 35, 'Adjustment counted_quantity is 35');
  assert(createAdjRes.data?.data?.difference === 5, 'Adjustment difference calculated as +5 (35 - 30)');

  // 16.2 Verify inventory NOT modified before application
  const preAdjInv = await request(`/inventory/product/${createdProductId}`);
  const preAdjLoc2 = preAdjInv.data?.data?.locations?.find((l) => l.location_id === createdLocationId2);
  assert(preAdjLoc2?.quantity === 30, 'Inventory unchanged at 30 prior to applying adjustment');

  // 16.3 Apply stock adjustment
  const applyAdjRes = await request(`/adjustments/${createdAdjId}/apply`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(applyAdjRes.status === 200, 'POST /api/adjustments/:id/apply returns 200 OK');
  assert(applyAdjRes.data?.data?.status === 'APPLIED', 'Adjustment status changed to APPLIED');

  // 16.4 Verify inventory reconciled to exact physical count
  const postAdjInv = await request(`/inventory/product/${createdProductId}`);
  const postAdjLoc2 = postAdjInv.data?.data?.locations?.find((l) => l.location_id === createdLocationId2);
  assert(postAdjLoc2?.quantity === 35, 'Inventory at location 2 reconciled exactly to 35');
  assert(postAdjInv.data?.data?.total_stock === 135, 'Total stock updated to 135 (100 + 35)');

  // 16.5 Duplicate application rejection
  const dupAdjApply = await request(`/adjustments/${createdAdjId}/apply`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(dupAdjApply.status === 409, 'Duplicate adjustment application rejected with 409 Conflict');

  // -------------------------------------------------------------------------
  // 17. Immutable Stock Ledger: Auditing, Filtering & Immutability Enforcement
  // -------------------------------------------------------------------------
  console.log('\n--- 17. Immutable Stock Ledger: Queries & Immutability Enforcement ---');

  // 17.1 Query entire ledger
  const ledgerAll = await request('/ledger', { cookie: managerCookie });
  assert(ledgerAll.status === 200, 'GET /api/ledger returns 200 OK');
  assert(Array.isArray(ledgerAll.data?.data) && ledgerAll.data.data.length >= 5, 'Ledger contains at least 5 movement records');

  // 17.2 Verify Chronological Descending Order
  const movements = ledgerAll.data.data;
  let isChronological = true;
  for (let i = 1; i < movements.length; i++) {
    if (new Date(movements[i].created_at) > new Date(movements[i - 1].created_at)) {
      isChronological = false;
      break;
    }
  }
  assert(isChronological, 'Ledger entries are strictly returned in chronological descending order');

  // 17.3 Filter ledger by movement_type: RECEIPT
  const ledgerReceipts = await request('/ledger?movement_type=RECEIPT', { cookie: managerCookie });
  assert(
    ledgerReceipts.status === 200 && ledgerReceipts.data.data.every((m) => m.movement_type === 'RECEIPT'),
    'Filter /ledger?movement_type=RECEIPT returns only RECEIPT movements'
  );

  // 17.4 Filter ledger by movement_type: DELIVERY
  const ledgerDeliveries = await request('/ledger?movement_type=DELIVERY', { cookie: managerCookie });
  assert(
    ledgerDeliveries.status === 200 && ledgerDeliveries.data.data.every((m) => m.movement_type === 'DELIVERY'),
    'Filter /ledger?movement_type=DELIVERY returns only DELIVERY movements'
  );

  // 17.5 Filter ledger by product_id
  const ledgerProduct = await request(`/ledger?product_id=${createdProductId}`, { cookie: managerCookie });
  assert(
    ledgerProduct.status === 200 && ledgerProduct.data.data.every((m) => m.product_id === createdProductId),
    'Filter /ledger?product_id=... returns only target product movements'
  );

  // 17.6 Query single ledger entry
  const firstMovementId = movements[0].id;
  const singleMovementRes = await request(`/ledger/${firstMovementId}`, { cookie: managerCookie });
  assert(singleMovementRes.status === 200, 'GET /api/ledger/:id returns 200 OK');
  assert(singleMovementRes.data?.data?.id === firstMovementId, 'Retrieved movement ID matches requested ID');
  assert(singleMovementRes.data?.data?.sku !== undefined, 'Movement includes product SKU');
  assert(singleMovementRes.data?.data?.warehouse_code !== undefined, 'Movement includes warehouse code');
  assert(singleMovementRes.data?.data?.location_code !== undefined, 'Movement includes location code');
  assert(singleMovementRes.data?.data?.user_name !== undefined, 'Movement includes operator name');

  // 17.7 STRICT IMMUTABILITY ENFORCEMENT: Ledger cannot be modified or deleted
  const postLedger = await request('/ledger', {
    method: 'POST',
    cookie: managerCookie,
    body: { movement_type: 'FORGED' },
  });
  assert(postLedger.status === 405, 'POST /api/ledger blocked with 405 Method Not Allowed (Immutable)');

  const putLedger = await request(`/ledger/${firstMovementId}`, {
    method: 'PUT',
    cookie: managerCookie,
    body: { quantity_change: 9999 },
  });
  assert(putLedger.status === 405, 'PUT /api/ledger/:id blocked with 405 Method Not Allowed (Immutable)');

  const deleteLedger = await request(`/ledger/${firstMovementId}`, {
    method: 'DELETE',
    cookie: managerCookie,
  });
  assert(deleteLedger.status === 405, 'DELETE /api/ledger/:id blocked with 405 Method Not Allowed (Immutable)');

  // -------------------------------------------------------------------------
  // 18. Concurrency & Transaction Rollback Atomicity
  // -------------------------------------------------------------------------
  console.log('\n--- 18. Concurrency & Transaction Rollback Atomicity ---');

  // Create a multi-item delivery where Item 1 is available (10 units), but Item 2 has 0 available
  const atomicDelivRes = await request('/deliveries', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      delivery_number: `DEL-ATOMIC-${Date.now().toString().slice(-4)}`,
      customer_name: 'Rollback Testing Laboratories',
      shipping_address: 'Fault Ingestion Bay',
      source_warehouse_id: createdWarehouseId,
      source_location_id: createdLocationId,
      items: [
        { product_id: createdProductId, quantity_ordered: 10 },
        { product_id: outProd.data.data.id, quantity_ordered: 50 }, // Out-of-stock item!
      ],
    },
  });
  const atomicDelivId = atomicDelivRes.data?.data?.id;
  await request(`/deliveries/${atomicDelivId}/pick`, { method: 'POST', cookie: managerCookie });
  await request(`/deliveries/${atomicDelivId}/pack`, { method: 'POST', cookie: managerCookie });

  const startInvItem1 = await request(`/inventory/product/${createdProductId}`);
  const startQtyItem1 = startInvItem1.data?.data?.locations?.find((l) => l.location_id === createdLocationId)?.quantity;

  const failAtomicVal = await request(`/deliveries/${atomicDelivId}/validate`, {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(failAtomicVal.status === 400, 'Multi-item delivery with one insufficient item fails validation');

  const afterAtomicInvItem1 = await request(`/inventory/product/${createdProductId}`);
  const afterQtyItem1 = afterAtomicInvItem1.data?.data?.locations?.find((l) => l.location_id === createdLocationId)?.quantity;
  assert(afterQtyItem1 === startQtyItem1, 'Full transaction rollback: Item 1 was NOT deducted (Atomic Rollback Verified)');

  // -------------------------------------------------------------------------
  // 19. Strict 4-Step End-to-End Real-World Scenario
  // -------------------------------------------------------------------------
  console.log('\n--- 19. Strict 4-Step End-to-End Scenario Verification ---');
  console.log('  Scenario Specification:');
  console.log('    1. Product start: 100 units in Main Store (Rack A)');
  console.log('    2. Inbound Receipt: +50 units -> 150');
  console.log('    3. Internal Transfer: 30 units to Production Floor -> MS: 120, PF: 30, Total: 150');
  console.log('    4. Outbound Delivery: 20 units from Main Store -> MS: 100, PF: 30, Total: 130');
  console.log('    5. Stock Adjustment: Physical count MS = 97 (-3) -> MS: 97, PF: 30, Total: 127');

  // Step 0: Setup isolated product and locations
  const scenarioSku = `SKU-TURBINE-${Date.now().toString().slice(-4)}`;
  const scenarioProdRes = await request('/products', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      name: 'Titanium Turbine Bolt M12',
      sku: scenarioSku,
      category_id: createdCategoryId,
      unit_of_measure: 'Pieces',
      reorder_level: 25,
      status: 'ACTIVE',
      initial_stock: 100,
      initial_location_id: createdLocationId, // Main Store (Rack A)
    },
  });
  assert(scenarioProdRes.status === 201, 'Step 0: Product created with 100 units at Main Store');
  const scProdId = scenarioProdRes.data?.data?.id;

  // Step 1: Validate Receipt of 50 units
  const scRecRes = await request('/receipts', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      receipt_number: `REC-SC-${Date.now().toString().slice(-4)}`,
      supplier_name: 'Aerospace Fastener Forgings',
      destination_warehouse_id: createdWarehouseId,
      destination_location_id: createdLocationId,
      items: [{ product_id: scProdId, quantity_expected: 50 }],
    },
  });
  await request(`/receipts/${scRecRes.data.data.id}/validate`, { method: 'POST', cookie: managerCookie });

  const scCheck1 = await request(`/inventory/product/${scProdId}`);
  const scLoc1_1 = scCheck1.data?.data?.locations?.find((l) => l.location_id === createdLocationId);
  assert(scLoc1_1?.quantity === 150, 'Step 1: Receipt +50 brings Main Store to 150');

  // Step 2: Validate Internal Transfer of 30 units to Production Floor (createdLocationId2)
  const scTrfRes = await request('/transfers', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      transfer_number: `TRF-SC-${Date.now().toString().slice(-4)}`,
      source_location_id: createdLocationId,
      destination_location_id: createdLocationId2,
      reason: 'Issue bolts to Turbine Assembly Cell 3',
      items: [{ product_id: scProdId, quantity: 30 }],
    },
  });
  await request(`/transfers/${scTrfRes.data.data.id}/validate`, { method: 'POST', cookie: managerCookie });

  const scCheck2 = await request(`/inventory/product/${scProdId}`);
  const scLoc1_2 = scCheck2.data?.data?.locations?.find((l) => l.location_id === createdLocationId);
  const scLoc2_2 = scCheck2.data?.data?.locations?.find((l) => l.location_id === createdLocationId2);
  assert(scLoc1_2?.quantity === 120, 'Step 2: Transfer decreases Main Store to 120');
  assert(scLoc2_2?.quantity === 30, 'Step 2: Transfer increases Production Floor to 30');
  assert(scCheck2.data?.data?.total_stock === 150, 'Step 2: Total company stock conserved at 150');

  // Step 3: Validate Outbound Delivery of 20 units from Main Store
  const scDelRes = await request('/deliveries', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      delivery_number: `DEL-SC-${Date.now().toString().slice(-4)}`,
      customer_name: 'Boeing Flight Services',
      shipping_address: 'Everett Delivery Center Dock 12',
      source_warehouse_id: createdWarehouseId,
      source_location_id: createdLocationId,
      items: [{ product_id: scProdId, quantity_ordered: 20 }],
    },
  });
  const scDelId = scDelRes.data?.data?.id;
  await request(`/deliveries/${scDelId}/pick`, { method: 'POST', cookie: managerCookie });
  await request(`/deliveries/${scDelId}/pack`, { method: 'POST', cookie: managerCookie });
  await request(`/deliveries/${scDelId}/validate`, { method: 'POST', cookie: managerCookie });

  const scCheck3 = await request(`/inventory/product/${scProdId}`);
  const scLoc1_3 = scCheck3.data?.data?.locations?.find((l) => l.location_id === createdLocationId);
  const scLoc2_3 = scCheck3.data?.data?.locations?.find((l) => l.location_id === createdLocationId2);
  assert(scLoc1_3?.quantity === 100, 'Step 3: Delivery decreases Main Store to 100');
  assert(scLoc2_3?.quantity === 30, 'Step 3: Production Floor unchanged at 30');
  assert(scCheck3.data?.data?.total_stock === 130, 'Step 3: Total company stock is 130');

  // Step 4: Validate Stock Adjustment: physical count Main Store found to be 97 (difference -3)
  const scAdjRes = await request('/adjustments', {
    method: 'POST',
    cookie: managerCookie,
    body: {
      adjustment_number: `ADJ-SC-${Date.now().toString().slice(-4)}`,
      product_id: scProdId,
      location_id: createdLocationId,
      counted_quantity: 97,
      reason: 'Missing 3 bolts during weekly cycle count audit',
    },
  });
  await request(`/adjustments/${scAdjRes.data.data.id}/apply`, { method: 'POST', cookie: managerCookie });

  const scCheck4 = await request(`/inventory/product/${scProdId}`);
  const scLoc1_4 = scCheck4.data?.data?.locations?.find((l) => l.location_id === createdLocationId);
  const scLoc2_4 = scCheck4.data?.data?.locations?.find((l) => l.location_id === createdLocationId2);
  assert(scLoc1_4?.quantity === 97, 'Step 4: Main Store inventory reconciled to exact counted quantity 97');
  assert(scLoc2_4?.quantity === 30, 'Step 4: Production Floor inventory remains 30');
  assert(scCheck4.data?.data?.total_stock === 127, 'Step 4: Total company stock is exactly 127 (97 + 30)');

  // Step 5: Verify Complete Scenario Audit Ledger
  const scLedgerRes = await request(`/ledger?product_id=${scProdId}`, { cookie: managerCookie });
  assert(scLedgerRes.status === 200, 'Step 5: Retrieved complete ledger trail for scenario product');
  const scMovements = scLedgerRes.data.data;
  assert(scMovements.length === 5, 'Step 5: Exactly 5 audit movement records logged for scenario');

  // Verify movements in chronological sequence (reversed since ledger is returned DESC)
  const ascMovements = [...scMovements].reverse();
  assert(
    ascMovements[0].movement_type === 'RECEIPT' &&
      ascMovements[0].quantity_before === 100 &&
      ascMovements[0].quantity_change === 50 &&
      ascMovements[0].quantity_after === 150,
    'Step 5 Movement 1 Verified: RECEIPT (+50, 100 -> 150)'
  );

  assert(
    ascMovements[1].movement_type === 'TRANSFER_OUT' &&
      ascMovements[1].quantity_before === 150 &&
      ascMovements[1].quantity_change === -30 &&
      ascMovements[1].quantity_after === 120,
    'Step 5 Movement 2 Verified: TRANSFER_OUT (-30, 150 -> 120)'
  );

  assert(
    ascMovements[2].movement_type === 'TRANSFER_IN' &&
      ascMovements[2].quantity_before === 0 &&
      ascMovements[2].quantity_change === 30 &&
      ascMovements[2].quantity_after === 30,
    'Step 5 Movement 3 Verified: TRANSFER_IN (+30, 0 -> 30)'
  );

  assert(
    ascMovements[3].movement_type === 'DELIVERY' &&
      ascMovements[3].quantity_before === 120 &&
      ascMovements[3].quantity_change === -20 &&
      ascMovements[3].quantity_after === 100,
    'Step 5 Movement 4 Verified: DELIVERY (-20, 120 -> 100)'
  );

  assert(
    ascMovements[4].movement_type === 'ADJUSTMENT' &&
      ascMovements[4].quantity_before === 100 &&
      ascMovements[4].quantity_change === -3 &&
      ascMovements[4].quantity_after === 97,
    'Step 5 Movement 5 Verified: ADJUSTMENT (-3, 100 -> 97)'
  );

  // -------------------------------------------------------------------------
  // 20. Logout
  // -------------------------------------------------------------------------
  console.log('\n--- 20. Auth: Session Termination (Logout) ---');
  const logoutRes = await request('/auth/logout', {
    method: 'POST',
    cookie: managerCookie,
  });
  assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 OK');

  const postLogoutMe = await request('/auth/me', {
    cookie: 'stocksense_token=; Max-Age=0',
  });
  assert(postLogoutMe.status === 401, 'Request with cleared cookie is unauthenticated (401)');

  // -------------------------------------------------------------------------
  // Test Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS:  ${totalTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
