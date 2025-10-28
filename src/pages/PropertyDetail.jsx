import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
    FiCamera, FiChevronLeft, FiChevronRight, FiPlus,
    FiCheckCircle, FiHome, FiCalendar, FiMapPin,
    FiShare2, FiDollarSign,
    FiUsers, FiUser, FiPhone, FiMessageSquare
} from 'react-icons/fi';
import { db } from '../firebase';
import {
    doc, getDoc, collection, getDocs, query, where
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { incrementPropertyViews } from '../services/analyticsService';
import Navbar from '../components/Navbar';

// Stunning Image Gallery Component
const PropertyGallery = ({ images = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Use placeholders if no images
    const allImages = images.length > 0 ? images : [
        'https://placehold.co/1200x800?text=No+Image+Available'
    ];

    // Touch handlers for mobile swipe
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 100) {
            // Swipe left
            goToNext();
        }

        if (touchStart - touchEnd < -100) {
            // Swipe right
            goToPrevious();
        }
    };

    const goToPrevious = () => {
        const newIndex = activeIndex === 0 ? allImages.length - 1 : activeIndex - 1;
        setActiveIndex(newIndex);
    };

    const goToNext = () => {
        const newIndex = activeIndex === allImages.length - 1 ? 0 : activeIndex + 1;
        setActiveIndex(newIndex);
    };

    // Keyboard navigation for accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showModal) return;

            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'Escape') {
                setShowModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showModal, activeIndex]);

    return (
        <>
            <div className="relative mb-8 overflow-hidden shadow-2xl rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[70vh] max-h-[600px]">
                    <div
                        className="relative col-span-2 overflow-hidden cursor-pointer group"
                        onClick={() => setShowModal(true)}
                    >
                        <Motion.img
                            src={allImages[0]}
                            alt="Property main view"
                            className="object-cover w-full h-full"
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/1200x800?text=Image+Not+Available';
                            }}
                        />
                        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/40 to-transparent group-hover:opacity-100">
                            <div className="absolute bottom-4 left-4">
                                <div className="flex items-center gap-2 text-white">
                                    <FiCamera size={20} />
                                    <span className="font-medium">View all {allImages.length} photos</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden grid-rows-2 gap-2 md:grid">
                        {allImages.length > 1 ? (
                            <>
                                <div
                                    className="relative overflow-hidden cursor-pointer group"
                                    onClick={() => setShowModal(true)}
                                >
                                    <Motion.img
                                        src={allImages[1]}
                                        alt="Property view 2"
                                        className="object-cover w-full h-full"
                                        initial={{ scale: 1 }}
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.5 }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/1200x800?text=Image+Not+Available';
                                        }}
                                    />
                                    <div className="absolute inset-0 transition-opacity opacity-0 bg-black/20 group-hover:opacity-100"></div>
                                </div>
                                <div
                                    className="relative overflow-hidden cursor-pointer group"
                                    onClick={() => setShowModal(true)}
                                >
                                    {allImages.length > 2 ? (
                                        <>
                                            <Motion.img
                                                src={allImages[2]}
                                                alt="Property view 3"
                                                className="object-cover w-full h-full"
                                                initial={{ scale: 1 }}
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ duration: 0.5 }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/1200x800?text=Image+Not+Available';
                                                }}
                                            />
                                            {allImages.length > 3 && (
                                                <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/50 group-hover:bg-black/70">
                                                    <div className="text-center text-white">
                                                        <FiPlus size={28} className="mx-auto mb-1" />
                                                        <span className="font-medium">{allImages.length - 3} more</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full bg-gray-100">
                                            <FiCamera size={28} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center row-span-2 bg-gray-100">
                                <div className="text-center text-gray-400">
                                    <FiCamera size={36} className="mx-auto mb-2" />
                                    <p>No additional photos</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute left-0 right-0 md:hidden bottom-4">
                    <div className="flex justify-center gap-1.5">
                        {allImages.map((_, index) => (
                            <button
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-white/50'}`}
                                onClick={() => setActiveIndex(index)}
                            />
                        ))}
                    </div>
                </div>

                <button
                    className="absolute flex items-center px-4 py-2 font-medium text-gray-800 transition-all rounded-lg shadow-lg right-4 bottom-4 bg-white/90 hover:bg-white"
                    onClick={() => setShowModal(true)}
                >
                    <FiCamera className="mr-2" />
                    View All Photos
                </button>
            </div>

            <AnimatePresence>
                {showModal && (
                    <Motion.div
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <button
                            className="absolute p-2 text-white transition-colors rounded-full top-4 right-4 bg-black/40 hover:bg-black/60"
                            onClick={() => setShowModal(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <div className="relative w-full max-w-5xl h-[70vh]">
                            <div
                                className="flex items-center justify-center w-full h-full"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <AnimatePresence mode="wait">
                                    <Motion.img
                                        key={activeIndex}
                                        src={allImages[activeIndex]}
                                        alt={`Property view ${activeIndex + 1}`}
                                        className="object-contain max-w-full max-h-full"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/1200x800?text=Image+Not+Available';
                                        }}
                                    />
                                </AnimatePresence>
                            </div>

                            <button
                                className="absolute p-3 text-white transition-colors -translate-y-1/2 rounded-full left-4 top-1/2 bg-black/40 hover:bg-black/60"
                                onClick={goToPrevious}
                            >
                                <FiChevronLeft size={24} />
                            </button>
                            <button
                                className="absolute p-3 text-white transition-colors -translate-y-1/2 rounded-full right-4 top-1/2 bg-black/40 hover:bg-black/60"
                                onClick={goToNext}
                            >
                                <FiChevronRight size={24} />
                            </button>
                        </div>

                        <div className="w-full max-w-5xl px-4 mt-4">
                            <div className="flex gap-2 py-2 overflow-x-auto scrollbar-hide">
                                {allImages.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveIndex(index)}
                                        className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden transition-all ${activeIndex === index ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="object-cover w-full h-full"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/1200x800?text=Image+Not+Available';
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/60 rounded-full px-4 py-1.5">
                            {activeIndex + 1} / {allImages.length}
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Elegant Feature Badge Component with fixed color class implementation
const FeatureBadge = ({ icon: Icon, label, value, color = "emerald" }) => {
    // Container background, text and border colors
    const colorClasses = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100"
    };

    // Icon colors
    const iconColorClasses = {
        emerald: "text-emerald-500",
        blue: "text-blue-500",
        amber: "text-amber-500",
        purple: "text-purple-500",
        indigo: "text-indigo-500"
    };

    // Label text colors
    const labelColorClasses = {
        emerald: "text-emerald-800/70",
        blue: "text-blue-800/70",
        amber: "text-amber-800/70",
        purple: "text-purple-800/70",
        indigo: "text-indigo-800/70"
    };

    return (
        <div className={`flex flex-col items-center p-4 rounded-xl border shadow-sm ${colorClasses[color]}`}>
            <Icon className={`mb-2 ${iconColorClasses[color]}`} size={24} />
            <span className={`text-xs ${labelColorClasses[color]} mb-1`}>{label}</span>
            <span className="text-lg font-bold">{value || 'N/A'}</span>
        </div>
    );
};

// Animated Feature Amenity Component
const FeatureAmenity = ({ children }) => (
    <Motion.div
        className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-800 rounded-lg flex items-center shadow-sm"
        whileHover={{ scale: 1.03, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
        <FiCheckCircle className="mr-2 text-emerald-500" size={16} />
        {children}
    </Motion.div>
);

// Main Property Detail Component
const PropertyDetail = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [hasRecordedView, setHasRecordedView] = useState(false);

    useEffect(() => {
        const fetchPropertyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get property data
                const propertyDoc = await getDoc(doc(db, 'properties', id));

                if (!propertyDoc.exists()) {
                    setError('Property not found');
                    setLoading(false);
                    return;
                }

                const propertyData = {
                    id: propertyDoc.id,
                    ...propertyDoc.data()
                };

                setProperty(propertyData);

                // Record the view after a short delay (to ensure it's an actual view, not just a page load)
                if (!hasRecordedView) {
                    const viewTimer = setTimeout(() => {
                        incrementPropertyViews(id, propertyData.agentID);
                        setHasRecordedView(true);
                    }, 5000); // 5 second delay

                    // Clean up timer if component unmounts
                    return () => clearTimeout(viewTimer);
                }

                // Set user email from auth if available
                if (currentUser) {
                    setUserEmail(currentUser.email || '');
                }

                // Fetch similar properties
                const similarQuery = query(
                    collection(db, 'properties'),
                    where('city', '==', propertyData.city),
                    where('propertyType', '==', propertyData.propertyType),
                    where('id', '!=', id)
                );

                const similarSnapshot = await getDocs(similarQuery);
                const similarData = similarSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).slice(0, 3);

                setSimilarProperties(similarData);

                // Increment view counter after a short delay
                // The delay prevents counting accidental/bounce views
                const viewTimer = setTimeout(() => {
                    incrementPropertyViews(id, propertyData.agentID);
                }, 5000); // 5 second delay

                return () => clearTimeout(viewTimer); // Clean up timer
            } catch (err) {
                console.error('Error fetching property:', err);
                setError('Failed to load property data');
            } finally {
                setLoading(false);
            }
        };

        fetchPropertyData();
    }, [id, currentUser]);

    // Handle share functionality
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: property.title,
                text: `Check out this property: ${property.title}`,
                url: window.location.href
            }).catch(err => {
                console.error('Error sharing:', err);
                copyToClipboard();
            });
        } else {
            copyToClipboard();
        }

        toast.success('Property link copied to clipboard')
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                toast.success('Link copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                toast.error('Failed to copy link');
            });
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="pt-20 pb-10">
                    <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="space-y-8 animate-pulse">
                            <div className="bg-gray-200 h-96 rounded-xl"></div>
                            <div className="w-3/4 h-8 bg-gray-200 rounded"></div>
                            <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="h-32 bg-gray-200 rounded"></div>
                                <div className="h-32 bg-gray-200 rounded"></div>
                                <div className="h-32 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !property) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="pt-20 pb-10">
                    <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="p-8 text-center bg-white rounded-xl shadow-subtle">
                            <h2 className="mb-4 text-2xl font-bold text-gray-800">
                                {error || 'Property Not Found'}
                            </h2>
                            <p className="mb-6 text-gray-600">
                                The property you're looking for doesn't exist or has been removed.
                            </p>
                            <button
                                onClick={() => navigate('/properties')}
                                className="inline-block px-6 py-3 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                                Browse Properties
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-20 pb-10">
                <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Image Gallery */}
                    <PropertyGallery images={property.images || []} />

                    <div className="flex flex-col gap-8 lg:flex-row">
                        {/* Main Content */}
                        <div className="lg:w-2/3">
                            {/* Property Header */}
                            <div className="p-6 mb-6 bg-white rounded-xl shadow-subtle">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                      
                                        <h1 className="mb-2 font-serif text-3xl font-bold text-gray-800">{property.title}</h1>
                                        <div className="flex items-center text-gray-600">
                                            <FiMapPin className="mr-2 text-gray-400" />
                                            {property.city}{property.area ? `, ${property.area}` : ''}
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-emerald-600">
                                            Ksh.{property.price?.toLocaleString() || '0'}
                                        </h2>
                                        <div className="mt-1 text-sm text-gray-500">
                                            Listed on {new Date(property.createdAt?.toDate() || Date.now()).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-8 pt-4 border-t border-gray-100">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">Beds</div>
                                        <div className="text-xl font-bold text-gray-800">{property.beds || 0}</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">Baths</div>
                                        <div className="text-xl font-bold text-gray-800">{property.baths || 0}</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">Stories</div>
                                        <div className="text-xl font-bold text-gray-800">{property.stories || 'N/A'}</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">Year Built</div>
                                        <div className="text-xl font-bold text-gray-800">{property.yearBuilt || 'N/A'}</div>
                                    </div>
                                </div>

                                {/* Only Share Button */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        className="flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
                                        onClick={handleShare}
                                    >
                                        <FiShare2 className="mr-2" />
                                        Share
                                    </button>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="mb-6 overflow-hidden bg-white rounded-xl shadow-subtle">
                                <div className="flex border-b border-gray-100">
                                    <button
                                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'description'
                                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                                            : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setActiveTab('description')}
                                    >
                                        Description
                                    </button>
                                    <button
                                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'features'
                                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                                            : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setActiveTab('features')}
                                    >
                                        Features
                                    </button>
                                </div>

                                <div className="p-6">
                                    {/* Description Tab */}
                                    {activeTab === 'description' && (
                                        <div className="text-gray-700 whitespace-pre-line">
                                            {property.description || 'No description available.'}
                                        </div>
                                    )}

                                    {/* Features Tab */}
                                    {activeTab === 'features' && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3">
                                            {property.features && property.features.length > 0 ? (
                                                property.features.map((feature, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <FiCheckCircle className="mr-2 text-emerald-500" />
                                                        <span className="text-gray-700">{feature}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-3 py-8 text-center text-gray-500">
                                                    No features specified for this property.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Sidebar */}
                        <div className="lg:w-1/3">
                            {/* Agent Contact */}
                            <div className="p-6 mb-6 bg-white rounded-xl shadow-subtle">
                                <div className="flex items-center mb-4">
                                    <div className="flex items-center justify-center w-16 h-16 mr-4 bg-gray-200 rounded-full">
                                        <FiUser className="text-gray-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{property.agentName || 'Property Agent'}</h3>
                                        <p className="text-sm text-gray-600">Zillow Real Estate</p>
                                    </div>
                                </div>

                                <div className="mb-6 space-y-4">
                                    <a href="tel:123-456-7890" className="flex items-center text-gray-700 hover:text-emerald-600">
                                        <FiPhone className="mr-3 text-emerald-500" />
                                        Contact via phone
                                    </a>
                                    <a href={`mailto:${property.agentEmail || 'contact@example.com'}`} className="flex items-center text-gray-700 hover:text-emerald-600">
                                        <FiMessageSquare className="mr-3 text-emerald-500" />
                                        Send email inquiry
                                    </a>
                                </div>

                                {/* Google Maps Buttons - Moved here */}
                                {property.location && (
                                    <div className="mb-6 space-y-3">
                                        <button
                                            onClick={() => {
                                                const { lat, lng } = property.location;
                                                const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                                                window.open(googleMapsUrl, '_blank');
                                            }}
                                            className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <FiMapPin className="mr-2" />
                                            Open in Google Maps
                                        </button>

                                        <button
                                            onClick={() => {
                                                const { lat, lng } = property.location;
                                                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                                                window.open(directionsUrl, '_blank');
                                            }}
                                            className="flex items-center justify-center w-full px-4 py-3 font-medium transition-colors border rounded-lg text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            Get Directions
                                        </button>
                                    </div>
                                )}

                                {/* Similar Properties */}
                                {similarProperties.length > 0 && (
                                    <div className="p-6 bg-white rounded-xl shadow-subtle">
                                        <h3 className="mb-4 font-bold text-gray-800">Similar Properties</h3>
                                        <div className="space-y-4">
                                            {similarProperties.map((similar) => (
                                                <div key={similar.id} className="flex pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                                    <div className="flex-shrink-0 w-24 h-20 overflow-hidden rounded-lg">
                                                        <img
                                                            src={similar.images?.[0] || 'https://placehold.co/800x600?text=No+Image'}
                                                            alt={similar.title}
                                                            className="object-cover w-full h-full"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://placehold.co/800x600?text=No+Image';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 ml-3">
                                                        <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{similar.title}</h4>
                                                        <p className="text-sm font-semibold text-emerald-600">${similar.price?.toLocaleString() || '0'}</p>
                                                        <div className="flex mt-1 text-xs text-gray-500">
                                                            <span className="mr-2">{similar.beds || 0} bd</span>
                                                            <span className="mr-2">{similar.baths || 0} ba</span>
                                                            <span>{similar.city}, {similar.area}</span>
                                                        </div>
                                                        <a
                                                            href={`/properties/${similar.id}`}
                                                            className="inline-block mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                                                        >
                                                            View Details
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;