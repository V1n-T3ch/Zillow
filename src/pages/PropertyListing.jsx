import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import { FiFilter, FiGrid, FiList, FiAlertCircle } from 'react-icons/fi';
import { db } from '../firebase';
import {
    collection, query, where, getDocs, orderBy,
    doc, getDoc, deleteDoc, addDoc, updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PropertyListing = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [properties, setProperties] = useState([]);
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();
    const [favorites, setFavorites] = useState({});

    // Filter states
    const [priceRange, setPriceRange] = useState([0, 2000000]);
    const [bedrooms, setBedrooms] = useState('');
    const [propertyType, setPropertyType] = useState('Any');
    const [propertyStatus, setPropertyStatus] = useState('Any');
    const [showFilters, setShowFilters] = useState(true);
    const [location, setLocation] = useState('Any');

    // Sort state
    const [sortOption, setSortOption] = useState('newest');

    // Pagination
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const propertiesPerPage = 10;

    // Get filter values from URL params
    useEffect(() => {
        const type = searchParams.get('type') || 'Any';
        const bedsParam = searchParams.get('beds') || '';
        const minPrice = parseInt(searchParams.get('minPrice') || '0');
        const maxPrice = parseInt(searchParams.get('maxPrice') || '2000000');
        const status = searchParams.get('status') || 'Any';
        const loc = searchParams.get('location') || 'Any';
        const sort = searchParams.get('sort') || 'newest';
        const page = parseInt(searchParams.get('page') || '1');

        setPropertyType(type);
        setBedrooms(bedsParam);
        setPriceRange([minPrice, maxPrice]);
        setPropertyStatus(status);
        setLocation(loc);
        setSortOption(sort);
        setCurrentPage(page);
    }, [searchParams]);

    // Fetch properties from Firestore
    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Start with base query - only show active properties
                let propertiesQuery = query(
                    collection(db, 'properties'),
                    where('status', '==', 'active')
                );

                // Apply filters from URL parameters
                if (propertyType !== 'Any') {
                    propertiesQuery = query(
                        propertiesQuery,
                        where('propertyType', '==', propertyType)
                    );
                }

                // Apply sorting
                let sortField, sortDirection;

                switch (sortOption) {
                    case 'newest':
                        sortField = 'createdAt';
                        sortDirection = 'desc';
                        break;
                    case 'price-asc':
                        sortField = 'price';
                        sortDirection = 'asc';
                        break;
                    case 'price-desc':
                        sortField = 'price';
                        sortDirection = 'desc';
                        break;
                    default:
                        sortField = 'createdAt';
                        sortDirection = 'desc';
                }

                propertiesQuery = query(
                    propertiesQuery,
                    orderBy(sortField, sortDirection)
                );

                // Get all properties for client-side filtering
                const querySnapshot = await getDocs(propertiesQuery);

                const allProperties = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));

                // Apply client-side filters
                let filtered = allProperties;

                // Filter by price
                filtered = filtered.filter(property => 
                    property.price >= priceRange[0] && property.price <= priceRange[1]
                );

                // Filter by bedrooms (now using direct input value)
                if (bedrooms && bedrooms !== '') {
                    const bedsValue = parseInt(bedrooms);
                    if (!isNaN(bedsValue)) {
                        filtered = filtered.filter(property => property.beds === bedsValue);
                    }
                }

                // Filter by location (case-insensitive partial match for both city and area)
                if (location !== 'Any' && location !== '') {
                    const searchTerm = location.toLowerCase().trim();
                    
                    filtered = filtered.filter(property => {
                        // Check if city matches (case-insensitive)
                        const cityMatch = property.city && 
                            property.city.toLowerCase().includes(searchTerm);
                        
                        // Check if area matches (case-insensitive)
                        const areaMatch = property.area && 
                            property.area.toLowerCase().includes(searchTerm);
                        
                        // Return true if either city or area matches
                        return cityMatch || areaMatch;
                    });
                }

                // Filter by status (map UI status to data status)
                if (propertyStatus !== 'Any') {
                    filtered = filtered.filter(property => 
                        property.listingStatus === propertyStatus
                    );
                }

                // Calculate total for pagination
                setTotalCount(filtered.length);

                // Apply pagination
                const skip = (currentPage - 1) * propertiesPerPage;
                const paginatedResults = filtered.slice(skip, skip + propertiesPerPage);

                setProperties(filtered);
                setFilteredProperties(paginatedResults);

                // Fetch user's favorites if logged in
                if (currentUser) {
                    await fetchUserFavorites();
                }

                // Log for debugging
                console.log(`Found ${filtered.length} properties, showing ${paginatedResults.length} on page ${currentPage}`);
                console.log('Applied filters:', {
                    price: priceRange,
                    beds: bedrooms,
                    location,
                    status: propertyStatus,
                    type: propertyType
                });

            } catch (error) {
                console.error('Error fetching properties:', error);
                setError('Failed to load properties. Please try again later.');
                toast.error('Failed to load properties. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, [propertyType, propertyStatus, location, bedrooms, sortOption, currentPage, currentUser, priceRange]);

    // Fetch user favorites
    const fetchUserFavorites = async () => {
        if (!currentUser) return;

        try {
            const favoritesQuery = query(
                collection(db, 'favorites'),
                where('userId', '==', currentUser.uid)
            );

            const querySnapshot = await getDocs(favoritesQuery);

            const favoritesMap = {};
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                favoritesMap[data.propertyId] = doc.id;
            });

            setFavorites(favoritesMap);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const toggleFavorite = async (propertyId) => {
        if (!currentUser) {
            // Redirect to login or show login modal
            toast.info('Please login to save properties to your favorites');
            return;
        }

        try {
            if (favorites[propertyId]) {
                // Remove from favorites
                await deleteDoc(doc(db, 'favorites', favorites[propertyId]));

                // Update local state
                const newFavorites = { ...favorites };
                delete newFavorites[propertyId];
                setFavorites(newFavorites);

                // Update property favorites count
                const propertyRef = doc(db, 'properties', propertyId);
                const propertyDoc = await getDoc(propertyRef);

                if (propertyDoc.exists()) {
                    const currentCount = propertyDoc.data().favorites || 0;
                    if (currentCount > 0) {
                        await updateDoc(propertyRef, {
                            favorites: currentCount - 1
                        });
                    }
                }

                toast.success('Property removed from favorites');
            } else {
                // Add to favorites
                const docRef = await addDoc(collection(db, 'favorites'), {
                    propertyId,
                    userId: currentUser.uid,
                    createdAt: serverTimestamp()
                });

                // Update local state
                setFavorites({
                    ...favorites,
                    [propertyId]: docRef.id
                });

                // Update property favorites count
                const propertyRef = doc(db, 'properties', propertyId);
                const propertyDoc = await getDoc(propertyRef);

                if (propertyDoc.exists()) {
                    const currentCount = propertyDoc.data().favorites || 0;
                    await updateDoc(propertyRef, {
                        favorites: currentCount + 1
                    });
                }

                toast.success('Property added to favorites');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Failed to update favorites. Please try again.');
        }
    };

    const applyFilters = () => {
        // Update URL params
        setSearchParams({
            type: propertyType,
            beds: bedrooms,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            status: propertyStatus,
            location: location,
            sort: sortOption,
            page: 1 // Reset to first page on filter change
        });
    };

    const resetFilters = () => {
        setPriceRange([0, 2000000]);
        setBedrooms('');
        setPropertyType('Any');
        setPropertyStatus('Any');
        setLocation('Any');
        setSortOption('newest');
        setCurrentPage(1);
        setSearchParams({});

        toast.info('Filters have been reset');
    };

    // Total pages for pagination
    const totalPages = Math.ceil(totalCount / propertiesPerPage);

    // Navigate to page
    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;

        setCurrentPage(page);
        setSearchParams({
            ...Object.fromEntries(searchParams),
            page: page.toString()
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
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

            <div className="container px-4 py-8 mx-auto">
                <h1 className="mb-8 text-3xl font-bold">Property Listings</h1>

                {error && (
                    <div className="flex items-start p-4 mb-6 text-red-700 rounded-lg bg-red-50">
                        <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                        <div>{error}</div>
                    </div>
                )}

                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Filters Sidebar */}
                    <div className={`lg:w-1/4 bg-white p-6 rounded-lg shadow-md ${showFilters ? 'block' : 'hidden lg:block'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Filters</h2>
                            <button
                                onClick={resetFilters}
                                className="text-sm text-emerald-600 hover:underline"
                            >
                                Reset All
                            </button>
                        </div>

                        {/* Price Range */}
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold">Price Range</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="block mb-1 text-xs text-gray-500">Min Price</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full p-2 border rounded"
                                            value={priceRange[0]}
                                            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block mb-1 text-xs text-gray-500">Max Price</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full p-2 border rounded"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bedrooms - Now an input field */}
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold">Bedrooms</h3>
                            <input
                                type="number"
                                min="0"
                                className="w-full p-2 border rounded"
                                placeholder="Enter number of bedrooms"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                            />
                        </div>

                        {/* Property Type */}
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold">Property Type</h3>
                            <select
                                className="w-full p-2 bg-white border rounded"
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                            >
                                <option value="Any">Any</option>
                                <option value="House">House</option>
                                <option value="Apartment">Apartment</option>
                                <option value="Condo">Condo</option>
                                <option value="Townhouse">Townhouse</option>
                                <option value="Villa">Villa</option>
                                <option value="Land">Land</option>
                            </select>
                        </div>

                        {/* Property Status */}
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold">Listing Type</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Any', 'For Sale', 'For Rent'].map(option => (
                                    <button
                                        key={option}
                                        className={`px-4 py-2 rounded-full ${propertyStatus === option
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        onClick={() => setPropertyStatus(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location - Search for city or area */}
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold">Location</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-2 pr-8 border rounded"
                                    placeholder="Search by city or area"
                                    value={location === 'Any' ? '' : location}
                                    onChange={(e) => setLocation(e.target.value ? e.target.value.trim() : 'Any')}
                                />
                                {location !== 'Any' && (
                                    <button 
                                        className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
                                        onClick={() => setLocation('Any')}
                                    >
                                        <span className="text-xl">&times;</span>
                                    </button>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Searches both city and area fields
                            </p>
                        </div>

                        <button
                            onClick={applyFilters}
                            className="w-full py-3 text-white transition rounded-lg bg-emerald-600 hover:bg-emerald-700"
                        >
                            Apply Filters
                        </button>
                    </div>

                    {/* Property Listings */}
                    <div className="lg:w-3/4">
                        {/* Results Header */}
                        <div className="flex flex-col justify-between gap-4 p-4 mb-6 bg-white rounded-lg shadow-md sm:flex-row sm:items-center">
                            <div>
                                <p className="text-gray-600">
                                    {isLoading
                                        ? 'Loading properties...'
                                        : `${filteredProperties.length} properties found`
                                    }
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center overflow-hidden border rounded">
                                    <button
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <FiGrid />
                                    </button>
                                    <button
                                        className={`p-2 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <FiList />
                                    </button>
                                </div>

                                <select
                                    className="p-2 bg-white border rounded"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="beds-desc">Most Bedrooms</option>
                                </select>

                                <button
                                    className="p-2 border rounded lg:hidden"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <FiFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </button>
                            </div>
                        </div>

                        {/* Properties Grid/List */}
                        {isLoading ? (
                            // Skeleton loading UI
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="overflow-hidden bg-white rounded-lg shadow-md animate-pulse">
                                        <div className="w-full h-48 bg-gray-300"></div>
                                        <div className="p-4">
                                            <div className="w-3/4 h-6 mb-3 bg-gray-300 rounded"></div>
                                            <div className="w-1/2 h-4 mb-3 bg-gray-300 rounded"></div>
                                            <div className="w-1/4 h-5 mb-3 bg-gray-300 rounded"></div>
                                            <div className="flex justify-between mb-3">
                                                <div className="w-12 h-4 bg-gray-300 rounded"></div>
                                                <div className="w-12 h-4 bg-gray-300 rounded"></div>
                                                <div className="w-12 h-4 bg-gray-300 rounded"></div>
                                            </div>
                                            <div className="w-full bg-gray-300 rounded h-9"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {filteredProperties.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className={viewMode === 'grid'
                                            ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                                            : 'space-y-6'
                                        }>
                                            {filteredProperties.map(property => (
                                                <PropertyCard
                                                    key={property.id}
                                                    property={{
                                                        ...property,
                                                        isFavorite: Boolean(favorites[property.id]),
                                                        // Match the expected field names in PropertyCard
                                                        beds: property.beds || 0,
                                                        baths: property.baths || 0,
                                                        // Use listingStatus directly
                                                        listingStatus: property.listingStatus || 'For Sale',
                                                        propertyType: property.propertyType || 'Property',
                                                        // Ensure price has a default value
                                                        price: property.price || 0,
                                                        // Use the first image from images array
                                                        imageUrl: property.images?.[0] || 'https://placehold.co/800x500?text=No+Image'
                                                    }}
                                                    onFavoriteToggle={() => toggleFavorite(property.id)}
                                                    viewMode={viewMode}
                                                />
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center mt-8 space-x-2">
                                                <button
                                                    onClick={() => goToPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className={`px-3 py-1 rounded ${currentPage === 1
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    Previous
                                                </button>

                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    // Show limited page numbers with ellipsis
                                                    .filter(page =>
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                                    )
                                                    .map((page, index, array) => {
                                                        // Add ellipsis
                                                        if (index > 0 && array[index - 1] !== page - 1) {
                                                            return (
                                                                <span key={`ellipsis-${page}`} className="px-3 py-1">
                                                                    ...
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => goToPage(page)}
                                                                className={`px-3 py-1 rounded ${currentPage === page
                                                                        ? 'bg-emerald-600 text-white'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    })
                                                }

                                                <button
                                                    onClick={() => goToPage(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className={`px-3 py-1 rounded ${currentPage === totalPages
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-white rounded-lg shadow-md">
                                        <h3 className="mb-2 text-xl font-semibold">No properties found</h3>
                                        <p className="mb-4 text-gray-600">Try adjusting your search criteria or filters</p>
                                        <button
                                            onClick={resetFilters}
                                            className="px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyListing;