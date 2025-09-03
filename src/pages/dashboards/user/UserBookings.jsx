import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiMapPin, FiHome, FiX, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import {
    collection, query, where, getDocs, orderBy, doc,
    updateDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';

// Add these imports for the date picker
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const UserBookings = () => {
    const { currentUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');

    // Add state for rescheduling
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [newDate, setNewDate] = useState(new Date());
    const [newTime, setNewTime] = useState('10:00 AM');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Available time slots
    const timeSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];

    useEffect(() => {
        const fetchBookings = async () => {
            if (!currentUser) return;

            try {
                setIsLoading(true);

                // Create a query for this user's bookings
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('userId', '==', currentUser.uid),
                    orderBy('date', 'asc')
                );

                // Get the bookings
                const bookingsSnapshot = await getDocs(bookingsQuery);

                if (bookingsSnapshot.empty) {
                    // No bookings found
                    setBookings([]);
                    setIsLoading(false);
                    return;
                }

                // Process each booking and get the associated property details
                const bookingsPromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
                    const bookingData = bookingDoc.data();
                    const propertyId = bookingData.propertyId;

                    try {
                        // Fetch the property data
                        const propertyDoc = await getDoc(doc(db, 'properties', propertyId));

                        if (!propertyDoc.exists()) {
                            console.warn(`Property ${propertyId} not found. It may have been deleted.`);
                            return {
                                id: bookingDoc.id,
                                propertyId,
                                propertyTitle: 'Property No Longer Available',
                                address: 'N/A',
                                date: bookingData.date.toDate().toISOString(),
                                time: bookingData.time || 'N/A',
                                status: bookingData.status || 'Pending',
                                agentName: bookingData.agentName || 'N/A',
                                agentPhone: bookingData.agentPhone || 'N/A',
                                imageUrl: 'https://placehold.co/800x500?text=No+Image',
                                notes: bookingData.notes || '',
                                propertyDeleted: true
                            };
                        }

                        const propertyData = propertyDoc.data();

                        // Format the booking with property data
                        return {
                            id: bookingDoc.id,
                            propertyId,
                            propertyTitle: propertyData.title || 'Unnamed Property',
                            address: propertyData.address || 'No address provided',
                            date: bookingData.date.toDate().toISOString(),
                            time: bookingData.time || 'N/A',
                            status: bookingData.status || 'Pending',
                            agentName: bookingData.agentName || 'N/A',
                            agentPhone: bookingData.agentPhone || 'N/A',
                            imageUrl: propertyData.images?.[0] || 'https://placehold.co/800x500?text=No+Image',
                            notes: bookingData.notes || '',
                            vendorId: propertyData.vendorId
                        };
                    } catch (error) {
                        console.error(`Error fetching property ${propertyId}:`, error);
                        return null;
                    }
                });

                // Wait for all property fetches to complete
                const bookingsResults = await Promise.all(bookingsPromises);

                // Filter out null results (bookings that couldn't be processed)
                const validBookings = bookingsResults.filter(booking => booking !== null);

                // Sort bookings by date
                const sortedBookings = validBookings.sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });

                setBookings(sortedBookings);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                setError('Failed to load your bookings. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, [currentUser]);

    const cancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            // Update the booking status in Firestore
            await updateDoc(doc(db, 'bookings', bookingId), {
                status: 'Cancelled',
                updatedAt: serverTimestamp()
            });

            // Update local state
            setBookings(bookings.map(booking =>
                booking.id === bookingId
                    ? { ...booking, status: 'Cancelled' }
                    : booking
            ));
        } catch (error) {
            console.error('Error cancelling booking:', error);
            setError('Failed to cancel booking. Please try again later.');
        }
    };

    // New reschedule functionality
    const openRescheduleModal = (booking) => {
        // Set current booking being rescheduled
        setCurrentBooking(booking);

        // Initialize date picker with the current booking date
        setNewDate(new Date(booking.date));

        // Initialize time dropdown with the current booking time
        setNewTime(booking.time);

        // Open the modal
        setIsRescheduling(true);
    };

    const closeRescheduleModal = () => {
        setIsRescheduling(false);
        setCurrentBooking(null);
    };

    const handleReschedule = async (e) => {
        e.preventDefault();

        if (!currentBooking) return;

        try {
            setIsSubmitting(true);

            // Update the booking in Firestore
            const bookingRef = doc(db, 'bookings', currentBooking.id);

            await updateDoc(bookingRef, {
                date: newDate,
                time: newTime,
                status: 'Pending', // Reset to pending since it needs to be confirmed again
                updatedAt: serverTimestamp(),
                rescheduled: true
            });

            // Update local state
            setBookings(bookings.map(booking =>
                booking.id === currentBooking.id
                    ? {
                        ...booking,
                        date: newDate.toISOString(),
                        time: newTime,
                        status: 'Pending',
                        rescheduled: true
                    }
                    : booking
            ));

            // Close the modal
            closeRescheduleModal();

            // Show success message (you could use a toast notification library here)
            alert('Your booking has been rescheduled successfully.');
        } catch (error) {
            console.error('Error rescheduling booking:', error);
            setError('Failed to reschedule booking. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter bookings based on active tab
    const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison

        if (activeTab === 'upcoming') {
            return bookingDate >= today && booking.status !== 'Cancelled';
        } else if (activeTab === 'past') {
            return bookingDate < today || booking.status === 'Completed';
        } else if (activeTab === 'cancelled') {
            return booking.status === 'Cancelled';
        }
        return true;
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

    // Function to check if the selected date is valid (not in the past, not on weekends)
    const isDateValid = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if date is in the future
        const isInFuture = date >= today;

        // Check if date is not a weekend (0 = Sunday, 6 = Saturday)
        const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;

        return isInFuture && isWeekday;
    };

    if (error) {
        return (
            <DashboardLayout role="user">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h2>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 flex items-start">
                        <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                        <div>
                            <h3 className="font-medium mb-1">Error</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="user">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h2>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'upcoming'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'past'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('past')}
                    >
                        Past
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'cancelled'
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
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-lg h-48 shadow-sm border border-gray-200 flex flex-col md:flex-row">
                                <div className="md:w-1/4 h-48 md:h-auto bg-gray-200"></div>
                                <div className="p-4 md:p-6 flex-grow">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="h-5 bg-gray-200 rounded"></div>
                                        <div className="h-5 bg-gray-200 rounded"></div>
                                        <div className="h-5 bg-gray-200 rounded"></div>
                                        <div className="h-5 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredBookings.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBookings.map(booking => (
                            <div
                                key={booking.id}
                                className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 flex flex-col md:flex-row"
                            >
                                <div className="md:w-1/4 h-48 md:h-auto relative">
                                    <img
                                        src={booking.imageUrl}
                                        alt={booking.propertyTitle}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                        }}
                                    />
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 md:p-6 flex-grow">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {booking.propertyTitle}
                                        {booking.propertyDeleted && (
                                            <span className="ml-2 text-sm bg-red-100 text-red-800 py-1 px-2 rounded-full">
                                                Property Removed
                                            </span>
                                        )}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-start">
                                            <FiMapPin className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                            <span className="text-gray-600">{booking.address}</span>
                                        </div>

                                        <div className="flex items-start">
                                            <FiCalendar className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                            <span className="text-gray-600">
                                                {new Date(booking.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-start">
                                            <FiClock className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                            <span className="text-gray-600">{booking.time}</span>
                                        </div>

                                        <div className="flex items-start">
                                            <FiHome className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                            <span className="text-gray-600">With: {booking.agentName}</span>
                                        </div>
                                    </div>

                                    {booking.notes && (
                                        <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-700 text-sm">{booking.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {!booking.propertyDeleted && (
                                            <Link
                                                to={`/properties/${booking.propertyId}`}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                            >
                                                View Property
                                            </Link>
                                        )}

                                        {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                                            <button
                                                onClick={() => openRescheduleModal(booking)}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            >
                                                Reschedule
                                            </button>
                                        )}

                                        {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                                            <button
                                                onClick={() => cancelBooking(booking.id)}
                                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                                            >
                                                <FiX className="mr-1" /> Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-full mx-auto mb-4">
                            <FiCalendar size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No {activeTab} Bookings</h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'upcoming'
                                ? "You don't have any upcoming property viewings scheduled."
                                : activeTab === 'past'
                                    ? "You don't have any past property viewings."
                                    : "You don't have any cancelled bookings."
                            }
                        </p>
                        <Link
                            to="/properties"
                            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Find Properties to Tour
                        </Link>
                    </div>
                )}

                {/* Reschedule Modal */}
                {isRescheduling && currentBooking && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Reschedule Booking</h3>
                                <p className="text-gray-600 mb-4">
                                    You're rescheduling your viewing of <span className="font-medium">{currentBooking.propertyTitle}</span>
                                </p>

                                <form onSubmit={handleReschedule}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select a new date
                                        </label>
                                        <DatePicker
                                            selected={newDate}
                                            onChange={(date) => setNewDate(date)}
                                            minDate={new Date()}
                                            filterDate={isDateValid}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            dateFormat="MMMM d, yyyy"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Viewings are available Monday-Friday
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select a new time
                                        </label>
                                        <select
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {timeSlots.map(time => (
                                                <option key={time} value={time}>{time}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeRescheduleModal}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default UserBookings;