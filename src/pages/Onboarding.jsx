import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, Phone, MapPin, CheckCircle, Loader } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  
  const [formData, setFormData] = useState({
    organization: {
      name: '',
      subdomain: '',
      email: '',
      phone: '',
      address: ''
    },
    admin: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));

    if (section === 'organization' && field === 'subdomain') {
      setSubdomainAvailable(null);
    }
  };

  const checkSubdomain = async () => {
    const subdomain = formData.organization.subdomain.toLowerCase().trim();
    if (!subdomain || subdomain.length < 3) {
      toast.error('Subdomain must be at least 3 characters');
      return;
    }

    setCheckingSubdomain(true);
    try {
      const { data } = await api.post('/onboarding?action=check-subdomain', { subdomain });
      setSubdomainAvailable(data.available);
      if (!data.available) toast.error('Subdomain already taken');
    } catch (error) {
      toast.error('Failed to check subdomain');
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const validateStep1 = () => {
    const { name, subdomain, email } = formData.organization;
    if (!name || !subdomain || !email) {
      toast.error('Please fill all required fields');
      return false;
    }
    if (subdomainAvailable !== true) {
      toast.error('Please verify subdomain availability');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { name, email, password, confirmPassword } = formData.admin;
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill all required fields');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/onboarding?action=register', {
        organization: formData.organization,
        admin: formData.admin
      });

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('organization', JSON.stringify(data.data.organization));

      toast.success('Welcome to Cloudritz CRM! 🎉');
      setTimeout(() => navigate('/', { replace: true }), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Free Trial</h1>
          <p className="text-gray-600">14 days free trial • No credit card required</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Organization Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Building2 className="w-6 h-6 mr-2 text-blue-600" />
                  Organization Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.organization.name}
                    onChange={(e) => handleChange('organization', 'name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Corporation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <input
                        type="text"
                        value={formData.organization.subdomain}
                        onChange={(e) => handleChange('organization', 'subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="flex-1 px-4 py-3 border-0 focus:ring-0"
                        placeholder="acme"
                        required
                      />
                      <span className="px-3 text-gray-500 bg-gray-50">.cloudritz.app</span>
                    </div>
                    <button
                      type="button"
                      onClick={checkSubdomain}
                      disabled={checkingSubdomain || !formData.organization.subdomain}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
                    >
                      {checkingSubdomain ? <Loader className="w-5 h-5 animate-spin" /> : 'Check'}
                    </button>
                  </div>
                  {subdomainAvailable === true && (
                    <p className="text-green-600 text-sm mt-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Available
                    </p>
                  )}
                  {subdomainAvailable === false && (
                    <p className="text-red-600 text-sm mt-1">Already taken</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Organization Email *
                  </label>
                  <input
                    type="email"
                    value={formData.organization.email}
                    onChange={(e) => handleChange('organization', 'email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@acme.com"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.organization.phone}
                      onChange={(e) => handleChange('organization', 'phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.organization.address}
                      onChange={(e) => handleChange('organization', 'address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, State"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Admin Account */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  Admin Account
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.admin.name}
                    onChange={(e) => handleChange('admin', 'name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.admin.email}
                    onChange={(e) => handleChange('admin', 'email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@acme.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.admin.password}
                    onChange={(e) => handleChange('admin', 'password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.admin.confirmPassword}
                    onChange={(e) => handleChange('admin', 'confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Re-enter password"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
