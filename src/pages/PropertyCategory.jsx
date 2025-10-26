import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import { FiMapPin, FiChevronRight, FiHome, FiFilter } from 'react-icons/fi';
import { motion as Motion } from 'framer-motion';

const PropertyCategory = () => {
    const [searchParams] = useSearchParams();
    const propertyType = searchParams.get('propertyType') || 'House';
    
    const [properties, setProperties] = useState([]);
    const [groupedProperties, setGroupedProperties] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPropertiesByType();
    }, [propertyType]);

    const fetchPropertiesByType = async () => {
        try {
            setLoading(true);
            
            const propertiesQuery = query(
                collection(db, 'properties'),
                where('propertyType', '==', propertyType),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(propertiesQuery);
            
            if (querySnapshot.empty) {
                setProperties([]);
                setGroupedProperties({});
                setLoading(false);
                return;
            }

            const fetchedProperties = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setProperties(fetchedProperties);
            
            // Group properties by number of bedrooms
            const grouped = fetchedProperties.reduce((acc, property) => {
                const beds = parseInt(property.beds) || 0;
                const key = beds === 0 ? 'Studio' : beds === 1 ? '1 Bedroom' : `${beds} Bedrooms`;
                
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(property);
                return acc;
            }, {});

            setGroupedProperties(grouped);
            
        } catch (err) {
            console.error('Error fetching properties:', err);
            setError('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-64">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full border-t-emerald-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <div className="pb-16 md:pb-0 mt-5" >
                {/* Breadcrumb */}
                <div className="bg-white border-b">
                    <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <nav className="flex items-center space-x-2 text-sm text-gray-500">
                            <Link to="/" className="hover:text-emerald-600">Home</Link>
                            <FiChevronRight size={16} />
                            <Link to="/properties" className="hover:text-emerald-600">Properties</Link>
                            <FiChevronRight size={16} />
                            <span className="text-gray-900 font-medium">{propertyType}s</span>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {error && (
                        <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                            {error}
                        </div>
                    )}

                    {Object.keys(groupedProperties).length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="mb-4 text-6xl">🏠</div>
                            <h2 className="mb-4 text-2xl font-bold text-gray-900">
                                No {propertyType}s Found
                            </h2>
                            <p className="mb-8 text-gray-600">
                                We couldn't find any {propertyType.toLowerCase()}s at the moment. Try checking other property types.
                            </p>
                            <Link
                                to="/properties"
                                className="inline-flex items-center px-6 py-3 font-medium text-white transition duration-300 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                                Browse All Properties
                                <FiChevronRight className="ml-2" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Mobile List View */}
                            <div className="space-y-4 md:hidden">
                                {Object.entries(groupedProperties)
                                    .sort(([a], [b]) => {
                                        if (a === 'Studio') return -1;
                                        if (b === 'Studio') return 1;
                                        const numA = parseInt(a);
                                        const numB = parseInt(b);
                                        return numA - numB;
                                    })
                                    .map(([bedroomCount, propertyList]) => (
                                    <Link
                                        key={bedroomCount}
                                        to={`/properties?propertyType=${propertyType}&beds=${bedroomCount.split(' ')[0] === 'Studio' ? '0' : bedroomCount.split(' ')[0]}`}
                                        className="block p-4 transition duration-300 bg-white border rounded-lg hover:shadow-md hover:border-emerald-300"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {bedroomCount} {propertyType}s
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {propertyList.length} {propertyList.length === 1 ? 'property' : 'properties'} available
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full">
                                                    {propertyList.length}
                                                </span>
                                                <FiChevronRight className="text-gray-400" size={20} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Desktop Card View */}
                            <div className="hidden space-y-8 md:block">
                                {Object.entries(groupedProperties)
                                    .sort(([a], [b]) => {
                                        if (a === 'Studio') return -1;
                                        if (b === 'Studio') return 1;
                                        const numA = parseInt(a);
                                        const numB = parseInt(b);
                                        return numA - numB;
                                    })
                                    .map(([bedroomCount, propertyList]) => (
                                    <Motion.div
                                        key={bedroomCount}
                                        className="p-6 bg-white border rounded-xl shadow-sm"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {bedroomCount} {propertyType}s
                                            </h2>
                                            <span className="px-3 py-1 text-sm font-medium text-emerald-600 bg-emerald-100 rounded-full">
                                                {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'}
                                            </span>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {propertyList.map((property) => (
                                                <Link
                                                    key={property.id}
                                                    to={`/properties/${property.id}`}
                                                    className="block overflow-hidden transition duration-300 bg-white border rounded-lg hover:shadow-lg group"
                                                >
                                                    <div className="relative h-48">
                                                        <img
                                                            src={property.images?.[0] || 'https://placehold.co/400x300?text=No+Image'}
                                                            alt={property.title}
                                                            className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                                                            onError={(e) => {
                                                                e.target.src = 'https://placehold.co/400x300?text=No+Image';
                                                            }}
                                                        />
                                                        <div className="absolute px-2 py-1 text-xs font-medium text-white rounded bg-emerald-600 top-3 left-3">
                                                            {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                                                        </div>
                                                    </div>

                                                    <div className="p-4">
                                                        <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-emerald-600">
                                                            {property.title}
                                                        </h3>
                                                        
                                                        <div className="flex items-center mb-3 text-gray-600">
                                                            <FiMapPin className="mr-1 text-gray-400" size={16} />
                                                            <span className="text-sm">
                                                                {property.area}, {property.city}
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-between mb-3 text-sm text-gray-600">
                                                            <span>{property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}</span>
                                                            <span>{property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}</span>
                                                            <span>{property.sqft} sqft</span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="text-2xl font-bold text-emerald-600">
                                                                Ksh {parseInt(property.price).toLocaleString()}
                                                            </div>
                                                            <div className="text-emerald-600 group-hover:text-emerald-700">
                                                                <FiChevronRight size={20} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>

                                        {propertyList.length > 6 && (
                                            <div className="mt-6 text-center">
                                                <Link
                                                    to={`/properties?propertyType=${propertyType}&beds=${bedroomCount.split(' ')[0] === 'Studio' ? '0' : bedroomCount.split(' ')[0]}`}
                                                    className="inline-flex items-center px-4 py-2 font-medium text-emerald-600 transition duration-300 border border-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white"
                                                >
                                                    View All {bedroomCount} {propertyType}s
                                                    <FiChevronRight className="ml-2" />
                                                </Link>
                                            </div>
                                        )}
                                    </Motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyCategory;