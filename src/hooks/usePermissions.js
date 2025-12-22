import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const PERMISSIONS = {
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_ANALYTICS: 'view_analytics',
    VIEW_PRODUCTS: 'view_products',
    CREATE_PRODUCT: 'create_product',
    EDIT_PRODUCT: 'edit_product',
    DELETE_PRODUCT: 'delete_product',
    VIEW_CUSTOMERS: 'view_customers',
    CREATE_CUSTOMER: 'create_customer',
    EDIT_CUSTOMER: 'edit_customer',
    DELETE_CUSTOMER: 'delete_customer',
    VIEW_INVOICES: 'view_invoices',
    CREATE_INVOICE: 'create_invoice',
    EDIT_INVOICE: 'edit_invoice',
    DELETE_INVOICE: 'delete_invoice',
    DOWNLOAD_INVOICE: 'download_invoice',
    VIEW_REPORTS: 'view_reports',
    VIEW_GST_REPORTS: 'view_gst_reports',
    VIEW_FINANCIAL_TRENDS: 'view_financial_trends',
    EXPORT_REPORTS: 'export_reports',
    VIEW_EXPENSES: 'view_expenses',
    CREATE_EXPENSE: 'create_expense',
    EDIT_EXPENSE: 'edit_expense',
    DELETE_EXPENSE: 'delete_expense',
    VIEW_SETTINGS: 'view_settings',
    EDIT_SETTINGS: 'edit_settings',
    MANAGE_USERS: 'manage_users',
    MANAGE_SUBSCRIPTION: 'manage_subscription',
    MANAGE_ORGANIZATIONS: 'manage_organizations',
    BLOCK_ORGANIZATIONS: 'block_organizations',
    MANAGE_FEATURES: 'manage_features'
  };

  const ROLE_PERMISSIONS = {
    superadmin: Object.values(PERMISSIONS),
    admin: [
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
    manager: [
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
    staff: [
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

  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isSuperAdmin = () => user?.role === 'superadmin';
  const isAdmin = () => user?.role === 'admin';
  const isManager = () => user?.role === 'manager';
  const isStaff = () => user?.role === 'staff';

  return {
    PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isManager,
    isStaff,
    userRole: user?.role
  };
};
