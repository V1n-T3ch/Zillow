import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiCheck, FiX, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import {
    collection, query, where, getDocs, doc,
    updateDoc, orderBy, getDoc, serverTimestamp
} from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VendorBookings = () => {
    const { currentUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        const fetchBookings = async () => {
            if (!currentUser) return;

            try {
                setIsLoading(true);

                // Query bookings where vendorId matches current user's ID
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('vendorId', '==', currentUser.uid),
                    orderBy('date', 'desc')
                );

                const querySnapshot = await getDocs(bookingsQuery);

                // Process and format the bookings
                const bookingsPromises = querySnapshot.docs.map(async (doc) => {
                    const bookingData = doc.data();

                    // Get property details
                    let propertyDetails = {
                        title: 'Property no longer available',
                        images: bookingData.propertyImage
                    };

                    if (bookingData.propertyId) {
                        try {
                            const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId));
                            if (propertyDoc.exists()) {
                                propertyDetails = propertyDoc.data();
                            }
                        } catch (err) {
                            console.error(`Error fetching property ${bookingData.propertyId}:`, err);
                        }
                    }

                    // Get user details
                    let userData = {
                        name: bookingData.userName || 'Client',
                        email: bookingData.userEmail || 'Not Provided',
                        phone: bookingData.userPhone || 'Not provided',
                        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(bookingData.userName || 'Client')}`
                    };

                    if (bookingData.userId) {
                        try {
                            const userDoc = await getDoc(doc(db, 'users', bookingData.userId));
                            if (userDoc.exists()) {
                                const user = userDoc.data();
                                userData = {
                                    name: user.name || bookingData.userName || 'Client',
                                    email: user.email || bookingData.userEmail || 'client@example.com',
                                    phone: user.phone || bookingData.userPhone || 'Not provided',
                                    imageUrl: user.photoURL || userData.imageUrl
                                };
                            }
                        } catch (err) {
                            console.error(`Error fetching user ${bookingData.userId}:`, err);
                        }
                    }

                    return {
                        id: doc.id,
                        propertyId: bookingData.propertyId,
                        propertyTitle: bookingData.propertyTitle || propertyDetails.title,
                        propertyImage: bookingData.propertyImage || 'https://placehold.co/800x500?text=No+Image',
                        date: bookingData.date?.toDate().toISOString() || new Date().toISOString(),
                        time: bookingData.time || 'Not specified',
                        status: bookingData.status || 'Pending',
                        user: userData,
                        message: bookingData.notes || ''
                    };
                });

                const bookingsList = await Promise.all(bookingsPromises);
                setBookings(bookingsList);
                setError(null);

            } catch (error) {
                console.error("Error fetching bookings:", error);
                setError("Failed to load bookings. Please try again later.");
                toast.error("Failed to load bookings. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, [currentUser]);

    const handleUpdateStatus = async (bookingId, newStatus) => {
        try {
            // Update booking status in Firestore
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // Update state
            setBookings(bookings.map(booking =>
                booking.id === bookingId
                    ? { ...booking, status: newStatus }
                    : booking
            ));

            // Show success toast
            const statusMessages = {
                'Confirmed': 'Booking confirmed successfully!',
                'Completed': 'Booking marked as completed.',
                'Cancelled': 'Booking has been cancelled.'
            };

            toast.success(statusMessages[newStatus] || `Booking status updated to ${newStatus}`);

        } catch (error) {
            console.error("Error updating booking:", error);
            toast.error("Failed to update booking status. Please try again.");
        }
    };

    const filteredBookings = bookings.filter(booking => {
        if (activeTab === 'all') return true;
        return booking.status.toLowerCase() === activeTab.toLowerCase();
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'bg-green-100 text-green-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout role="vendor">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div>
                <h2 className="mb-6 text-2xl font-bold text-gray-800">Property Viewing Requests</h2>

                {error && (
                    <div className="flex items-start p-4 mb-6 text-red-700 rounded-lg bg-red-50">
                        <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                        <div>{error}</div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex mb-6 overflow-x-auto border-b border-gray-200">
                    <button
                        className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'all'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Bookings
                    </button>
                    <button
                        className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'pending'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'confirmed'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('confirmed')}
                    >
                        Confirmed
                    </button>
                    <button
                        className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'completed'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed
                    </button>
                    <button
                        className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'cancelled'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('cancelled')}
                    >
                        Cancelled
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="p-4 bg-white rounded-lg shadow-subtle animate-pulse">
                                <div className="flex flex-col md:flex-row">
                                    <div className="h-24 mb-3 bg-gray-200 rounded-lg md:w-1/4 md:mb-0 md:mr-4"></div>
                                    <div className="md:w-3/4">
                                        <div className="w-3/4 h-5 mb-2 bg-gray-200 rounded"></div>
                                        <div className="w-1/2 h-4 mb-2 bg-gray-200 rounded"></div>
                                        <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredBookings.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="p-4 bg-white rounded-lg shadow-subtle">
                                <div className="flex flex-col md:flex-row">
                                    <div className="mb-4 md:w-1/4 md:mb-0 md:mr-4">
                                        <div className="relative">
                                            <img
                                                src={booking.propertyImage}
                                                alt={booking.propertyTitle}
                                                className="object-cover w-full h-32 rounded-lg"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                                }}
                                            />
                                            <div className="absolute top-2 right-2">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <Link
                                                to={`/properties/${booking.propertyId}`}
                                                className="font-medium text-emerald-600 hover:text-emerald-700"
                                            >
                                                {booking.propertyTitle}
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="md:w-3/4">
                                        <div className="flex flex-col justify-between md:flex-row">
                                            <div>
                                                <h3 className="mb-1 text-lg font-bold text-gray-800">
                                                    Viewing Request
                                                </h3>
                                                <div className="grid grid-cols-1 mb-4 md:grid-cols-2 gap-y-2 gap-x-4">
                                                    <div className="flex items-center text-gray-600">
                                                        <FiCalendar className="mr-2 text-gray-400" />
                                                        {new Date(booking.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <FiClock className="mr-2 text-gray-400" />
                                                        {booking.time}
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <FiUser className="mr-2 text-gray-400" />
                                                        {booking.user.name}
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <FiMapPin className="mr-2 text-gray-400" />
                                                        In-person viewing
                                                    </div>
                                                </div>

                                                {booking.message && (
                                                    <div className="p-3 mb-4 rounded-md bg-gray-50">
                                                        <div className="flex items-start">
                                                            <FiMessageSquare className="flex-shrink-0 mt-1 mr-2 text-gray-400" />
                                                            <p className="text-sm text-gray-600">{booking.message}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between md:flex-col md:items-end md:justify-start">
                                                <div className="flex items-center mb-4 space-x-2">
                                                    <img
                                                        src={booking.user.imageUrl}
                                                        alt={booking.user.name}
                                                        className="object-cover w-10 h-10 rounded-full"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.user.name)}&background=random`;
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{booking.user.name}</p>
                                                        <a href={`mailto:${booking.user.email}`} className="text-xs text-emerald-600 hover:text-emerald-700">
                                                            {booking.user.email}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {booking.status === 'Pending' && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'Confirmed')}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
                                                >
                                                    <FiCheck className="mr-1" /> Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                                                    className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                                                >
                                                    <FiX className="mr-1" /> Decline
                                                </button>
                                                <a
                                                    href={`tel:${booking.user.phone}`}
                                                    className="px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                                                >
                                                    Call Client
                                                </a>
                                            </div>
                                        )}

                                        {booking.status === 'Confirmed' && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'Completed')}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                                >
                                                    <FiCheck className="mr-1" /> Mark as Completed
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                                                    className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                                                >
                                                    <FiX className="mr-1" /> Cancel
                                                </button>
                                                <a
                                                    href={`tel:${booking.user.phone}`}
                                                    className="px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                                                >
                                                    Call Client
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-gray-400 bg-gray-100 rounded-full">
                            <FiCalendar size={24} />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-800">No {activeTab} Bookings</h3>
                        <p className="text-gray-600">
                            {activeTab === 'pending'
                                ? "You don't have any pending viewing requests at the moment."
                                : activeTab === 'confirmed'
                                    ? "You don't have any confirmed appointments scheduled."
                                    : activeTab === 'completed'
                                        ? "You don't have any completed viewings yet."
                                        : activeTab === 'cancelled'
                                            ? "You don't have any cancelled bookings."
                                            : "You don't have any booking requests yet."
                            }
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default VendorBookings;