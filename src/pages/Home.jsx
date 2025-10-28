import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
    FiSearch, FiMapPin, FiChevronRight,
    FiMail, FiPhone, 
    FiMapPin as FiLocation, FiInstagram, FiTwitter, FiFacebook 
} from 'react-icons/fi';
import { TbBrandTiktok } from 'react-icons/tb';
import { motion as Motion } from 'framer-motion';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Handle search form submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        // Redirect to properties page with search term that will match both city and area
        navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
    };

    // Handle category click - direct navigation without location requirement
    const handleCategoryClick = (propertyType) => {
        navigate(`/category?propertyType=${propertyType}`);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Add padding bottom for mobile tab navigator */}
            <div className="pb-16 md:pb-0">
                {/* Hero Section */}
                <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 min-h-[350px] flex items-center">
                    <div className="relative w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="text-center">
                            <Motion.h1
                                className="mb-4 font-serif text-4xl font-bold text-white md:text-5xl lg:text-6xl"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                House Hunting made easy
                            </Motion.h1>
                            
                            <div className="flex items-center justify-center w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                                <Motion.div
                                    className="w-full max-w-2xl overflow-hidden bg-transparent shadow-none sm:bg-white sm:shadow-xl rounded-xl"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <form onSubmit={handleSearch} className="p-0 sm:p-4">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                            <div className="relative flex-grow">
                                                <FiMapPin className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                                                <input
                                                    type="text"
                                                    placeholder="Enter a location"
                                                    className="block w-full py-3 pl-10 pr-4 bg-white border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="hidden px-6 py-3 font-medium text-white transition duration-300 rounded-lg sm:block bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                                            >
                                                <FiSearch className="inline-block mr-2" />
                                                Search
                                            </button>
                                        </div>
                                    </form>
                                </Motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Property Categories */}
                <section className="py-12 bg-gray-50">
                    <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Section Title */}
                        <div className="mb-10 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                                What are you looking for?
                            </h2>
                            <p className="text-lg text-gray-600">
                                Browse properties by category to find your perfect home
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
                            {/* Studios & Bedsitters */}
                            <button 
                                onClick={() => handleCategoryClick('Bedsitter')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=80&fit=crop&crop=center" 
                                        alt="Studio/Bedsitter"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🏠</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Studio/Bedsitter</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Apartments */}
                            <button 
                                onClick={() => handleCategoryClick('Apartment')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=80&h=80&fit=crop&crop=center" 
                                        alt="Apartments"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🏢</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Apartments</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Bungalows */}
                            <button 
                                onClick={() => handleCategoryClick('Bungalow')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=80&h=80&fit=crop&crop=center" 
                                        alt="Bungalows"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🏘️</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Bungalows</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Mansionettes */}
                            <button 
                                onClick={() => handleCategoryClick('Mansionette')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&h=80&fit=crop&crop=center" 
                                        alt="Mansionettes"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🏡</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Mansionettes</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Luxury Villas */}
                            <button 
                                onClick={() => handleCategoryClick('Villa')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=80&h=80&fit=crop&crop=center" 
                                        alt="Luxury Villas"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🏰</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Luxury Villas</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Commercials */}
                            <button 
                                onClick={() => handleCategoryClick('Commercial')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&h=80&fit=crop&crop=center" 
                                        alt="Commercial Properties"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🏢</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Commercials</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* BnB */}
                            <button 
                                onClick={() => handleCategoryClick('BnB')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=80&h=80&fit=crop&crop=center" 
                                        alt="BnB Properties"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🏨</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">BnB</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Singles */}
                            <button 
                                onClick={() => handleCategoryClick('Singles')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 overflow-hidden rounded-lg">
                                    <img 
                                        src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&h=80&fit=crop&crop=center" 
                                        alt="Single Room Properties"
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="80" height="80" fill="#10b981"/>
                                                    <text x="40" y="45" font-family="Arial" font-size="24" fill="white" text-anchor="middle">🚪</text>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Singles</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-white bg-gray-900">
                    {/* Main Footer */}
                    <div className="py-12 border-b border-gray-800">
                        <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                                {/* Company Info */}
                                <div>
                                    <h3 className="mb-6 text-xl font-bold text-white">
                                        <span className="text-emerald-400">D</span>wella
                                    </h3>
                                    <p className="mb-6 text-gray-400">
                                        Making house hunting simple, secure, and successful since 2025.
                                    </p>
                                    <div className="flex flex-col space-y-4">
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-gray-300">Follow Us</h4>
                                            <div className="flex space-x-3">
                                                <a href="https://instagram.com/dwella_ke" target="_blank" rel="noopener noreferrer"
                                                   className="p-2 transition-colors bg-gray-800 rounded-full hover:bg-emerald-600">
                                                    <FiInstagram size={18} />
                                                </a>
                                                <a href="https://facebook.com/dwella_ke" target="_blank" rel="noopener noreferrer"
                                                   className="p-2 transition-colors bg-gray-800 rounded-full hover:bg-emerald-600">
                                                    <FiFacebook size={18} />
                                                </a>
                                                <a href="https://twitter.com/dwella_ke" target="_blank" rel="noopener noreferrer"
                                                   className="p-2 transition-colors bg-gray-800 rounded-full hover:bg-emerald-600">
                                                    <FiTwitter size={18} />
                                                </a>
                                                <a href="https://tiktok.com/@dwella_ke" target="_blank" rel="noopener noreferrer"
                                                   className="p-2 transition-colors bg-gray-800 rounded-full hover:bg-emerald-600">
                                                    <TbBrandTiktok size={18} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <h3 className="mb-6 text-lg font-semibold">Contact Us</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start">
                                            <FiLocation className="mt-1 mr-3 text-emerald-400" />
                                            <span className="text-gray-400">
                                                Westlands<br />
                                                Nairobi, Kenya
                                            </span>
                                        </li>
                                        <li className="flex items-center">
                                            <FiPhone className="mr-3 text-emerald-400" />
                                            <a href="tel:+254794886290" className="text-gray-400 transition-colors hover:text-emerald-400">
                                                +254 794 886 290
                                            </a>
                                        </li>
                                        <li className="flex items-center">
                                            <FiMail className="mr-3 text-emerald-400" />
                                            <a href="mailto:dwellakenya@gmail.com" className="text-gray-400 transition-colors hover:text-emerald-400">
                                                dwellakenya@gmail.com
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Home;