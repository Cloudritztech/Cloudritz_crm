import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const CreateOrganization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    subdomain: '',
    email: '',
    phone: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/admin?type=superadmin&action=create-organization', {
        organization: {
          name: formData.orgName,
          subdomain: formData.subdomain,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        },
        admin: {
          name: formData.adminName,
          email: formData.adminEmail,
          password: formData.adminPassword
        }
      });

      toast.success('Organization created successfully');
      navigate('/superadmin/organizations');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} icon={ArrowLeft}>Back</Button>
        <h1 className="text-3xl font-bold">Create Organization</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">Organization Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Organization Name" name="orgName" value={formData.orgName} onChange={handleChange} required />
            <Input label="Subdomain" name="subdomain" value={formData.subdomain} onChange={handleChange} required placeholder="company" />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
            <div className="md:col-span-2">
              <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Admin User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Admin Name" name="adminName" value={formData.adminName} onChange={handleChange} required />
            <Input label="Admin Email" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} required />
            <Input label="Admin Password" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} required />
          </div>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" loading={loading}>Create Organization</Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrganization;
