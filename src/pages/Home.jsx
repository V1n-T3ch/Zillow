import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
    FiSearch, FiMapPin, FiHome, FiChevronRight, FiUser, 
    FiDollarSign, FiShield, FiStar, FiMail, FiPhone, 
    FiMapPin as FiLocation, FiInstagram, FiTwitter, FiFacebook 
} from 'react-icons/fi';
import { TbBrandTiktok, TbBuildingSkyscraper, TbBuildingEstate, TbBuildingCottage, TbBuildingStore } from 'react-icons/tb';
import { motion as Motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('buy');
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Fetch latest properties from Firestore
    useEffect(() => {
        const fetchFeaturedProperties = async () => {
            try {
                setIsLoading(true);

                // Create a query for the latest 3 active properties
                const propertiesQuery = query(
                    collection(db, 'properties'),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                );

                const querySnapshot = await getDocs(propertiesQuery);

                if (querySnapshot.empty) {
                    // If no properties found, keep the default mock data
                    console.log('No properties found, using demo data');
                    setIsLoading(false);
                    return;
                }

                // Map the documents to our property format
                const properties = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || 'Beautiful Property',
                        address: data.area || 'Address not available',
                        price: data.price || 0,
                        beds: data.beds || 0,
                        baths: data.baths || 0,
                        image: data.images?.[0] || 'https://placehold.co/800x500?text=No+Image'
                    };
                });

                setFeaturedProperties(properties);

            } catch (err) {
                console.error('Error fetching featured properties:', err);
                setError('Failed to load featured properties');

                // Keep the mock data if there's an error
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeaturedProperties();
    }, [error]);

    // Neighborhoods data
    const neighborhoods = [
        {
            id: 1,
            name: 'Downtown',
            properties: 24,
            image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 2,
            name: 'Westside',
            properties: 18,
            image: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 3,
            name: 'Riverfront',
            properties: 15,
            image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 4,
            name: 'Hillside',
            properties: 12,
            image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        }
    ];

    // Handle search form submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        // Redirect to properties page with search term
        navigate(`/properties?location=${encodeURIComponent(searchTerm)}&status=${activeTab === 'buy' ? 'For Sale' : activeTab === 'rent' ? 'For Rent' : 'Any'}`);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-16 md:pt-20 lg:pt-24">
                <div className="absolute inset-0 z-0 overflow-hidden" style={{ height: "600px" }}>
                    <img
                        src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
                        alt="Luxury home"
                        className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
                </div>

                <div className="relative z-10 w-full px-4 pt-24 pb-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <Motion.h1
                            className="mb-6 font-serif text-4xl font-bold text-white md:text-5xl lg:text-6xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            Find Your Perfect Place to Call Home
                        </Motion.h1>
                        <Motion.p
                            className="mb-10 text-xl text-white/90"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            Discover exceptional properties in premier locations
                        </Motion.p>

                        <Motion.div
                            className="overflow-hidden bg-white shadow-xl rounded-xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            {/* Search Tabs */}
                            <div className="flex border-b">
                                <button
                                    className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'buy' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}
                                    onClick={() => setActiveTab('buy')}
                                >
                                    Buy
                                </button>
                                <button
                                    className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'rent' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}
                                    onClick={() => setActiveTab('rent')}
                                >
                                    Rent
                                </button>
                                <button
                                    className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'sell' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}
                                    onClick={() => setActiveTab('sell')}
                                >
                                    Sell
                                </button>
                            </div>

                            {/* Search Input */}
                            <form onSubmit={handleSearch} className="p-6">
                                <div className="flex items-center">
                                    <div className="relative flex-grow">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <FiMapPin className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter an address, neighborhood, city, or ZIP code"
                                            className="block w-full py-4 pl-10 pr-12 border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex-shrink-0 px-8 py-4 ml-4 font-medium text-white transition duration-300 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <FiSearch className="inline-block mr-2" />
                                        Search
                                    </button>
                                </div>
                            </form>
                        </Motion.div>
                    </div>
                </div>
            </section>

            {/* Property Categories */}
            <section className="py-16 bg-gray-50">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <h2 className="mb-10 font-serif text-3xl font-bold text-center text-gray-900">Find Properties by Category</h2>

                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        <div className="p-6 text-center transition-shadow duration-300 bg-white rounded-xl shadow-subtle hover:shadow-lg">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <TbBuildingEstate size={28} />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gray-800">Houses</h3>
                            <p className="mb-4 text-gray-600">Find your perfect family home</p>
                            <Link to="/properties?type=House" className="font-medium text-emerald-600 hover:text-emerald-700">
                                Browse Houses <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>

                        <div className="p-6 text-center transition-shadow duration-300 bg-white rounded-xl shadow-subtle hover:shadow-lg">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <TbBuildingSkyscraper size={28} />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gray-800">Apartments</h3>
                            <p className="mb-4 text-gray-600">Modern city living spaces</p>
                            <Link to="/properties?type=Apartment" className="font-medium text-emerald-600 hover:text-emerald-700">
                                Browse Apartments <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>

                        <div className="p-6 text-center transition-shadow duration-300 bg-white rounded-xl shadow-subtle hover:shadow-lg">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <TbBuildingCottage size={28} />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gray-800">Villas</h3>
                            <p className="mb-4 text-gray-600">Luxury homes with privacy</p>
                            <Link to="/properties?type=Villa" className="font-medium text-emerald-600 hover:text-emerald-700">
                                Browse Villas <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>

                        <div className="p-6 text-center transition-shadow duration-300 bg-white rounded-xl shadow-subtle hover:shadow-lg">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <TbBuildingStore size={28} />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gray-800">Commercial</h3>
                            <p className="mb-4 text-gray-600">Office and retail spaces</p>
                            <Link to="/properties?type=Commercial" className="font-medium text-emerald-600 hover:text-emerald-700">
                                Browse Commercial <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-16">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="font-serif text-3xl font-bold text-gray-900">Featured Properties</h2>
                        <Link to="/properties" className="font-medium text-emerald-600 hover:text-emerald-700">
                            View All <FiChevronRight className="inline" />
                        </Link>
                    </div>

                    {isLoading ? (
                        // Loading skeleton
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="overflow-hidden bg-white rounded-xl shadow-subtle animate-pulse">
                                    <div className="h-64 bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="w-3/4 h-6 mb-3 bg-gray-200 rounded"></div>
                                        <div className="w-1/2 h-4 mb-4 bg-gray-200 rounded"></div>
                                        <div className="flex justify-between mb-5">
                                            <div className="w-16 h-4 bg-gray-200 rounded"></div>
                                            <div className="w-16 h-4 bg-gray-200 rounded"></div>
                                            <div className="w-16 h-4 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="h-10 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredProperties.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {featuredProperties.map((property) => (
                                <div key={property.id} className="overflow-hidden transition-shadow duration-300 bg-white rounded-xl shadow-subtle hover:shadow-elevated">
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={property.image}
                                            alt={property.title}
                                            className="object-cover w-full h-full transition-transform duration-700 hover:scale-110"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                            }}
                                        />
                                        <div className="absolute px-4 py-2 font-bold rounded-lg bottom-4 right-4 bg-white/90 backdrop-blur-sm text-emerald-700">
                                            Ksh.{property.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="mb-2 text-xl font-bold text-gray-800">{property.title}</h3>
                                        <p className="flex items-center mb-4 text-gray-600">
                                            <FiMapPin className="mr-2 text-gray-400" />
                                            {property.address}
                                        </p>

                                        <div className="flex justify-between mb-5 text-gray-700">
                                            <span>{property.beds} Beds</span>
                                            <span>{property.baths} Baths</span>
                                        </div>

                                        <Link
                                            to={`/properties/${property.id}`}
                                            className="block w-full py-3 font-medium text-center text-white transition duration-300 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Fallback when no properties found
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    id: 1,
                                    title: 'Modern Villa with Pool',
                                    address: 'Kilimani',
                                    price: 1250000,
                                    beds: 4,
                                    baths: 3.5,
                                    sqft: 3200,
                                    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                                },
                                {
                                    id: 2,
                                    title: 'Downtown Penthouse',
                                    address: 'Westlands',
                                    price: 890000,
                                    beds: 3,
                                    baths: 2,
                                    sqft: 1800,
                                    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                                },
                                {
                                    id: 3,
                                    title: 'Coastal Beach House',
                                    address: 'Diani',
                                    price: 2100000,
                                    beds: 5,
                                    baths: 4,
                                    sqft: 4100,
                                    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                                }
                            ].map((property) => (
                                <div key={property.id} className="overflow-hidden transition-shadow duration-300 bg-white rounded-xl shadow-subtle hover:shadow-elevated">
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={property.image}
                                            alt={property.title}
                                            className="object-cover w-full h-full transition-transform duration-700 hover:scale-110"
                                        />
                                        <div className="absolute px-4 py-2 font-bold rounded-lg bottom-4 right-4 bg-white/90 backdrop-blur-sm text-emerald-700">
                                            Ksh.{property.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="mb-2 text-xl font-bold text-gray-800">{property.title}</h3>
                                        <p className="flex items-center mb-4 text-gray-600">
                                            <FiMapPin className="mr-2 text-gray-400" />
                                            {property.address}
                                        </p>

                                        <div className="flex justify-between mb-5 text-gray-700">
                                            <span>{property.beds} Beds</span>
                                            <span>{property.baths} Baths</span>
                                            <span>{property.sqft.toLocaleString()} sqft</span>
                                        </div>

                                        <Link
                                            to={`/properties/${property.id}`}
                                            className="block w-full py-3 font-medium text-center text-white transition duration-300 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 bg-gray-50">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <h2 className="mb-4 font-serif text-3xl font-bold text-center text-gray-900">How Dwella Works</h2>
                    <p className="max-w-3xl mx-auto mb-12 text-xl text-center text-gray-600">
                        We've simplified the process of finding or selling your home
                    </p>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-emerald-100 text-emerald-600">
                                <FiSearch size={32} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-800">Search Properties</h3>
                            <p className="text-gray-600">
                                Browse thousands of listings using our advanced search filters to find your perfect home
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-emerald-100 text-emerald-600">
                                <FiHome size={32} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-800">Tour Homes</h3>
                            <p className="text-gray-600">
                                Schedule viewings or take virtual tours of properties from the comfort of your current home
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-emerald-100 text-emerald-600">
                                <FiDollarSign size={32} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-800">Close the Deal</h3>
                            <p className="text-gray-600">
                                Get expert support throughout the buying or selling process for a smooth transaction
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Neighborhoods */}
            <section className="py-16">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <h2 className="mb-10 font-serif text-3xl font-bold text-center text-gray-900">Explore Popular Neighborhoods</h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {neighborhoods.map((neighborhood) => (
                            <div key={neighborhood.id} className="relative overflow-hidden transition-all duration-300 group rounded-xl shadow-subtle hover:shadow-elevated">
                                <img
                                    src={neighborhood.image}
                                    alt={neighborhood.name}
                                    className="object-cover w-full h-64 transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="mb-1 text-xl font-bold text-white">{neighborhood.name}</h3>
                                    <p className="mb-3 text-white/80">{neighborhood.properties} Properties</p>
                                    <Link
                                        to={`/properties?location=${encodeURIComponent(neighborhood.name)}`}
                                        className="inline-block px-4 py-2 text-white transition duration-300 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30"
                                    >
                                        Explore
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-emerald-600">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="mb-6 font-serif text-3xl font-bold text-white">Ready to Find Your Dream Home?</h2>
                        <p className="mb-8 text-xl text-emerald-100">
                            Join thousands of satisfied customers who found their perfect property with Dwella
                        </p>
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                to="/properties"
                                className="px-8 py-4 font-medium transition duration-300 bg-white rounded-lg text-emerald-600 hover:bg-gray-100"
                            >
                                Browse Properties
                            </Link>
                            <Link
                                to="/vendor-application"
                                className="px-8 py-4 font-medium text-white transition duration-300 rounded-lg bg-emerald-700 hover:bg-emerald-800"
                            >
                                List Your Property
                            </Link>
                        </div>
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
                                    Your trusted partner in finding the perfect property. Making real estate simple, secure, and successful since 2023.
                                </p>
                                <div className="flex space-x-4">
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

                            {/* Quick Links */}
                            <div>
                                <h3 className="mb-6 text-lg font-semibold">Quick Links</h3>
                                <ul className="space-y-3">
                                    <li>
                                        <Link to="/properties" className="text-gray-400 transition-colors hover:text-emerald-400">
                                            Browse Properties
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/neighborhoods" className="text-gray-400 transition-colors hover:text-emerald-400">
                                            Neighborhoods
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/agents" className="text-gray-400 transition-colors hover:text-emerald-400">
                                            Find an Agent
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/vendor-application" className="text-gray-400 transition-colors hover:text-emerald-400">
                                            List Your Property
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/blog" className="text-gray-400 transition-colors hover:text-emerald-400">
                                            Real Estate Blog
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="mb-6 text-lg font-semibold">Contact Us</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start">
                                        <FiLocation className="mt-1 mr-3 text-emerald-400" />
                                        <span className="text-gray-400">
                                            Westlands Business Park<br />
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
                            <div>
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="py-6">
                    <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between md:flex-row">
                            <p className="text-sm text-gray-500">
                                © {new Date().getFullYear()} Dwella Real Estate. All rights reserved.
                            </p>
                            <div className="flex mt-4 space-x-6 md:mt-0">
                                <Link to="/privacy-policy" className="text-sm text-gray-500 transition-colors hover:text-emerald-400">
                                    Privacy Policy
                                </Link>
                                <Link to="/terms-of-service" className="text-sm text-gray-500 transition-colors hover:text-emerald-400">
                                    Terms of Service
                                </Link>
                                <Link to="/sitemap" className="text-sm text-gray-500 transition-colors hover:text-emerald-400">
                                    Sitemap
                                </Link>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-6 mt-6 md:justify-start">
                            <div className="flex items-center">
                                <FiShield className="mr-2 text-emerald-400" size={16} />
                                <span className="text-sm text-gray-500">Secure Transactions</span>
                            </div>
                            <div className="flex items-center">
                                <FiUser className="mr-2 text-emerald-400" size={16} />
                                <span className="text-sm text-gray-500">Verified Agents</span>
                            </div>
                            <div className="flex items-center">
                                <FiStar className="mr-2 text-emerald-400" size={16} />
                                <span className="text-sm text-gray-500">Top Rated Service</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;