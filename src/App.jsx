import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ModernLayout from './components/ModernLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import AddInvoice from './pages/AddInvoice';
import ViewInvoice from './pages/ViewInvoice';
import SalesReports from './pages/SalesReports';
import BusinessProfile from './pages/BusinessProfile';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Toast from './components/ui/Toast';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
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
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <ModernLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/invoices/add" element={<AddInvoice />} />
                        <Route path="/invoices/view/:id" element={<ViewInvoice />} />
                        <Route path="/sales-reports" element={<SalesReports />} />
                        <Route path="/business-profile" element={<BusinessProfile />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings/*" element={<Settings />} />
                      </Routes>
                    </ModernLayout>
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