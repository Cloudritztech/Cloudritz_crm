import Employee from '../models/Employee.js';

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Super admin and admin bypass permission checks
      if (req.userRole === 'superadmin' || req.userRole === 'admin') {
        return next();
      }

      // Check if user is employee
      if (req.userRole !== 'employee') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      // Get employee with permissions
      const employee = await Employee.findOne({ 
        _id: req.userId,
        organizationId: req.organizationId,
        status: 'active'
      });

      if (!employee) {
        return res.status(403).json({ 
          success: false, 
          message: 'Employee not found or inactive' 
        });
      }

      // Check specific permission
      if (!employee.permissions || !employee.permissions[permission]) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required permission: ${permission}`,
          requiredPermission: permission
        });
      }

      // Attach employee to request
      req.employee = employee;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Permission check failed' 
      });
    }
  };
};

export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Super admin and admin bypass
      if (req.userRole === 'superadmin' || req.userRole === 'admin') {
        return next();
      }

      if (req.userRole !== 'employee') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const employee = await Employee.findOne({ 
        _id: req.userId,
        organizationId: req.organizationId,
        status: 'active'
      });

      if (!employee) {
        return res.status(403).json({ success: false, message: 'Employee not found' });
      }

      // Check if employee has any of the required permissions
      const hasPermission = permissions.some(perm => employee.permissions?.[perm]);

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions',
          requiredPermissions: permissions
        });
      }

      req.employee = employee;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Permission check failed' });
    }
  };
};
