import { useState, useEffect } from 'react';
import { Search, Filter, UserCheck, UserX } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgsRes] = await Promise.all([
        api.get('/admin?type=organizations')
      ]);
      setOrganizations(orgsRes.data.organizations || []);
      
      // Fetch all users from all organizations
      const allUsers = [];
      for (const org of orgsRes.data.organizations || []) {
        try {
          const usersRes = await api.get(`/admin?type=users&organizationId=${org._id}`);
          const orgUsers = (usersRes.data.users || []).map(u => ({
            ...u,
            organizationName: org.name,
            organizationSubdomain: org.subdomain
          }));
          allUsers.push(...orgUsers);
        } catch (err) {
          console.error(`Failed to fetch users for ${org.name}`);
        }
      }
      setUsers(allUsers);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin?type=user&id=${userId}`, {
        isActive: !currentStatus
      });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = !search || 
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchOrg = !filterOrg || user.organizationId === filterOrg;
    return matchSearch && matchOrg;
  });

  const getRoleBadge = (role) => {
    const colors = {
      superadmin: 'bg-red-100 text-red-700',
      admin: 'bg-purple-100 text-purple-700',
      manager: 'bg-blue-100 text-blue-700',
      staff: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || colors.staff;
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-600 mt-1">Manage users across all organizations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org._id} value={org._id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.organizationName}</div>
                      <div className="text-xs text-gray-500 font-mono">{user.organizationSubdomain}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="flex items-center text-green-600 text-sm font-medium">
                        <UserCheck className="w-4 h-4 mr-1" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm font-medium">
                        <UserX className="w-4 h-4 mr-1" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {user.role !== 'superadmin' && (
                      <button
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        className={`text-sm font-medium ${user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Admins</div>
          <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Staff</div>
          <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'staff').length}</div>
        </div>
      </div>
    </div>
  );
}
