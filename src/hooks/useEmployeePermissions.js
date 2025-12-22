import { useAuth } from '../context/AuthContext';

export const useEmployeePermissions = () => {
  const { user } = useAuth();

  const isEmployee = () => user?.role === 'employee' && user?.isEmployee === true;
  
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin and superadmin have all permissions
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    
    // Check employee permissions
    if (isEmployee() && user.permissions) {
      return user.permissions[permission] === true;
    }
    
    return false;
  };

  const canAccessDashboard = () => hasPermission('dashboardAccess');
  const canAccessReports = () => hasPermission('reportAccess');
  const canAccessAnalytics = () => hasPermission('analyticsAccess');
  const canAccessSettings = () => hasPermission('settingsAccess');
  
  const canCreateInvoice = () => hasPermission('invoiceCreate');
  const canViewInvoice = () => hasPermission('invoiceView');
  const canEditInvoice = () => hasPermission('invoiceEdit');
  const canDeleteInvoice = () => hasPermission('invoiceDelete');
  
  const canCreateExpense = () => hasPermission('expenseCreate');
  const canViewExpense = () => hasPermission('expenseView');
  const canEditExpense = () => hasPermission('expenseEdit');
  const canDeleteExpense = () => hasPermission('expenseDelete');
  
  const canCreateCustomer = () => hasPermission('customerCreate');
  const canViewCustomer = () => hasPermission('customerView');
  const canEditCustomer = () => hasPermission('customerEdit');
  
  const canViewProduct = () => hasPermission('productView');
  const canCreateProduct = () => hasPermission('productCreate');

  return {
    isEmployee,
    hasPermission,
    canAccessDashboard,
    canAccessReports,
    canAccessAnalytics,
    canAccessSettings,
    canCreateInvoice,
    canViewInvoice,
    canEditInvoice,
    canDeleteInvoice,
    canCreateExpense,
    canViewExpense,
    canEditExpense,
    canDeleteExpense,
    canCreateCustomer,
    canViewCustomer,
    canEditCustomer,
    canViewProduct,
    canCreateProduct,
    permissions: user?.permissions || {}
  };
};
