import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Toast from './components/ui/Toast';
import BlockedAccountModal from './components/BlockedAccountModal';

const ModernLayout = lazy(() => import('./components/ModernLayout'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const SuperAdminOrganizations = lazy(() => import('./pages/superadmin/Organizations'));
const CreateOrganization = lazy(() => import('./pages/superadmin/CreateOrganization'));
const OrganizationDetail = lazy(() => import('./pages/superadmin/OrganizationDetail'));
const SuperAdminUsers = lazy(() => import('./pages/superadmin/Users'));
const SuperAdminSupport = lazy(() => import('./pages/superadmin/Support'));
const Support = lazy(() => import('./pages/Support'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Invoices = lazy(() => import('./pages/Invoices'));
const AddInvoice = lazy(() => import('./pages/AddInvoice'));
const ViewInvoice = lazy(() => import('./pages/ViewInvoice'));
const SalesReports = lazy(() => import('./pages/SalesReports'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Employees = lazy(() => import('./pages/Employees'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));



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

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'superadmin') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  return !isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  const [blockedInfo, setBlockedInfo] = useState(null);

  useEffect(() => {
    const handleBlocked = (event) => {
      setBlockedInfo(event.detail);
    };
    window.addEventListener('account-blocked', handleBlocked);
    return () => window.removeEventListener('account-blocked', handleBlocked);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              {blockedInfo && (
                <BlockedAccountModal
                  message={blockedInfo.message}
                  monthlyFee={blockedInfo.monthlyFee}
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
                            <Route path="/superadmin" element={
                              <SuperAdminRoute>
                                <SuperAdminDashboard />
                              </SuperAdminRoute>
                            } />
                            <Route path="/superadmin/organizations" element={
                              <SuperAdminRoute>
                                <SuperAdminOrganizations />
                              </SuperAdminRoute>
                            } />
                            <Route path="/superadmin/organizations/create" element={
                              <SuperAdminRoute>
                                <CreateOrganization />
                              </SuperAdminRoute>
                            } />
                            <Route path="/superadmin/organizations/:id" element={
                              <SuperAdminRoute>
                                <OrganizationDetail />
                              </SuperAdminRoute>
                            } />
                            <Route path="/superadmin/users" element={
                              <SuperAdminRoute>
                                <SuperAdminUsers />
                              </SuperAdminRoute>
                            } />
                            <Route path="/superadmin/support" element={
                              <SuperAdminRoute>
                                <SuperAdminSupport />
                              </SuperAdminRoute>
                            } />
                            <Route path="/support" element={<Support />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/products/:id" element={<ProductDetail />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/customers/:id" element={<CustomerDetail />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/invoices/add" element={<AddInvoice />} />
                            <Route path="/invoices/view/:id" element={<ViewInvoice />} />
                            <Route path="/sales-reports" element={<SalesReports />} />
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/employees" element={<Employees />} />
                            <Route path="/business-profile" element={<BusinessProfile />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings/*" element={<Settings />} />

                          </Routes>
                        </Suspense>
                      </ModernLayout>
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              </Routes>
              <Toast />
            </div>
          </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;