import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';

const SavedProperties = () => {
    const { currentUser } = useAuth();
    const [savedProperties, setSavedProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSavedProperties = async () => {
            if (!currentUser) return;

            try {
                setIsLoading(true);

                // Fetch user's favorites from Firestore
                const favoritesQuery = query(
                    collection(db, 'favorites'),
                    where('userId', '==', currentUser.uid)
                );

                const favoritesSnapshot = await getDocs(favoritesQuery);

                if (favoritesSnapshot.empty) {
                    // No saved properties found
                    setSavedProperties([]);
                    setIsLoading(false);
                    return;
                }

                // Process each favorite entry and fetch the associated property details
                const propertyPromises = favoritesSnapshot.docs.map(async (favoriteDoc) => {
                    const favoriteData = favoriteDoc.data();
                    const propertyId = favoriteData.propertyId;

                    try {
                        // Fetch the actual property data
                        const propertyDoc = await getDoc(doc(db, 'properties', propertyId));

                        if (!propertyDoc.exists()) {
                            console.warn(`Property ${propertyId} not found. It may have been deleted.`);
                            return null;
                        }

                        const propertyData = propertyDoc.data();

                        return {
                            id: favoriteDoc.id,  // favorite document ID (for deletion)
                            propertyId: propertyId,
                            title: propertyData.title || 'Unnamed Property',
                            address: propertyData.address || 'No address provided',
                            price: propertyData.price || 0,
                            beds: propertyData.specs?.beds || 0,
                            baths: propertyData.specs?.baths || 0,
                            sqft: propertyData.specs?.sqft || 0,
                            imageUrl: propertyData.images?.[0] || 'https://placehold.co/800x500?text=No+Image',
                            type: propertyData.type || 'Property',
                            status: propertyData.status
                        };
                    } catch (error) {
                        console.error(`Error fetching property ${propertyId}:`, error);
                        return null;
                    }
                });

                // Wait for all property fetches to complete
                const propertiesResults = await Promise.all(propertyPromises);

                // Filter out null results (properties that couldn't be fetched)
                // and properties that are not active
                const validProperties = propertiesResults.filter(
                    property => property !== null && property.status === 'active'
                );

                setSavedProperties(validProperties);
            } catch (error) {
                console.error('Error fetching saved properties:', error);
                setError('Failed to load your saved properties. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedProperties();
    }, [currentUser]);

    const removeProperty = async (id) => {
        if (!window.confirm('Are you sure you want to remove this property from your saved list?')) {
            return;
        }

        try {
            // Actually delete the document from Firestore
            await deleteDoc(doc(db, 'favorites', id));

            // Update the UI
            setSavedProperties(savedProperties.filter(property => property.id !== id));
        } catch (error) {
            console.error('Error removing property:', error);
            setError('Failed to remove property. Please try again later.');
        }
    };

    if (error) {
        return (
            <DashboardLayout role="user">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Properties</h2>

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
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Properties</h2>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-lg h-48 shadow-sm border border-gray-200 flex">
                                <div className="w-1/4 bg-gray-200"></div>
                                <div className="p-6 flex-grow">
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="flex space-x-4 mb-4">
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : savedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {savedProperties.map(property => (
                            <div
                                key={property.id}
                                className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 flex flex-col md:flex-row"
                            >
                                <div className="md:w-1/4 h-48 md:h-auto">
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

                                <div className="p-4 md:p-6 flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mb-2">
                                                {property.type}
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">{property.title}</h3>
                                            <p className="text-gray-600 mb-4">{property.address}</p>

                                            <div className="flex items-center text-gray-600 mb-4">
                                                <span className="mr-4">{property.beds} beds</span>
                                                <span className="mr-4">{property.baths} baths</span>
                                                <span>{property.sqft} sqft</span>
                                            </div>
                                        </div>

                                        <p className="text-2xl font-bold text-emerald-600">${property.price.toLocaleString()}</p>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <Link
                                            to={`/properties/${property.propertyId}`}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                        >
                                            View Details
                                        </Link>

                                        <button
                                            onClick={() => removeProperty(property.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full flex items-center"
                                            aria-label="Remove from saved"
                                        >
                                            <FiTrash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-full mx-auto mb-4">
                            <FiHeart size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Saved Properties</h3>
                        <p className="text-gray-600 mb-6">You haven't saved any properties yet.</p>
                        <Link
                            to="/properties"
                            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Browse Properties
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SavedProperties;