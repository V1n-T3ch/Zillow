import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  collection, query, getDocs, where, limit
} from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import { FiMapPin, FiHome, FiDollarSign, FiUsers, FiSearch, FiFilter } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Neighborhoods = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || 'All');
  const [priceRangeFilter, setPriceRangeFilter] = useState(searchParams.get('priceRange') || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState([]);
  const navigate = useNavigate();
  
  // Fetch all neighborhoods and properties
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // For this example, we'll get neighborhoods from properties data
        // In a real app, you might have a dedicated neighborhoods collection
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('status', '==', 'active')
        );
        
        const querySnapshot = await getDocs(propertiesQuery);
        
        // Extract unique neighborhoods and their stats
        const neighborhoodMap = {};
        const citiesSet = new Set();
        
        querySnapshot.forEach(doc => {
          const property = { id: doc.id, ...doc.data() };
          const neighborhood = property.state || 'Unknown';
          const city = property.city || 'Unknown';
          
          citiesSet.add(city);
          
          if (!neighborhoodMap[neighborhood]) {
            neighborhoodMap[neighborhood] = {
              name: neighborhood,
              city: city,
              properties: [],
              avgPrice: 0,
              minPrice: Number.MAX_SAFE_INTEGER,
              maxPrice: 0,
              listingCount: 0,
              featuredImage: property.images?.[0] || null
            };
          }
          
          neighborhoodMap[neighborhood].properties.push(property);
          neighborhoodMap[neighborhood].listingCount++;
          
          // Update price stats
          const price = property.price || 0;
          neighborhoodMap[neighborhood].minPrice = Math.min(neighborhoodMap[neighborhood].minPrice, price);
          neighborhoodMap[neighborhood].maxPrice = Math.max(neighborhoodMap[neighborhood].maxPrice, price);
          
          // Use a better image if available (prioritize houses over apartments)
          if (property.propertyType === 'House' && property.images?.[0]) {
            neighborhoodMap[neighborhood].featuredImage = property.images[0];
          }
        });
        
        // Calculate average prices and create the neighborhoods array
        const neighborhoodsArray = Object.values(neighborhoodMap).map(neighborhood => {
          const totalPrice = neighborhood.properties.reduce((sum, property) => sum + (property.price || 0), 0);
          neighborhood.avgPrice = totalPrice / neighborhood.listingCount;
          return neighborhood;
        });
        
        setNeighborhoods(neighborhoodsArray);
        setFilteredNeighborhoods(neighborhoodsArray);
        setCities(['All', ...Array.from(citiesSet)]);
        
      } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        setError('Failed to load neighborhoods. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNeighborhoods();
  }, []);
  
  // Apply filters when they change
  useEffect(() => {
    if (neighborhoods.length === 0) return;
    
    let filtered = [...neighborhoods];
    
    // Apply city filter
    if (cityFilter && cityFilter !== 'All') {
      filtered = filtered.filter(neighborhood => 
        neighborhood.city.toLowerCase() === cityFilter.toLowerCase()
      );
    }
    
    // Apply price range filter
    if (priceRangeFilter && priceRangeFilter !== 'All') {
      const ranges = {
        'Under 200k': { min: 0, max: 200000 },
        '200k-500k': { min: 200000, max: 500000 },
        '500k-1M': { min: 500000, max: 1000000 },
        'Over 1M': { min: 1000000, max: Number.MAX_SAFE_INTEGER }
      };
      
      const range = ranges[priceRangeFilter];
      if (range) {
        filtered = filtered.filter(neighborhood => 
          neighborhood.avgPrice >= range.min && neighborhood.avgPrice <= range.max
        );
      }
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(neighborhood => 
        neighborhood.name.toLowerCase().includes(term) || 
        neighborhood.city.toLowerCase().includes(term)
      );
    }
    
    setFilteredNeighborhoods(filtered);
    
    // Update URL params
    const params = {};
    if (cityFilter !== 'All') params.city = cityFilter;
    if (priceRangeFilter !== 'All') params.priceRange = priceRangeFilter;
    setSearchParams(params, { replace: true });
    
  }, [cityFilter, priceRangeFilter, searchTerm, neighborhoods, setSearchParams]);
  
  const handleNeighborhoodClick = (neighborhood) => {
    // Navigate to properties page with neighborhood filter
    navigate(`/properties?location=${encodeURIComponent(neighborhood.name)}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Neighborhoods
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the perfect neighborhood for your new home. Browse areas, see local insights, 
              and find properties in your desired location.
            </p>
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-subtle p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex-grow">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search neighborhoods or cities..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <div>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={priceRangeFilter}
                    onChange={(e) => setPriceRangeFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="All">All Prices</option>
                    <option value="Under 200k">Under Ksh. 200k</option>
                    <option value="200k-500k">Ksh. 200k-Ksh. 500k</option>
                    <option value="500k-1M">Ksh. 500k-Ksh. 1M</option>
                    <option value="Over 1M">Over Ksh. 1M</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Neighborhoods Grid */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {filteredNeighborhoods.length} Neighborhoods Available
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-xl shadow-subtle overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            ) : filteredNeighborhoods.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-subtle text-center">
                <h3 className="text-xl font-semibold mb-2">No neighborhoods found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
                <button
                  onClick={() => {
                    setCityFilter('All');
                    setPriceRangeFilter('All');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNeighborhoods.map(neighborhood => (
                  <motion.div
                    key={neighborhood.name}
                    className="bg-white rounded-xl shadow-subtle overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleNeighborhoodClick(neighborhood)}
                    whileHover={{ y: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="h-48 bg-gray-200 relative">
                      <img 
                        src={neighborhood.featuredImage || 'https://via.placeholder.com/500x300?text=Neighborhood'} 
                        alt={neighborhood.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 text-white">
                        <h3 className="text-xl font-bold">{neighborhood.name}</h3>
                        <p>{neighborhood.city}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center text-emerald-600">
                          <FiHome className="mr-1" />
                          <span className="font-medium">{neighborhood.listingCount} Properties</span>
                        </div>
                        <div className="text-gray-700 font-bold">
                          Avg: Ksh. {Math.round(neighborhood.avgPrice).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        Price Range: Ksh. {neighborhood.minPrice.toLocaleString()} - Ksh. {neighborhood.maxPrice.toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {/* Call To Action */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to find your dream home?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Browse our selection of properties in your favorite neighborhood and start your journey to homeownership today.
            </p>
            <Link
              to="/properties"
              className="inline-block px-6 py-3 bg-white text-emerald-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Browse All Properties
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Neighborhoods;