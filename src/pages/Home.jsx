import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
    FiSearch, FiMapPin, FiChevronRight, FiX,
    FiMail, FiPhone, 
    FiMapPin as FiLocation, FiInstagram, FiTwitter, FiFacebook 
} from 'react-icons/fi';
import { TbBrandTiktok, TbBuildingSkyscraper, TbBuildingEstate, TbBuildingCottage, TbBuildingStore } from 'react-icons/tb';
import { motion as Motion } from 'framer-motion';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedPropertyType, setSelectedPropertyType] = useState('');
    const [modalLocation, setModalLocation] = useState('');
    const navigate = useNavigate();

    // Handle search form submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        // Redirect to properties page with search term
        navigate(`/properties?location=${encodeURIComponent(searchTerm)}`);
    };

    // Handle category click
    const handleCategoryClick = (propertyType) => {
        if (!searchTerm.trim()) {
            // No location set, show modal
            setSelectedPropertyType(propertyType);
            setShowLocationModal(true);
        } else {
            // Location is set, navigate directly
            navigate(`/category?propertyType=${propertyType}&location=${encodeURIComponent(searchTerm)}`);
        }
    };

    // Handle modal location submission
    const handleModalSubmit = (e) => {
        e.preventDefault();
        if (!modalLocation.trim()) return;

        // Set the main search term and navigate
        setSearchTerm(modalLocation);
        setShowLocationModal(false);
        navigate(`/category?propertyType=${selectedPropertyType}&location=${encodeURIComponent(modalLocation)}`);
        setModalLocation('');
    };

    // Close modal
    const closeModal = () => {
        setShowLocationModal(false);
        setSelectedPropertyType('');
        setModalLocation('');
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Location Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Set Your Location
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-1 text-gray-400 hover:text-gray-600"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        <p className="mb-4 text-gray-600">
                            Please enter your preferred location to browse {selectedPropertyType.toLowerCase()}s in that area.
                        </p>

                        <form onSubmit={handleModalSubmit}>
                            <div className="relative mb-4">
                                <FiMapPin className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                                <input
                                    type="text"
                                    placeholder="Enter a location (e.g., Nairobi, Westlands)"
                                    className="block w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                    value={modalLocation}
                                    onChange={(e) => setModalLocation(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                <section className="py-8 bg-gray-50">
                    <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
                            {/* Studios & Bedsitters */}
                            <button 
                                onClick={() => handleCategoryClick('House')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingEstate size={24} />
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
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingSkyscraper size={24} />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Apartments</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Bungalows */}
                            <button 
                                onClick={() => handleCategoryClick('Bungalows')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingCottage size={24} />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Bungalows</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Mansionettes */}
                            <button 
                                onClick={() => handleCategoryClick('Mansionettes')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingStore size={24} />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Mansionettes</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Luxury Villas */}
                            <button 
                                onClick={() => handleCategoryClick('Luxury Villas')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingEstate size={24} />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-gray-800 group-hover:text-emerald-600">Luxury Villas</h3>
                                <div className="flex items-center justify-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                                    Browse <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Commercials */}
                            <button 
                                onClick={() => handleCategoryClick('Commercials')}
                                className="p-4 text-center transition-all duration-300 bg-white border-2 border-emerald-200 group rounded-xl shadow-subtle hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingSkyscraper size={24} />   
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
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingSkyscraper size={24} />   
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
                                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                                    <TbBuildingSkyscraper size={24} />   
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

                                {/* Newsletter */}
                                {/* <div>
                                    <h3 className="mb-6 text-lg font-semibold">Newsletter</h3>
                                    <p className="mb-4 text-gray-400">
                                        Subscribe to get the latest property listings and real estate news
                                    </p>
                                    <form className="space-y-3">
                                        <div className="flex flex-wrap items-center">
                                            <input 
                                                type="email" 
                                                placeholder="Your email address" 
                                                className="w-full px-4 py-2 text-gray-800 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="w-full px-4 py-2 text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            Subscribe
                                        </button>
                                    </form>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Home;