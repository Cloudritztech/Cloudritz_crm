import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin?type=superadmin&action=stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-gray-600">Manage all organizations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Organizations</p>
              <p className="text-3xl font-bold">{stats?.totalOrgs || 0}</p>
            </div>
            <Building2 className="w-12 h-12 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Organizations</p>
              <p className="text-3xl font-bold text-green-600">{stats?.activeOrgs || 0}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            <Users className="w-12 h-12 text-purple-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
