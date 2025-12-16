import axios from 'axios';
import { apiCache } from '../utils/cache';

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
    
    // Handle blocked account
    if (error.response?.status === 403 && error.response?.data?.blocked) {
      window.dispatchEvent(new CustomEvent('account-blocked', { 
        detail: error.response.data 
      }));
      return Promise.reject(error);
    }
    
    // Handle 401 - Don't auto-logout, let app handle it
    if (error.response?.status === 401) {
      // Only redirect if explicitly unauthorized (not just token issues)
      if (error.response?.data?.message?.includes('Access denied')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
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

// Products API with caching
export const productsAPI = {
  getAll: async (params) => {
    const cacheKey = `products_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    // Try IndexedDB for installed app
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      try {
        const { localDB } = await import('../utils/localDB.js');
        const localData = await localDB.getAll('products');
        if (localData && localData.length > 0) {
          // Return local data, sync in background
          setTimeout(() => {
            api.get('/products', { params }).then(res => {
              if (res.data?.success) {
                localDB.bulkSet('products', res.data.products || []).catch(console.error);
              }
            }).catch(console.error);
          }, 100);
          return { data: { success: true, products: localData } };
        }
      } catch (e) {}
    }
    
    const response = await api.get('/products', { params });
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    
    // Store in IndexedDB for offline
    if (response.data?.success && response.data.products) {
      try {
        const { localDB } = await import('../utils/localDB.js');
        localDB.bulkSet('products', response.data.products).catch(console.error);
      } catch (e) {}
    }
    
    return response;
  },
  getById: async (id) => {
    const cacheKey = `product_${id}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get(`/products?id=${id}`);
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    return response;
  },
  create: async (product) => {
    const response = await api.post('/products', product);
    apiCache.clear(); // Clear all cache
    return response;
  },
  update: async (id, product) => {
    const response = await api.put(`/products?id=${id}`, product);
    apiCache.clear(); // Clear all cache
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/products?id=${id}`);
    apiCache.clear(); // Clear all cache
    return response;
  },
  updateStock: async (id, data) => {
    const response = await api.post(`/products?id=${id}&action=stock`, data);
    apiCache.clear(`product_${id}`);
    apiCache.clear('products_');
    return response;
  },
  getLowStock: async () => {
    const cacheKey = 'products_lowStock';
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/products?lowStock=true');
    apiCache.set(cacheKey, response.data, 120000); // 2 min
    return response;
  },
  syncExcel: async (products) => {
    const response = await api.post('/products?action=sync-excel', { products });
    apiCache.clear('products_');
    return response;
  },
};

// Customers API with caching
export const customersAPI = {
  getAll: async (params) => {
    const cacheKey = `customers_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    // Try IndexedDB for installed app
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      try {
        const { localDB } = await import('../utils/localDB.js');
        const localData = await localDB.getAll('customers');
        if (localData && localData.length > 0) {
          setTimeout(() => {
            api.get('/customers', { params }).then(res => {
              if (res.data?.success) {
                localDB.bulkSet('customers', res.data.customers || []).catch(console.error);
              }
            }).catch(console.error);
          }, 100);
          return { data: { success: true, customers: localData } };
        }
      } catch (e) {}
    }
    
    const response = await api.get('/customers', { params });
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    
    // Store in IndexedDB
    if (response.data?.success && response.data.customers) {
      try {
        const { localDB } = await import('../utils/localDB.js');
        localDB.bulkSet('customers', response.data.customers).catch(console.error);
      } catch (e) {}
    }
    
    return response;
  },
  getById: async (id) => {
    const cacheKey = `customer_${id}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get(`/customers?id=${id}`);
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    return response;
  },
  create: async (customer) => {
    const response = await api.post('/customers', customer);
    apiCache.clear(); // Clear all cache
    return response;
  },
  update: async (id, customer) => {
    const response = await api.put(`/customers?id=${id}`, customer);
    apiCache.clear(); // Clear all cache
    return response;
  },
  getPurchaseHistory: async (id) => {
    const cacheKey = `customer_purchases_${id}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get(`/customers?id=${id}&action=purchases`);
    apiCache.set(cacheKey, response.data, 180000); // 3 min
    return response;
  },
};

// Invoices API with caching
export const invoicesAPI = {
  getAll: async (params) => {
    const cacheKey = `invoices_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/invoices', { params });
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    return response;
  },
  getById: async (id) => {
    const cacheKey = `invoice_${id}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get(`/invoices?id=${id}`);
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    return response;
  },
  create: async (invoice) => {
    const response = await api.post('/invoices', invoice);
    apiCache.clear(); // Clear all cache
    return response;
  },
  generatePDF: (id) => api.get(`/invoices?id=${id}&action=pdf`, { responseType: 'blob' }),
  getWhatsAppLink: (id) => api.get(`/invoices?id=${id}&action=whatsapp`),
  updatePayment: async (id, paymentData) => {
    const response = await api.put(`/invoices?id=${id}&action=payment`, paymentData);
    apiCache.clear(`invoice_${id}`);
    apiCache.clear('invoices_');
    apiCache.clear('dashboard');
    return response;
  },
};

// Reports API with caching
export const reportsAPI = {
  getSales: async (params) => {
    const cacheKey = `sales_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/reports?action=sales', { params });
    apiCache.set(cacheKey, response.data, 120000); // 2 min
    return response;
  },
  getProfit: async (params) => {
    const cacheKey = `profit_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/reports?action=profit', { params });
    apiCache.set(cacheKey, response.data, 120000); // 2 min
    return response;
  },
  getTopProducts: async (params) => {
    const cacheKey = `topProducts_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/reports?action=top-products', { params });
    apiCache.set(cacheKey, response.data, 180000); // 3 min
    return response;
  },
  getDashboard: async () => {
    const cacheKey = 'dashboard';
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/reports');
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    return response;
  },
  getSalesAnalytics: async () => {
    const cacheKey = 'salesAnalytics';
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/reports?action=sales-analytics');
    apiCache.set(cacheKey, response.data, 180000); // 3 min
    return response;
  },
  getSalesReports: async (params) => {
    const cacheKey = `salesReports_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/reports?action=sales-reports', { params });
    apiCache.set(cacheKey, response.data, 120000); // 2 min
    return response;
  },
};

// Profile API with caching (now part of account)
export const profileAPI = {
  getProfile: async () => {
    const cacheKey = 'businessProfile';
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    
    const response = await api.get('/account?type=profile');
    apiCache.set(cacheKey, response.data, 300000); // 5 min
    return response;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/account?type=profile', profileData);
    apiCache.clear('businessProfile');
    return response;
  },
};

// Employees API (now part of account)
export const employeesAPI = {
  getAll: async () => {
    const cached = apiCache.get('employees');
    if (cached) return { data: cached };
    const response = await api.get('/account?type=employees');
    apiCache.set('employees', response.data, 300000);
    return response;
  },
  getById: async (id) => {
    const cached = apiCache.get(`employee_${id}`);
    if (cached) return { data: cached };
    const response = await api.get(`/account?type=employees&action=single&id=${id}`);
    apiCache.set(`employee_${id}`, response.data, 300000);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/account?type=employees', data);
    apiCache.clear('employees');
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/account?type=employees&id=${id}`, data);
    apiCache.clear('employees');
    apiCache.clear(`employee_${id}`);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/account?type=employees&id=${id}`);
    apiCache.clear('employees');
    apiCache.clear(`employee_${id}`);
    return response;
  }
};

// Expenses API
export const expensesAPI = {
  getAll: async (params) => {
    const cacheKey = `expenses_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    const response = await api.get('/expenses', { params });
    apiCache.set(cacheKey, response.data, 180000);
    return response;
  },
  getById: async (id) => {
    const cached = apiCache.get(`expense_${id}`);
    if (cached) return { data: cached };
    const response = await api.get(`/expenses?id=${id}`);
    apiCache.set(`expense_${id}`, response.data, 300000);
    return response;
  },
  getSummary: async (params) => {
    const cacheKey = `expenseSummary_${JSON.stringify(params || {})}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { data: cached };
    const response = await api.get('/expenses', { params: { action: 'summary', ...params } });
    apiCache.set(cacheKey, response.data, 180000);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/expenses', data);
    apiCache.clear(); // Clear all cache
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/expenses?id=${id}`, data);
    apiCache.clear(); // Clear all cache
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/expenses?id=${id}`);
    apiCache.clear('expenses_');
    apiCache.clear(`expense_${id}`);
    return response;
  }
};

// Payments API (now part of invoices)
export const paymentsAPI = {
  getAll: (params) => api.get('/invoices?action=payment', { params }),
  getByInvoice: (invoiceId) => api.get(`/invoices?action=payment&invoiceId=${invoiceId}`),
  getByCustomer: (customerId) => api.get(`/invoices?action=payment&customerId=${customerId}`),
  create: (data) => api.post('/invoices?action=payment', data),
  delete: (id) => api.delete(`/invoices?id=${id}&action=payment`)
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications?action=mark-read&id=${id}`),
  markAllAsRead: () => api.put('/notifications?action=mark-read'),
  delete: (id) => api.delete(`/notifications?id=${id}`)
};

export default api;