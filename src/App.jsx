import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Toast from './components/ui/Toast';

const ModernLayout = lazy(() => import('./components/ModernLayout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Invoices = lazy(() => import('./pages/Invoices'));
const AddInvoice = lazy(() => import('./pages/AddInvoice'));
const ViewInvoice = lazy(() => import('./pages/ViewInvoice'));
const SalesReports = lazy(() => import('./pages/SalesReports'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  return !isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
          <Router>
            <div className="App">
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
                path="/register" 
                element={
                  <PublicRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Register />
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
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/products/:id" element={<ProductDetail />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/customers/:id" element={<CustomerDetail />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/invoices/add" element={<AddInvoice />} />
                            <Route path="/invoices/view/:id" element={<ViewInvoice />} />
                            <Route path="/sales-reports" element={<SalesReports />} />
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