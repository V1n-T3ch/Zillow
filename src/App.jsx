import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import MobileTabNavigator from './components/MobileTabNavigator';
import Home from './pages/Home';
import PropertyListing from './pages/PropertyListing';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import AgentApplication from './pages/AgentApplication';
import Notifications from './pages/Notifications';
import PropertyCategory from './pages/PropertyCategory';

// User dashboard
import UserDashboard from './pages/dashboards/user/UserDashboard';
import SavedProperties from './pages/dashboards/user/SavedProperties';
import UserProfile from './pages/dashboards/user/UserProfile';

// Agent dashboard
import AgentDashboard from './pages/dashboards/agent/AgentDashboard';
import ListProperty from './pages/dashboards/agent/ListProperty';
import ManageProperties from './pages/dashboards/agent/ManageProperties';
import EditProperty from './pages/dashboards/agent/EditProperty';
import PropertyAnalytics from './pages/dashboards/agent/PropertyAnalytics';

// Admin dashboard
import AdminDashboard from './pages/dashboards/admin/AdminDashboard';
import UserManagement from './pages/dashboards/admin/UserManagement';
import PropertyManagement from './pages/dashboards/admin/PropertyManagement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white">
          {/* Main content with bottom padding for mobile nav */}
          <div className="pb-16 md:pb-0">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<PropertyListing />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Agent application route */}
              <Route path="/agent-application" element={
                <ProtectedRoute>
                  <AgentApplication />
                </ProtectedRoute>
              } />

              {/* User dashboard routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/saved" element={
                <ProtectedRoute>
                  <SavedProperties />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />

              {/* Agent dashboard routes */}
              <Route path="/agent" element={
                <ProtectedRoute requiredRole="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/agent/list-property" element={
                <ProtectedRoute requiredRole="agent">
                  <ListProperty />
                </ProtectedRoute>
              } />
              <Route path="/agent/properties" element={
                <ProtectedRoute requiredRole="agent">
                  <ManageProperties />
                </ProtectedRoute>
              } />
              <Route path="/agent/edit-property/:id" element={
                <ProtectedRoute requiredRole="agent">
                  <EditProperty />
                </ProtectedRoute>
              } />
              <Route path="/agent/analytics" element={
                <ProtectedRoute requiredRole="agent">
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
              <Route path="/category" element={<PropertyCategory />} />
            </Routes>
          </div>
          
          {/* Mobile Tab Navigator - appears on all pages */}
          <MobileTabNavigator />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
