import { Link } from 'react-router-dom';
import { FiHome, FiChevronRight, FiPlusCircle, FiList, FiBarChart2 } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

const AgentDashboard = () => {
    const navigationCards = [
        { 
            to: '/agent', 
            icon: <FiHome size={24} />, 
            label: 'Dashboard',
            description: 'Overview & statistics',
            color: 'bg-blue-100 text-blue-600',
            current: true
        },
        { 
            to: '/agent/list-property', 
            icon: <FiPlusCircle size={24} />, 
            label: 'List Property',
            description: 'Add new property',
            color: 'bg-emerald-100 text-emerald-600'
        },
        { 
            to: '/agent/properties', 
            icon: <FiList size={24} />, 
            label: 'My Properties',
            description: 'Manage listings',
            color: 'bg-purple-100 text-purple-600'
        },
        { 
            to: '/agent/analytics', 
            icon: <FiBarChart2 size={24} />, 
            label: 'Analytics',
            description: 'Performance insights',
            color: 'bg-orange-100 text-orange-600'
        }
    ];

    return (
        <DashboardLayout role="agent">
            <div className="space-y-8">
                {/* Navigation Cards */}
                <div>
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {navigationCards.map((card) => (
                            <Link
                                key={card.to}
                                to={card.to}
                                className={`block p-6 transition-all duration-200 bg-white border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 group ${
                                    card.current ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full ${card.color} group-hover:scale-110 transition-transform`}>
                                        {card.icon}
                                    </div>
                                    <h3 className={`mb-2 text-lg font-semibold ${card.current ? 'text-emerald-700' : 'text-gray-900 group-hover:text-emerald-600'}`}>
                                        {card.label}
                                    </h3>
                                    <p className="text-sm text-gray-600 group-hover:text-gray-700">
                                        {card.description}
                                    </p>
                                    <div className="flex items-center justify-center mt-3">
                                        <FiChevronRight className={`transition-transform group-hover:translate-x-1 ${card.current ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'}`} size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AgentDashboard;