// Role-based permissions for multi-tenant SaaS CRM

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff'
};

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Products
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCT: 'create_product',
  EDIT_PRODUCT: 'edit_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Customers
  VIEW_CUSTOMERS: 'view_customers',
  CREATE_CUSTOMER: 'create_customer',
  EDIT_CUSTOMER: 'edit_customer',
  DELETE_CUSTOMER: 'delete_customer',
  
  // Invoices
  VIEW_INVOICES: 'view_invoices',
  CREATE_INVOICE: 'create_invoice',
  EDIT_INVOICE: 'edit_invoice',
  DELETE_INVOICE: 'delete_invoice',
  DOWNLOAD_INVOICE: 'download_invoice',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  VIEW_GST_REPORTS: 'view_gst_reports',
  VIEW_FINANCIAL_TRENDS: 'view_financial_trends',
  EXPORT_REPORTS: 'export_reports',
  
  // Expenses
  VIEW_EXPENSES: 'view_expenses',
  CREATE_EXPENSE: 'create_expense',
  EDIT_EXPENSE: 'edit_expense',
  DELETE_EXPENSE: 'delete_expense',
  
  // Settings
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings',
  MANAGE_USERS: 'manage_users',
  MANAGE_SUBSCRIPTION: 'manage_subscription',
  
  // Super Admin Only
  MANAGE_ORGANIZATIONS: 'manage_organizations',
  BLOCK_ORGANIZATIONS: 'block_organizations',
  MANAGE_FEATURES: 'manage_features'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS),
  
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.EDIT_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.EDIT_CUSTOMER,
    PERMISSIONS.DELETE_CUSTOMER,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.EDIT_INVOICE,
    PERMISSIONS.DELETE_INVOICE,
    PERMISSIONS.DOWNLOAD_INVOICE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_GST_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_TRENDS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.DELETE_EXPENSE,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.EDIT_SETTINGS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SUBSCRIPTION
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.EDIT_PRODUCT,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.EDIT_CUSTOMER,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.EDIT_INVOICE,
    PERMISSIONS.DOWNLOAD_INVOICE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_GST_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.VIEW_SETTINGS
  ],
  
  [ROLES.STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.DOWNLOAD_INVOICE,
    PERMISSIONS.VIEW_EXPENSES
  ]
};

export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

export const canAccessFeature = (organization, feature) => {
  if (!organization || !organization.features) return false;
  return organization.features[feature] === true;
};

export const isSubscriptionActive = (organization) => {
  if (!organization || !organization.subscription) return false;
  return organization.subscription.status === 'active' && !organization.subscription.isBlocked;
};
