const API_BASE_URL = '';

export const API_ENDPOINTS = {
  // Auth endpoints (SSO Service)
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },
  // Profile endpoints (SSO Service)
  PROFILE: {
    GET: `${API_BASE_URL}/api/profile`,
    UPDATE: `${API_BASE_URL}/api/profile`,
    SESSIONS: `${API_BASE_URL}/api/profile/sessions`,
    UPLOAD_PHOTO: `${API_BASE_URL}/api/profile/photo`,
  },
  // OAuth endpoints
  OAUTH: {
    GOOGLE: `${API_BASE_URL}/api/oauth/google`,
    YANDEX: `${API_BASE_URL}/api/oauth/yandex`,
    COMPLETE_REGISTRATION: `${API_BASE_URL}/api/oauth/complete-registration`,
  },
  // Organization endpoints
  ORGANIZATIONS: {
    BASE: `${API_BASE_URL}/api/organizations`,
    MY: `${API_BASE_URL}/api/organizations/my`,
    JOIN: `${API_BASE_URL}/api/organizations/join`,
    EMPLOYEES: (orgId) => `${API_BASE_URL}/api/organizations/${orgId}/employees`,
    INVITATION_CODE: (orgId) => `${API_BASE_URL}/api/organizations/${orgId}/invitation-code`,
  },
  // Warehouse endpoints
  WAREHOUSES: {
    BASE: `${API_BASE_URL}/api/warehouses`,
    BY_ORG: (orgId) => `${API_BASE_URL}/api/warehouses/organization/${orgId}`,
    BY_ID: (id) => `${API_BASE_URL}/api/warehouses/${id}`,
    ANALYTICS: `${API_BASE_URL}/api/warehouses/analytics`,
  },
  // Rack endpoints
  RACKS: {
    BASE: `${API_BASE_URL}/api/racks`,
    BY_WAREHOUSE: (warehouseId) => `${API_BASE_URL}/api/racks/warehouse/${warehouseId}`,
    BY_ID: (id) => `${API_BASE_URL}/api/racks/${id}`,
  },
  // Product endpoints
  PRODUCTS: {
    BASE: `${API_BASE_URL}/api/products`,
    BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
    SEARCH: `${API_BASE_URL}/api/products/search`,
  },
  // Batch endpoints
  BATCHES: {
    BASE: `${API_BASE_URL}/api/batches`,
    BY_PRODUCT: (productId) => `${API_BASE_URL}/api/batches/product/${productId}`,
  },
  // Operations endpoints
  OPERATIONS: {
    RECEIVE: `${API_BASE_URL}/api/operations/receive`,
    SHIP: `${API_BASE_URL}/api/operations/ship`,
    TRANSFER: `${API_BASE_URL}/api/operations/transfer`,
    RESERVE: `${API_BASE_URL}/api/operations/reserve`,
    HISTORY: `${API_BASE_URL}/api/operations/history`,
  },
  // Inventory endpoints
  INVENTORY: {
    BASE: `${API_BASE_URL}/api/inventory`,
    BY_WAREHOUSE: (warehouseId) => `${API_BASE_URL}/api/inventory/warehouse/${warehouseId}`,
    WRITEOFF: `${API_BASE_URL}/api/inventory/writeoff`,
    REVALUATION: `${API_BASE_URL}/api/inventory/revaluation`,
  },
  // Inventory check (инвентаризация)
  INVENTORY_CHECK: {
    START: `${API_BASE_URL}/api/inventory-check/start`,
    COMPLETE: `${API_BASE_URL}/api/inventory-check/complete`,
    COUNT: `${API_BASE_URL}/api/inventory-check/count`,
    SESSIONS: `${API_BASE_URL}/api/inventory-check/sessions`,
  },
  // Analytics endpoints
  ANALYTICS: {
    STOCK: `${API_BASE_URL}/api/analytics/stock`,
    OPERATIONS: `${API_BASE_URL}/api/analytics/operations`,
    WAREHOUSE_LOAD: `${API_BASE_URL}/api/analytics/warehouse-load`,
    EMPLOYEES: `${API_BASE_URL}/api/analytics/employees`,
  },
  // Document endpoints
  DOCUMENTS: {
    RECEIPT_ORDER: `${API_BASE_URL}/api/documents/receipt-order`,
    SHIPPING_INVOICE: `${API_BASE_URL}/api/documents/shipping-invoice`,
    INVENTORY_LIST: `${API_BASE_URL}/api/documents/inventory-list`,
    WRITEOFF_ACT: `${API_BASE_URL}/api/documents/writeoff-act`,
    REVALUATION_ACT: `${API_BASE_URL}/api/documents/revaluation-act`,
  },
};

export default API_BASE_URL;

