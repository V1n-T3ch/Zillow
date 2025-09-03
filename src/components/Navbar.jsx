import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiMenu, FiX, FiBell, FiHeart, FiSettings, FiLogOut } from 'react-icons/fi';
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaBuildingColumns } from "react-icons/fa6";
import { useAuth } from '../hooks/useAuth';

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
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <FiHome className="text-emerald-600 text-2xl mr-2" />
                    <span className="font-serif text-2xl font-bold text-gray-800">
                        Estates<span className="text-emerald-500">Hub</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center space-x-8">
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
                        <button className="text-gray-700 hover:text-emerald-500 transition-colors font-medium flex items-center">
                            Explore <span className="ml-1">▼</span>
                        </button>
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left">
                            <Link to="/neighborhoods" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-t-lg">Neighborhoods</Link>
                            <Link to="/agents" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">Agents</Link>
                            {/* <Link to="/mortgage" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-b-lg">Mortgage</Link> */}
                        </div>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="hidden lg:flex items-center space-x-4">
                    {currentUser ? (
                        <>
                            <Link to="/favorites" className="text-gray-600 hover:text-emerald-500 p-2 rounded-full hover:bg-gray-100">
                                <FiHeart size={20} />
                            </Link>
                            <Link to="/notifications" className="text-gray-600 hover:text-emerald-500 p-2 rounded-full hover:bg-gray-100">
                                <FiBell size={20} />
                            </Link>
                            <div className="relative group">
                                <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100">
                                    {currentUser.photoURL ? (
                                        <img
                                            src={currentUser.photoURL}
                                            alt={currentUser.displayName || 'User'}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                                            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <span className="text-gray-700">{currentUser.displayName || 'User'}</span>
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                                    <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-t-lg">
                                        <FiUser className="mr-2" size={16} />
                                        Dashboard
                                    </Link>
                                    <Link to="/favorites" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                                        <FiHeart className="mr-2" size={16} />
                                        Saved Homes
                                    </Link>
                                    <Link to="/settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                                        <FiSettings className="mr-2" size={16} />
                                        Settings
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
                                        className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 rounded-b-lg"
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
                                className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2 rounded-full font-medium transition-colors flex items-center"
                            >
                                <FiUser className="mr-2" /> Sign In
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden p-2 rounded-full focus:outline-none text-gray-700 hover:bg-gray-100"
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
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                    {/* User info if logged in */}
                    {currentUser && (
                        <div className="flex items-center space-x-3 py-3 border-b border-gray-100">
                            {currentUser.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt={currentUser.displayName || 'User'}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
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
                        className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/properties"
                        className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Properties
                    </Link>
                    <Link
                        to="/neighborhoods"
                        className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Neighborhoods
                    </Link>
                    <Link
                        to="/agents"
                        className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
                        onClick={() => setMenuOpen(false)}
                    >
                        Agents
                    </Link>

                    {/* Additional links for authenticated users */}
                    {currentUser && (
                        <>
                            <Link
                                to="/dashboard"
                                className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
                                onClick={() => setMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/favorites"
                                className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
                                onClick={() => setMenuOpen(false)}
                            >
                                Saved Homes
                            </Link>
                            <Link
                                to="/settings"
                                className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
                                onClick={() => setMenuOpen(false)}
                            >
                                Settings
                            </Link>
                            {userDetails?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="block py-3 text-gray-700 hover:text-emerald-600 font-medium border-b border-gray-100"
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
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full font-medium w-full text-center"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2 rounded-full font-medium w-full text-center"
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