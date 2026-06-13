import { useState, useEffect, useCallback } from 'react';
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
import { normalizeProperty, toBedsCount, toNumber } from '../utils/propertyData';

const PropertyListing = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();
    const [favorites, setFavorites] = useState({});

    // Filter states
    const [priceRange, setPriceRange] = useState([0, 2000000]);
    const [priceFilterApplied, setPriceFilterApplied] = useState(false);
    const [bedrooms, setBedrooms] = useState('');
    const [propertyType, setPropertyType] = useState('Any');
    const [showFilters, setShowFilters] = useState(true);
    const [searchFilter, setSearchFilter] = useState(''); // New search filter for city/area
    const [locationFilter, setLocationFilter] = useState(''); // New location filter for sidebar

    // Sort state
    const [sortOption, setSortOption] = useState('newest');

    // Pagination
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const propertiesPerPage = 10;

    // Get filter values from URL params
    useEffect(() => {
        const type = searchParams.get('propertyType') || searchParams.get('type') || 'Any';
        const bedsParam = searchParams.get('beds') || '';
        const minPrice = parseInt(searchParams.get('minPrice') || '0');
        const maxPrice = parseInt(searchParams.get('maxPrice') || '2000000');
        const hasPriceParams = searchParams.has('minPrice') || searchParams.has('maxPrice');
        const search = searchParams.get('search') || ''; // New search param
        const sort = searchParams.get('sort') || 'newest';
        const page = parseInt(searchParams.get('page') || '1');

        setPropertyType(type);
        setBedrooms(bedsParam);
        setPriceRange([minPrice, maxPrice]);
        setPriceFilterApplied(hasPriceParams);
        setSearchFilter(search); // Set search filter
        setSortOption(sort);
        setCurrentPage(page);
    }, [searchParams]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(max-width: 1023px)');
        const updateFilterVisibility = () => setShowFilters(!mediaQuery.matches);

        updateFilterVisibility();

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateFilterVisibility);
            return () => mediaQuery.removeEventListener('change', updateFilterVisibility);
        }

        mediaQuery.addListener(updateFilterVisibility);
        return () => mediaQuery.removeListener(updateFilterVisibility);
    }, []);

    const fetchUserFavorites = useCallback(async () => {
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
    }, [currentUser]);

    const fetchProperties = useCallback(async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Start with base query - only show active properties
                let propertiesQuery = query(
                    collection(db, 'properties'),
                    where('status', '==', 'active')
                );

                // Apply property type filter from URL parameters
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
                    case 'beds-desc':
                        sortField = 'beds';
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

                const allProperties = querySnapshot.docs.map(doc => normalizeProperty({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
                }));

                // Apply client-side filters
                let filtered = allProperties;

                // Filter by search term (city or area) from URL
                if (searchFilter && searchFilter.trim() !== '') {
                    const searchTerm = searchFilter.toLowerCase().trim();
                    filtered = filtered.filter(property => 
                        property.city?.toLowerCase().includes(searchTerm) ||
                        property.area?.toLowerCase().includes(searchTerm)
                    );
                }

                // Filter by location from sidebar
                if (locationFilter && locationFilter.trim() !== '') {
                    const locationTerm = locationFilter.toLowerCase().trim();
                    filtered = filtered.filter(property => 
                        property.city?.toLowerCase().includes(locationTerm) ||
                        property.area?.toLowerCase().includes(locationTerm)
                    );
                }

                // Filter by price
                if (priceFilterApplied) {
                    filtered = filtered.filter(property => {
                        const price = toNumber(property.price);
                        return price >= priceRange[0] && price <= priceRange[1];
                    });
                }

                // Filter by bedrooms - exact match
                if (bedrooms && bedrooms !== '') {
                    const bedsNumber = parseInt(bedrooms);
                    filtered = filtered.filter(property => toBedsCount(property.beds) === bedsNumber);
                }

                // Calculate total for pagination
                setTotalCount(filtered.length);

                // Apply pagination
                const skip = (currentPage - 1) * propertiesPerPage;
                const paginatedResults = filtered.slice(skip, skip + propertiesPerPage);

                setFilteredProperties(paginatedResults);

                // Fetch user's favorites if logged in
                if (currentUser) {
                    await fetchUserFavorites();
                }

            } catch (error) {
                console.error('Error fetching properties:', error);
                setError('Failed to load properties. Please try again later.');
                toast.error('Failed to load properties. Please try again later.');
            } finally {
                setIsLoading(false);
            }
    }, [propertyType, bedrooms, sortOption, currentPage, currentUser, priceRange, priceFilterApplied, searchFilter, locationFilter, fetchUserFavorites]);

    // Fetch properties from Firestore
    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const toggleFavorite = async (propertyId) => {
        if (!currentUser) {
            toast.info('Please login to save properties to your favorites');
            return;
        }

        try {
            if (favorites[propertyId]) {
                // Remove from favorites
                await deleteDoc(doc(db, 'favorites', favorites[propertyId]));

                const newFavorites = { ...favorites };
                delete newFavorites[propertyId];
                setFavorites(newFavorites);

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

                setFavorites({
                    ...favorites,
                    [propertyId]: docRef.id
                });

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
        }
    };

    const applyFilters = () => {
        // Update URL params with only the sidebar filters
        const params = {
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            sort: sortOption,
            page: 1 // Reset to first page on filter change
        };

        // Preserve existing URL params that aren't handled by sidebar
        const existingSearch = searchParams.get('search');
        const existingPropertyType = searchParams.get('propertyType');
        const existingBeds = searchParams.get('beds');

        if (existingSearch) params.search = existingSearch;
        if (existingPropertyType) params.propertyType = existingPropertyType;
        if (existingBeds) params.beds = existingBeds;

        // Add location filter to URL if set
        if (locationFilter && locationFilter.trim() !== '') {
            params.locationFilter = locationFilter;
        }

        setPriceFilterApplied(true);

        setSearchParams(params);
    };

    const resetFilters = () => {
        // Only reset sidebar filters, keep URL-based filters
        setPriceRange([0, 2000000]);
        setPriceFilterApplied(false);
        setLocationFilter('');
        setSortOption('newest');
        setCurrentPage(1);
        
        // Preserve search and property type from URL
        const params = {};
        const existingSearch = searchParams.get('search');
        const existingPropertyType = searchParams.get('propertyType');
        const existingBeds = searchParams.get('beds');

        if (existingSearch) params.search = existingSearch;
        if (existingPropertyType) params.propertyType = existingPropertyType;
        if (existingBeds) params.beds = existingBeds;

        setSearchParams(params);
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

            <div className="pb-16 md:pb-0">
                <div className="container px-4 py-8 mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Property Listings</h1>
                        {/* Show current filters if active */}
                        <div className="hidden flex-wrap gap-2 mt-4 lg:flex">
                            {searchFilter && (
                                <div className="flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-emerald-100 text-emerald-800">
                                    <span>Location: "{searchFilter}"</span>
                                    <button
                                        onClick={() => {
                                            const params = Object.fromEntries(searchParams);
                                            delete params.search;
                                            setSearchParams(params);
                                        }}
                                        className="ml-1 text-emerald-600 hover:text-emerald-800"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            {locationFilter && (
                                <div className="flex items-center gap-2 px-3 py-1 text-sm text-orange-800 bg-orange-100 rounded-full">
                                    <span>Filter: "{locationFilter}"</span>
                                    <button
                                        onClick={() => {
                                            setLocationFilter('');
                                            const params = Object.fromEntries(searchParams);
                                            delete params.locationFilter;
                                            setSearchParams(params);
                                        }}
                                        className="ml-1 text-orange-600 hover:text-orange-800"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            {/*  */}
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start p-4 mb-6 text-red-700 rounded-lg bg-red-50">
                            <FiAlertCircle className="mt-0.5 mr-2" size={18} />
                            <div>{error}</div>
                        </div>
                    )}

                    <div className="flex flex-col gap-6 lg:flex-row">
                        {/* Filters Sidebar - Price Range and Location */}
                        <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                            <div className="p-4 bg-white rounded-lg shadow-md h-fit">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold">Filters</h2>
                                    <button
                                        onClick={resetFilters}
                                        className="text-sm text-emerald-600 hover:underline"
                                    >
                                        Reset
                                    </button>
                                </div>

                                {/* Price Range */}
                                <div className="mb-4">
                                    <h3 className="mb-2 font-medium text-gray-700">Price Range</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                            />
                                        </div>
                                        <span className="text-gray-400">-</span>
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location Filter */}
                                <div className="mb-4">
                                    <h3 className="mb-2 font-medium text-gray-700">Location</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter city or area (e.g., Nairobi, Westlands)"
                                        className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Filter properties by city or specific area
                                    </p>
                                </div>

                                <button
                                    onClick={applyFilters}
                                    className="w-full py-2 text-sm font-medium text-white transition rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>

                        {/* Property Listings */}
                        <div className="lg:w-3/4">
                            {/* Results Header */}
                            <div className="flex flex-col justify-between gap-4 p-4 mb-6 bg-white rounded-lg shadow-md sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-gray-600">
                                        {isLoading
                                            ? 'Loading properties...'
                                            : `${totalCount} properties found`
                                        }
                                        {(searchFilter || locationFilter) && (
                                            <span>
                                                {' '}for "{searchFilter || locationFilter}"
                                            </span>
                                        )}
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
                                        className="flex items-center gap-1 p-2 border rounded lg:hidden"
                                        onClick={() => setShowFilters(!showFilters)}
                                        aria-expanded={showFilters}
                                    >
                                        <FiFilter size={16} />
                                        <span className="text-sm">{showFilters ? 'Hide' : 'Show'}</span>
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
                                                            beds: toBedsCount(property.beds),
                                                            baths: toNumber(property.baths),                                                         
                                                            propertyType: property.propertyType || 'Property',
                                                            price: toNumber(property.price),
                                                            images: property.images || [],
                                                            imageUrl: property.imageUrl || 'https://placehold.co/800x500?text=No+Image'
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
                                                        .filter(page =>
                                                            page === 1 ||
                                                            page === totalPages ||
                                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                                        )
                                                        .map((page, index, array) => {
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
                                            <p className="mb-4 text-gray-600">
                                                {(searchFilter || locationFilter)
                                                    ? `No properties found for "${searchFilter || locationFilter}". Try a different location or adjust your filters.`
                                                    : 'Try adjusting your search criteria or filters'
                                                }
                                            </p>
                                            <button
                                                onClick={() => setSearchParams({})}
                                                className="px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                Clear All Filters
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyListing;