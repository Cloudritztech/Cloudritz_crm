// v1.0.1 - Fixed ModernLayout loading
import React, { lazy, Suspense, useState, useEffect } from 'react';

// Retry lazy loading with exponential backoff
const lazyWithRetry = (componentImport) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const hasRefreshed = JSON.parse(
        window.sessionStorage.getItem('retry-lazy-refreshed') || 'false'
      );

      componentImport()
        .then((component) => {
          window.sessionStorage.setItem('retry-lazy-refreshed', 'false');
          resolve(component);
        })
        .catch((error) => {
          if (!hasRefreshed) {
            window.sessionStorage.setItem('retry-lazy-refreshed', 'true');
            return window.location.reload();
          }
          reject(error);
        });
    });
  });
};
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Toast from './components/ui/Toast';
import BlockedAccountModal from './components/BlockedAccountModal';
import ModernLayout from './components/ModernLayout';
import InstallPrompt from './components/InstallPrompt';
import NotificationPrompt from './components/NotificationPrompt';
import ProtectedRoute from './components/ProtectedRoute';
const Login = lazyWithRetry(() => import('./pages/Login'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Support = lazyWithRetry(() => import('./pages/Support'));
const Products = lazyWithRetry(() => import('./pages/Products'));
const Customers = lazyWithRetry(() => import('./pages/Customers'));
const Invoices = lazyWithRetry(() => import('./pages/Invoices'));
const AddInvoice = lazyWithRetry(() => import('./pages/AddInvoice'));
const ViewInvoice = lazyWithRetry(() => import('./pages/ViewInvoice'));
const SalesReports = lazyWithRetry(() => import('./pages/SalesReports'));
const BusinessProfile = lazyWithRetry(() => import('./pages/BusinessProfile'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const CustomerDetail = lazyWithRetry(() => import('./pages/CustomerDetail'));
const Expenses = lazyWithRetry(() => import('./pages/Expenses'));
const Employees = lazyWithRetry(() => import('./pages/Employees'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const Notifications = lazyWithRetry(() => import('./pages/Notifications'));



const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

const SkeletonLoader = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ))}
    </div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error loading component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function AppContent() {
  const [blockedInfo, setBlockedInfo] = useState(null);

  useEffect(() => {
    const handleBlocked = (event) => {
      setBlockedInfo(event.detail);
    };
    window.addEventListener('account-blocked', handleBlocked);
    return () => window.removeEventListener('account-blocked', handleBlocked);
  }, []);

  return (
          <ErrorBoundary>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              {blockedInfo && (
                <BlockedAccountModal
                  message={blockedInfo.message}
                  quarterlyFee={blockedInfo.quarterlyFee}
                  contactInfo={blockedInfo.contactInfo}
                />
              )}
              <Routes>
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Login />
                    </Suspense>
                  </PublicRoute>
                } 
              />

              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ModernLayout>
                        <Suspense fallback={<SkeletonLoader />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/support" element={<Support />} />
                            <Route path="/products" element={
                              <ProtectedRoute requiredPermission="view_products">
                                <Products />
                              </ProtectedRoute>
                            } />
                            <Route path="/products/:id" element={
                              <ProtectedRoute requiredPermission="view_products">
                                <ProductDetail />
                              </ProtectedRoute>
                            } />
                            <Route path="/customers" element={
                              <ProtectedRoute requiredPermission="view_customers">
                                <Customers />
                              </ProtectedRoute>
                            } />
                            <Route path="/customers/:id" element={
                              <ProtectedRoute requiredPermission="view_customers">
                                <CustomerDetail />
                              </ProtectedRoute>
                            } />
                            <Route path="/invoices" element={
                              <ProtectedRoute requiredPermission="view_invoices">
                                <Invoices />
                              </ProtectedRoute>
                            } />
                            <Route path="/invoices/add" element={
                              <ProtectedRoute requiredPermission="create_invoice">
                                <AddInvoice />
                              </ProtectedRoute>
                            } />
                            <Route path="/invoices/view/:id" element={
                              <ProtectedRoute requiredPermission="view_invoices">
                                <ViewInvoice />
                              </ProtectedRoute>
                            } />
                            <Route path="/sales-reports" element={
                              <ProtectedRoute requiredPermission="view_reports">
                                <SalesReports />
                              </ProtectedRoute>
                            } />
                            <Route path="/expenses" element={
                              <ProtectedRoute requiredPermission="view_expenses">
                                <Expenses />
                              </ProtectedRoute>
                            } />
                            <Route path="/employees" element={
                              <ProtectedRoute requiredPermission="manage_users">
                                <Employees />
                              </ProtectedRoute>
                            } />
                            <Route path="/business-profile" element={<BusinessProfile />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={
                              <ProtectedRoute requiredPermission="view_settings">
                                <Settings />
                              </ProtectedRoute>
                            } />
                            <Route path="/notifications" element={<Notifications />} />
                          </Routes>
                        </Suspense>
                      </ModernLayout>
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              </Routes>
              <Toast />
              <InstallPrompt />
              <NotificationPrompt />
            </div>
          </Router>
          </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;