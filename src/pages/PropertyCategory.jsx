import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import { FiChevronRight, FiHome, FiFilter, FiX } from 'react-icons/fi';
import { motion as Motion } from 'framer-motion';

const PropertyCategory = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const propertyType = searchParams.get('propertyType') || 'House';
    const searchFilter = searchParams.get('search') || '';
    const bedsFilter = searchParams.get('beds') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '2000000');
    
    const [properties, setProperties] = useState([]);
    const [groupedProperties, setGroupedProperties] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchPropertiesByType();
    }, [propertyType, searchFilter, bedsFilter, minPrice, maxPrice]);

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
                setTotalCount(0);
                setLoading(false);
                return;
            }

            let fetchedProperties = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Apply client-side filters
            let filtered = fetchedProperties;

            // Filter by search term (city or area)
            if (searchFilter && searchFilter.trim() !== '') {
                const searchTerm = searchFilter.toLowerCase().trim();
                filtered = filtered.filter(property => 
                    property.city?.toLowerCase().includes(searchTerm) ||
                    property.area?.toLowerCase().includes(searchTerm)
                );
            }

            // Filter by bedrooms
            if (bedsFilter && bedsFilter !== '') {
                const bedsNumber = parseInt(bedsFilter);
                filtered = filtered.filter(property => 
                    property.beds >= bedsNumber
                );
            }

            setProperties(filtered);
            setTotalCount(filtered.length);
            
            // Group properties by number of bedrooms
            const grouped = filtered.reduce((acc, property) => {
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

    const removeFilter = (filterName) => {
        const params = Object.fromEntries(searchParams);
        delete params[filterName];
        setSearchParams(params);
    };

    const clearAllFilters = () => {
        setSearchParams({ propertyType });
    };

    const hasActiveFilters = searchFilter || bedsFilter || minPrice > 0 || maxPrice < 2000000;

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
            
            <div className="pb-16 mt-5 md:pb-0">
                {/* Breadcrumb */}
                <div className="bg-white border-b">
                    <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <nav className="flex items-center space-x-2 text-sm text-gray-500">
                            <Link to="/" className="hover:text-emerald-600">Home</Link>
                            <FiChevronRight size={16} />
                            <Link to="/properties" className="hover:text-emerald-600">Properties</Link>
                            <FiChevronRight size={16} />
                            <span className="font-medium text-gray-900">{propertyType}s</span>
                        </nav>
                    </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                    <div className="bg-white border-b">
                        <div className="px-4 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                                
                                {searchFilter && (
                                    <div className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-emerald-100 text-emerald-800">
                                        <span>Location: "{searchFilter}"</span>
                                        <button
                                            onClick={() => removeFilter('search')}
                                            className="ml-1 text-emerald-600 hover:text-emerald-800"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                )}
                                
                                {bedsFilter && (
                                    <div className="flex items-center gap-1 px-3 py-1 text-sm text-purple-800 bg-purple-100 rounded-full">
                                        <span>Bedrooms: {bedsFilter}+</span>
                                        <button
                                            onClick={() => removeFilter('beds')}
                                            className="ml-1 text-purple-600 hover:text-purple-800"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                )}
                                
                                <button
                                    onClick={clearAllFilters}
                                    className="text-sm text-gray-600 underline hover:text-gray-800"
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Results Summary */}
                    <div className="mb-6">
                        <h1 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">
                            {propertyType === 'Studio' 
                                ? 'Studio & Bedsitter Properties'
                                : propertyType === 'BnB'
                                    ? 'BnB Properties'
                                    : propertyType === 'Singles'
                                        ? 'Single Room Properties'
                                        : `${propertyType} Properties`
                            }
                        </h1>
                        <p className="text-gray-600">
                            {totalCount} {propertyType.toLowerCase()}{totalCount !== 1 ? 's' : ''} found
                            {hasActiveFilters && ' with current filters'}
                        </p>
                    </div>

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
                                {hasActiveFilters 
                                    ? `No ${propertyType.toLowerCase()}s match your current filters. Try adjusting your search criteria.`
                                    : `We couldn't find any ${propertyType.toLowerCase()}s at the moment. Try checking other property types.`
                                }
                            </p>
                            <div className="space-x-4">
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="inline-flex items-center px-6 py-3 font-medium transition duration-300 border rounded-lg text-emerald-600 border-emerald-600 hover:bg-emerald-600 hover:text-white"
                                    >
                                        <FiFilter className="mr-2" />
                                        Clear Filters
                                    </button>
                                )}
                                <Link
                                    to="/properties"
                                    className="inline-flex items-center px-6 py-3 font-medium text-white transition duration-300 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Browse All Properties
                                    <FiChevronRight className="ml-2" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedProperties)
                                .sort(([a], [b]) => {
                                    if (a === 'Studio') return -1;
                                    if (b === 'Studio') return 1;
                                    const numA = parseInt(a);
                                    const numB = parseInt(b);
                                    return numA - numB;
                                })
                                .map(([bedroomCount, propertyList]) => {
                                    const bedValue = bedroomCount.split(' ')[0] === 'Studio' ? '0' : bedroomCount.split(' ')[0];
                                    const linkParams = new URLSearchParams({ 
                                        propertyType, 
                                        beds: bedValue,
                                        ...(searchFilter && { search: searchFilter }),
                                    });
                                    
                                    return (
                                        <Motion.div
                                            key={bedroomCount}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Link
                                                to={`/properties?${linkParams.toString()}`}
                                                className="block p-6 transition duration-300 bg-white border rounded-xl hover:shadow-lg hover:border-emerald-300 group"
                                            >
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 group-hover:bg-emerald-100">
                                                                <FiHome className="text-emerald-600" size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600">
                                                                    {propertyType === 'Singles' 
                                                                        ? bedroomCount === 'Studio' 
                                                                            ? 'Single Rooms' 
                                                                            : `${bedroomCount} Single Rooms`
                                                                        : propertyType === 'BnB'
                                                                            ? `${bedroomCount} BnB Properties`
                                                                            : propertyType === 'Studio'
                                                                                ? bedroomCount === 'Studio' ? 'Studio & Bedsitter' : `${bedroomCount} ${propertyType}s`
                                                                                : `${bedroomCount} ${propertyType}s`
                                                                    }
                                                                </h3>
                                                                <p className="text-sm text-gray-500">
                                                                    {searchFilter && `in ${searchFilter}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-gray-600">
                                                            {propertyList.length} {propertyList.length === 1 ? 'property' : 'properties'} available
                                                        </p>
                                                        
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between md:justify-end md:gap-4">
                                                        <span className="px-3 py-1 text-sm font-medium rounded-full text-emerald-600 bg-emerald-100">
                                                            {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'}
                                                        </span>
                                                        <FiChevronRight className="text-gray-400 group-hover:text-emerald-600" size={24} />
                                                    </div>
                                                </div>
                                            </Link>
                                        </Motion.div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyCategory;