import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { currentUser, userDetails, loading } = useAuth();

    // Wait until auth state is loaded
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    // Check if user is logged in
    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Check for role requirement
    if (requiredRole && (!userDetails || userDetails.role !== requiredRole)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;