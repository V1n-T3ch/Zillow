import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';
import Navbar from '../Navbar';

const DashboardLayout = ({ children, role = 'user' }) => {
    const { currentUser, userDetails } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get display name from userDetails or currentUser
    const getDisplayName = () => {
        if (userDetails?.firstName && userDetails?.lastName) {
            return `${userDetails.firstName} ${userDetails.lastName}`;
        }
        if (userDetails?.firstName) {
            return userDetails.firstName;
        }
        if (currentUser?.displayName) {
            return currentUser.displayName;
        }
        if (currentUser?.email) {
            return currentUser.email.split('@')[0];
        }
        return 'User';
    };

    // Get current page info based on pathname
    const getCurrentPageInfo = () => {
        const path = location.pathname;
        
        if (path.includes('/admin')) {
            if (path === '/admin') return { title: 'Dashboard', parentPath: null, parentTitle: null };
            if (path === '/admin/users') return { title: 'User Management', parentPath: '/admin', parentTitle: 'Dashboard' };
            if (path === '/admin/properties') return { title: 'Property Management', parentPath: '/admin', parentTitle: 'Dashboard' };
        }
        
        if (path.includes('/agent')) {
            if (path === '/agent') return { title: 'Dashboard', parentPath: null, parentTitle: null };
            if (path === '/agent/list-property') return { title: 'List Property', parentPath: '/agent', parentTitle: 'Dashboard' };
            if (path === '/agent/properties') return { title: 'My Properties', parentPath: '/agent', parentTitle: 'Dashboard' };
            if (path === '/agent/analytics') return { title: 'Analytics', parentPath: '/agent', parentTitle: 'Dashboard' };
            if (path.includes('/agent/edit-property')) return { title: 'Edit Property', parentPath: '/agent/properties', parentTitle: 'My Properties' };
            if (path === '/agent/bookings') return { title: 'Bookings', parentPath: '/agent', parentTitle: 'Dashboard' };
        }
        
        if (path.includes('/dashboard')) {
            if (path === '/dashboard') return { title: 'Dashboard', parentPath: null, parentTitle: null };
            if (path === '/dashboard/saved') return { title: 'Saved Properties', parentPath: '/dashboard', parentTitle: 'Dashboard' };
            if (path === '/dashboard/bookings') return { title: 'My Bookings', parentPath: '/dashboard', parentTitle: 'Dashboard' };
            if (path === '/dashboard/profile') return { title: 'Profile', parentPath: '/dashboard', parentTitle: 'Dashboard' };
        }
        
        return { title: 'Dashboard', parentPath: null, parentTitle: null };
    };

    const pageInfo = getCurrentPageInfo();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pb-16 pt-20 md:pb-8">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8 mt-8">
                        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    Welcome back, {getDisplayName()}!
                                </h1>
                                <p className="mt-2 text-lg text-gray-600">
                                    {role === 'user' ? 'Manage your saved properties and bookings' : 
                                     role === 'agent' ? 'Manage your property listings and bookings' : 
                                     'Manage platform users and properties'}
                                </p>
                            </div>

                            {/* Navigation Indicator - visible on desktop */}
                            {pageInfo.parentPath && (
                                <div className="hidden md:block">
                                    <nav className="flex items-center space-x-2 text-sm">
                                        <button
                                            onClick={() => navigate(pageInfo.parentPath)}
                                            className="flex items-center px-4 py-2 text-gray-600 transition-colors border border-gray-300 rounded-lg hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                                        >
                                            <FiArrowLeft className="mr-2" size={16} />
                                            {pageInfo.parentTitle}
                                        </button>
                                        <FiChevronRight className="text-gray-400" size={16} />
                                        <span className="px-3 py-2 font-medium text-gray-900 bg-white border border-gray-200 rounded-lg">
                                            {pageInfo.title}
                                        </span>
                                    </nav>
                                </div>
                            )}
                        </div>

                        {/* Mobile Navigation Indicator */}
                        {pageInfo.parentPath && (
                            <div className="mt-4 md:hidden">
                                <nav className="flex items-center space-x-2 text-sm">
                                    <button
                                        onClick={() => navigate(pageInfo.parentPath)}
                                        className="flex items-center px-3 py-2 text-gray-600 transition-colors rounded-lg hover:text-emerald-600 hover:bg-emerald-50"
                                    >
                                        <FiArrowLeft className="mr-2" size={16} />
                                        {pageInfo.parentTitle}
                                    </button>
                                    <FiChevronRight className="text-gray-400" size={16} />
                                    <span className="font-medium text-gray-900">{pageInfo.title}</span>
                                </nav>
                            </div>
                        )}
                    </div>

                    {/* Main Content - Full Width */}
                    <div className="w-full">
                        <div className="p-6 bg-white shadow-sm md:p-8 rounded-xl">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;