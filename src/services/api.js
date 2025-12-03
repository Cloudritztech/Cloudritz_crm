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
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Only handle 401 for protected routes, not auth endpoints
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth');
      const isLoginPage = window.location.pathname === '/login';
      
      if (!isAuthEndpoint && !isLoginPage) {
        console.log('Unauthorized - clearing auth and redirecting');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth?action=login', credentials),
  register: (userData) => api.post('/auth?action=register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products?id=${id}`),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products?id=${id}`, product),
  delete: (id) => api.delete(`/products?id=${id}`),
  updateStock: (id, data) => api.post(`/products?id=${id}&action=stock`, data),
  getLowStock: () => api.get('/products?lowStock=true'),
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers?id=${id}`),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers?id=${id}`, customer),
  getPurchaseHistory: (id) => api.get(`/customers?id=${id}&action=purchases`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => {
    console.log('🔍 Making API call to get invoice by ID:', id);
    console.log('🔍 Full URL will be:', `${API_BASE_URL}/invoice?id=${id}`);
    return api.get(`/invoice?id=${id}`);
  },
  create: (invoice) => api.post('/invoices', invoice),
  generatePDF: (id) => {
    console.log('🔍 Making API call to generate PDF for ID:', id);
    console.log('🔍 Full URL will be:', `${API_BASE_URL}/invoice?id=${id}&action=pdf`);
    return api.get(`/invoice?id=${id}&action=pdf`, { responseType: 'blob' });
  },
  getWhatsAppLink: (id) => api.get(`/invoice?id=${id}&action=whatsapp`),
};

// Reports API
export const reportsAPI = {
  getSales: (params) => api.get('/reports?action=sales', { params }),
  getProfit: (params) => api.get('/reports?action=profit', { params }),
  getTopProducts: (params) => api.get('/reports?action=top-products', { params }),
  getDashboard: () => api.get('/reports'),
  getSalesAnalytics: () => api.get('/reports?action=sales-analytics'),
  getSalesReports: (params) => api.get('/reports?action=sales-reports', { params }),
};

// Profile API (JSON only - no file uploads)
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.post('/profile', profileData), // JSON only
};

export default api;