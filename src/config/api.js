const API_BASE_URL = '';

export const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8765';

export const API_ENDPOINTS = {

  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER_DIRECTOR: `${API_BASE_URL}/api/auth/register/director`,
    REGISTER_INVITATION: `${API_BASE_URL}/api/auth/register/invitation`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },

  INVITATIONS: {
    VALIDATE: `${API_BASE_URL}/api/invitations/validate`,
  },

  PROFILE: {
    GET: `${API_BASE_URL}/api/profile`,
    UPDATE: `${API_BASE_URL}/api/profile`,
    DELETE_ACCOUNT: `${API_BASE_URL}/api/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/profile/password`,
    PHOTO: `${API_BASE_URL}/api/profile/photo`,
    SESSIONS: `${API_BASE_URL}/api/profile/sessions`,
    SESSION_BY_ID: (sessionId) => `${API_BASE_URL}/api/profile/sessions/${sessionId}`,
  },

  OAUTH: {
    GOOGLE: `${API_BASE_URL}/api/oauth/google`,
    YANDEX: `${API_BASE_URL}/api/oauth/yandex`,
    COMPLETE_REGISTRATION: `${API_BASE_URL}/api/oauth/complete-registration`,
  },

  ORGANIZATIONS: {
    BASE: `${API_BASE_URL}/api/organizations`,
    BY_ID: (orgId) => `${API_BASE_URL}/api/organizations/${orgId}`,
    EMPLOYEES: (orgId) => `${API_BASE_URL}/api/organizations/${orgId}/employees`,
    EMPLOYEE_BY_ID: (orgId, userId) => `${API_BASE_URL}/api/organizations/${orgId}/employees/${userId}`,
    EMPLOYEE_STATUS: (orgId, userId) => `${API_BASE_URL}/api/organizations/${orgId}/employees/${userId}/status`,
    INVITATIONS: (orgId) => `${API_BASE_URL}/api/organizations/${orgId}/invitations`,
  },

  WAREHOUSES: {
    BASE: `${API_BASE_URL}/api/warehouses`,
    BY_ORG: (orgId) => `${API_BASE_URL}/api/warehouses/organization/${orgId}`,
    BY_ID: (id) => `${API_BASE_URL}/api/warehouses/${id}`,
    ANALYTICS: `${API_BASE_URL}/api/warehouses/analytics`,
  },

  RACKS: {
    BASE: `${API_BASE_URL}/api/racks`,
    BY_WAREHOUSE: (warehouseId) => `${API_BASE_URL}/api/racks/warehouse/${warehouseId}`,
    BY_ID: (id) => `${API_BASE_URL}/api/racks/${id}`,
    SHELVES: (rackId) => `${API_BASE_URL}/api/racks/${rackId}/shelves`,
    CELLS: (rackId) => `${API_BASE_URL}/api/racks/${rackId}/cells`,
    PALLETS: (rackId) => `${API_BASE_URL}/api/racks/${rackId}/pallets`,
    SLOTS: (rackId) => `${API_BASE_URL}/api/racks/${rackId}/slots`,
    CELL_BY_ID: (cellId) => `${API_BASE_URL}/api/racks/cells/${cellId}`,
  },

  PRODUCTS: {
    BASE: `${API_BASE_URL}/api/products`,
    BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
    SEARCH: `${API_BASE_URL}/api/products/search`,
  },

  BATCHES: {
    BASE: `${API_BASE_URL}/api/batches`,
    BY_PRODUCT: (productId) => `${API_BASE_URL}/api/batches/product/${productId}`,
  },

  SUPPLIERS: {
    BASE: `${API_BASE_URL}/api/suppliers`,
    BY_ID: (id) => `${API_BASE_URL}/api/suppliers/${id}`,
  },

  SUPPLIES: {
    BASE: `${API_BASE_URL}/api/supplies`,
    BY_ID: (id) => `${API_BASE_URL}/api/supplies/${id}`,
    STATUS: (id) => `${API_BASE_URL}/api/supplies/${id}/status`,
    IMPORT_1C: `${API_BASE_URL}/api/supplies/import-1c`,
    IMPORT_JSON: `${API_BASE_URL}/api/supplies/import-json`,
    SAMPLE_JSON: `${API_BASE_URL}/api/supplies/sample-json`,
  },

  OPERATIONS: {
    TRANSFER: `${API_BASE_URL}/api/operations/transfer`,
    REVALUATE: `${API_BASE_URL}/api/operations/revaluate`,
    WRITE_OFF: `${API_BASE_URL}/api/operations/write-off`,
    WRITE_OFF_MARKED: `${API_BASE_URL}/api/operations/write-off/marked-items`,
    HISTORY: `${API_BASE_URL}/api/operations/history`,
    PLACEMENT_AUTO: `${API_BASE_URL}/api/operations/placement/auto`,
    PLACEMENT_MANUAL: `${API_BASE_URL}/api/operations/placement/manual`,
    BARCODES_PRINT: `${API_BASE_URL}/api/operations/barcodes/print`,

    SHIP_REQUESTS: `${API_BASE_URL}/api/operations/ship-requests`,
    SHIP_REQUEST_BY_ID: (id) => `${API_BASE_URL}/api/operations/ship-requests/${id}`,
    SHIP_REQUEST_PICK: (id) => `${API_BASE_URL}/api/operations/ship-requests/${id}/pick`,
    SHIP_REQUEST_COMPLETE: (id) => `${API_BASE_URL}/api/operations/ship-requests/${id}/complete`,
    SHIP_REQUEST_UNPICK: (id) => `${API_BASE_URL}/api/operations/ship-requests/${id}/unpick`,
  },

  RECEIPT_SESSIONS: {
    BASE: `${API_BASE_URL}/api/receipt-sessions`,
    BY_ID: (sessionId) => `${API_BASE_URL}/api/receipt-sessions/${sessionId}`,
    COMPLETE: (sessionId) => `${API_BASE_URL}/api/receipt-sessions/${sessionId}/complete`,
    DISCREPANCY: (sessionId) => `${API_BASE_URL}/api/receipt-sessions/${sessionId}/discrepancy`,
  },

  INVENTORY: {
    BASE: `${API_BASE_URL}/api/inventory`,
    BY_WAREHOUSE: (warehouseId) => `${API_BASE_URL}/api/inventory/warehouse/${warehouseId}`,
    BY_PRODUCT: (productId) => `${API_BASE_URL}/api/inventory/product/${productId}`,
    BY_CELL: (cellId) => `${API_BASE_URL}/api/inventory/cell/${cellId}`,
  },

  INVENTORY_CHECK: {
    START: `${API_BASE_URL}/api/inventory-check/start`,
    START_STRUCTURED: `${API_BASE_URL}/api/inventory-check/start-structured`,
    BY_ID: (sessionId) => `${API_BASE_URL}/api/inventory-check/${sessionId}`,
    RECORD: (sessionId) => `${API_BASE_URL}/api/inventory-check/${sessionId}/record`,
    COMPLETE: (sessionId) => `${API_BASE_URL}/api/inventory-check/${sessionId}/complete`,
    CANCEL: (sessionId) => `${API_BASE_URL}/api/inventory-check/${sessionId}/cancel`,
  },

  ANALYTICS: {
    INVENTORY: `${API_BASE_URL}/api/analytics/inventory`,
    OPERATIONS_DYNAMICS: `${API_BASE_URL}/api/analytics/operations/dynamics`,
    OPERATIONS_COMPARE: `${API_BASE_URL}/api/analytics/operations/compare`,
    INVENTORY_COMPARE: `${API_BASE_URL}/api/analytics/inventory/compare`,
    OPERATIONS_SUMMARY: `${API_BASE_URL}/api/analytics/operations/summary`,
    ABC_DISTRIBUTION: `${API_BASE_URL}/api/analytics/abc-distribution`,
    EXPIRING_PRODUCTS: `${API_BASE_URL}/api/analytics/expiring-products`,
    WAREHOUSES_ALL: `${API_BASE_URL}/api/warehouses/analytics`,
    WAREHOUSE_BY_ID: (warehouseId) => `${API_BASE_URL}/api/warehouses/analytics/${warehouseId}`,
    WAREHOUSES_ORG_SUMMARY: (orgId) => `${API_BASE_URL}/api/warehouses/analytics/organization/${orgId}/summary`,
    EMPLOYEES_BY_ORG: (orgId) => `${API_BASE_URL}/api/organizations/${orgId}/analytics/employees`,
    REPORT: `${API_BASE_URL}/api/analytics/report`,
  },

  DOCUMENTS: {
    LIST: `${API_BASE_URL}/api/documents`,
    BY_ID: (id) => `${API_BASE_URL}/api/documents/${id}`,
    METADATA: (id) => `${API_BASE_URL}/api/documents/${id}/metadata`,
    GENERATE: (type) => `${API_BASE_URL}/api/documents/${type}`,
    STUB_INFO: `${API_BASE_URL}/api/documents/stub-info`,
    RPA_HEALTH: `${API_BASE_URL}/api/documents/rpa/health`,
  },

  DOCUMENT_REGISTRY: {
    LIST: `${API_BASE_URL}/api/document-registry`,
    BY_ID: (id) => `${API_BASE_URL}/api/document-registry/${id}`,
    DOWNLOAD: (id) => `${API_BASE_URL}/api/document-registry/${id}/download`,
    PRESIGNED_URL: (id) => `${API_BASE_URL}/api/document-registry/${id}/url`,
    BY_OPERATION: (operationId) => `${API_BASE_URL}/api/document-registry/by-operation/${operationId}`,
  },

};

export default API_BASE_URL;

