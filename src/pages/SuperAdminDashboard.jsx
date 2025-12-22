import React, { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, Shield, Lock, Unlock } from 'lucide-react';
import Button from '../components/ui/Button';
import { StatCard } from '../components/ui/Card';
import api from '../services/api';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin?action=organizations');
      if (response.data?.success) {
        const orgs = response.data.organizations || [];
        setOrganizations(orgs);
        setStats({
          total: orgs.length,
          active: orgs.filter(o => o.subscription?.status === 'active').length,
          blocked: orgs.filter(o => o.subscription?.isBlocked).length
        });
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (orgId, currentStatus) => {
    try {
      const response = await api.put(`/admin?action=block-organization&id=${orgId}`, {
        isBlocked: !currentStatus,
        blockReason: !currentStatus ? 'Payment pending' : null
      });
      if (response.data?.success) {
        toast.success(!currentStatus ? 'Organization blocked' : 'Organization unblocked');
        fetchOrganizations();
      }
    } catch (error) {
      toast.error('Failed to update organization');
    }
  };

  const toggleFeature = async (orgId, feature, currentStatus) => {
    try {
      const response = await api.put(`/admin?action=toggle-feature&id=${orgId}`, {
        feature,
        enabled: !currentStatus
      });
      if (response.data?.success) {
        toast.success(`Feature ${!currentStatus ? 'enabled' : 'disabled'}`);
        fetchOrganizations();
      }
    } catch (error) {
      toast.error('Failed to update feature');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600">Manage organizations, features, and subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          icon={Building2}
          title="Total Organizations"
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={Users}
          title="Active Organizations"
          value={stats.active}
          color="success"
        />
        <StatCard
          icon={Shield}
          title="Blocked Organizations"
          value={stats.blocked}
          color="danger"
        />
      </div>

      {/* Organizations List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2">Organization</th>
                <th className="text-left py-3 px-2">Subdomain</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Features</th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org._id} className="border-b border-gray-100">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-gray-500">{org.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{org.subdomain}</code>
                  </td>
                  <td className="py-3 px-2">
                    {org.subscription?.isBlocked ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Blocked</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {org.features?.advancedReports && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Reports</span>
                      )}
                      {org.features?.whatsappIntegration && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">WhatsApp</span>
                      )}
                      {org.features?.aiInsights && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">AI</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Button
                      variant={org.subscription?.isBlocked ? 'success' : 'danger'}
                      size="sm"
                      icon={org.subscription?.isBlocked ? Unlock : Lock}
                      onClick={() => toggleBlock(org._id, org.subscription?.isBlocked)}
                    >
                      {org.subscription?.isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
