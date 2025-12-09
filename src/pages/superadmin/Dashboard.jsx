import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, DollarSign, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import api from '../../services/api';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrgs, setRecentOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, orgsRes] = await Promise.all([
        api.get('/admin?type=superadmin&action=stats'),
        api.get('/admin?type=organizations')
      ]);
      setStats(statsRes.data.data);
      setRecentOrgs(orgsRes.data.organizations?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'basic': return 'text-green-600 bg-green-100';
      case 'professional': return 'text-purple-600 bg-purple-100';
      case 'enterprise': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform-wide overview and management</p>
        </div>
        <Link
          to="/superadmin/organizations/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Organization
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalOrgs || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Organizations</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats?.activeOrgs || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Trial Organizations</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.trialOrgs || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Organizations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Organizations</h2>
            <Link to="/superadmin/organizations" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subdomain</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrgs.map((org) => (
                <tr key={org._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                        {org.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-mono">{org.subdomain}.cloudritz.app</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPlanColor(org.subscription?.plan)}`}>
                      {org.subscription?.plan || 'trial'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(org.subscription?.status)}`}>
                      {org.subscription?.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/superadmin/organizations/${org._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/superadmin/organizations/create" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Organization</h3>
              <p className="text-sm text-gray-600">Add new tenant</p>
            </div>
          </div>
        </Link>

        <Link to="/superadmin/organizations" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Organizations</h3>
              <p className="text-sm text-gray-600">View all tenants</p>
            </div>
          </div>
        </Link>

        <Link to="/superadmin/users" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-600">View all users</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
