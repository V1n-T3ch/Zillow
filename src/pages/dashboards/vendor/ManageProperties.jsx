import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiEdit, FiTrash2, FiEye, FiPlus, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';

const ManageProperties = () => {
    const { currentUser } = useAuth();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const success = searchParams.get('success');
    const propertyId = searchParams.get('propertyId');

    useEffect(() => {
        const fetchProperties = async () => {
            if (!currentUser) return;

            try {
                // Query properties where vendorId matches current user's ID
                const propertiesQuery = query(
                    collection(db, 'properties'),
                    where('vendorId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(propertiesQuery);

                const propertiesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));

                setProperties(propertiesList);
            } catch (error) {
                console.error('Error fetching properties:', error);
                setError('Failed to load your properties. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();

        // Show success toast if property was just added
        if (success === 'true' && propertyId) {
            toast.success('Property successfully added! It will be reviewed by an admin before being published.');
        }
    }, [currentUser, success, propertyId]);

    const handleDeleteProperty = async (id) => {
        if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            return;
        }

        try {
            // Delete the property from Firestore
            await deleteDoc(doc(db, 'properties', id));

            // Update local state
            setProperties(properties.filter(property => property.id !== id));

            toast.success('Property successfully deleted');
        } catch (error) {
            console.error('Error deleting property:', error);
            toast.error('Failed to delete property. Please try again.');
        }
    };

    return (
        <DashboardLayout role="vendor">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Manage Properties</h2>
                    <Link
                        to="/vendor/list-property"
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        <FiPlus className="mr-2" /> Add Property
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-700 flex items-start">
                        <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                        <div>{error}</div>
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="bg-white p-4 rounded-lg shadow-subtle animate-pulse">
                                <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {properties.length === 0 ? (
                            <div className="bg-gray-50 p-8 rounded-lg text-center">
                                <p className="text-gray-600 mb-4">You don't have any properties listed yet.</p>
                                <Link
                                    to="/vendor/list-property"
                                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    <FiPlus className="mr-2" /> Add Your First Property
                                </Link>
                            </div>
                        ) : (
                            properties.map((property) => (
                                <div key={property.id} className="bg-white p-4 rounded-lg shadow-subtle flex flex-col sm:flex-row">
                                    <div className="sm:w-1/4 mb-4 sm:mb-0 sm:mr-4">
                                        <img
                                            src={property.images?.[0] || 'https://placehold.co/800x500?text=No+Image'}
                                            alt={property.title}
                                            className="w-full h-32 object-cover rounded-lg"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/800x500?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <div className="sm:w-2/4 mb-4 sm:mb-0">
                                        <h3 className="font-bold text-lg text-gray-800">{property.title}</h3>
                                        <p className="text-gray-600">{property.address}</p>
                                        <p className="text-lg font-semibold text-emerald-600">${property.price?.toLocaleString() || '0'}</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${property.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : property.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                {property.status === 'active'
                                                    ? 'Active'
                                                    : property.status === 'pending'
                                                        ? 'Pending Review'
                                                        : 'Rejected'}
                                            </span>
                                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                {property.propertyType || property.type || 'Property'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="sm:w-1/4">
                                        <div className="flex flex-col sm:items-end">
                                            <div className="mb-4 flex flex-wrap gap-2">
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700">
                                                    {property.views || 0} Views
                                                </span>
                                                <span className="px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-700">
                                                    {property.inquiries || 0} Inquiries
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/properties/${property.id}`}
                                                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                                    title="View Property"
                                                >
                                                    <FiEye />
                                                </Link>
                                                <Link
                                                    to={`/vendor/edit-property/${property.id}`}
                                                    className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                                                    title="Edit Property"
                                                >
                                                    <FiEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteProperty(property.id)}
                                                    className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                                                    title="Delete Property"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageProperties;