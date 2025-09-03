import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiUsers, FiHome, FiDollarSign, FiBarChart2,
    FiCalendar, FiChevronRight, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import {
    collection, query, getDocs, where, orderBy, limit,
    getCountFromServer, Timestamp, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../../../firebase';

const AdminDashboard = () => {
    const { currentUser, userDetails } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        userGrowth: 0,
        totalProperties: 0,
        propertyGrowth: 0,
        totalBookings: 0,
        bookingGrowth: 0,
        totalRevenue: 0,
        revenueGrowth: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [pendingProperties, setPendingProperties] = useState([]);

    useEffect(() => {
        // Check if user is admin
        if (!userDetails || userDetails.role !== 'admin') {
            setError('You do not have permission to access this page');
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Get current date and date 30 days ago for growth calculations
                const now = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                const sixtyDaysAgo = new Date();
                sixtyDaysAgo.setDate(now.getDate() - 60);

                // Convert to Firestore timestamps
                const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
                const sixtyDaysAgoTimestamp = Timestamp.fromDate(sixtyDaysAgo);

                // Fetch total user count
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getCountFromServer(usersCollection);
                const totalUsers = usersSnapshot.data().count;

                // Fetch users created in last 30 days
                const recentUsersQuery = query(
                    usersCollection,
                    where('createdAt', '>=', thirtyDaysAgoTimestamp)
                );
                const recentUsersSnapshot = await getCountFromServer(recentUsersQuery);
                const recentUsers = recentUsersSnapshot.data().count;

                // Fetch users created 30-60 days ago for growth comparison
                const previousUsersQuery = query(
                    usersCollection,
                    where('createdAt', '>=', sixtyDaysAgoTimestamp),
                    where('createdAt', '<', thirtyDaysAgoTimestamp)
                );
                const previousUsersSnapshot = await getCountFromServer(previousUsersQuery);
                const previousUsers = previousUsersSnapshot.data().count;

                // Calculate user growth
                const userGrowth = previousUsers > 0
                    ? ((recentUsers - previousUsers) / previousUsers) * 100
                    : recentUsers > 0 ? 100 : 0;

                // Fetch total property count
                const propertiesCollection = collection(db, 'properties');
                const propertiesSnapshot = await getCountFromServer(propertiesCollection);
                const totalProperties = propertiesSnapshot.data().count;

                // Fetch properties created in last 30 days
                const recentPropertiesQuery = query(
                    propertiesCollection,
                    where('createdAt', '>=', thirtyDaysAgoTimestamp)
                );
                const recentPropertiesSnapshot = await getCountFromServer(recentPropertiesQuery);
                const recentProperties = recentPropertiesSnapshot.data().count;

                // Fetch properties created 30-60 days ago for growth comparison
                const previousPropertiesQuery = query(
                    propertiesCollection,
                    where('createdAt', '>=', sixtyDaysAgoTimestamp),
                    where('createdAt', '<', thirtyDaysAgoTimestamp)
                );
                const previousPropertiesSnapshot = await getCountFromServer(previousPropertiesQuery);
                const previousProperties = previousPropertiesSnapshot.data().count;

                // Calculate property growth
                const propertyGrowth = previousProperties > 0
                    ? ((recentProperties - previousProperties) / previousProperties) * 100
                    : recentProperties > 0 ? 100 : 0;

                // Fetch total booking count
                const bookingsCollection = collection(db, 'bookings');
                const bookingsSnapshot = await getCountFromServer(bookingsCollection);
                const totalBookings = bookingsSnapshot.data().count;

                // Fetch bookings created in last 30 days
                const recentBookingsQuery = query(
                    bookingsCollection,
                    where('createdAt', '>=', thirtyDaysAgoTimestamp)
                );
                const recentBookingsSnapshot = await getCountFromServer(recentBookingsQuery);
                const recentBookings = recentBookingsSnapshot.data().count;

                // Fetch bookings created 30-60 days ago for growth comparison
                const previousBookingsQuery = query(
                    bookingsCollection,
                    where('createdAt', '>=', sixtyDaysAgoTimestamp),
                    where('createdAt', '<', thirtyDaysAgoTimestamp)
                );
                const previousBookingsSnapshot = await getCountFromServer(previousBookingsQuery);
                const previousBookings = previousBookingsSnapshot.data().count;

                // Calculate booking growth
                const bookingGrowth = previousBookings > 0
                    ? ((recentBookings - previousBookings) / previousBookings) * 100
                    : recentBookings > 0 ? 100 : 0;

                // Calculate revenue (simplified example - in reality, you'd sum actual transaction amounts)
                // Assuming each booking has a value of $100 for this example
                const totalRevenue = totalBookings * 100;
                const recentRevenue = recentBookings * 100;
                const previousRevenue = previousBookings * 100;

                // Calculate revenue growth
                const revenueGrowth = previousRevenue > 0
                    ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
                    : recentRevenue > 0 ? 100 : 0;

                // Update stats state
                setStats({
                    totalUsers,
                    userGrowth: parseFloat(userGrowth.toFixed(1)),
                    totalProperties,
                    propertyGrowth: parseFloat(propertyGrowth.toFixed(1)),
                    totalBookings,
                    bookingGrowth: parseFloat(bookingGrowth.toFixed(1)),
                    totalRevenue,
                    revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
                });

                // Fetch recent users (limited to 4)
                const recentUsersListQuery = query(
                    usersCollection,
                    orderBy('createdAt', 'desc'),
                    limit(4)
                );
                const recentUsersListSnapshot = await getDocs(recentUsersListQuery);
                const recentUsersList = recentUsersListSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    joinDate: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));
                setRecentUsers(recentUsersList);

                // Fetch pending properties (limited to 3)
                const pendingPropertiesQuery = query(
                    propertiesCollection,
                    where('status', '==', 'pending'),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                );
                const pendingPropertiesSnapshot = await getDocs(pendingPropertiesQuery);
                const pendingPropertiesList = pendingPropertiesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    submittedDate: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));
                setPendingProperties(pendingPropertiesList);

                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setError("Failed to load dashboard data");
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, userDetails]);

    const handleApproveProperty = async (propertyId) => {
        try {
            // Update the property status in Firestore
            const propertyRef = doc(db, 'properties', propertyId);
            await updateDoc(propertyRef, {
                status: 'active',
                updatedAt: serverTimestamp()
            });

            // Update local state
            setPendingProperties(pendingProperties.filter(prop => prop.id !== propertyId));

            // You could show a success toast/notification here
        } catch (error) {
            console.error("Error approving property:", error);
            // You could show an error toast/notification here
        }
    };

    const handleRejectProperty = async (propertyId) => {
        try {
            // Update the property status in Firestore
            const propertyRef = doc(db, 'properties', propertyId);
            await updateDoc(propertyRef, {
                status: 'rejected',
                updatedAt: serverTimestamp()
            });

            // Update local state
            setPendingProperties(pendingProperties.filter(prop => prop.id !== propertyId));

            // You could show a success toast/notification here
        } catch (error) {
            console.error("Error rejecting property:", error);
            // You could show an error toast/notification here
        }
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (isLoading) {
        return (
            <DashboardLayout role="admin">
                <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="bg-gray-200 h-64 rounded-lg"></div>
                    <div className="bg-gray-200 h-64 rounded-lg"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="admin">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
                    <h3 className="text-lg font-medium mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                <FiUsers size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${stats.userGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</h3>
                        <p className="text-gray-500">Total Users</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg">
                                <FiHome size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${stats.propertyGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stats.propertyGrowth >= 0 ? '+' : ''}{stats.propertyGrowth}%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalProperties.toLocaleString()}</h3>
                        <p className="text-gray-500">Total Properties</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                                <FiCalendar size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${stats.bookingGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stats.bookingGrowth >= 0 ? '+' : ''}{stats.bookingGrowth}%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalBookings.toLocaleString()}</h3>
                        <p className="text-gray-500">Total Bookings</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-amber-100 text-amber-600 p-3 rounded-lg">
                                <FiDollarSign size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${stats.revenueGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">${stats.totalRevenue.toLocaleString()}</h3>
                        <p className="text-gray-500">Total Revenue</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Users */}
                    <div className="bg-white p-6 rounded-lg shadow-subtle">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Recent Users</h3>
                            <Link to="/admin/users" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center">
                                View All <FiChevronRight className="ml-1" size={16} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {recentUsers.length > 0 ? (
                                recentUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <img
                                                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full mr-3 object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`px-2 py-1 text-xs rounded-full mr-3 ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : user.role === 'vendor'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : user.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : user.status === 'suspended'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-green-100 text-green-800'
                                                }`}>
                                                {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No users found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Property Approvals */}
                    <div className="bg-white p-6 rounded-lg shadow-subtle">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Pending Property Approvals</h3>
                            <Link to="/admin/properties" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center">
                                View All <FiChevronRight className="ml-1" size={16} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {pendingProperties.length > 0 ? (
                                pendingProperties.map(property => (
                                    <div key={property.id} className="flex items-start">
                                        <img
                                            src={property.images?.[0] || 'https://placehold.co/800x500?text=No+Image'}
                                            alt={property.title}
                                            className="w-16 h-12 rounded object-cover mr-3"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{property.title}</p>
                                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                                <span>By {property.vendorName || 'Unknown Vendor'}</span>
                                                <span className="mx-2">•</span>
                                                <span>{formatDate(property.submittedDate)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 mr-2">
                                                    {property.type || 'Property'}
                                                </span>
                                                <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">
                                                    ${property.price?.toLocaleString() || '0'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                title="Approve"
                                                onClick={() => handleApproveProperty(property.id)}
                                            >
                                                <FiCheckCircle size={18} />
                                            </button>
                                            <button
                                                className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                title="Reject"
                                                onClick={() => handleRejectProperty(property.id)}
                                            >
                                                <FiAlertCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No pending properties
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-lg shadow-subtle">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Platform Activity</h3>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 text-sm bg-emerald-600 text-white rounded">Monthly</button>
                            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded">Weekly</button>
                            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded">Daily</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-center">
                            <FiBarChart2 size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">Analytics charts would appear here</p>
                            <p className="text-sm text-gray-400">Showing user growth, property listings, and bookings</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;