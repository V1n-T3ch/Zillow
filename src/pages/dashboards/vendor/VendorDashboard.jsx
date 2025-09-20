import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiCalendar, FiDollarSign, FiUsers, FiChevronRight, FiPlusCircle, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, limit, orderBy, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';

const VendorDashboard = () => {
    const { currentUser } = useAuth();
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({
        totalProperties: 0,
        activeProperties: 0,
        totalViews: 0,
        totalInquiries: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVendorData = async () => {
            if (!currentUser) return;

            try {
                setIsLoading(true);

                // Fetch properties
                const propertiesQuery = query(
                    collection(db, 'properties'),
                    where('vendorId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                );

                const propertiesSnapshot = await getDocs(propertiesQuery);

                const propertiesList = propertiesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    title: doc.data().title || 'Untitled Property',
                    address: doc.data().address || 'Address not available',
                    price: doc.data().price || 0,
                    status: doc.data().status || 'pending',
                    type: doc.data().propertyType || doc.data().type || 'Property',
                    views: doc.data().views || 0,
                    inquiries: doc.data().inquiries || 0,
                    imageUrl: doc.data().images?.[0] || 'https://placehold.co/800x500?text=No+Image',
                    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));

                setProperties(propertiesList);

                // Fetch bookings - with improved error handling and logging
                try {
                    console.log("Attempting to fetch bookings for vendor:", currentUser.uid);
                    
                    const bookingsQuery = query(
                        collection(db, 'bookings'),
                        where('vendorId', '==', currentUser.uid),
                        orderBy('createdAt', 'desc'), // Use createdAt instead of date for sorting
                        limit(5) // Fetch more to ensure we get some results
                    );

                    const bookingsSnapshot = await getDocs(bookingsQuery);
                    console.log(`Found ${bookingsSnapshot.docs.length} bookings`);

                    // Process and format the bookings
                    const bookingsList = await Promise.all(bookingsSnapshot.docs.map(async (bookingDoc) => {
                        const bookingData = bookingDoc.data();
                        console.log("Booking data:", bookingData);

                        // Get property details if needed
                        let propertyImage = bookingData.propertyImage || null;
                        let propertyTitle = bookingData.propertyTitle || 'Property Viewing';

                        if (bookingData.propertyId) {
                            try {
                                const propertyDocRef = doc(db, 'properties', bookingData.propertyId);
                                const propertyDoc = await getDoc(propertyDocRef);
                                if (propertyDoc.exists()) {
                                    const propertyData = propertyDoc.data();
                                    propertyImage = propertyData.images?.[0] || propertyImage;
                                    propertyTitle = propertyData.title || propertyTitle;
                                }
                            } catch (err) {
                                console.error(`Error fetching property ${bookingData.propertyId}:`, err);
                                // Continue with default values
                            }
                        }

                        // Format the date safely
                        let formattedDate;
                        try {
                            formattedDate = bookingData.date?.toDate?.() 
                                ? bookingData.date.toDate().toISOString() 
                                : typeof bookingData.date === 'string' 
                                    ? new Date(bookingData.date).toISOString() 
                                    : new Date().toISOString();
                        } catch (err) {
                            console.error("Error formatting date:", err);
                            formattedDate = new Date().toISOString();
                        }

                        return {
                            id: bookingDoc.id,
                            propertyId: bookingData.propertyId || '',
                            propertyTitle: propertyTitle,
                            clientName: bookingData.userName || bookingData.clientName || 'Client',
                            clientEmail: bookingData.userEmail || bookingData.clientEmail || '',
                            date: formattedDate,
                            time: bookingData.time || 'Not specified',
                            status: bookingData.status || 'Pending',
                            imageUrl: propertyImage || 'https://placehold.co/800x500?text=Property'
                        };
                    }));

                    console.log("Processed bookings:", bookingsList);
                    setBookings(bookingsList);
                } catch (bookingError) {
                    console.error('Error fetching bookings:', bookingError);
                    // Don't fail the whole function, just set bookings to empty
                    setBookings([]);
                }

                // Calculate stats from real data
                const activeProperties = propertiesList.filter(p => p.status === 'active' || p.status === 'Active').length;
                const totalViews = propertiesList.reduce((sum, p) => sum + (p.views || 0), 0);
                const totalInquiries = propertiesList.reduce((sum, p) => sum + (p.inquiries || 0), 0);

                setStats({
                    totalProperties: propertiesList.length,
                    activeProperties: activeProperties,
                    totalViews: totalViews,
                    totalInquiries: totalInquiries
                });

                // Also get count of pending bookings for stats
                const pendingBookingsQuery = query(
                    collection(db, 'bookings'),
                    where('vendorId', '==', currentUser.uid),
                    where('status', '==', 'Pending')
                );

                const pendingBookingsSnapshot = await getDocs(pendingBookingsQuery);
                const pendingBookingsCount = pendingBookingsSnapshot.size;

                // Count total bookings for stats
                const allBookingsQuery = query(
                    collection(db, 'bookings'),
                    where('vendorId', '==', currentUser.uid)
                );

                const allBookingsSnapshot = await getDocs(allBookingsQuery);
                const totalBookingsCount = allBookingsSnapshot.size;

                // Update stats with booking counts
                setStats(prevStats => ({
                    ...prevStats,
                    totalBookings: totalBookingsCount,
                    pendingBookings: pendingBookingsCount
                }));

            } catch (error) {
                console.error('Error fetching vendor data:', error);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendorData();
    }, [currentUser]);

    const formatStatus = (status) => {
        // Normalize status strings
        const normalizedStatus = status.toLowerCase();

        if (normalizedStatus === 'active') {
            return {
                label: 'Active',
                className: 'bg-green-100 text-green-800'
            };
        } else if (normalizedStatus === 'pending' || normalizedStatus === 'pending review') {
            return {
                label: 'Pending Review',
                className: 'bg-yellow-100 text-yellow-800'
            };
        } else if (normalizedStatus === 'rejected') {
            return {
                label: 'Rejected',
                className: 'bg-red-100 text-red-800'
            };
        } else {
            return {
                label: status,
                className: 'bg-gray-100 text-gray-800'
            };
        }
    };

    return (
        <DashboardLayout role="vendor">
            <div className="space-y-8">
                {error && (
                    <div className="flex items-start p-4 mb-6 text-red-700 rounded-lg bg-red-50">
                        <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                        <div>{error}</div>
                    </div>
                )}

                <div>
                    <h2 className="mb-4 text-xl font-bold text-gray-800">Dashboard Overview</h2>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <FiHome size={24} />
                            </div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-500">Total Properties</h3>
                            {isLoading ? (
                                <div className="w-1/4 h-8 mb-2 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-3xl font-bold text-gray-800">{stats.totalProperties}</p>
                            )}
                            <p className="mt-1 text-sm text-emerald-600">
                                {isLoading ? (
                                    <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                    <>{stats.activeProperties} active listings</>
                                )}
                            </p>
                        </div>

                        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <FiCalendar size={24} />
                            </div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-500">Property Viewings</h3>
                            {isLoading ? (
                                <div className="w-1/4 h-8 mb-2 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-3xl font-bold text-gray-800">{stats.totalBookings || 0}</p>
                            )}
                            <p className="mt-1 text-sm text-emerald-600">
                                {isLoading ? (
                                    <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                    <>{stats.pendingBookings || 0} pending requests</>
                                )}
                            </p>
                        </div>

                        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <FiUsers size={24} />
                            </div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-500">Total Views</h3>
                            {isLoading ? (
                                <div className="w-1/4 h-8 mb-2 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-3xl font-bold text-gray-800">{stats.totalViews}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-600">All time</p>
                        </div>

                        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-emerald-100 text-emerald-600">
                                <FiDollarSign size={24} />
                            </div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-500">Inquiries</h3>
                            {isLoading ? (
                                <div className="w-1/4 h-8 mb-2 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-3xl font-bold text-gray-800">{stats.totalInquiries}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-600">All time</p>
                        </div>
                    </div>
                </div>

                {/* Recent Properties */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">My Properties</h2>
                        <div className="flex gap-2">
                            <Link to="/vendor/properties" className="flex items-center text-emerald-600 hover:text-emerald-700">
                                View All <FiChevronRight className="ml-1" />
                            </Link>
                            <Link
                                to="/vendor/list-property"
                                className="flex items-center px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                                <FiPlusCircle className="mr-2" /> Add Property
                            </Link>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse md:flex-row">
                                    <div className="h-48 bg-gray-200 md:w-1/4"></div>
                                    <div className="flex-grow p-4 md:p-6">
                                        <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                                        <div className="w-1/2 h-4 mb-4 bg-gray-200 rounded"></div>
                                        <div className="w-1/3 h-8 mb-4 bg-gray-200 rounded"></div>
                                        <div className="pt-4 mt-4 border-t border-gray-100">
                                            <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : properties.length > 0 ? (
                        <div className="space-y-4">
                            {properties.map(property => {
                                const statusInfo = formatStatus(property.status);

                                return (
                                    <div
                                        key={property.id}
                                        className="flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row"
                                    >
                                        <div className="h-48 md:w-1/4 md:h-auto">
                                            <img
                                                src={property.imageUrl}
                                                alt={property.title}
                                                className="object-cover w-full h-full"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-grow p-4 md:p-6">
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                                <div>
                                                    <div className="flex items-center mb-2">
                                                        <span className={`inline-block px-3 py-1 text-xs rounded-full mr-2 ${statusInfo.className}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                        <span className="inline-block px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-full">
                                                            {property.type}
                                                        </span>
                                                    </div>
                                                    <h3 className="mb-2 text-xl font-bold text-gray-800">{property.title}</h3>
                                                    <p className="mb-4 text-gray-600">{property.address}</p>
                                                </div>
                                                <div className="mt-2 text-right md:mt-0">
                                                    <p className="text-2xl font-bold text-emerald-600">${property.price.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 mt-4 border-t border-gray-100">
                                                <div className="flex flex-wrap items-center justify-between">
                                                    <div className="flex space-x-4">
                                                        <div className="text-sm">
                                                            <span className="text-gray-500">Views:</span> <span className="font-medium">{property.views}</span>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="text-gray-500">Inquiries:</span> <span className="font-medium">{property.inquiries}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex mt-2 space-x-2 md:mt-0">
                                                        <Link
                                                            to={`/vendor/edit-property/${property.id}`}
                                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <Link
                                                            to={`/properties/${property.id}`}
                                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm"
                                                        >
                                                            View
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center rounded-lg bg-gray-50">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-gray-400 bg-gray-100 rounded-full">
                                <FiHome size={24} />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-gray-800">No Properties Listed</h3>
                            <p className="mb-6 text-gray-600">You haven't listed any properties yet.</p>
                            <Link
                                to="/vendor/list-property"
                                className="inline-block px-6 py-3 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                                <FiPlusCircle className="inline-block mr-2" /> List Your First Property
                            </Link>
                        </div>
                    )}
                </div>

                {/* Recent Bookings */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Booking Requests</h2>
                        <Link to="/vendor/bookings" className="flex items-center text-emerald-600 hover:text-emerald-700">
                            View All <FiChevronRight className="ml-1" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
                                    <div className="w-16 h-16 mr-4 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-grow">
                                        <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                                        <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="w-16 h-6 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : bookings.length > 0 ? (
                        <div className="space-y-4">
                            {bookings.map(booking => (
                                <div key={booking.id} className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="flex-shrink-0 w-16 h-16 mr-4 overflow-hidden rounded-lg">
                                        <img
                                            src={booking.imageUrl}
                                            alt={booking.propertyTitle}
                                            className="object-cover w-full h-full"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-gray-800">{booking.propertyTitle}</h3>
                                        <div className="flex flex-col text-sm text-gray-600 sm:flex-row sm:items-center">
                                            <span className="mr-3">
                                                {new Date(booking.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })} at {booking.time}
                                            </span>
                                            <span className="hidden mr-3 sm:inline">•</span>
                                            <span>{booking.clientName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center ml-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium mr-3 ${booking.status === 'Confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : booking.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : booking.status === 'Completed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : booking.status === 'Cancelled'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                        <Link
                                            to="/vendor/bookings"
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center rounded-lg bg-gray-50">
                            <p className="text-gray-600">No booking requests yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VendorDashboard;