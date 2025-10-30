import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiUsers, FiHome, FiDollarSign, FiBarChart2,
    FiCalendar, FiChevronRight, FiCheckCircle, FiAlertCircle, FiDatabase
} from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import AdminApplications from '../../../components/AdminApplications'

const AdminDashboard = () => {
    const { currentUser, userDetails } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is admin
        if (!userDetails || userDetails.role !== 'admin') {
            setError('You do not have permission to access this page');
            setIsLoading(false);
            return;
        }
        setIsLoading(false);
    }, [userDetails]);

    const navigationCards = [
        { 
            to: '/admin', 
            icon: <FiBarChart2 size={24} />, 
            label: 'Dashboard',
            description: 'Overview & analytics',
            color: 'bg-blue-100 text-blue-600',
            current: true
        },
        { 
            to: '/admin/users', 
            icon: <FiUsers size={24} />, 
            label: 'User Management',
            description: 'Manage all users',
            color: 'bg-emerald-100 text-emerald-600'
        },
        { 
            to: '/admin/properties', 
            icon: <FiDatabase size={24} />, 
            label: 'Property Management',
            description: 'Manage all properties',
            color: 'bg-purple-100 text-purple-600'
        }
    ];

    if (isLoading) {
        return (
            <DashboardLayout role="admin">
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="admin">
                <div className="p-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
                    <h3 className="mb-2 text-lg font-medium">Error</h3>
                    <p>{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {navigationCards.map((card) => (
                            <Link
                                key={card.to}
                                to={card.to}
                                className={`block p-8 transition-all duration-200 bg-white border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 group ${
                                    card.current ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full ${card.color} group-hover:scale-110 transition-transform`}>
                                        {card.icon}
                                    </div>
                                    <h3 className={`mb-3 text-xl font-semibold ${card.current ? 'text-emerald-700' : 'text-gray-900 group-hover:text-emerald-600'}`}>
                                        {card.label}
                                    </h3>
                                    <p className="text-gray-600 group-hover:text-gray-700">
                                        {card.description}
                                    </p>
                                    <div className="flex items-center justify-center mt-4">
                                        <FiChevronRight className={`transition-transform group-hover:translate-x-1 ${card.current ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'}`} size={20} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <AdminApplications />
        </DashboardLayout>
    );
};

export default AdminDashboard;