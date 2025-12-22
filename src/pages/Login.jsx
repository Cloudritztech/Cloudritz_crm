import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Mail, Lock, ArrowRight, Phone } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        toast.success('Login successful!');
        // Force full page reload to ensure clean state
        window.location.href = '/';
      } else {
        toast.error(result.message);
        setLoading(false);
      }
    } catch (error) {
      toast.error('Login failed: ' + error.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">C</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Cloudritz CRM
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Complete business management solution for modern enterprises
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Inventory Management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Customer Database</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">GST Compliant Invoicing</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Sales Analytics</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-20 right-32 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-secondary-50">
        <div className="max-w-md w-full">
          <div className="card">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h2 className="text-2xl font-bold text-secondary-900">
                Cloudritz CRM
              </h2>
            </div>

            <div className="text-center mb-8">
              <h2 className="hidden lg:block text-3xl font-bold text-secondary-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-secondary-600">
                Sign in to your CRM account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                name="identifier"
                type="text"
                label="Email or Mobile Number"
                placeholder="Enter email or 10-digit mobile"
                value={formData.identifier}
                onChange={handleChange}
                leftIcon={formData.identifier?.match(/^[0-9]/) ? Phone : Mail}
                required
              />

              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                leftIcon={Lock}
                required
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Admin Panel Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Are you an administrator?{' '}
                <a 
                  href="https://admin.cloudritz.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to Admin Panel →
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-secondary-500">
            <p>© 2024 Cloudritz Tech. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;