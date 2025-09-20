import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import PropertyListing from './pages/PropertyListing';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import Neighborhoods from './pages/Neighborhoods';
import Agents from './pages/Agents';
import VendorApplication from './pages/VendorApplication';
import Notifications from './pages/Notifications';

// User dashboard
import UserDashboard from './pages/dashboards/user/UserDashboard';
import SavedProperties from './pages/dashboards/user/SavedProperties';
import UserBookings from './pages/dashboards/user/UserBookings';
import UserProfile from './pages/dashboards/user/UserProfile';

// Vendor dashboard
import VendorDashboard from './pages/dashboards/vendor/VendorDashboard';
import ListProperty from './pages/dashboards/vendor/ListProperty';
import ManageProperties from './pages/dashboards/vendor/ManageProperties';
import EditProperty from './pages/dashboards/vendor/EditProperty';
import VendorBookings from './pages/dashboards/vendor/VendorBookings';
import PropertyAnalytics from './pages/dashboards/vendor/PropertyAnalytics';

// Admin dashboard
import AdminDashboard from './pages/dashboards/admin/AdminDashboard';
import UserManagement from './pages/dashboards/admin/UserManagement';
import PropertyManagement from './pages/dashboards/admin/PropertyManagement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyListing />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/neighborhoods" element={<Neighborhoods />} />
          <Route path="/agents" element={<Agents />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Vendor application route */}
          <Route path="/vendor-application" element={
            <ProtectedRoute>
              <VendorApplication />
            </ProtectedRoute>
          } />

          {/* User dashboard routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/saved" element={
            <ProtectedRoute>
              <SavedProperties />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/bookings" element={
            <ProtectedRoute>
              <UserBookings />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          {/* Vendor dashboard routes */}
          <Route path="/vendor" element={
            <ProtectedRoute requiredRole="vendor">
              <VendorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/vendor/list-property" element={
            <ProtectedRoute requiredRole="vendor">
              <ListProperty />
            </ProtectedRoute>
          } />
          <Route path="/vendor/properties" element={
            <ProtectedRoute requiredRole="vendor">
              <ManageProperties />
            </ProtectedRoute>
          } />
          {/* Add the new Edit Property route */}
          <Route path="/vendor/edit-property/:id" element={
            <ProtectedRoute requiredRole="vendor">
              <EditProperty />
            </ProtectedRoute>
          } />
          <Route path="/vendor/bookings" element={
            <ProtectedRoute requiredRole="vendor">
              <VendorBookings />
            </ProtectedRoute>
          } />
          <Route path="/vendor/analytics" element={
            <ProtectedRoute requiredRole="vendor">
              <PropertyAnalytics />
            </ProtectedRoute>
          } />

          {/* Admin dashboard routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/properties" element={
            <ProtectedRoute requiredRole="admin">
              <PropertyManagement />
            </ProtectedRoute>
          } />

          {/* Notifications route */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;