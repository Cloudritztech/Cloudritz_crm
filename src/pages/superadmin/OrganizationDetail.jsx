import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Users, Lock, Unlock, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [subData, setSubData] = useState({});

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const fetchOrganization = async () => {
    try {
      const response = await api.get(`/admin?type=superadmin&action=organization&id=${id}`);
      setOrg(response.data.data.organization);
      setUsers(response.data.data.users);
      setEditData(response.data.data.organization);
      setSubData(response.data.data.organization.subscription);
    } catch (error) {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrg = async () => {
    try {
      await api.put(`/admin?type=superadmin&action=update-organization&id=${id}`, editData);
      toast.success('Organization updated');
      setShowEditModal(false);
      fetchOrganization();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      await api.put(`/admin?type=superadmin&action=update-subscription&id=${id}`, {
        plan: subData.plan,
        isBlocked: subData.isBlocked,
        blockReason: subData.blockReason,
        monthlyFee: subData.monthlyFee,
        limits: {
          maxUsers: subData.maxUsers,
          maxProducts: subData.maxProducts,
          maxInvoices: subData.maxInvoices
        }
      });
      toast.success('Subscription updated');
      setShowSubModal(false);
      fetchOrganization();
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  const toggleBlock = async () => {
    const newBlockStatus = !org.subscription.isBlocked;
    try {
      await api.put(`/admin?type=superadmin&action=update-subscription&id=${id}`, {
        isBlocked: newBlockStatus,
        blockReason: newBlockStatus ? 'Payment pending' : '',
        monthlyFee: org.subscription.monthlyFee || 999
      });
      toast.success(newBlockStatus ? 'Organization blocked' : 'Organization unblocked');
      fetchOrganization();
    } catch (error) {
      toast.error('Failed to toggle block status');
    }
  };

  const toggleStatus = async () => {
    try {
      await api.put(`/admin?type=superadmin&action=toggle-status&id=${id}`);
      toast.success('Status updated');
      fetchOrganization();
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} icon={ArrowLeft}>Back</Button>
          <div>
            <h1 className="text-3xl font-bold">{org.name}</h1>
            <p className="text-gray-600">{org.subdomain}.cloudritz.com</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)} icon={Edit}>Edit</Button>
          <Button variant={org.isActive ? 'outline' : 'primary'} onClick={toggleStatus}>
            {org.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">Organization Info</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {org.email}</p>
            <p><strong>Phone:</strong> {org.phone || 'N/A'}</p>
            <p><strong>Address:</strong> {org.address || 'N/A'}</p>
            <p><strong>Status:</strong> <span className={org.isActive ? 'text-green-600' : 'text-red-600'}>{org.isActive ? 'Active' : 'Inactive'}</span></p>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Subscription</h2>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={org.subscription.isBlocked ? 'primary' : 'outline'}
                onClick={toggleBlock} 
                icon={org.subscription.isBlocked ? Unlock : Lock}
              >
                {org.subscription.isBlocked ? 'Unblock' : 'Block'}
              </Button>
              <Button size="sm" onClick={() => setShowSubModal(true)} icon={Edit}>Edit</Button>
            </div>
          </div>
          <div className="space-y-2">
            <p><strong>Plan:</strong> <span className="capitalize">{org.subscription.plan}</span></p>
            <p><strong>Status:</strong> <span className={org.subscription.isBlocked ? 'text-red-600' : org.subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
              {org.subscription.isBlocked ? 'BLOCKED' : org.subscription.status}
            </span></p>
            <p><strong>Monthly Fee:</strong> <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" />{org.subscription.monthlyFee || 999}</span></p>
            {org.subscription.isBlocked && org.subscription.blockReason && (
              <p><strong>Block Reason:</strong> <span className="text-red-600">{org.subscription.blockReason}</span></p>
            )}
            <p><strong>Users:</strong> {org.subscription.maxUsers}</p>
            <p><strong>Products:</strong> {org.subscription.maxProducts}</p>
            <p><strong>Invoices/month:</strong> {org.subscription.maxInvoices}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5" />Users ({users.length})</h2>
        </div>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">{user.role}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Organization Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Organization">
        <div className="space-y-4">
          <Input label="Name" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
          <Input label="Email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} />
          <Input label="Phone" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} />
          <Input label="Address" value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} />
          <div className="flex gap-2">
            <Button onClick={handleUpdateOrg}>Save</Button>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Subscription Modal */}
      <Modal isOpen={showSubModal} onClose={() => setShowSubModal(false)} title="Edit Subscription">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plan</label>
            <select value={subData.plan} onChange={(e) => setSubData({...subData, plan: e.target.value})} className="w-full border rounded px-3 py-2">
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                checked={subData.isBlocked || false} 
                onChange={(e) => setSubData({...subData, isBlocked: e.target.checked})} 
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Block Access</span>
            </label>
          </div>
          {subData.isBlocked && (
            <>
              <Input 
                label="Block Reason" 
                value={subData.blockReason || ''} 
                onChange={(e) => setSubData({...subData, blockReason: e.target.value})} 
                placeholder="e.g., Payment pending"
              />
              <Input 
                label="Monthly Fee (₹)" 
                type="number" 
                value={subData.monthlyFee || 999} 
                onChange={(e) => setSubData({...subData, monthlyFee: Number(e.target.value)})} 
              />
            </>
          )}
          <Input label="Max Users" type="number" value={subData.maxUsers} onChange={(e) => setSubData({...subData, maxUsers: Number(e.target.value)})} />
          <Input label="Max Products" type="number" value={subData.maxProducts} onChange={(e) => setSubData({...subData, maxProducts: Number(e.target.value)})} />
          <Input label="Max Invoices" type="number" value={subData.maxInvoices} onChange={(e) => setSubData({...subData, maxInvoices: Number(e.target.value)})} />
          <div className="flex gap-2">
            <Button onClick={handleUpdateSubscription}>Save</Button>
            <Button variant="outline" onClick={() => setShowSubModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrganizationDetail;
