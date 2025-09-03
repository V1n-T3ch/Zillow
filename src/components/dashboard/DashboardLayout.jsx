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

            <div className="pt-20 pb-10">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row">
                        {/* Mobile Sidebar Toggle */}
                        <div className="lg:hidden flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                {role === 'user' ? 'User Dashboard' : role === 'vendor' ? 'Vendor Dashboard' : 'Admin Dashboard'}
                            </h1>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-md bg-white shadow-sm text-gray-500 hover:text-emerald-600"
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
                                        className="w-12 h-12 rounded-full object-cover mr-4"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold mr-4">
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
                                    className="flex items-center w-full px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                >
                                    <FiLogOut size={20} className="mr-3" />
                                    Logout
                                </button>
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="lg:w-3/4 lg:ml-8 mt-6 lg:mt-0">
                            {/* Page Heading - visible on desktop */}
                            <div className="hidden lg:block mb-6">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {role === 'user' ? 'User Dashboard' : role === 'vendor' ? 'Vendor Dashboard' : 'Admin Dashboard'}
                                </h1>
                            </div>

                            {/* Page Content */}
                            <div className="bg-white shadow-md rounded-xl p-6">
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