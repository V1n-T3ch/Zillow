import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiUser, FiMenu, FiX, FiHeart, FiLogOut } from 'react-icons/fi';
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaBuildingColumns } from "react-icons/fa6";
import { useAuth } from '../hooks/useAuth';
import Logo from '/Dwella.jpg'
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, userDetails, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${scrolled ? 'shadow-md py-3' : 'py-5'
            }`}>
            <div className="flex items-center justify-between w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img src={Logo} alt="Dwella" className='h-14 w-18'/>
                </Link>

                {/* Desktop Navigation */}
                <div className="items-center hidden space-x-8 lg:flex">
                    <Link
                        to="/"
                        className={`text-gray-700 hover:text-emerald-500 transition-colors font-medium ${isActive('/') ? 'border-b-2 border-emerald-500' : ''}`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/properties"
                        className={`text-gray-700 hover:text-emerald-500 transition-colors font-medium ${isActive('/properties') ? 'border-b-2 border-emerald-500' : ''}`}
                    >
                        Properties
                    </Link>
                    <div className="relative group">
                        <button className="flex items-center font-medium text-gray-700 transition-colors hover:text-emerald-500">
                            Explore <span className="ml-1">▼</span>
                        </button>
                        <div className="absolute left-0 invisible w-48 mt-2 transition-all duration-300 origin-top-left transform bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 group-hover:visible">
                            <Link to="/neighborhoods" className="block px-4 py-3 text-gray-700 rounded-t-lg hover:bg-gray-50 hover:text-emerald-600">Neighborhoods</Link>
                            <Link to="/agents" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">Agents</Link>
                            {/* <Link to="/mortgage" className="block px-4 py-3 text-gray-700 rounded-b-lg hover:bg-gray-50 hover:text-emerald-600">Mortgage</Link> */}
                        </div>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="items-center hidden space-x-4 lg:flex">
                    {currentUser ? (
                        <>
                            <Link to="/favorites" className="p-2 text-gray-600 rounded-full hover:text-emerald-500 hover:bg-gray-100">
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
                                    <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-700 rounded-t-lg hover:bg-gray-50 hover:text-emerald-600">
                                        <FiUser className="mr-2" size={16} />
                                        Dashboard
                                    </Link>
                                    <Link to="/favorites" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                                        <FiHeart className="mr-2" size={16} />
                                        Saved Homes
                                    </Link>
                                    
                                    {userDetails?.role === 'admin' && (
                                        <Link to="/admin" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                                            <MdOutlineAdminPanelSettings className="mr-2" size={16} />
                                            Admin Panel
                                        </Link>
                                    )}
                                    {userDetails?.role === 'vendor' && (
                                        <Link to="/vendor" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                                            <FaBuildingColumns className="mr-2" size={16} />
                                            Vendor Panel
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

                {/* Mobile Menu Button */}
                <button
                    className="p-2 text-gray-700 rounded-full lg:hidden focus:outline-none hover:bg-gray-100"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? (
                        <FiX size={24} />
                    ) : (
                        <FiMenu size={24} />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden bg-white shadow-xl absolute w-full left-0 transition-all duration-300 ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 invisible'
                } overflow-hidden`}>
                <div className="w-full px-4 py-4 mx-auto space-y-4 max-w-7xl sm:px-6 lg:px-8">
                    {/* User info if logged in */}
                    {currentUser && (
                        <div className="flex items-center py-3 space-x-3 border-b border-gray-100">
                            {currentUser.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt={currentUser.displayName || 'User'}
                                    className="object-cover w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-10 h-10 font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                            <div>
                                <div className="font-medium text-gray-800">{currentUser.displayName || 'User'}</div>
                                <div className="text-sm text-gray-500">{currentUser.email}</div>
                            </div>
                        </div>
                    )}

                    <Link
                        to="/"
                        className="block py-3 font-medium text-gray-700 border-b border-gray-100 hover:text-emerald-600"
                        onClick={() => setMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/properties"
                        className="block py-3 font-medium text-gray-700 border-b border-gray-100 hover:text-emerald-600"
                        onClick={() => setMenuOpen(false)}
                    >
                        Properties
                    </Link>
                    <Link
                        to="/neighborhoods"
                        className="block py-3 font-medium text-gray-700 border-b border-gray-100 hover:text-emerald-600"
                        onClick={() => setMenuOpen(false)}
                    >
                        Neighborhoods
                    </Link>
                    <Link
                        to="/agents"
                        className="block py-3 font-medium text-gray-700 border-b border-gray-100 hover:text-emerald-600"
                        onClick={() => setMenuOpen(false)}
                    >
                        Agents
                    </Link>

                    {/* Additional links for authenticated users */}
                    {currentUser && (
                        <>
                            <Link
                                to="/dashboard"
                                className="block py-3 font-medium text-gray-700 border-b border-gray-100 hover:text-emerald-600"
                                onClick={() => setMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/favorites"
                                className="block py-3 font-medium text-gray-700 border-b border-gray-100 hover:text-emerald-600"
                                onClick={() => setMenuOpen(false)}
                            >
                                Saved Homes
                            </Link>
                            
                            {userDetails?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="block py-3 font-medium text-gray-700 border-b border-gray-100 hover:text-emerald-600"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Admin Panel
                                </Link>
                            )}
                        </>
                    )}

                    <div className="flex justify-center pt-3">
                        {currentUser ? (
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setMenuOpen(false);
                                }}
                                className="w-full px-6 py-2 font-medium text-center text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="w-full px-6 py-2 font-medium text-center text-white rounded-full bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => setMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;