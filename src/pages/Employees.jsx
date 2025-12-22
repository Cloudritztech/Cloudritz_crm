import React, { useState, useEffect } from 'react';
import { employeesAPI } from '../services/api';
import { Plus, UserCheck, Phone, Mail, Briefcase, Edit2, Trash2, Calendar, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    organizationId: '',
    // Login credentials
    createLogin: false,
    role: 'staff',
    username: '',
    password: '',
    permissions: []
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await employeesAPI.getAll();
      setEmployees(res.data.employees || []);
    } catch (error) {
      console.error('Fetch employees error:', error);
      setEmployees([]);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await employeesAPI.update(editingId, formData);
        toast.success('Employee updated');
      } else {
        await employeesAPI.create(formData);
        toast.success('Employee added');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ 
        name: '', 
        phone: '', 
        email: '', 
        department: '', 
        salary: '', 
        joiningDate: new Date().toISOString().split('T')[0], 
        status: 'active',
        organizationId: '',
        createLogin: false,
        role: 'staff',
        username: '',
        password: '',
        permissions: []
      });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setFormData({
      name: employee.name,
      phone: employee.phone,
      email: employee.email || '',
      department: employee.department,
      salary: employee.salary,
      joiningDate: new Date(employee.joiningDate).toISOString().split('T')[0],
      status: employee.status,
      // Don't allow editing login credentials
      createLogin: false,
      role: 'staff',
      username: '',
      password: '',
      permissions: []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeesAPI.delete(id);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      phone: '', 
      email: '', 
      department: '', 
      salary: '', 
      joiningDate: new Date().toISOString().split('T')[0], 
      status: 'active',
      createLogin: false,
      role: 'staff',
      username: '',
      password: '',
      permissions: []
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-gray-600">Manage your team</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center px-4 py-2 rounded-xl">
          <Plus className="h-4 w-4 mr-2" />Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 mb-1">Total Employees</p>
              <p className="text-3xl font-bold">{employees.length}</p>
            </div>
            <UserCheck className="h-12 w-12 text-green-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div>
            <p className="text-blue-100 mb-1">Active Employees</p>
            <p className="text-3xl font-bold">{employees.filter(e => e.status === 'active').length}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div>
            <p className="text-purple-100 mb-1">Total Salary</p>
            <p className="text-3xl font-bold">₹{employees.filter(e => e.status === 'active').reduce((sum, e) => sum + (e.salary || 0), 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.length > 0 ? employees.map((employee) => (
          <div key={employee._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {employee.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-end gap-2">
                {employee.userId && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    🔑 Login Access
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${employee.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {employee.status}
                </span>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">{employee.name}</h3>
            <p className="text-sm text-gray-600 mb-3 flex items-center"><Briefcase className="h-4 w-4 mr-1" />{employee.department}</p>
            {isSuperadmin && employee.organizationId && (
              <p className="text-xs text-gray-500 mb-2 flex items-center">
                <Building2 className="h-3 w-3 mr-1" />
                Org: {employee.organizationId.toString().slice(-8)}
              </p>
            )}
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center"><Phone className="h-4 w-4 mr-2" />{employee.phone}</p>
              {employee.email && <p className="flex items-center"><Mail className="h-4 w-4 mr-2" />{employee.email}</p>}
              <p className="flex items-center"><Calendar className="h-4 w-4 mr-2" />Joined: {new Date(employee.joiningDate).toLocaleDateString()}</p>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">Salary: <span className="font-semibold text-gray-900">₹{employee.salary?.toLocaleString('en-IN')}</span></p>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(employee)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(employee._id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full card text-center py-12">
            <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No employees found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Selector - Only for Superadmin */}
              {isSuperadmin && !editingId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization ID * (Superadmin Only)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter Organization ID" 
                    value={formData.organizationId} 
                    onChange={(e) => setFormData({...formData, organizationId: e.target.value})} 
                    className="input-field" 
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the MongoDB ObjectId of the organization this employee belongs to
                  </p>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Full Name *" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="input-field" 
                  required 
                />
                <input 
                  type="tel" 
                  placeholder="Phone *" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  className="input-field" 
                  required 
                />
              </div>
              
              <input 
                type="email" 
                placeholder="Email (optional)" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="input-field" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Department *" 
                  value={formData.department} 
                  onChange={(e) => setFormData({...formData, department: e.target.value})} 
                  className="input-field" 
                  required 
                />
                <input 
                  type="number" 
                  placeholder="Salary *" 
                  value={formData.salary} 
                  onChange={(e) => setFormData({...formData, salary: e.target.value})} 
                  className="input-field" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={formData.joiningDate} 
                  onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} 
                  className="input-field" 
                  required 
                />
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})} 
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Login Credentials Section - Only for new employees */}
              {!editingId && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input 
                      type="checkbox" 
                      id="createLogin"
                      checked={formData.createLogin}
                      onChange={(e) => setFormData({...formData, createLogin: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="createLogin" className="font-semibold text-gray-900">
                      Create Login Credentials (Allow system access)
                    </label>
                  </div>

                  {formData.createLogin && (
                    <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-3">
                        🔒 Create username and password for this employee to login to the system
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="Username *" 
                          value={formData.username} 
                          onChange={(e) => setFormData({...formData, username: e.target.value})} 
                          className="input-field" 
                          required={formData.createLogin}
                        />
                        <input 
                          type="password" 
                          placeholder="Password *" 
                          value={formData.password} 
                          onChange={(e) => setFormData({...formData, password: e.target.value})} 
                          className="input-field" 
                          required={formData.createLogin}
                          minLength="6"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role & Access Level *
                        </label>
                        <select 
                          value={formData.role} 
                          onChange={(e) => setFormData({...formData, role: e.target.value})} 
                          className="input-field"
                          required={formData.createLogin}
                        >
                          <option value="staff">Staff (View & Create Only)</option>
                          <option value="manager">Manager (Can Edit, No Delete)</option>
                          <option value="admin">Admin (Full Access)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.role === 'staff' && '• Can view products, customers, invoices and create basic records'}
                          {formData.role === 'manager' && '• Can create and edit records, view reports, cannot delete'}
                          {formData.role === 'admin' && '• Full access to all features except super admin functions'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleModalClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingId ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
