import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  collection, query, getDocs, where, orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import { 
  FiUser, FiMail, FiPhone, FiStar, FiHome, 
  FiSearch, FiMapPin, FiFilter, FiChevronDown,
  FiCheck, FiMessageSquare, FiCalendar 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

const AgentCard = ({ agent, onContactClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-subtle overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-center">
          <div className="w-24 h-24 mb-4 sm:mb-0 sm:mr-6 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
            <img 
              src={agent.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0D9488&color=fff`} 
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="text-center sm:text-left flex-grow">
            <h3 className="text-xl font-bold text-gray-800">{agent.name}</h3>
            <p className="text-gray-600">{agent.title || 'Real Estate Agent'}</p>
            
            <div className="flex items-center justify-center sm:justify-start mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar 
                  key={i} 
                  className={`${i < Math.round(agent.rating || 0) 
                    ? 'text-amber-400 fill-amber-400' 
                    : 'text-gray-300'}`} 
                />
              ))}
              <span className="ml-2 text-gray-600">
                {agent.rating?.toFixed(1) || 'No ratings'} ({agent.reviewCount || 0})
              </span>
            </div>
            
            {agent.specialties && (
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1">
                {agent.specialties.map((specialty, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 sm:mt-0 text-center sm:text-right sm:border-l sm:pl-6 sm:ml-6">
            <div className="flex flex-col sm:items-end">
              <div className="flex items-center justify-center sm:justify-end mb-2">
                <FiHome className="text-emerald-500 mr-2" />
                <span className="text-gray-700">{agent.listingCount || 0} Properties</span>
              </div>
              
              {agent.location && (
                <div className="flex items-center justify-center sm:justify-end mb-2">
                  <FiMapPin className="text-emerald-500 mr-2" />
                  <span className="text-gray-700">{agent.location}</span>
                </div>
              )}
              
              {agent.experience && (
                <div className="flex items-center justify-center sm:justify-end">
                  <FiCheck className="text-emerald-500 mr-2" />
                  <span className="text-gray-700">{agent.experience} Experience</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a 
            href={`mailto:${agent.email}`} 
            className="flex-1 flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiMail className="mr-2" />
            Email
          </a>
          
          <a 
            href={`tel:${agent.phone}`} 
            className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <FiPhone className="mr-2" />
            Call
          </a>
          
          <button 
            onClick={() => onContactClick(agent)}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiMessageSquare className="mr-2" />
            Message
          </button>
        </div>
      </div>
      
      {agent.recentReview && (
        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <FiStar className="fill-current" size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <h4 className="font-medium text-gray-800 mr-2">{agent.recentReview.name || 'Anonymous'}</h4>
                <span className="text-gray-500 text-sm">{agent.recentReview.date}</span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2">{agent.recentReview.text}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 border-t border-gray-100 bg-white">
        <Link 
          to={`/properties?agent=${agent.id}`}
          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
        >
          View {agent.name}'s properties →
        </Link>
      </div>
    </div>
  );
};

const Agents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || 'All');
  const [specialtyFilter, setSpecialtyFilter] = useState(searchParams.get('specialty') || 'All');
  const [ratingFilter, setRatingFilter] = useState(searchParams.get('rating') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState(['All']);
  const [specialties, setSpecialties] = useState(['All']);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const { currentUser } = useAuth();
  
  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get users with role "vendor"
        const vendorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'vendor')
        );
        
        const vendorSnapshot = await getDocs(vendorsQuery);
        const vendorsList = [];
        const locationsSet = new Set(['All']);
        const specialtiesSet = new Set(['All']);
        
        // Get additional details for each vendor
        for (const vendorDoc of vendorSnapshot.docs) {
          const vendorData = vendorDoc.data();
          
          // Get property count for this vendor
          const propertiesQuery = query(
            collection(db, 'properties'),
            where('vendorId', '==', vendorDoc.id),
            where('status', '==', 'active')
          );
          
          const propertiesSnapshot = await getDocs(propertiesQuery);
          const listingCount = propertiesSnapshot.size;
          
          // Get reviews for this vendor
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('vendorId', '==', vendorDoc.id),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          
          const reviewsSnapshot = await getDocs(reviewsQuery);
          
          let recentReview = null;
          let totalRating = 0;
          let reviewCount = 0;
          
          if (!reviewsSnapshot.empty) {
            const reviewDoc = reviewsSnapshot.docs[0];
            const reviewData = reviewDoc.data();
            
            recentReview = {
              id: reviewDoc.id,
              name: reviewData.userName || 'Anonymous',
              text: reviewData.text || '',
              rating: reviewData.rating || 5,
              date: reviewData.createdAt?.toDate().toLocaleDateString() || 'Recently'
            };
            
            // Get average rating
            const allReviewsQuery = query(
              collection(db, 'reviews'),
              where('vendorId', '==', vendorDoc.id)
            );
            
            const allReviewsSnapshot = await getDocs(allReviewsQuery);
            reviewCount = allReviewsSnapshot.size;
            
            allReviewsSnapshot.forEach(doc => {
              totalRating += doc.data().rating || 0;
            });
          }
          
          // Add location to filter options
          if (vendorData.location) {
            locationsSet.add(vendorData.location);
          }
          
          // Add specialties to filter options
          if (vendorData.specialties && Array.isArray(vendorData.specialties)) {
            vendorData.specialties.forEach(specialty => {
              specialtiesSet.add(specialty);
            });
          }
          
          // Calculate average rating
          const rating = reviewCount > 0 ? totalRating / reviewCount : null;
          
          // Create agent object
          const agent = {
            id: vendorDoc.id,
            name: vendorData.name || vendorData.displayName || 'Unknown Agent',
            email: vendorData.email || '',
            phone: vendorData.phone || '',
            photoURL: vendorData.photoURL || '',
            title: vendorData.title || 'Real Estate Agent',
            location: vendorData.location || '',
            specialties: vendorData.specialties || [],
            experience: vendorData.experience || '',
            bio: vendorData.bio || '',
            listingCount,
            rating,
            reviewCount,
            recentReview
          };
          
          vendorsList.push(agent);
        }
        
        // Set agents and filter options
        setAgents(vendorsList);
        setFilteredAgents(vendorsList);
        setLocations([...locationsSet]);
        setSpecialties([...specialtiesSet]);
        
      } catch (error) {
        console.error('Error fetching agents:', error);
        setError('Failed to load agents. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgents();
  }, []);
  
  // Apply filters when they change
  useEffect(() => {
    if (agents.length === 0) return;
    
    let filtered = [...agents];
    
    // Apply location filter
    if (locationFilter && locationFilter !== 'All') {
      filtered = filtered.filter(agent => 
        agent.location?.toLowerCase() === locationFilter.toLowerCase()
      );
    }
    
    // Apply specialty filter
    if (specialtyFilter && specialtyFilter !== 'All') {
      filtered = filtered.filter(agent => 
        agent.specialties?.some(specialty => 
          specialty.toLowerCase() === specialtyFilter.toLowerCase()
        )
      );
    }
    
    // Apply rating filter
    if (ratingFilter && ratingFilter !== 'All') {
      const minRating = parseInt(ratingFilter.split('+')[0]);
      filtered = filtered.filter(agent => 
        agent.rating && agent.rating >= minRating
      );
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name?.toLowerCase().includes(term) || 
        agent.location?.toLowerCase().includes(term) ||
        agent.title?.toLowerCase().includes(term) ||
        agent.specialties?.some(specialty => specialty.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'listings') {
      filtered.sort((a, b) => (b.listingCount || 0) - (a.listingCount || 0));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'reviews') {
      filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }
    
    setFilteredAgents(filtered);
    
    // Update URL params
    const params = {};
    if (locationFilter !== 'All') params.location = locationFilter;
    if (specialtyFilter !== 'All') params.specialty = specialtyFilter;
    if (ratingFilter !== 'All') params.rating = ratingFilter;
    if (sortBy !== 'rating') params.sort = sortBy;
    setSearchParams(params, { replace: true });
    
  }, [locationFilter, specialtyFilter, ratingFilter, sortBy, searchTerm, agents, setSearchParams]);
  
  const handleContactClick = (agent) => {
    if (!currentUser) {
      toast.info('Please log in to contact agents');
      return;
    }
    
    setSelectedAgent(agent);
    setShowContactForm(true);
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.info('Please log in to contact agents');
      return;
    }
    
    if (!contactMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Send message to agent
      // In a real app, you would save this to Firestore
      toast.success(`Message sent to ${selectedAgent.name}`);
      setShowContactForm(false);
      setContactMessage('');
      setSelectedAgent(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find Your Perfect Real Estate Agent
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Connect with top-rated real estate professionals who can help you
              find your dream home or sell your property.
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
                    placeholder="Search by name, location, specialty..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>
                        {location === 'All' ? 'All Locations' : location}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>
                        {specialty === 'All' ? 'All Specialties' : specialty}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="All">All Ratings</option>
                    <option value="4+">4+ Stars</option>
                    <option value="3+">3+ Stars</option>
                    <option value="2+">2+ Stars</option>
                  </select>
                </div>
                
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="rating">Sort by Rating</option>
                    <option value="listings">Sort by Listings</option>
                    <option value="reviews">Sort by Reviews</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Agents Grid */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {filteredAgents.length} Agent{filteredAgents.length !== 1 ? 's' : ''} Available
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl shadow-subtle overflow-hidden animate-pulse">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="w-24 h-24 rounded-full bg-gray-300 mr-6"></div>
                        <div className="flex-grow">
                          <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
                          <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <div className="h-10 bg-gray-300 rounded flex-1"></div>
                        <div className="h-10 bg-gray-300 rounded flex-1"></div>
                        <div className="h-10 bg-gray-300 rounded flex-1"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-subtle text-center">
                <h3 className="text-xl font-semibold mb-2">No agents found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
                <button
                  onClick={() => {
                    setLocationFilter('All');
                    setSpecialtyFilter('All');
                    setRatingFilter('All');
                    setSortBy('rating');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredAgents.map(agent => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    onContactClick={handleContactClick} 
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Call To Action */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Are you a real estate professional?</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Join our platform to showcase your properties and connect with potential clients.
            </p>
            <Link
              to="/register?role=vendor"
              className="inline-block px-6 py-3 bg-white text-emerald-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Register as an Agent
            </Link>
          </div>
        </div>
      </div>
      
      {/* Contact Form Modal */}
      {showContactForm && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Contact {selectedAgent.name}
              </h3>
              
              <form onSubmit={handleSendMessage}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows="5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={`Hello ${selectedAgent.name}, I'm interested in...`}
                    required
                  ></textarea>
                </div>
                
                <div className="mb-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setContactMessage(`Hello ${selectedAgent.name}, I'm interested in viewing some of your properties. Please contact me to discuss further.`);
                    }}
                    className="text-sm text-gray-600 px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    Viewing Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContactMessage(`Hello ${selectedAgent.name}, I'm looking to sell my property and would like to learn more about your services.`);
                    }}
                    className="text-sm text-gray-600 px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    Selling Inquiry
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContactForm(false);
                      setContactMessage('');
                    }}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
            
            <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 mr-3 rounded-full overflow-hidden">
                    <img 
                      src={selectedAgent.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAgent.name)}&background=0D9488&color=fff`} 
                      alt={selectedAgent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{selectedAgent.name}</h4>
                    <p className="text-sm text-gray-600">{selectedAgent.title}</p>
                  </div>
                </div>
                
                <div>
                  <a 
                    href={`tel:${selectedAgent.phone}`}
                    className="text-emerald-600 hover:text-emerald-700"
                    title="Call Agent"
                  >
                    <FiPhone />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;