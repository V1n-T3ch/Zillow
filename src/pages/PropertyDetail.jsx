import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  FiCamera, FiChevronLeft, FiChevronRight, FiPlus, 
  FiCheckCircle, FiHome, FiCalendar, FiMapPin, 
  FiHeart, FiShare2, FiDollarSign, 
  FiUsers, FiUser, FiPhone, FiMessageSquare
} from 'react-icons/fi';
import { db } from '../firebase';
import { 
  doc, getDoc, collection, addDoc, 
  deleteDoc, getDocs, query, where, serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { incrementPropertyViews } from '../services/analyticsService';

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
                                        className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden transition-all ${
                                            activeIndex === index ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-100'
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
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteId, setFavoriteId] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [bookingSubmitted, setBookingSubmitted] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [userPhone, setUserPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');
    const [bookingErrors, setBookingErrors] = useState({});
    const [existingBookings, setExistingBookings] = useState([]);
    const [hasCheckedBookings, setHasCheckedBookings] = useState(false);
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
                        incrementPropertyViews(id, propertyData.vendorId);
                        setHasRecordedView(true);
                    }, 5000); // 5 second delay
                    
                    // Clean up timer if component unmounts
                    return () => clearTimeout(viewTimer);
                }
                
                // Check if this property is in user's favorites
                if (currentUser) {
                    const favoritesQuery = query(
                        collection(db, 'favorites'),
                        where('userId', '==', currentUser.uid),
                        where('propertyId', '==', id)
                    );
                    
                    const favoritesSnapshot = await getDocs(favoritesQuery);
                    
                    if (!favoritesSnapshot.empty) {
                        setIsFavorite(true);
                        setFavoriteId(favoritesSnapshot.docs[0].id);
                    }
                    
                    // Set user email from auth
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
                    incrementPropertyViews(id, propertyData.vendorId);
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

    // Toggle favorite status
    const toggleFavorite = async () => {
        if (!currentUser) {
            toast.info('Please log in to save properties');
            navigate('/login', { state: { from: `/properties/${id}` } });
            return;
        }
        
        try {
            if (isFavorite) {
                // Remove from favorites
                await deleteDoc(doc(db, 'favorites', favoriteId));
                setIsFavorite(false);
                setFavoriteId(null);
                toast.success('Removed from favorites');
            } else {
                // Add to favorites
                const favoriteRef = await addDoc(collection(db, 'favorites'), {
                    userId: currentUser.uid,
                    propertyId: id,
                    createdAt: serverTimestamp()
                });
                
                setIsFavorite(true);
                setFavoriteId(favoriteRef.id);
                toast.success('Added to favorites');
            }
        } catch (err) {
            console.error('Error updating favorites:', err);
            toast.error('Failed to update favorites');
        }
    };

    // Check for existing bookings
    const checkExistingBookings = useCallback(async () => {
        if (!currentUser || !id || hasCheckedBookings) return;
        
        try {
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('userId', '==', currentUser.uid),
                where('propertyId', '==', id)
            );
            
            const bookingsSnapshot = await getDocs(bookingsQuery);
            
            if (!bookingsSnapshot.empty) {
                const bookingsData = bookingsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    bookingDate: doc.data().bookingDate?.toDate() || new Date()
                }));
                
                setExistingBookings(bookingsData);
            }
            
            setHasCheckedBookings(true);
        } catch (err) {
            console.error('Error checking bookings:', err);
        }
    }, [currentUser, id, hasCheckedBookings]);

    useEffect(() => {
        if (currentUser && id && !hasCheckedBookings) {
            checkExistingBookings();
            
            // Pre-fill user email if available
            if (currentUser.email) {
                setUserEmail(currentUser.email);
            }
        }
    }, [currentUser, checkExistingBookings, hasCheckedBookings, userEmail, id]);

    // Submit booking request
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            toast.info('Please log in to book a viewing');
            navigate('/login', { state: { from: `/properties/${id}` } });
            return;
        }
        
        // Validate form
        const errors = {};
        if (!selectedDate) errors.date = 'Please select a date';
        if (!selectedTime) errors.time = 'Please select a time';
        if (!userPhone) errors.phone = 'Please provide your phone number';
        if (!userEmail) errors.email = 'Please provide your email';
        
        if (Object.keys(errors).length > 0) {
            setBookingErrors(errors);
            return;
        }
        
        setBookingErrors({});
        setBookingLoading(true);
        
        try {
            // Create booking in Firestore
            await addDoc(collection(db, 'bookings'), {
                propertyId: id,
                userId: currentUser.uid,
                userEmail,
                userPhone,
                bookingDate: new Date(`${selectedDate}T00:00:00`),
                bookingTime: selectedTime,
                notes: bookingNotes,
                status: 'pending',
                createdAt: serverTimestamp(),
                vendorId: property.vendorId,       // Make sure to include vendorId
                propertyTitle: property.title,     // Include property title
                agentName: property.vendorName     // Use vendorName directly
            });
            
            setBookingSubmitted(true);
            
            // Reset form
            setTimeout(() => {
                setShowBookingForm(false);
                setBookingSubmitted(false);
                setSelectedDate('');
                setSelectedTime('');
                setBookingNotes('');
                
                // Refresh bookings
                checkExistingBookings();
                setHasCheckedBookings(false);
            }, 3000);
            
            toast.success('Booking request submitted successfully!');
        } catch (err) {
            console.error('Error submitting booking:', err);
            toast.error('Failed to submit booking request');
        } finally {
            setBookingLoading(false);
        }
    };

    // Cancel an existing booking
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'bookings', bookingId));
            
            // Update local state
            setExistingBookings(existingBookings.filter(booking => booking.id !== bookingId));
            
            toast.success('Booking cancelled successfully');
        } catch (err) {
            console.error('Error cancelling booking:', err);
            toast.error('Failed to cancel booking');
        }
    };

    // Generate available times
    const availableTimes = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];

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

    // Status display
    const getStatusDisplay = () => {
        if (property.listingStatus === 'For Rent') {
            return 'For Rent';
        } else {
            return 'For Sale';
        }
    };
    
    // Status color classes
    const getStatusColors = () => {
        if (property.listingStatus === 'For Rent') {
            return 'bg-violet-100 text-violet-800';
        } else {
            return 'bg-amber-100 text-amber-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
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
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColors()} mb-2`}>
                                            {getStatusDisplay()}
                                        </span>
                                        <h1 className="mb-2 font-serif text-3xl font-bold text-gray-800">{property.title}</h1>
                                        <div className="flex items-center text-gray-600">
                                            <FiMapPin className="mr-2 text-gray-400" />
                                            {property.city}{property.area ? `, ${property.area}` : ''}
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-emerald-600">
                                            ${property.price?.toLocaleString() || '0'}
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

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={toggleFavorite}
                                        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isFavorite
                                            ? 'bg-red-50 text-red-600 border border-red-200'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        <FiHeart className={`mr-2 ${isFavorite ? 'fill-red-500' : ''}`} />
                                        {isFavorite ? 'Saved' : 'Save'}
                                    </button>

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
                                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'details' 
                                            ? 'text-emerald-600 border-b-2 border-emerald-600' 
                                            : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setActiveTab('details')}
                                    >
                                        Details
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

                                    {/* Details Tab */}
                                    {activeTab === 'details' && (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <h3 className="mb-3 font-medium text-gray-700">Basic Information</h3>
                                                <ul className="space-y-3">
                                                    <li className="flex items-start">
                                                        <FiHome className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Property Type</span>
                                                            <span className="text-gray-800">{property.propertyType || 'N/A'}</span>
                                                        </div>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <FiUsers className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Year Built</span>
                                                            <span className="text-gray-800">{property.yearBuilt || 'N/A'}</span>
                                                        </div>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <FiDollarSign className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Listing Status</span>
                                                            <span className="text-gray-800">{property.listingStatus || 'For Sale'}</span>
                                                        </div>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <FiMapPin className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Location</span>
                                                            <span className="text-gray-800">{property.city}{property.area ? `, ${property.area}` : ''}</span>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h3 className="mb-3 font-medium text-gray-700">Interior Features</h3>
                                                <ul className="space-y-3">
                                                    <li className="flex items-start">
                                                        <FiHome className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Bedrooms</span>
                                                            <span className="text-gray-800">{property.beds || 'N/A'}</span>
                                                        </div>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <FiHome className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Bathrooms</span>
                                                            <span className="text-gray-800">{property.baths || 'N/A'}</span>
                                                        </div>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <FiHome className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Stories</span>
                                                            <span className="text-gray-800">{property.stories || 'N/A'}</span>
                                                        </div>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <FiHome className="mt-1 mr-2 text-emerald-500" />
                                                        <div>
                                                            <span className="block text-sm text-gray-500">Garage</span>
                                                            <span className="text-gray-800">{property.garage || 'N/A'}</span>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
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

                            {/* Property Stats and Highlights */}
                            <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
                                <FeatureBadge
                                    icon={FiHome}
                                    label="Property Type"
                                    value={property.propertyType || 'N/A'}
                                    color="emerald"
                                />
                                <FeatureBadge
                                    icon={FiUsers}
                                    label="Bedrooms"
                                    value={property.beds}
                                    color="blue"
                                />
                                <FeatureBadge
                                    icon={FiHome}
                                    label="Bathrooms"
                                    value={property.baths}
                                    color="amber"
                                />
                                <FeatureBadge
                                    icon={FiHome}
                                    label="Garage"
                                    value={property.garage || 'None'}
                                    color="purple"
                                />
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
                                        <h3 className="font-bold text-gray-800">{property.vendorName || 'Property Agent'}</h3>
                                        <p className="text-sm text-gray-600">Zillow Real Estate</p>
                                    </div>
                                </div>

                                {existingBookings.length > 0 ? (
                                    <div className="mb-6">
                                        <h4 className="mb-3 font-medium text-gray-800">Your Bookings</h4>
                                        {existingBookings.map((booking) => (
                                            <div key={booking.id} className="p-4 mb-2 rounded-lg bg-blue-50">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Status: 
                                                            <span className={`ml-1 ${
                                                                booking.status === 'confirmed' 
                                                                    ? 'text-green-600' 
                                                                    : booking.status === 'cancelled' 
                                                                    ? 'text-red-600' 
                                                                    : 'text-amber-600'
                                                            }`}>
                                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    {booking.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                            className="text-sm text-red-600 hover:text-red-800"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="mb-6 space-y-4">
                                    <a href="tel:123-456-7890" className="flex items-center text-gray-700 hover:text-emerald-600">
                                        <FiPhone className="mr-3 text-emerald-500" />
                                        Contact via phone
                                    </a>
                                    <a href={`mailto:${property.vendorEmail || 'contact@example.com'}`} className="flex items-center text-gray-700 hover:text-emerald-600">
                                        <FiMessageSquare className="mr-3 text-emerald-500" />
                                        Send email inquiry
                                    </a>
                                </div>

                                <button 
                                    onClick={() => setShowBookingForm(!showBookingForm)}
                                    className="flex items-center justify-center w-full py-3 font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <FiCalendar className="mr-2" />
                                    Schedule a Viewing
                                </button>
                            </div>

                            {/* Booking Form */}
                            {showBookingForm && (
                                <div className="p-6 mb-6 bg-white rounded-xl shadow-subtle">
                                    <h3 className="mb-4 font-bold text-gray-800">Schedule a Viewing</h3>
                                    
                                    {bookingSubmitted ? (
                                        <div className="p-4 text-center rounded-lg bg-emerald-50 text-emerald-700">
                                            <FiCheckCircle className="mx-auto mb-2 text-2xl" />
                                            <p className="font-medium">Booking request sent!</p>
                                            <p className="mt-1 text-sm">We'll contact you to confirm your appointment.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleBookingSubmit}>
                                            <div className="mb-4">
                                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                                    Select Date*
                                                </label>
                                                <input
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    className={`w-full p-2 border rounded-lg ${
                                                        bookingErrors.date ? 'border-red-500' : 'border-gray-300'
                                                    } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                                                />
                                                {bookingErrors.date && (
                                                    <p className="mt-1 text-xs text-red-500">{bookingErrors.date}</p>
                                                )}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                                    Select Time*
                                                </label>
                                                <select
                                                    value={selectedTime}
                                                    onChange={(e) => setSelectedTime(e.target.value)}
                                                    className={`w-full p-2 border rounded-lg ${
                                                        bookingErrors.time ? 'border-red-500' : 'border-gray-300'
                                                    } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                                                >
                                                    <option value="">Select a time</option>
                                                    {availableTimes.map((time) => (
                                                        <option key={time} value={time}>
                                                            {time}
                                                        </option>
                                                    ))}
                                                </select>
                                                {bookingErrors.time && (
                                                    <p className="mt-1 text-xs text-red-500">{bookingErrors.time}</p>
                                                )}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                                    Your Phone Number*
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={userPhone}
                                                    onChange={(e) => setUserPhone(e.target.value)}
                                                    className={`w-full p-2 border rounded-lg ${
                                                        bookingErrors.phone ? 'border-red-500' : 'border-gray-300'
                                                    } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                                                    placeholder="Your phone number"
                                                />
                                                {bookingErrors.phone && (
                                                    <p className="mt-1 text-xs text-red-500">{bookingErrors.phone}</p>
                                                )}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                                    Your Email*
                                                </label>
                                                <input
                                                    type="email"
                                                    value={userEmail}
                                                    onChange={(e) => setUserEmail(e.target.value)}
                                                    className={`w-full p-2 border rounded-lg ${
                                                        bookingErrors.email ? 'border-red-500' : 'border-gray-300'
                                                    } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                                                    placeholder="Your email address"
                                                />
                                                {bookingErrors.email && (
                                                    <p className="mt-1 text-xs text-red-500">{bookingErrors.email}</p>
                                                )}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                                    Notes (optional)
                                                </label>
                                                <textarea
                                                    value={bookingNotes}
                                                    onChange={(e) => setBookingNotes(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="Any special requests or questions?"
                                                    rows="3"
                                                ></textarea>
                                            </div>
                                            
                                            <button
                                                type="submit"
                                                className="flex items-center justify-center w-full py-3 font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                                disabled={bookingLoading}
                                            >
                                                {bookingLoading ? (
                                                    <>
                                                        <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Confirm Booking
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    )}
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
    );
};

export default PropertyDetail;