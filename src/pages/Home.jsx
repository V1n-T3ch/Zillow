import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FiSearch, FiMapPin, FiHome, FiChevronRight, FiUser, FiDollarSign, FiShield, FiStar } from 'react-icons/fi';
import { TbBuildingSkyscraper, TbBuildingEstate, TbBuildingCottage, TbBuildingStore } from 'react-icons/tb';
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
                        address: data.address || 'Address not available',
                        price: data.price || 0,
                        beds: data.specs?.beds || 0,
                        baths: data.specs?.baths || 0,
                        sqft: data.specs?.sqft || 0,
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

    // Testimonials data
    const testimonials = [
        {
            id: 1,
            text: "I found my dream home in just two weeks using EstatesHub. The search tools made it so easy to find exactly what I was looking for.",
            author: "Sarah Johnson",
            role: "Homeowner",
            avatar: "https://randomuser.me/api/portraits/women/44.jpg"
        },
        {
            id: 2,
            text: "As a real estate agent, I've increased my client base by 40% since listing on EstatesHub. The platform is intuitive and powerful.",
            author: "Michael Chen",
            role: "Real Estate Agent",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
            id: 3,
            text: "The virtual tours feature saved me so much time. I was able to narrow down my options without leaving my current home.",
            author: "Emily Rodriguez",
            role: "First-time Buyer",
            avatar: "https://randomuser.me/api/portraits/women/68.jpg"
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
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
                    <div className="max-w-3xl">
                        <Motion.h1
                            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            Find Your Perfect Place to Call Home
                        </Motion.h1>
                        <Motion.p
                            className="text-xl text-white/90 mb-10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            Discover exceptional properties in premier locations
                        </Motion.p>

                        <Motion.div
                            className="bg-white rounded-xl shadow-xl overflow-hidden"
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
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiMapPin className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter an address, neighborhood, city, or ZIP code"
                                            className="block w-full pl-10 pr-12 py-4 border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="ml-4 px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition duration-300 flex-shrink-0 font-medium"
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
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-10 text-center">Find Properties by Category</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-subtle text-center hover:shadow-lg transition-shadow duration-300">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                <TbBuildingEstate size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Houses</h3>
                            <p className="text-gray-600 mb-4">Find your perfect family home</p>
                            <Link to="/properties?type=House" className="text-emerald-600 font-medium hover:text-emerald-700">
                                Browse Houses <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-subtle text-center hover:shadow-lg transition-shadow duration-300">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                <TbBuildingSkyscraper size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Apartments</h3>
                            <p className="text-gray-600 mb-4">Modern city living spaces</p>
                            <Link to="/properties?type=Apartment" className="text-emerald-600 font-medium hover:text-emerald-700">
                                Browse Apartments <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-subtle text-center hover:shadow-lg transition-shadow duration-300">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                <TbBuildingCottage size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Villas</h3>
                            <p className="text-gray-600 mb-4">Luxury homes with privacy</p>
                            <Link to="/properties?type=Villa" className="text-emerald-600 font-medium hover:text-emerald-700">
                                Browse Villas <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-subtle text-center hover:shadow-lg transition-shadow duration-300">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                <TbBuildingStore size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Commercial</h3>
                            <p className="text-gray-600 mb-4">Office and retail spaces</p>
                            <Link to="/properties?type=Commercial" className="text-emerald-600 font-medium hover:text-emerald-700">
                                Browse Commercial <FiChevronRight className="inline ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-16">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-serif font-bold text-gray-900">Featured Properties</h2>
                        <Link to="/properties" className="text-emerald-600 font-medium hover:text-emerald-700">
                            View All <FiChevronRight className="inline" />
                        </Link>
                    </div>

                    {isLoading ? (
                        // Loading skeleton
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-subtle animate-pulse">
                                    <div className="h-64 bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                        <div className="flex justify-between mb-5">
                                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                                        </div>
                                        <div className="h-10 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredProperties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredProperties.map((property) => (
                                <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-subtle hover:shadow-elevated transition-shadow duration-300">
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={property.image}
                                            alt={property.title}
                                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                            }}
                                        />
                                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-emerald-700">
                                            Ksh.{property.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{property.title}</h3>
                                        <p className="text-gray-600 mb-4 flex items-center">
                                            <FiMapPin className="mr-2 text-gray-400" />
                                            {property.address}
                                        </p>

                                        <div className="flex justify-between text-gray-700 mb-5">
                                            <span>{property.beds} Beds</span>
                                            <span>{property.baths} Baths</span>
                                            <span>{property.sqft.toLocaleString()} sqft</span>
                                        </div>

                                        <Link
                                            to={`/properties/${property.id}`}
                                            className="block text-center w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition duration-300 font-medium"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Fallback when no properties found
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-subtle hover:shadow-elevated transition-shadow duration-300">
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={property.image}
                                            alt={property.title}
                                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                        />
                                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-emerald-700">
                                            Ksh.{property.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{property.title}</h3>
                                        <p className="text-gray-600 mb-4 flex items-center">
                                            <FiMapPin className="mr-2 text-gray-400" />
                                            {property.address}
                                        </p>

                                        <div className="flex justify-between text-gray-700 mb-5">
                                            <span>{property.beds} Beds</span>
                                            <span>{property.baths} Baths</span>
                                            <span>{property.sqft.toLocaleString()} sqft</span>
                                        </div>

                                        <Link
                                            to={`/properties/${property.id}`}
                                            className="block text-center w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition duration-300 font-medium"
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
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4 text-center">How EstatesHub Works</h2>
                    <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
                        We've simplified the process of finding or selling your home
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6">
                                <FiSearch size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Search Properties</h3>
                            <p className="text-gray-600">
                                Browse thousands of listings using our advanced search filters to find your perfect home
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6">
                                <FiHome size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Tour Homes</h3>
                            <p className="text-gray-600">
                                Schedule viewings or take virtual tours of properties from the comfort of your current home
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-6">
                                <FiDollarSign size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Close the Deal</h3>
                            <p className="text-gray-600">
                                Get expert support throughout the buying or selling process for a smooth transaction
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Neighborhoods */}
            <section className="py-16">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-10 text-center">Explore Popular Neighborhoods</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {neighborhoods.map((neighborhood) => (
                            <div key={neighborhood.id} className="group relative rounded-xl overflow-hidden shadow-subtle hover:shadow-elevated transition-all duration-300">
                                <img
                                    src={neighborhood.image}
                                    alt={neighborhood.name}
                                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="text-xl font-bold text-white mb-1">{neighborhood.name}</h3>
                                    <p className="text-white/80 mb-3">{neighborhood.properties} Properties</p>
                                    <Link
                                        to={`/properties?location=${encodeURIComponent(neighborhood.name)}`}
                                        className="inline-block py-2 px-4 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition duration-300"
                                    >
                                        Explore
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 bg-gray-50">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12 text-center">What Our Users Say</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white p-6 rounded-xl shadow-subtle">
                                <div className="flex items-center mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <FiStar key={i} className="text-yellow-400 fill-yellow-400 mr-1" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6">"{testimonial.text}"</p>
                                <div className="flex items-center">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.author}
                                        className="w-12 h-12 rounded-full mr-4"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-800">{testimonial.author}</h4>
                                        <p className="text-gray-600 text-sm">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-emerald-600">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-serif font-bold text-white mb-6">Ready to Find Your Dream Home?</h2>
                        <p className="text-emerald-100 text-xl mb-8">
                            Join thousands of satisfied customers who found their perfect property with EstatesHub
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/properties"
                                className="px-8 py-4 bg-white text-emerald-600 rounded-lg hover:bg-gray-100 transition duration-300 font-medium"
                            >
                                Browse Properties
                            </Link>
                            <Link
                                to="/vendor/list-property"
                                className="px-8 py-4 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition duration-300 font-medium"
                            >
                                List Your Property
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="py-12 border-t border-gray-200">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                        <div className="mb-6 md:mb-0">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">EstatesHub</h3>
                            <p className="text-gray-600">
                                Making real estate simple, secure, and successful
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-end gap-8">
                            <div className="flex items-center">
                                <FiShield className="text-emerald-600 mr-2" size={20} />
                                <span className="text-gray-700">Secure Transactions</span>
                            </div>
                            <div className="flex items-center">
                                <FiUser className="text-emerald-600 mr-2" size={20} />
                                <span className="text-gray-700">Verified Agents</span>
                            </div>
                            <div className="flex items-center">
                                <FiStar className="text-emerald-600 mr-2" size={20} />
                                <span className="text-gray-700">Top Rated Service</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;