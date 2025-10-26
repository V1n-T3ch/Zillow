import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiHeart, FiLogOut } from 'react-icons/fi';
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaBuildingColumns } from "react-icons/fa6";
import { useAuth } from '../hooks/useAuth';
import Logo from '/Dwella.jpg'
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const { currentUser, userDetails, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${scrolled ? 'shadow-md py-3' : 'py-5'
            }`}>
            <div className="flex items-center justify-between w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img src={Logo} alt="Dwella" className='h-14 w-18'/>
                </Link>

                {/* Desktop Right Side Actions */}
                <div className="items-center hidden space-x-4 lg:flex">
                    {currentUser ? (
                        <>
                            <Link to="/saved" className="p-2 text-gray-600 rounded-full hover:text-emerald-500 hover:bg-gray-100">
                                <FiHeart size={20} />
                            </Link>
                            <NotificationBell />
                            <div className="relative group">
                                <button className="flex items-center p-2 space-x-2 rounded-full hover:bg-gray-100">
                                    {currentUser.photoURL ? (
                                        <img
                                            src={currentUser.photoURL}
                                            alt={currentUser.displayName || 'User'}
                                            className="object-cover w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-8 h-8 font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <span className="text-gray-700">{currentUser.displayName || 'User'}</span>
                                </button>
                                <div className="absolute right-0 invisible w-48 mt-2 transition-all duration-300 origin-top-right transform bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 group-hover:visible">
                                    <Link to="/profile" className="flex items-center px-4 py-3 text-gray-700 rounded-t-lg hover:bg-gray-50 hover:text-emerald-600">
                                        <FiUser className="mr-2" size={16} />
                                        Profile
                                    </Link>
                                    
                                    {userDetails?.role === 'admin' && (
                                        <Link to="/admin" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                                            <MdOutlineAdminPanelSettings className="mr-2" size={16} />
                                            Admin Panel
                                        </Link>
                                    )}
                                    {userDetails?.role === 'agent' && (
                                        <Link to="/agent" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                                            <FaBuildingColumns className="mr-2" size={16} />
                                            Agent Panel
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-3 text-left text-gray-700 rounded-b-lg hover:bg-gray-50 hover:text-emerald-600"
                                    >
                                        <FiLogOut className="mr-2" size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="flex items-center px-6 py-2 font-medium text-white transition-colors rounded-full bg-emerald-600 hover:bg-emerald-700"
                            >
                                <FiUser className="mr-2" /> Sign In
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Right Side - Only User Avatar or Sign In */}
                <div className="flex items-center space-x-3 lg:hidden">
                    {currentUser ? (
                        <>
                            <NotificationBell />
                            <Link to="/dashboard">
                                {currentUser.photoURL ? (
                                    <img
                                        src={currentUser.photoURL}
                                        alt={currentUser.displayName || 'User'}
                                        className="object-cover w-8 h-8 rounded-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-8 h-8 font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;