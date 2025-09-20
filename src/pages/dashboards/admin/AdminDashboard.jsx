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
import { 
    sendVendorApprovedNotification, 
    sendVendorRejectedNotification,
    sendPropertyApprovedNotification,
    sendPropertyRejectedNotification
} from '../../../services/notificationService';

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
    const [pendingVendorApplications, setPendingVendorApplications] = useState([]);

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
                    collection(db, 'properties'),
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

                // Fetch pending vendor applications
                const pendingVendorsQuery = query(
                    usersCollection,
                    where('vendorApplication.status', '==', 'pending'),
                    orderBy('vendorApplication.submittedAt', 'desc'),
                    limit(3)
                );
                const pendingVendorsSnapshot = await getDocs(pendingVendorsQuery);
                const pendingVendorsList = pendingVendorsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    name: doc.data().name || doc.data().displayName || 'Anonymous User',
                    email: doc.data().email || 'No email provided',
                    photoURL: doc.data().photoURL || null,
                    submittedDate: doc.data().vendorApplication?.submittedAt?.toDate().toISOString() || new Date().toISOString(),
                    specialization: doc.data().vendorApplication?.specialization || 'Not specified',
                    experience: doc.data().vendorApplication?.yearsExperience || 'Not specified'
                }));
                setPendingVendorApplications(pendingVendorsList);

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

            // Find the property in the local state
            const property = pendingProperties.find(prop => prop.id === propertyId);
            
            // Update local state
            setPendingProperties(pendingProperties.filter(prop => prop.id !== propertyId));

            // Send notification to the property owner if found
            if (property && property.vendorId) {
                await sendPropertyApprovedNotification(
                    property.vendorId, 
                    propertyId, 
                    property.title || 'Your property'
                );
            }

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

            // Find the property in the local state
            const property = pendingProperties.find(prop => prop.id === propertyId);
            
            // Update local state
            setPendingProperties(pendingProperties.filter(prop => prop.id !== propertyId));

            // Send notification to the property owner if found
            if (property && property.vendorId) {
                await sendPropertyRejectedNotification(
                    property.vendorId, 
                    propertyId, 
                    property.title || 'Your property'
                );
            }

            // You could show a success toast/notification here
        } catch (error) {
            console.error("Error rejecting property:", error);
            // You could show an error toast/notification here
        }
    };

    const handleApproveVendor = async (userId) => {
        try {
            // Update the user's role and vendor application status
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: 'vendor',
                'vendorApplication.status': 'approved',
                'vendorApplication.reviewedAt': serverTimestamp()
            });

            // Update local state
            setPendingVendorApplications(pendingVendorApplications.filter(app => app.id !== userId));

            // Send notification to the user
            const applicant = pendingVendorApplications.find(app => app.id === userId);
            if (applicant) {
                await sendVendorApprovedNotification(userId, applicant.name);
            }

            // You could show a success toast/notification here
        } catch (error) {
            console.error("Error approving vendor application:", error);
            // You could show an error toast/notification here
        }
    };

    const handleRejectVendor = async (userId) => {
        try {
            // Update vendor application status to rejected
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'vendorApplication.status': 'rejected',
                'vendorApplication.reviewedAt': serverTimestamp()
            });

            // Update local state
            setPendingVendorApplications(pendingVendorApplications.filter(app => app.id !== userId));

            // Send notification to the user
            const applicant = pendingVendorApplications.find(app => app.id === userId);
            if (applicant) {
                await sendVendorRejectedNotification(userId);
            }

            // You could show a success toast/notification here
        } catch (error) {
            console.error("Error rejecting vendor application:", error);
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
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="admin">
                <div className="p-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
                    <h3 className="mb-2 text-lg font-medium">Error</h3>
                    <p>{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <h2 className="mb-6 text-2xl font-bold text-gray-800">Admin Stats</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 text-blue-600 bg-blue-100 rounded-lg">
                                <FiUsers size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${stats.userGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</h3>
                        <p className="text-gray-500">Total Users</p>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                                <FiHome size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${stats.propertyGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stats.propertyGrowth >= 0 ? '+' : ''}{stats.propertyGrowth}%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalProperties.toLocaleString()}</h3>
                        <p className="text-gray-500">Total Properties</p>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 text-purple-600 bg-purple-100 rounded-lg">
                                <FiCalendar size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${stats.bookingGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stats.bookingGrowth >= 0 ? '+' : ''}{stats.bookingGrowth}%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalBookings.toLocaleString()}</h3>
                        <p className="text-gray-500">Total Bookings</p>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
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

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Users */}
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Recent Users</h3>
                            <Link to="/admin/users" className="flex items-center text-sm text-emerald-600 hover:text-emerald-700">
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
                                                className="object-cover w-10 h-10 mr-3 rounded-full"
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
                                <div className="py-4 text-center text-gray-500">
                                    No users found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Property Approvals */}
                    <div className="p-6 bg-white rounded-lg shadow-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Pending Property Approvals</h3>
                            <Link to="/admin/properties" className="flex items-center text-sm text-emerald-600 hover:text-emerald-700">
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
                                            className="object-cover w-16 h-12 mr-3 rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{property.title}</p>
                                            <div className="flex items-center mb-1 text-xs text-gray-500">
                                                <span>By {property.vendorName || 'Unknown Vendor'}</span>
                                                <span className="mx-2">•</span>
                                                <span>{formatDate(property.submittedDate)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="px-2 py-1 mr-2 text-xs text-gray-800 bg-gray-100 rounded-full">
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
                                <div className="py-4 text-center text-gray-500">
                                    No pending properties
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pending Vendor Applications */}
                <div className="p-6 bg-white rounded-lg shadow-subtle">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Pending Vendor Applications</h3>
                        <Link to="/admin/users" className="flex items-center text-sm text-emerald-600 hover:text-emerald-700">
                            View All <FiChevronRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {pendingVendorApplications.length > 0 ? (
                            pendingVendorApplications.map(application => (
                                <div key={application.id} className="flex items-start p-4 rounded-lg bg-gray-50">
                                    <img
                                        src={application.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(application.name)}&background=random`}
                                        alt={application.name}
                                        className="object-cover w-12 h-12 mr-4 rounded-full"
                                    />
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{application.name}</p>
                                                <p className="text-sm text-gray-600">{application.email}</p>
                                                <div className="flex flex-wrap items-center mt-1 text-xs text-gray-500">
                                                    <span className="mr-2">Applied: {formatDate(application.submittedDate)}</span>
                                                    <span className="px-2 py-1 mr-2 text-blue-800 bg-blue-100 rounded-full">
                                                        {application.specialization}
                                                    </span>
                                                    <span className="px-2 py-1 text-purple-800 bg-purple-100 rounded-full">
                                                        {application.experience} Experience
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex mt-2 space-x-2 sm:mt-0">
                                                <button
                                                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center"
                                                    title="Approve Vendor"
                                                    onClick={() => handleApproveVendor(application.id)}
                                                >
                                                    <FiCheckCircle size={16} className="mr-1" />
                                                    <span className="hidden sm:inline">Approve</span>
                                                </button>
                                                <button
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
                                                    title="Reject Vendor"
                                                    onClick={() => handleRejectVendor(application.id)}
                                                >
                                                    <FiAlertCircle size={16} className="mr-1" />
                                                    <span className="hidden sm:inline">Reject</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-2 text-sm">
                                            <div className="p-3 bg-white border border-gray-200 rounded">
                                                <p className="mb-1 font-medium text-gray-700">Why they want to become a vendor:</p>
                                                <p className="text-gray-600">{application.vendorApplication?.reason || "No reason provided"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <FiUsers className="mx-auto mb-2 text-gray-300" size={32} />
                                <p>No pending vendor applications</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart Section */}
                <div className="p-6 bg-white rounded-lg shadow-subtle">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Platform Activity</h3>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 text-sm text-white rounded bg-emerald-600">Monthly</button>
                            <button className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded">Weekly</button>
                            <button className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded">Daily</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center h-64 border border-gray-100 rounded-lg bg-gray-50">
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