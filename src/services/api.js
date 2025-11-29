import axios from 'axios';

// Dynamic API base URL for different environments
const getApiBaseUrl = () => {
  // In production (deployed), use same domain
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, check if we have a custom API URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default to same domain API
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('📝 Production mode:', import.meta.env.PROD);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors and logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  adjustStock: (id, adjustment, reason) => api.put(`/products/${id}/adjust-stock`, { adjustment, reason }),
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  getPurchaseHistory: (id) => api.get(`/customers/${id}/purchases`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => {
    console.log('🔍 Making API call to get invoice by ID:', id);
    console.log('🔍 Full URL will be:', `${API_BASE_URL}/invoices/${id}`);
    return api.get(`/invoices/${id}`);
  },
  create: (invoice) => api.post('/invoices', invoice),
  generatePDF: (id) => {
    console.log('🔍 Making API call to generate PDF for ID:', id);
    console.log('🔍 Full URL will be:', `${API_BASE_URL}/invoices/${id}/pdf`);
    return api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  },
  getWhatsAppLink: (id) => api.get(`/invoices/${id}/whatsapp-link`),
};

// Reports API
export const reportsAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getProfit: (params) => api.get('/reports/profit', { params }),
  getTopProducts: (params) => api.get('/reports/top-products', { params }),
  getDashboard: () => api.get('/reports/dashboard'),
};

export default api;