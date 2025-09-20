import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiCheck, FiX, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import {
    collection, query, where, getDocs, doc,
    updateDoc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
    sendBookingConfirmedNotification,
    sendBookingRejectedNotification,
    sendBookingCompletedNotification
} from '../../../services/notificationService';

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
                console.log("Attempting to fetch bookings for vendor:", currentUser.uid);

                // Query bookings for this vendor
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('vendorId', '==', currentUser.uid)
                );

                const querySnapshot = await getDocs(bookingsQuery);
                console.log(`Found ${querySnapshot.docs.length} bookings`);

                if (querySnapshot.empty) {
                    console.log("No bookings found for this vendor");
                    setBookings([]);
                    setIsLoading(false);
                    return;
                }

                // Process and format the bookings
                const bookingsPromises = querySnapshot.docs.map(async (bookingDoc) => {
                    const bookingData = bookingDoc.data();
                    console.log("Raw booking data:", bookingData);

                    // Get property details
                    let propertyDetails = {
                        title: bookingData.propertyTitle || 'Property no longer available',
                        images: []
                    };

                    if (bookingData.propertyId) {
                        try {
                            const propertyDocRef = doc(db, 'properties', bookingData.propertyId);
                            const propertyDoc = await getDoc(propertyDocRef);
                            if (propertyDoc.exists()) {
                                propertyDetails = propertyDoc.data();
                            }
                        } catch (err) {
                            console.error(`Error fetching property ${bookingData.propertyId}:`, err);
                        }
                    }

                    // Handle different date formats safely
                    let formattedDate;
                    try {
                        // Using bookingDate instead of date
                        if (bookingData.bookingDate && typeof bookingData.bookingDate.toDate === 'function') {
                            // Firestore Timestamp
                            formattedDate = bookingData.bookingDate.toDate().toISOString();
                        } else if (bookingData.bookingDate) {
                            // String date or something else
                            formattedDate = new Date(bookingData.bookingDate).toISOString();
                        } else {
                            // No date field
                            formattedDate = new Date().toISOString();
                        }
                    } catch (err) {
                        console.error("Error formatting date:", err);
                        formattedDate = new Date().toISOString();
                    }

                    return {
                        id: bookingDoc.id, // Change from doc.id to bookingDoc.id
                        propertyId: bookingData.propertyId || '',
                        propertyTitle: bookingData.propertyTitle || propertyDetails.title || 'Property',
                        propertyImage: propertyDetails.images?.[0] || 'https://placehold.co/800x500?text=No+Image',
                        date: formattedDate,
                        time: bookingData.bookingTime || 'Not specified',
                        status: bookingData.status || 'pending',
                        user: {
                            // Don't attempt to fetch user data, use what's in the booking document
                            name: bookingData.userName || 'Client',
                            email: bookingData.userEmail || 'Not Provided',
                            phone: bookingData.userPhone || 'Not provided',
                            imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(bookingData.userName || 'Client')}`
                        },
                        userId: bookingData.userId || '',
                        userEmail: bookingData.userEmail || '',
                        userPhone: bookingData.userPhone || '',
                        message: bookingData.notes || '',
                        agentName: bookingData.agentName || currentUser.displayName || 'Agent'
                    };
                });

                const bookingsList = await Promise.all(bookingsPromises);
                console.log("Processed bookings:", bookingsList);
                
                // Sort bookings by date (newest first) after processing
                bookingsList.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                setBookings(bookingsList);
                setError(null);

            } catch (error) {
                console.error("Error fetching bookings:", error);
                setError("Failed to load bookings. Please try again later.");
                setBookings([]); // Set empty array on error
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
                status: newStatus.toLowerCase(), // Convert to lowercase to match data structure
                updatedAt: serverTimestamp()
            });

            // Find the booking to get user details for notification
            const booking = bookings.find(b => b.id === bookingId);

            // Send notifications based on status change
            if (booking) {
                if (newStatus.toLowerCase() === 'confirmed') {
                    // Send confirmation notification
                    await sendBookingConfirmedNotification(
                        booking.userId,
                        bookingId,
                        booking.propertyTitle,
                        new Date(booking.date).toLocaleDateString(),
                        booking.time
                    );
                    console.log("Booking confirmation notification sent to user:", booking.userId);
                } 
                else if (newStatus.toLowerCase() === 'cancelled') {
                    // Send rejection/cancellation notification
                    await sendBookingRejectedNotification(
                        booking.userId,
                        bookingId,
                        booking.propertyTitle,
                        "Your booking request was not approved. Please contact us for more information."
                    );
                    console.log("Booking rejection notification sent to user:", booking.userId);
                }
                else if (newStatus.toLowerCase() === 'completed') {
                    // Send completion notification
                    await sendBookingCompletedNotification(
                        booking.userId,
                        bookingId,
                        booking.propertyTitle
                    );
                    console.log("Booking completion notification sent to user:", booking.userId);
                }
            }

            // Update state
            setBookings(bookings.map(booking =>
                booking.id === bookingId
                    ? { ...booking, status: newStatus.toLowerCase() }
                    : booking
            ));

            // Show success toast
            const statusMessages = {
                'confirmed': 'Booking confirmed successfully!',
                'completed': 'Booking marked as completed.',
                'cancelled': 'Booking has been cancelled.'
            };

            toast.success(statusMessages[newStatus.toLowerCase()] || `Booking status updated to ${newStatus}`);

        } catch (error) {
            console.error("Error updating booking:", error);
            toast.error("Failed to update booking status. Please try again.");
        }
    };

    const handleApproveBooking = async (bookingId) => {
        await handleUpdateStatus(bookingId, 'confirmed');
    };

    const handleRejectBooking = async (bookingId) => {
        await handleUpdateStatus(bookingId, 'cancelled');
    };

    // Filter bookings by status (convert to lowercase for case-insensitive comparison)
    const filteredBookings = bookings.filter(booking => {
        if (activeTab === 'all') return true;
        return booking.status.toLowerCase() === activeTab.toLowerCase();
    });

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Format status for display (capitalize first letter)
    const formatStatus = (status) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
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

                {/* Debug Panel - remove in production */}
                <div className="p-4 mb-6 bg-gray-100 rounded-lg">
                  <details>
                    <summary className="font-medium text-gray-700 cursor-pointer">Debug Information</summary>
                    <div className="mt-3">
                      <p>User ID: {currentUser?.uid || 'Not logged in'}</p>
                      <p>Bookings Count: {bookings.length}</p>
                      <p>Active Tab: {activeTab}</p>
                      <p>Filtered Count: {filteredBookings.length}</p>
                      <button 
                        onClick={() => console.log('Bookings:', bookings)} 
                        className="px-3 py-1 mt-2 text-sm text-white bg-gray-700 rounded hover:bg-gray-800"
                      >
                        Log Bookings to Console
                      </button>
                    </div>
                  </details>
                </div>

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
                                                    {formatStatus(booking.status)}
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

                                        {booking.status.toLowerCase() === 'pending' && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button
                                                    onClick={() => handleApproveBooking(booking.id)}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
                                                >
                                                    <FiCheck className="mr-1" /> Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleRejectBooking(booking.id)}
                                                    className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                                                >
                                                    <FiX className="mr-1" /> Decline
                                                </button>
                                                <a
                                                    href={`tel:${booking.userPhone || booking.user.phone}`}
                                                    className="px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                                                >
                                                    Call Client
                                                </a>
                                            </div>
                                        )}

                                        {booking.status.toLowerCase() === 'confirmed' && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                                >
                                                    <FiCheck className="mr-1" /> Mark as Completed
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                    className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                                                >
                                                    <FiX className="mr-1" /> Cancel
                                                </button>
                                                <a
                                                    href={`tel:${booking.userPhone || booking.user.phone}`}
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