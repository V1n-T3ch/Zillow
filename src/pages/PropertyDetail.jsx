import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
    FiCamera, FiChevronLeft, FiChevronRight, FiPlus,
    FiCheckCircle, FiMapPin, FiShare2, FiUser, FiPhone,
    FiMessageSquare, FiPlay, FiPause, FiVolume2, FiVolumeX
} from 'react-icons/fi';
import { db } from '../firebase';
import {
    doc, getDoc, collection, getDocs, query, where, documentId
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { incrementPropertyViews } from '../services/analyticsService';
import Navbar from '../components/Navbar';
import SubscriptionPaywall from '../components/SubscriptionPaywall';
import { normalizeProperty } from '../utils/propertyData';

const isSubscriptionActive = (subscription) => {
    if (!subscription || subscription.status !== 'active') {
        return false;
    }

    if (!subscription.expiresAt) {
        return true;
    }

    const expiryDate = subscription.expiresAt.toDate
        ? subscription.expiresAt.toDate()
        : new Date(subscription.expiresAt);

    return expiryDate.getTime() > Date.now();
};

// Enhanced Media Gallery Component for Images and Videos
const PropertyMediaGallery = ({ images = [], videos = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // FIX: Support both plain URL strings and { url, poster } objects for videos
    const allMedia = [
        ...images.map(url => ({ type: 'image', url })),
        ...videos.map(v =>
            typeof v === 'string'
                ? { type: 'video', url: v, poster: '' }
                : { type: 'video', url: v.url, poster: v.poster || '' }
        )
    ];

    // Use placeholders if no media
    const mediaToShow = allMedia.length > 0 ? allMedia : [
        { type: 'image', url: 'https://placehold.co/1200x800?text=No+Media+Available' }
    ];

    const currentMedia = mediaToShow[activeIndex];

    // Touch handlers for mobile swipe
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 100) {
            goToNext();
        }
        if (touchStart - touchEnd < -100) {
            goToPrevious();
        }
    };

    // FIX: Reset video ref on navigation to avoid stale state
    const videoRef = React.useRef(null);

    const goToPrevious = useCallback(() => {
        const newIndex = activeIndex === 0 ? mediaToShow.length - 1 : activeIndex - 1;
        setActiveIndex(newIndex);
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [activeIndex, mediaToShow.length]);

    const goToNext = useCallback(() => {
        const newIndex = activeIndex === mediaToShow.length - 1 ? 0 : activeIndex + 1;
        setActiveIndex(newIndex);
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [activeIndex, mediaToShow.length]);

    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)');
        const updateTouchDeviceState = () => setIsTouchDevice(mediaQuery.matches);

        updateTouchDeviceState();

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateTouchDeviceState);
            return () => mediaQuery.removeEventListener('change', updateTouchDeviceState);
        }

        mediaQuery.addListener(updateTouchDeviceState);
        return () => mediaQuery.removeListener(updateTouchDeviceState);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showModal) return;

            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'Escape') {
                setShowModal(false);
                setIsPlaying(false);
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                }
            } else if (e.key === ' ' && currentMedia?.type === 'video') {
                e.preventDefault();
                togglePlayPause();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showModal, activeIndex, currentMedia, goToNext, goToPrevious, togglePlayPause]);

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(() => setIsPlaying(false));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying]);

    // FIX: Sync muted state to video ref directly
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const renderMediaContent = (media, isModal = false) => {
        if (media.type === 'video') {
            return (
                <div className="relative w-full h-full group">
                    <video
                        ref={isModal ? videoRef : null}
                        src={media.url}
                        // FIX: Use poster frame so there's no black box on load
                        poster={media.poster || undefined}
                        className="object-cover w-full h-full"
                        muted={isMuted}
                        loop
                        playsInline
                        controls={isModal}
                        // FIX: preload metadata in modal, none in thumbnail
                        preload={isModal ? 'metadata' : 'none'}
                        onError={(e) => {
                            console.error('Video failed to load:', media.url);
                            e.target.style.display = 'none';
                        }}
                    />

                    {/* Video Controls Overlay */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/30 ${isModal ? 'pointer-events-none' : 'pointer-events-none opacity-0 group-hover:opacity-100'}`}
                    >
                        <div className="flex items-center gap-4">
                            {isModal && !isTouchDevice && (
                                <>
                                    <button
                                        onClick={togglePlayPause}
                                        className="p-3 text-white transition-colors rounded-full pointer-events-auto bg-black/50 hover:bg-black/70"
                                    >
                                        {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
                                    </button>
                                    <button
                                        onClick={toggleMute}
                                        className="p-3 text-white transition-colors rounded-full pointer-events-auto bg-black/50 hover:bg-black/70"
                                    >
                                        {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Play Icon for Non-Modal */}
                    {!isModal && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="p-4 text-white rounded-full bg-black/50">
                                <FiPlay size={32} />
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <Motion.img
                    src={media.url}
                    alt="Property view"
                    className="object-cover w-full h-full"
                    loading={isModal ? 'eager' : 'lazy'}
                    decoding="async"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/1200x800?text=Image+Not+Available';
                    }}
                />
            );
        }
    };

    return (
        <>
            <div className="relative mb-8 overflow-hidden shadow-2xl rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[70vh] max-h-[600px]">
                    {/* FIX: Main display now tracks activeIndex, not hardcoded to [0] */}
                    <div
                        className="relative col-span-2 overflow-hidden cursor-pointer group"
                        onClick={() => setShowModal(true)}
                    >
                        {renderMediaContent(mediaToShow[activeIndex])}
                        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/40 to-transparent group-hover:opacity-100">
                            <div className="absolute bottom-4 left-4">
                                <div className="flex items-center gap-2 text-white">
                                    <FiCamera size={20} />
                                    <span className="font-medium">
                                        View all {images.length} photos {videos.length > 0 && `& ${videos.length} videos`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thumbnail Grid */}
                    <div className="hidden grid-rows-2 gap-2 md:grid">
                        {mediaToShow.length > 1 ? (
                            <>
                                <div
                                    className="relative overflow-hidden cursor-pointer group"
                                    onClick={() => { setActiveIndex(1); setShowModal(true); }}
                                >
                                    {renderMediaContent(mediaToShow[1])}
                                    <div className="absolute inset-0 transition-opacity opacity-0 bg-black/20 group-hover:opacity-100"></div>
                                </div>
                                <div
                                    className="relative overflow-hidden cursor-pointer group"
                                    onClick={() => { setActiveIndex(2); setShowModal(true); }}
                                >
                                    {mediaToShow.length > 2 ? (
                                        <>
                                            {renderMediaContent(mediaToShow[2])}
                                            {mediaToShow.length > 3 && (
                                                <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/50 group-hover:bg-black/70">
                                                    <div className="text-center text-white">
                                                        <FiPlus size={28} className="mx-auto mb-1" />
                                                        <span className="font-medium">{mediaToShow.length - 3} more</span>
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
                                    <p>No additional media</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Dots Indicator */}
                <div className="absolute left-0 right-0 md:hidden bottom-4">
                    <div className="flex justify-center gap-1.5">
                        {mediaToShow.map((_, index) => (
                            <button
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-white/50'}`}
                                onClick={() => setActiveIndex(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* View All Button */}
                <button
                    className="absolute flex items-center px-4 py-2 font-medium text-gray-800 transition-all rounded-lg shadow-lg right-4 bottom-4 bg-white/90 hover:bg-white"
                    onClick={() => setShowModal(true)}
                >
                    <FiCamera className="mr-2" />
                    View All Media
                </button>
            </div>

            {/* Modal Gallery */}
            <AnimatePresence>
                {showModal && (
                    <Motion.div
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute p-2 text-white transition-colors rounded-full top-4 right-4 bg-black/40 hover:bg-black/60"
                            onClick={() => {
                                setShowModal(false);
                                setIsPlaying(false);
                                if (videoRef.current) {
                                    videoRef.current.pause();
                                    videoRef.current.currentTime = 0;
                                }
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        {/* Media Type Indicator */}
                        <div className="absolute z-10 px-3 py-1 text-sm text-white rounded-full top-4 left-4 bg-black/60">
                            {currentMedia?.type === 'video' ? '📹 Video' : '📷 Photo'}
                        </div>

                        {/* Main Media Display */}
                        <div className="relative w-full max-w-5xl h-[70vh]">
                            <div
                                className="flex items-center justify-center w-full h-full"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <AnimatePresence mode="wait">
                                    <Motion.div
                                        key={activeIndex}
                                        className="w-full h-full"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {renderMediaContent(currentMedia, true)}
                                    </Motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation Buttons */}
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

                        {/* Thumbnail Strip */}
                        <div className="w-full max-w-5xl px-4 mt-4">
                            <div className="flex gap-2 py-2 overflow-x-auto scrollbar-hide">
                                {mediaToShow.map((media, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setActiveIndex(index);
                                            setIsPlaying(false);
                                            if (videoRef.current) {
                                                videoRef.current.pause();
                                                videoRef.current.currentTime = 0;
                                            }
                                        }}
                                        className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden transition-all relative ${
                                            activeIndex === index ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        {/* FIX: Video thumbnails use poster img instead of <video> element */}
                                        {media.type === 'video' ? (
                                            <div className="relative w-full h-full">
                                                {media.poster ? (
                                                    <img
                                                        src={media.poster}
                                                        alt={`Video thumbnail ${index + 1}`}
                                                        className="object-cover w-full h-full"
                                                        loading="lazy"
                                                        decoding="async"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://placehold.co/64x48?text=▶';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full bg-gray-800">
                                                        <FiPlay size={14} className="text-white" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <FiPlay size={12} className="text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={media.url}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="object-cover w-full h-full"
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/1200x800?text=Image+Not+Available';
                                                }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Media Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/60 rounded-full px-4 py-1.5">
                            {activeIndex + 1} / {mediaToShow.length}
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Animated Feature Amenity Component (unchanged)
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
    const { currentUser, userDetails, fetchUserDetails } = useAuth();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [agentDetails, setAgentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [hasRecordedView, setHasRecordedView] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
    const canViewSensitiveDetails = isSubscriptionActive(userDetails?.subscription);

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

                const propertyData = normalizeProperty({
                    id: propertyDoc.id,
                    ...propertyDoc.data()
                });

                setProperty(propertyData);

                // Record the view after a short delay
                if (!hasRecordedView) {
                    const viewTimer = setTimeout(() => {
                        incrementPropertyViews(id, propertyData.agentId);
                        setHasRecordedView(true);
                    }, 5000);

                    return () => clearTimeout(viewTimer);
                }

                // Set user email from auth if available
                if (currentUser) {
                    setUserEmail(currentUser.email || '');
                }

                // Fetch similar properties separately so a query issue does not block the main detail view.
                try {
                    const similarQuery = query(
                        collection(db, 'properties'),
                        where('city', '==', propertyData.city),
                        where('propertyType', '==', propertyData.propertyType),
                        where(documentId(), '!=', id)
                    );

                    const similarSnapshot = await getDocs(similarQuery);
                    const similarData = similarSnapshot.docs.map(similarDoc => normalizeProperty({
                        id: similarDoc.id,
                        ...similarDoc.data()
                    })).slice(0, 3);

                    setSimilarProperties(similarData);
                } catch (similarError) {
                    console.warn('Failed to load similar properties:', similarError);
                    setSimilarProperties([]);
                }

            } catch (err) {
                console.error('Error fetching property:', err);
                setError('Failed to load property data');
            } finally {
                setLoading(false);
            }
        };

        fetchPropertyData();
    }, [id, currentUser]);

    useEffect(() => {
        const fetchAgentDetails = async () => {
            if (!property?.agentId || !canViewSensitiveDetails) {
                return;
            }

            try {
                const agentDoc = await getDoc(doc(db, 'users', property.agentId));
                if (agentDoc.exists()) {
                    const agentData = agentDoc.data();
                    console.log('Agent details fetched:', agentData);
                    setAgentDetails({
                        name: agentData.name || agentData.agentApplication?.fullName || 'Property Agent',
                        email: agentData.email,
                        phone: agentData.agentApplication?.phoneNumber || agentData.phone,
                        company: agentData.agentApplication?.companyName || 'Dwella Real Estate',
                        photoURL: agentData.photoURL,
                        bio: agentData.agentApplication?.bio,
                        website: agentData.agentApplication?.website
                    });
                } else {
                    console.warn('Agent document not found for ID:', property.agentId);
                    setAgentDetails({
                        name: 'Property Agent',
                        email: 'contact@dwella.com',
                        phone: 'Contact for details',
                        company: 'Dwella Real Estate'
                    });
                }
            } catch (agentError) {
                console.error('Error fetching agent details:', agentError);
                setAgentDetails({
                    name: 'Property Agent',
                    email: 'contact@dwella.com',
                    phone: 'Contact for details',
                    company: 'Dwella Real Estate'
                });
            }
        };

        fetchAgentDetails();
    }, [property?.agentId, canViewSensitiveDetails]);

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
                <Navbar />
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
                <Navbar />
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
                    <PropertyMediaGallery
                        // images={property.images || []}
                        videos={property.videos || []}
                    />

                    <div className="flex flex-col gap-8 lg:flex-row">
                        <div className="lg:w-2/3">
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

                            <div className="mb-6 overflow-hidden bg-white rounded-xl shadow-subtle">
                                <div className="flex border-b border-gray-100">
                                    <button
                                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'description' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setActiveTab('description')}
                                    >
                                        Description
                                    </button>
                                    <button
                                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'features' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        onClick={() => setActiveTab('features')}
                                    >
                                        Features
                                    </button>
                                </div>

                                <div className="p-6">
                                    {activeTab === 'description' && (
                                        <div className="text-gray-700 whitespace-pre-line">
                                            {property.description || 'No description available.'}
                                        </div>
                                    )}

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

                        <div className="lg:w-1/3">
                            <div className="relative p-6 mb-6 bg-white rounded-xl shadow-subtle group">
                                {!canViewSensitiveDetails && (
                                    <button
                                        type="button"
                                        onClick={() => (!currentUser ? navigate('/login') : setShowPaymentPrompt(true))}
                                        className="absolute inset-0 z-10 flex items-center justify-center transition-all rounded-xl bg-black/5 backdrop-blur-sm group-hover:bg-black/10"
                                    >
                                        <div className="text-center">
                                            <div className="mb-1 text-sm font-semibold text-gray-700">Click to view</div>
                                            <div className="text-xs text-gray-600">Agent details and Property location</div>
                                        </div>
                                    </button>
                                )}

                                <div className={`mb-4 flex items-center ${!canViewSensitiveDetails ? 'blur-sm select-none' : ''}`}>
                                    <div className="flex items-center justify-center w-16 h-16 mr-4 overflow-hidden bg-gray-200 rounded-full">
                                        {agentDetails?.photoURL && !imageError ? (
                                            <img
                                                src={agentDetails.photoURL}
                                                alt={agentDetails?.name || 'Agent'}
                                                className="object-cover w-full h-full"
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full">
                                                <FiUser className="text-gray-400" size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{agentDetails?.name || 'Loading...'}</h3>
                                        <p className="text-sm text-gray-600">{agentDetails?.company || 'Dwella Real Estate'}</p>
                                        {agentDetails?.bio && (
                                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{agentDetails.bio}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6 space-y-4">
                                    {agentDetails?.phone && (
                                        <a
                                            href={canViewSensitiveDetails ? `tel:${agentDetails.phone}` : undefined}
                                            onClick={(e) => {
                                                if (!canViewSensitiveDetails) {
                                                    e.preventDefault();
                                                    !currentUser ? navigate('/login') : setShowPaymentPrompt(true);
                                                }
                                            }}
                                            className={`flex items-center p-3 text-gray-700 transition-colors rounded-lg ${canViewSensitiveDetails ? 'hover:text-emerald-600 hover:bg-emerald-50' : 'cursor-pointer hover:bg-emerald-50 blur-sm'}`}
                                        >
                                            <FiPhone className="mr-3 text-emerald-500" />
                                            <div>
                                                <div className="font-medium">Call Agent</div>
                                                <div className="text-sm text-gray-500">{agentDetails.phone}</div>
                                            </div>
                                        </a>
                                    )}

                                    {agentDetails?.email && (
                                        <a
                                            href={canViewSensitiveDetails ? `mailto:${agentDetails.email}?subject=Inquiry about ${property.title}&body=Hi ${agentDetails.name},%0D%0A%0D%0AI'm interested in learning more about the property "${property.title}" listed at Ksh.${property.price?.toLocaleString()}.%0D%0A%0D%0ACould you please provide more details?%0D%0A%0D%0AThank you!` : undefined}
                                            onClick={(e) => {
                                                if (!canViewSensitiveDetails) {
                                                    e.preventDefault();
                                                    !currentUser ? navigate('/login') : setShowPaymentPrompt(true);
                                                }
                                            }}
                                            className={`flex items-center p-3 text-gray-700 transition-colors rounded-lg ${canViewSensitiveDetails ? 'hover:text-emerald-600 hover:bg-emerald-50' : 'cursor-pointer hover:bg-emerald-50 blur-sm'}`}
                                        >
                                            <FiMessageSquare className="mr-3 text-emerald-500" />
                                            <div>
                                                <div className="font-medium">Send Email</div>
                                                <div className="text-sm text-gray-500">{agentDetails.email}</div>
                                            </div>
                                        </a>
                                    )}

                                    {agentDetails?.website && (
                                        <a
                                            href={canViewSensitiveDetails ? (agentDetails.website.startsWith('http') ? agentDetails.website : `https://${agentDetails.website}`) : undefined}
                                            target={canViewSensitiveDetails ? '_blank' : undefined}
                                            rel={canViewSensitiveDetails ? 'noopener noreferrer' : undefined}
                                            onClick={(e) => {
                                                if (!canViewSensitiveDetails) {
                                                    e.preventDefault();
                                                    !currentUser ? navigate('/login') : setShowPaymentPrompt(true);
                                                }
                                            }}
                                            className={`flex items-center p-3 text-gray-700 transition-colors rounded-lg ${canViewSensitiveDetails ? 'hover:text-emerald-600 hover:bg-emerald-50' : 'cursor-pointer hover:bg-emerald-50 blur-sm'}`}
                                        >
                                            <svg className="w-5 h-5 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c2.485 0 4.5-4.03 4.5-9S11.485 3 9 3m0 18c-2.485 0-4.5-4.03-4.5-9S6.515 3 9 3m0 18V3" />
                                            </svg>
                                            <div>
                                                <div className="font-medium">Visit Website</div>
                                                <div className="text-sm text-gray-500 truncate">{agentDetails.website}</div>
                                            </div>
                                        </a>
                                    )}

                                    {!agentDetails && (
                                        <div className="flex items-center p-3 text-gray-500">
                                            <div className="w-5 h-5 mr-3 border-2 border-gray-300 rounded-full animate-spin border-t-emerald-500"></div>
                                            Loading agent details...
                                        </div>
                                    )}
                                </div>

                                {property.location && (
                                    <div className="mb-6 space-y-3">
                                        <button
                                            onClick={() => {
                                                const { lat, lng } = property.location;
                                                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                            }}
                                            className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <FiMapPin className="mr-2" />
                                            Open property location
                                        </button>

                                        <button
                                            onClick={() => {
                                                const { lat, lng } = property.location;
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
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
                            </div>

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
                                                    <p className="text-sm font-semibold text-emerald-600">Ksh.{similar.price?.toLocaleString() || '0'}</p>
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

                    <AnimatePresence>
                        {showPaymentPrompt && (
                            <Motion.div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Motion.div
                                    className="w-full max-w-md mx-4"
                                    initial={{ scale: 0.95, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.95, y: 20 }}
                                >
                                    <SubscriptionPaywall
                                        isAuthenticated={Boolean(currentUser)}
                                        email={currentUser?.email || userEmail}
                                        currentUserId={currentUser?.uid}
                                        onClose={() => setShowPaymentPrompt(false)}
                                        onSubscribed={async () => {
                                            if (currentUser?.uid) {
                                                await fetchUserDetails(currentUser.uid);
                                                setShowPaymentPrompt(false);
                                            }
                                        }}
                                    />
                                </Motion.div>
                            </Motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;