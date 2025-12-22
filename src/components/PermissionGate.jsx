import { usePermissions } from '../hooks/usePermissions';

/**
 * Permission Gate Component
 * Conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGate permission="create_product">
 *   <button>Create Product</button>
 * </PermissionGate>
 */
export default function PermissionGate({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null,
  showTooltip = false
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    if (showTooltip) {
      return (
        <div className="relative group inline-block">
          <div className="opacity-50 cursor-not-allowed pointer-events-none">
            {children}
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Access restricted
          </div>
        </div>
      );
    }
    return fallback;
  }

  return children;
}
