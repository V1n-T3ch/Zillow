import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome, FiUser, FiList, FiHeart, FiCalendar,
    FiLogOut, FiMenu, FiX, FiPlusCircle,
    FiUsers, FiDatabase, FiBarChart2
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../Navbar';

const DashboardLayout = ({ children, role = 'user' }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentUser, userDetails, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // Navigation links based on user role
    let navLinks = [];

    if (role === 'user') {
        navLinks = [
            { to: '/dashboard', icon: <FiHome size={20} />, label: 'Dashboard' },
            { to: '/dashboard/saved', icon: <FiHeart size={20} />, label: 'Saved Properties' },
            { to: '/dashboard/bookings', icon: <FiCalendar size={20} />, label: 'My Bookings' },
            { to: '/dashboard/profile', icon: <FiUser size={20} />, label: 'My Profile' },
        ];
    } else if (role === 'vendor') {
        navLinks = [
            { to: '/vendor', icon: <FiHome size={20} />, label: 'Dashboard' },
            { to: '/vendor/list-property', icon: <FiPlusCircle size={20} />, label: 'List Property' },
            { to: '/vendor/properties', icon: <FiList size={20} />, label: 'My Properties' },
            { to: '/vendor/bookings', icon: <FiCalendar size={20} />, label: 'Booking Requests' },
            { to: '/vendor/analytics', icon: <FiBarChart2 size={20} />, label: 'Analytics' },
        ];
    } else if (role === 'admin') {
        navLinks = [
            { to: '/admin', icon: <FiBarChart2 size={20} />, label: 'Dashboard' },
            { to: '/admin/users', icon: <FiUsers size={20} />, label: 'User Management' },
            { to: '/admin/properties', icon: <FiDatabase size={20} />, label: 'Property Management' },
        ];
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pb-10 pt-25">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row">
                        {/* Mobile Sidebar Toggle */}
                        <div className="flex items-center justify-between mb-6 lg:hidden">
                            <h1 className="text-2xl font-bold text-gray-800">
                                {role === 'user' ? 'User Dashboard' : role === 'vendor' ? 'Vendor Dashboard' : 'Admin Dashboard'}
                            </h1>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 text-gray-500 bg-white rounded-md shadow-sm hover:text-emerald-600"
                            >
                                {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                            </button>
                        </div>

                        {/* Sidebar */}
                        <div
                            className={`lg:w-1/4 bg-white shadow-md rounded-xl p-6 lg:sticky lg:top-24 lg:h-fit ${sidebarOpen ? 'block' : 'hidden lg:block'
                                }`}
                        >
                            {/* User Profile Summary */}
                            <div className="flex items-center mb-8">
                                {currentUser?.photoURL ? (
                                    <img
                                        src={currentUser.photoURL}
                                        alt={currentUser.displayName || 'User'}
                                        className="object-cover w-12 h-12 mr-4 rounded-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-12 h-12 mr-4 font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                        {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-800">{currentUser?.displayName || 'User'}</h3>
                                    <p className="text-sm text-gray-500">{userDetails?.role || role}</p>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <nav className="space-y-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive(link.to)
                                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <span className="mr-3">{link.icon}</span>
                                        {link.label}
                                    </Link>
                                ))}

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-3 text-gray-600 transition-colors rounded-lg hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <FiLogOut size={20} className="mr-3" />
                                    Logout
                                </button>
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="mt-6 lg:w-3/4 lg:ml-8 lg:mt-0">
                            {/* Page Heading - visible on desktop */}
                            <div className="hidden mb-6 lg:block">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {role === 'user' ? 'User Dashboard' : role === 'vendor' ? 'Vendor Dashboard' : 'Admin Dashboard'}
                                </h1>
                            </div>

                            {/* Page Content */}
                            <div className="p-6 bg-white shadow-md rounded-xl">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;