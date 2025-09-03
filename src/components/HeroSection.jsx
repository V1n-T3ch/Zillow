import { useState } from 'react';
import { FiSearch, FiMapPin, FiFilter } from 'react-icons/fi';

const HeroSection = ({ onSearch, activeListingType, setActiveListingType, showFilters, setShowFilters }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (onSearch) onSearch(searchTerm);
    };

    return (
        <div className="relative min-h-[85vh] bg-cover bg-center flex items-center"
            style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
                backgroundAttachment: 'fixed'
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>

            <div className="container mx-auto px-6 z-10">
                <div className="max-w-3xl mx-auto text-center mb-8">
                    <motion.h1
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Find Your Dream Home
                    </motion.h1>
                    <motion.p
                        className="text-white/90 text-xl mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        Discover exceptional properties in the most sought-after locations
                    </motion.p>
                </div>

                <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    {/* Property Type Tabs */}
                    <div className="bg-white/10 backdrop-blur-md inline-flex rounded-t-xl overflow-hidden mb-0 p-1">
                        {['buy', 'rent', 'all'].map((type) => (
                            <button
                                key={type}
                                className={`px-8 py-4 font-medium transition-colors ${activeListingType === type
                                        ? 'bg-white text-emerald-700'
                                        : 'text-white hover:bg-white/20'
                                    }`}
                                onClick={() => setActiveListingType(type)}
                            >
                                {type === 'buy' ? 'Buy' : type === 'rent' ? 'Rent' : 'All Properties'}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white rounded-xl rounded-tl-none shadow-2xl p-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-grow relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiMapPin className="text-gray-400" size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter location, ZIP code, or address"
                                    className="w-full pl-12 pr-4 py-4 rounded-lg bg-gray-50 border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-700 text-lg placeholder-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="flex items-center justify-center px-5 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <FiFilter className="mr-2" size={20} />
                                    Filters
                                </button>
                                <button
                                    type="submit"
                                    className="flex-grow md:flex-grow-0 px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center font-medium"
                                >
                                    <FiSearch className="mr-2" size={20} />
                                    Search
                                </button>
                            </div>
                        </form>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100 animate-fadeIn">
                                {/* Price Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="text"
                                                placeholder="Min"
                                                className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                        <span className="text-gray-400">to</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="text"
                                                placeholder="Max"
                                                className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bedrooms */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Any', '1', '2', '3', '4+'].map(option => (
                                            <button
                                                key={option}
                                                className={`px-4 py-3 rounded-lg ${option === 'Any'
                                                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Property Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none">
                                        <option>Any</option>
                                        <option>House</option>
                                        <option>Apartment</option>
                                        <option>Condo</option>
                                        <option>Townhouse</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;