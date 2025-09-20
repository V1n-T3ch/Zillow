import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiCheckCircle, FiXCircle, FiEye, FiTrash2, FiChevronLeft, FiChevronRight, FiHome } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import {
    collection, query, where, orderBy, doc,
    updateDoc, deleteDoc, serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
    sendPropertyApprovedNotification, 
    sendPropertyRejectedNotification 
} from '../../../services/notificationService';

const PropertyManagement = () => {
    const { userDetails } = useAuth();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [propertiesPerPage] = useState(6);
    const [propertyTypes, setPropertyTypes] = useState([
        'Apartment', 'House', 'Villa', 'Townhouse', 'Condo'
    ]);

    useEffect(() => {
        // Check if user is admin
        if (!userDetails || userDetails.role !== 'admin') {
            setError('You do not have permission to access this page');
            toast.error('You do not have permission to access this page');
            setIsLoading(false);
            return;
        }

        // Fetch property types (could be from a separate collection in Firestore)
        // For now we'll use the hardcoded list

        // Create a query for properties
        const propertiesRef = collection(db, 'properties');
        let propertiesQuery = query(propertiesRef, orderBy('createdAt', 'desc'));

        // If status filter is applied, add it to query
        if (selectedStatus !== 'all') {
            propertiesQuery = query(propertiesQuery, where('status', '==', selectedStatus));
        }

        // If type filter is applied, add it to query
        if (selectedType !== 'all') {
            propertiesQuery = query(propertiesQuery, where('propertyType', '==', selectedType));
        }

        // Set up real-time listener for properties
        const unsubscribe = onSnapshot(
            propertiesQuery,
            (snapshot) => {
                const propertiesList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));
                setProperties(propertiesList);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching properties:", err);
                setError("Failed to load properties. Please try again later.");
                toast.error("Failed to load properties. Please try again later.");
                setIsLoading(false);
            }
        );

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [userDetails, selectedStatus, selectedType]);

    const handleStatusChange = async (propertyId, newStatus) => {
        try {
            // Get the property details before updating
            const property = properties.find(p => p.id === propertyId);
            if (!property) {
                throw new Error("Property not found");
            }

            // Update the property status in Firestore
            const propertyRef = doc(db, 'properties', propertyId);
            await updateDoc(propertyRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // Show success notification with toast
            const statusMessages = {
                'active': 'Property has been approved and is now active',
                'pending': 'Property has been set to pending review',
                'rejected': 'Property has been rejected'
            };

            toast.success(statusMessages[newStatus] || `Property status updated to ${newStatus}`);

            // Send notification to the property owner
            if (property.vendorId) {
                if (newStatus === 'active') {
                    // Send property approved notification
                    await sendPropertyApprovedNotification(
                        property.vendorId,
                        propertyId,
                        property.title || 'Your property'
                    );
                } else if (newStatus === 'rejected') {
                    // Send property rejected notification
                    await sendPropertyRejectedNotification(
                        property.vendorId,
                        propertyId,
                        property.title || 'Your property',
                        'The property did not meet our listing requirements.'
                    );
                }
            } else {
                console.warn('No vendor ID found for property, notification not sent');
            }
        } catch (error) {
            console.error("Error updating property status:", error);
            // Show error notification with toast
            toast.error(`Failed to update property status: ${error.message}`);
            setError(`Failed to update property status: ${error.message}`);
        }
    };

    const handleDeleteProperty = async (propertyId) => {
        if (!window.confirm("Are you sure you want to permanently delete this property? This action cannot be undone.")) {
            return;
        }

        try {
            // Get the property details before deleting
            const property = properties.find(p => p.id === propertyId);
            if (!property) {
                throw new Error("Property not found");
            }

            // Delete the property from Firestore
            await deleteDoc(doc(db, 'properties', propertyId));

            // Show success notification with toast
            toast.success("Property has been permanently deleted");

            // Send notification to the property owner about the deletion
            if (property.vendorId) {
                // Create a custom notification for property deletion
                // We're using the rejection notification but with a specific message
                await sendPropertyRejectedNotification(
                    property.vendorId,
                    propertyId,
                    property.title || 'Your property',
                    'This property has been removed from our platform by an administrator.'
                );
                console.log('Property deletion notification sent to vendor');
            }
        } catch (error) {
            console.error("Error deleting property:", error);
            // Show error notification with toast
            toast.error(`Failed to delete property: ${error.message}`);
            setError(`Failed to delete property: ${error.message}`);
        }
    };

    // Filter properties based on search term (client-side filtering for search)
    // Note: We're already filtering by status and type on the server side
    const filteredProperties = properties.filter(property => {
        const matchesSearch = property.title?.toLowerCase().includes(search.toLowerCase()) ||
            property.city?.toLowerCase().includes(search.toLowerCase()) ||
            property.area?.toLowerCase().includes(search.toLowerCase()) ||
            property.description?.toLowerCase().includes(search.toLowerCase());

        return matchesSearch;
    });

    // Pagination
    const indexOfLastProperty = currentPage * propertiesPerPage;
    const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
    const currentProperties = filteredProperties.slice(indexOfFirstProperty, indexOfLastProperty);
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">Active</span>;
            case 'pending':
                return <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
            case 'rejected':
                return <span className="px-2 py-1 text-xs text-red-800 bg-red-100 rounded-full">Rejected</span>;
            default:
                return <span className="px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded-full">{status}</span>;
        }
    };

    if (error) {
        return (
            <DashboardLayout role="admin">
                <ToastContainer position="top-right" autoClose={5000} />
                <div className="p-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
                    <h3 className="mb-2 text-lg font-medium">Error</h3>
                    <p>{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            {/* Add ToastContainer at the top level */}
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
                <h2 className="mb-6 text-2xl font-bold text-gray-800">Property Management</h2>

                {/* Filters */}
                <div className="p-4 mb-6 bg-white rounded-lg shadow-subtle">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[280px]">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <FiSearch className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Search properties..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setCurrentPage(1); // Reset to first page when changing filters
                                }}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Types</option>
                                {propertyTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1); // Reset to first page when changing filters
                                }}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Properties Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="overflow-hidden bg-white rounded-lg shadow-subtle animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4">
                                    <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                                    <div className="w-1/2 h-4 mb-4 bg-gray-200 rounded"></div>
                                    <div className="w-1/3 h-6 mb-2 bg-gray-200 rounded"></div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : currentProperties.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {currentProperties.map((property) => (
                                <div key={property.id} className="overflow-hidden bg-white rounded-lg shadow-subtle">
                                    <div className="relative">
                                        <img
                                            src={property.images?.[0] || 'https://placehold.co/800x500?text=No+Image'}
                                            alt={property.title}
                                            className="object-cover w-full h-48"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2">
                                            {getStatusBadge(property.status)}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="mb-1 text-lg font-bold text-gray-800">{property.title}</h3>
                                        <p className="mb-2 text-sm text-gray-600">
                                            {property.city}{property.area ? `, ${property.area}` : ''}
                                        </p>
                                        <p className="mb-2 text-xl font-bold text-emerald-600">
                                            ${property.price?.toLocaleString() || '0'}
                                        </p>

                                        <div className="flex items-center mb-4 text-sm text-gray-500">
                                            <span className="mr-3">{property.beds || 0} beds</span>
                                            <span className="mr-3">{property.baths || 0} baths</span>
                                            <span>{property.stories || 1} {property.stories === 1 ? 'story' : 'stories'}</span>
                                        </div>

                                        <div className="flex items-center justify-between mb-4 text-sm">
                                            <span>Listed by: {property.vendorName || 'Unknown'}</span>
                                            <span>Added: {formatDate(property.createdAt)}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-x-2">
                                                {property.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(property.id, 'active')}
                                                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 inline-flex items-center"
                                                        >
                                                            <FiCheckCircle className="mr-1" size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(property.id, 'rejected')}
                                                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 inline-flex items-center"
                                                        >
                                                            <FiXCircle className="mr-1" size={14} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {property.status === 'rejected' && (
                                                    <button
                                                        onClick={() => handleStatusChange(property.id, 'active')}
                                                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 inline-flex items-center"
                                                    >
                                                        <FiCheckCircle className="mr-1" size={14} /> Approve
                                                    </button>
                                                )}
                                                {property.status === 'active' && (
                                                    <button
                                                        onClick={() => handleStatusChange(property.id, 'rejected')}
                                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 inline-flex items-center"
                                                    >
                                                        <FiXCircle className="mr-1" size={14} /> Deactivate
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-x-2">
                                                <Link
                                                    to={`/properties/${property.id}`}
                                                    className="inline-flex items-center p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                    title="View Property"
                                                >
                                                    <FiEye size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteProperty(property.id)}
                                                    className="inline-flex items-center p-2 text-red-700 rounded-lg bg-red-50 hover:bg-red-100"
                                                    title="Delete Property"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between py-3 mt-6">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">{indexOfFirstProperty + 1}</span> to <span className="font-medium">
                                    {Math.min(indexOfLastProperty, filteredProperties.length)}
                                </span> of <span className="font-medium">{filteredProperties.length}</span> properties
                            </div>

                            <nav className="flex items-center space-x-2">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded ${currentPage === 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <FiChevronLeft size={16} />
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                        pageNumber = index + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = index + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + index;
                                    } else {
                                        pageNumber = currentPage - 2 + index;
                                    }

                                    if (pageNumber <= totalPages) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => paginate(pageNumber)}
                                                className={`px-3 py-1 rounded ${currentPage === pageNumber
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded ${currentPage === totalPages
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <FiChevronRight size={16} />
                                </button>
                            </nav>
                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center bg-white rounded-lg shadow-subtle">
                        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 text-gray-400 bg-gray-100 rounded-full">
                            <FiHome size={24} />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-gray-800">No Properties Found</h3>
                        <p className="mb-6 text-gray-600">
                            {search ?
                                "No properties match your search criteria." :
                                selectedType !== 'all' || selectedStatus !== 'all' ?
                                    "No properties match your filters." :
                                    "There are no properties in the system yet."}
                        </p>
                        {(search || selectedType !== 'all' || selectedStatus !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setSelectedType('all');
                                    setSelectedStatus('all');
                                    toast.info("Filters cleared");
                                }}
                                className="px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PropertyManagement;