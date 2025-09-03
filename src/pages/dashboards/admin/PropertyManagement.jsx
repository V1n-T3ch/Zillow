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
            propertiesQuery = query(propertiesQuery, where('type', '==', selectedType));
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
            // Delete the property from Firestore
            await deleteDoc(doc(db, 'properties', propertyId));

            // Show success notification with toast
            toast.success("Property has been permanently deleted");
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
            property.address?.toLowerCase().includes(search.toLowerCase()) ||
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
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
            case 'pending':
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
            case 'rejected':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
            default:
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (error) {
        return (
            <DashboardLayout role="admin">
                <ToastContainer position="top-right" autoClose={5000} />
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
                    <h3 className="text-lg font-medium mb-2">Error</h3>
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
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Property Management</h2>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-subtle mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[280px]">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-subtle overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : currentProperties.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentProperties.map((property) => (
                                <div key={property.id} className="bg-white rounded-lg shadow-subtle overflow-hidden">
                                    <div className="relative">
                                        <img
                                            src={property.images?.[0] || 'https://placehold.co/800x500?text=No+Image'}
                                            alt={property.title}
                                            className="w-full h-48 object-cover"
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
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">{property.title}</h3>
                                        <p className="text-gray-600 text-sm mb-2">{property.address}</p>
                                        <p className="text-emerald-600 font-bold text-xl mb-2">
                                            ${property.price?.toLocaleString() || '0'}
                                        </p>

                                        <div className="flex items-center text-sm text-gray-500 mb-4">
                                            <span className="mr-3">{property.specs?.beds || 0} beds</span>
                                            <span className="mr-3">{property.specs?.baths || 0} baths</span>
                                            <span>{property.specs?.sqft || 0} sqft</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm mb-4">
                                            <span>Listed by: {property.vendorName || 'Unknown'}</span>
                                            <span>Added: {formatDate(property.createdAt)}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
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
                                                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center"
                                                    title="View Property"
                                                >
                                                    <FiEye size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteProperty(property.id)}
                                                    className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 inline-flex items-center"
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
                        <div className="mt-6 py-3 flex items-center justify-between">
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
                    <div className="bg-white p-8 rounded-lg shadow-subtle text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-full mb-4">
                            <FiHome size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Properties Found</h3>
                        <p className="text-gray-600 mb-6">
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
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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