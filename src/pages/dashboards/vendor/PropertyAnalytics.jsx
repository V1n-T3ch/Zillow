import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FiEye, FiHeart, FiMessageSquare, FiCalendar, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PropertyAnalytics = () => {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [timeRange, setTimeRange] = useState('30');
  const [totalViews, setTotalViews] = useState(0);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0); // New state for total bookings
  const [viewsChange, setViewsChange] = useState(0); // % change
  const [favoritesChange, setFavoritesChange] = useState(0); // % change
  const [viewsData, setViewsData] = useState([]);
  const [activeTab, setActiveTab] = useState('views'); // 'views' or 'favorites'
  
  // Fetch vendor's properties
  useEffect(() => {
    const fetchProperties = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('vendorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(propertiesQuery);
        
        const propertiesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProperties(propertiesList);
        
        // Calculate totals
        const views = propertiesList.reduce((sum, property) => sum + (property.views || 0), 0);
        const favorites = propertiesList.reduce((sum, property) => sum + (property.favorites || 0), 0);
        
        setTotalViews(views);
        setTotalFavorites(favorites);
        
        // Fetch bookings data
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('vendorId', '==', currentUser.uid),
          where('status', 'in', ['pending', 'confirmed'])
        );
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        setTotalBookings(bookingsSnapshot.docs.length);

        // Set mock change percentages (these would be calculated from historical data)
        setViewsChange(12); // 12% increase
        setFavoritesChange(-3); // 3% decrease
        
        // Generate view history data (mock data for now)
        generateChartData(propertiesList, timeRange, selectedProperty);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, [currentUser]);

  // Generate chart data whenever the filters change
  useEffect(() => {
    if (properties.length > 0) {
      generateChartData(properties, timeRange, selectedProperty);
    }
  }, [properties, timeRange, selectedProperty]);
  
  // Generate mock chart data (would be replaced with actual historical data)
  const generateChartData = (propertiesList, days, propertyId) => {
    const daysCount = parseInt(days) || 30;
    const labels = [];
    const viewsData = [];
    const favoritesData = [];
    
    // Generate date labels
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate random data points with an upward trend
      if (propertyId === 'all') {
        // For all properties combined, generate higher numbers
        const baseViews = Math.floor(totalViews / daysCount * 0.8);
        const baseFavorites = Math.floor(totalFavorites / daysCount * 0.8);
        
        // Add some randomness and trend (higher numbers for more recent days)
        viewsData.push(baseViews + Math.floor(Math.random() * 5) + Math.floor(i/3));
        favoritesData.push(baseFavorites + Math.floor(Math.random() * 2) + Math.floor(i/8));
      } else {
        // For individual property
        const property = propertiesList.find(p => p.id === propertyId);
        if (property) {
          const propertyViews = property.views || 0;
          const propertyFavorites = property.favorites || 0;
          
          const baseViews = Math.floor(propertyViews / daysCount * 0.8);
          const baseFavorites = Math.floor(propertyFavorites / daysCount * 0.8);
          
          viewsData.push(baseViews + Math.floor(Math.random() * 3) + Math.floor(i/5));
          favoritesData.push(baseFavorites + Math.floor(Math.random() * 1) + Math.floor(i/10));
        } else {
          viewsData.push(0);
          favoritesData.push(0);
        }
      }
    }
    
    setViewsData({
      labels,
      views: viewsData,
      favorites: favoritesData
    });
  };
  
  // Prepare chart configuration
  const chartData = useMemo(() => {
    if (!viewsData.labels) return null;
    
    return {
      labels: viewsData.labels,
      datasets: [
        {
          label: activeTab === 'views' ? 'Views' : 'Favorites',
          data: activeTab === 'views' ? viewsData.views : viewsData.favorites,
          borderColor: activeTab === 'views' ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)',
          backgroundColor: activeTab === 'views' 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: activeTab === 'views' ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [viewsData, activeTab]);
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 8,
        usePointStyle: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          maxRotation: 0,
        }
      }
    }
  };
  
  // Format number with sign
  const formatChangeNumber = (num) => {
    if (num > 0) return `+${num}%`;
    if (num < 0) return `${num}%`;
    return '0%';
  };

  return (
    <DashboardLayout role="vendor">
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Property Analytics</h2>
        
        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 gap-5 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl shadow-subtle">
            <div className="flex items-center">
              <div className="p-3 mr-4 rounded-full bg-emerald-100 text-emerald-600">
                <FiEye size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold text-gray-800">{totalViews}</h3>
                  {viewsChange !== 0 && (
                    <span className={`ml-2 text-xs font-medium ${
                      viewsChange > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {viewsChange > 0 ? <FiArrowUp className="inline mr-0.5" size={10} /> : 
                       <FiArrowDown className="inline mr-0.5" size={10} />}
                      {formatChangeNumber(viewsChange)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-subtle">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-blue-600 bg-blue-100 rounded-full">
                <FiHeart size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Favorites</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold text-gray-800">{totalFavorites}</h3>
                  {favoritesChange !== 0 && (
                    <span className={`ml-2 text-xs font-medium ${
                      favoritesChange > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {favoritesChange > 0 ? <FiArrowUp className="inline mr-0.5" size={10} /> : 
                       <FiArrowDown className="inline mr-0.5" size={10} />}
                      {formatChangeNumber(favoritesChange)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-subtle">
            <div className="flex items-center">
              <div className="p-3 mr-4 rounded-full bg-amber-100 text-amber-600">
                <FiMessageSquare size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Inquiries</p>
                <h3 className="text-2xl font-bold text-gray-800">0</h3>
              </div>
            </div>
          </div>
          
          {/* Replace the fourth analytics card (Viewings) with Bookings */}
          <div className="p-6 bg-white rounded-xl shadow-subtle">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-purple-600 bg-purple-100 rounded-full">
                <FiCalendar size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Bookings</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalBookings}</h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chart Section */}
        <div className="p-6 mb-6 bg-white rounded-xl shadow-subtle">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">
              {activeTab === 'views' ? 'Property Views' : 'Favorites'} Over Time
            </h3>
            
            <div className="flex flex-wrap gap-3">
              {/* Chart Type Tabs */}
              <div className="inline-flex overflow-hidden rounded-lg">
                <button
                  className={`px-4 py-1.5 text-sm font-medium ${
                    activeTab === 'views' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveTab('views')}
                >
                  Views
                </button>
                <button
                  className={`px-4 py-1.5 text-sm font-medium ${
                    activeTab === 'favorites' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveTab('favorites')}
                >
                  Favorites
                </button>
              </div>
              
              {/* Property Filter */}
              <select
                id="property-select"
                className="p-1.5 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <option value="all">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.title}
                  </option>
                ))}
              </select>
              
              {/* Time Range Filter */}
              <select
                id="time-range"
                className="p-1.5 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full border-t-emerald-500 animate-spin"></div>
            </div>
          ) : chartData ? (
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center text-gray-500 h-80">
              No data available
            </div>
          )}
        </div>
        
        {/* Filter Controls for Table */}
        <div className="flex flex-wrap items-center gap-4 p-6 mb-6 bg-white rounded-xl shadow-subtle">
          <div>
            <label htmlFor="property-table-select" className="block mb-2 text-sm font-medium text-gray-700">
              Property
            </label>
            <select
              id="property-table-select"
              className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              <option value="all">All Properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Property Stats */}
        <div className="p-6 bg-white rounded-xl shadow-subtle">
          <h3 className="mb-4 text-lg font-bold text-gray-800">Property Performance</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full border-t-emerald-500 animate-spin"></div>
            </div>
          ) : properties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Property</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Views</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Favorites</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Bookings</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Days Listed</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {properties
                    .filter(property => selectedProperty === 'all' || property.id === selectedProperty)
                    .map(property => {
                      const daysListed = Math.ceil(
                        (new Date() - new Date(property.createdAt?.toDate ? property.createdAt.toDate() : property.createdAt)) / 
                        (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 mr-3 overflow-hidden rounded-lg">
                                <img 
                                  src={property.images?.[0] || 'https://placehold.co/100?text=No+Image'} 
                                  alt={property.title}
                                  className="object-cover w-10 h-10"
                                />
                              </div>
                              <div className="max-w-xs truncate">{property.title}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">{property.views || 0}</td>
                          <td className="px-4 py-3 font-medium">{property.favorites || 0}</td>
                          <td className="px-4 py-3 font-medium">{property.bookings || 0}</td>
                          <td className="px-4 py-3">{daysListed}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              property.status === 'active' ? 'bg-green-100 text-green-800' : 
                              property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {property.status?.charAt(0).toUpperCase() + property.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600">You don't have any properties listed yet.</p>
              <button className="px-4 py-2 mt-4 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700">
                List a Property
              </button>
            </div>
          )}
        </div>
        
        {/* Property View Distribution Chart (Bar Chart) */}
        {properties.length > 1 && selectedProperty === 'all' && (
          <div className="p-6 mt-6 bg-white rounded-xl shadow-subtle">
            <h3 className="mb-6 text-lg font-bold text-gray-800">Views Distribution by Property</h3>
            
            <div className="h-80">
              <Bar 
                data={{
                  labels: properties.map(p => p.title?.length > 20 ? p.title.substring(0, 20) + '...' : p.title),
                  datasets: [
                    {
                      label: 'Views',
                      data: properties.map(p => p.views || 0),
                      backgroundColor: 'rgba(16, 185, 129, 0.7)',
                      borderRadius: 4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#1F2937',
                      bodyColor: '#1F2937',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderWidth: 1,
                      padding: 10
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Views',
                        color: '#6B7280',
                        font: {
                          size: 12,
                          weight: 'normal'
                        }
                      }
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PropertyAnalytics;