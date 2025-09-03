import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiCalendar, FiClock, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, limit, getDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';

const UserDashboard = () => {
    const { currentUser } = useAuth();
    const [savedProperties, setSavedProperties] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;

            try {
                setIsLoading(true);

                // 1. Fetch saved properties with full property details
                const savedPropertiesPromise = fetchSavedProperties();

                // 2. Fetch recent bookings with property details
                const recentBookingsPromise = fetchRecentBookings();

                // 3. Fetch recent activities (combination of saves and bookings)
                const recentActivitiesPromise = fetchRecentActivities();

                // Wait for all data to be fetched
                const [savedPropsResult, recentBookingsResult, activitiesResult] = await Promise.all([
                    savedPropertiesPromise,
                    recentBookingsPromise,
                    recentActivitiesPromise
                ]);

                setSavedProperties(savedPropsResult);
                setRecentBookings(recentBookingsResult);
                setRecentActivities(activitiesResult);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        // Function to fetch saved properties with full details
        const fetchSavedProperties = async () => {
            // Query favorites collection
            const savedQuery = query(
                collection(db, 'favorites'),
                where('userId', '==', currentUser.uid),
                orderBy('createdAt', 'desc'),
                limit(3)
            );

            const savedSnapshot = await getDocs(savedQuery);

            if (savedSnapshot.empty) {
                return [];
            }

            // For each favorite, fetch the property details
            const propertiesPromises = savedSnapshot.docs.map(async (favoriteDoc) => {
                const propertyId = favoriteDoc.data().propertyId;

                try {
                    const propertyDoc = await getDoc(doc(db, 'properties', propertyId));

                    if (!propertyDoc.exists()) {
                        return null; // Property might have been deleted
                    }

                    const propertyData = propertyDoc.data();

                    // Only include active properties
                    if (propertyData.status !== 'active') {
                        return null;
                    }

                    return {
                        id: favoriteDoc.id,
                        propertyId: propertyId,
                        title: propertyData.title || 'Unnamed Property',
                        price: propertyData.price || 0,
                        address: propertyData.address || 'No address provided',
                        imageUrl: propertyData.images?.[0] || 'https://placehold.co/800x500?text=No+Image'
                    };
                } catch (error) {
                    console.error(`Error fetching property ${propertyId}:`, error);
                    return null;
                }
            });

            const propertiesResults = await Promise.all(propertiesPromises);
            return propertiesResults.filter(prop => prop !== null);
        };

        // Function to fetch recent bookings with property details
        const fetchRecentBookings = async () => {
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('userId', '==', currentUser.uid),
                orderBy('date', 'desc'),
                limit(3)
            );

            const bookingsSnapshot = await getDocs(bookingsQuery);

            if (bookingsSnapshot.empty) {
                return [];
            }

            // For each booking, fetch the property details
            const bookingsPromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
                const bookingData = bookingDoc.data();
                const propertyId = bookingData.propertyId;

                try {
                    const propertyDoc = await getDoc(doc(db, 'properties', propertyId));

                    let propertyTitle = 'Property No Longer Available';
                    let imageUrl = 'https://placehold.co/800x500?text=No+Image';

                    if (propertyDoc.exists()) {
                        const propertyData = propertyDoc.data();
                        propertyTitle = propertyData.title || 'Unnamed Property';
                        imageUrl = propertyData.images?.[0] || 'https://placehold.co/800x500?text=No+Image';
                    }

                    return {
                        id: bookingDoc.id,
                        propertyId: propertyId,
                        propertyTitle: propertyTitle,
                        date: bookingData.date.toDate().toISOString(),
                        time: bookingData.time || 'Not specified',
                        status: bookingData.status || 'Pending',
                        imageUrl: imageUrl
                    };
                } catch (error) {
                    console.error(`Error fetching property for booking ${bookingDoc.id}:`, error);
                    return {
                        id: bookingDoc.id,
                        propertyId: propertyId,
                        propertyTitle: 'Error Loading Property',
                        date: bookingData.date.toDate().toISOString(),
                        time: bookingData.time || 'Not specified',
                        status: bookingData.status || 'Pending',
                        imageUrl: 'https://placehold.co/800x500?text=Error'
                    };
                }
            });

            return Promise.all(bookingsPromises);
        };

        // Function to fetch recent activities (saves and bookings combined)
        const fetchRecentActivities = async () => {
            // This could be implemented as a more sophisticated activity feed
            // For now, we'll just count the total number of recent actions
            const savedQuery = query(
                collection(db, 'favorites'),
                where('userId', '==', currentUser.uid)
            );

            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('userId', '==', currentUser.uid)
            );

            const [savedSnapshot, bookingsSnapshot] = await Promise.all([
                getDocs(savedQuery),
                getDocs(bookingsQuery)
            ]);

            return savedSnapshot.size + bookingsSnapshot.size;
        };

        fetchUserData();
    }, [currentUser]);

    if (error) {
        return (
            <DashboardLayout role="user">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 flex items-start">
                    <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                    <div>
                        <h3 className="font-medium mb-1">Error</h3>
                        <p>{error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="user">
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                <FiHeart size={24} />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Saved Properties</h3>
                            <p className="text-3xl font-bold text-gray-800">
                                {isLoading ? (
                                    <span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>
                                ) : (
                                    savedProperties.length
                                )}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                <FiCalendar size={24} />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Bookings</h3>
                            <p className="text-3xl font-bold text-gray-800">
                                {isLoading ? (
                                    <span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>
                                ) : (
                                    recentBookings.length
                                )}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                <FiClock size={24} />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Recent Activity</h3>
                            <p className="text-3xl font-bold text-gray-800">
                                {isLoading ? (
                                    <span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>
                                ) : (
                                    recentActivities
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Saved Properties */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Saved Properties</h2>
                        <Link to="/dashboard/saved" className="text-emerald-600 hover:text-emerald-700 flex items-center">
                            View All <FiChevronRight className="ml-1" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                    <div className="h-36 bg-gray-200"></div>
                                    <div className="p-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : savedProperties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {savedProperties.map(property => (
                                <Link
                                    to={`/properties/${property.propertyId}`}
                                    key={property.id}
                                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="h-36 overflow-hidden">
                                        <img
                                            src={property.imageUrl}
                                            alt={property.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800 mb-1">{property.title}</h3>
                                        <p className="text-gray-600 text-sm mb-2">{property.address}</p>
                                        <p className="text-emerald-600 font-bold">${property.price.toLocaleString()}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                            <p className="text-gray-600 mb-4">You haven't saved any properties yet.</p>
                            <Link
                                to="/properties"
                                className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                Browse Properties
                            </Link>
                        </div>
                    )}
                </div>

                {/* Recent Bookings */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
                        <Link to="/dashboard/bookings" className="text-emerald-600 hover:text-emerald-700 flex items-center">
                            View All <FiChevronRight className="ml-1" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="animate-pulse flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
                                    <div className="flex-grow">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                    <div className="w-16 h-6 bg-gray-200 rounded-full ml-4"></div>
                                </div>
                            ))}
                        </div>
                    ) : recentBookings.length > 0 ? (
                        <div className="space-y-4">
                            {recentBookings.map(booking => (
                                <Link
                                    to="/dashboard/bookings"
                                    key={booking.id}
                                    className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                                        <img
                                            src={booking.imageUrl}
                                            alt={booking.propertyTitle}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-gray-800">{booking.propertyTitle}</h3>
                                        <p className="text-gray-600 text-sm">
                                            {new Date(booking.date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}, {booking.time}
                                        </p>
                                    </div>
                                    <div className="ml-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'Confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : booking.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : booking.status === 'Cancelled'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                            <p className="text-gray-600 mb-4">You don't have any bookings yet.</p>
                            <Link
                                to="/properties"
                                className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                Find Properties
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserDashboard;