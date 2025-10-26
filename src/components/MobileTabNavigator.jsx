import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiHeart, FiUser } from 'react-icons/fi';
import { FaHouseUser } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

const MobileTabNavigator = () => {
    const location = useLocation();
    const { currentUser } = useAuth();
    
    const tabs = [
        {
            name: 'Home',
            path: '/',
            icon: FiHome,
            activeColor: 'text-emerald-600',
            inactiveColor: 'text-gray-400'
        },
        {
            name: 'Saved',
            path: '/saved',
            icon: FiHeart,
            activeColor: 'text-emerald-600',
            inactiveColor: 'text-gray-400'
        },
        {
            name: 'Agents',
            path: '/agent-application',
            icon: FaHouseUser,
            activeColor: 'text-emerald-600',
            inactiveColor: 'text-gray-400'
        },
        {
            name: 'Profile',
            path: currentUser ? '/profile' : '/login',
            icon: FiUser,
            activeColor: 'text-emerald-600',
            inactiveColor: 'text-gray-400'
        }
    ];

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
            <div className="flex items-center justify-around py-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.path);
                    
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                                active ? tab.activeColor : tab.inactiveColor
                            }`}
                        >
                            <Icon 
                                size={24} 
                                className={`mb-1 ${active ? 'stroke-2' : 'stroke-1'}`}
                            />
                            <span className={`text-xs font-medium ${
                                active ? 'text-emerald-600' : 'text-gray-500'
                            }`}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileTabNavigator;