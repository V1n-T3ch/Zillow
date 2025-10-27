import { useState, useEffect, useRef } from 'react';
import { FiCrosshair, FiSearch } from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null,
  address = '', 
  city = '', 
  state = '' 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null); // Use ref instead of state for marker
  const [map, setMap] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);

  // Initialize the map with Leaflet
  useEffect(() => {
    if (!mapRef.current) return;

    // Check if map is already initialized
    if (mapRef.current._leaflet_id) {
      return;
    }

    const initializeMap = () => {
      try {
        // Default center at Nairobi, Kenya if no initial location
        const defaultLocation = initialLocation || { lat: -1.2921, lng: 36.8219 };
        
        const newMap = L.map(mapRef.current, {
          center: [defaultLocation.lat, defaultLocation.lng],
          zoom: 13,
          zoomControl: true,
        });

        // Street map layer
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        });

        // Satellite layer
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 19,
        });

        // Add default layer
        streetLayer.addTo(newMap);

        // Layer control
        const baseLayers = {
          "Street Map": streetLayer,
          "Satellite": satelliteLayer
        };

        L.control.layers(baseLayers).addTo(newMap);

        setMap(newMap);
        mapInstanceRef.current = newMap; // Store map instance in ref

        // Add click handler
        newMap.on('click', (event) => {
          const clickedLocation = {
            lat: event.latlng.lat,
            lng: event.latlng.lng
          };
          
          setSelectedLocation(clickedLocation);
          setMarkerOnMap(clickedLocation); // No need to pass mapInstance now
          
          // Get address from coordinates (reverse geocoding)
          reverseGeocode(clickedLocation);
          
          // Call the parent component callback
          onLocationSelect(clickedLocation);
        });

        // Set marker if initial location exists
        if (initialLocation) {
          setMarkerOnMap(initialLocation);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapRef.current && mapRef.current._leaflet_id) {
        try {
          // Clean up marker first
          if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
          }
          
          // Clean up map
          const mapInstance = mapInstanceRef.current;
          if (mapInstance) {
            mapInstance.remove();
            mapInstanceRef.current = null;
          }
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, []); // Empty dependency array

  // Try to center map on address when provided
  useEffect(() => {
    if (map && address && city) {
      const addressString = `${address}, ${city}, ${state}`;
      geocodeAddress(addressString);
    }
  }, [map, address, city, state]);

  // Update map when initialLocation changes
  useEffect(() => {
    if (map && initialLocation) {
      setSelectedLocation(initialLocation);
      centerMap(initialLocation);
      setMarkerOnMap(initialLocation);
    }
  }, [map, initialLocation]);

  const setMarkerOnMap = (location) => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance) return;

    // Remove existing marker using ref
    if (markerRef.current) {
      try {
        mapInstance.removeLayer(markerRef.current);
      } catch (error) {
        console.error('Error removing marker:', error);
      }
      markerRef.current = null;
    }
    
    try {
      // Create new marker
      const newMarker = L.marker([location.lat, location.lng], {
        draggable: true
      }).addTo(mapInstance);
      
      // Add drag end event
      newMarker.on('dragend', (event) => {
        const newPosition = {
          lat: event.target.getLatLng().lat,
          lng: event.target.getLatLng().lng
        };
        
        setSelectedLocation(newPosition);
        reverseGeocode(newPosition);
        onLocationSelect(newPosition);
      });
      
      // Store marker in ref instead of state
      markerRef.current = newMarker;
    } catch (error) {
      console.error('Error creating marker:', error);
    }
  };

  const centerMap = (location) => {
    const mapInstance = mapInstanceRef.current;
    if (mapInstance) {
      try {
        mapInstance.setView([location.lat, location.lng], 16);
      } catch (error) {
        console.error('Error centering map:', error);
      }
    }
  };

  const geocodeAddress = async (addressString) => {
    if (!addressString) return;
    
    setIsLoading(true);
    
    try {
      // Use Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=ke`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        
        setSelectedLocation(location);
        centerMap(location);
        setMarkerOnMap(location);
        onLocationSelect(location);
      } else {
        console.log('No results found for:', addressString);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (location) => {
    if (!location) return;
    
    try {
      // Use Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=16&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        console.log('Address found:', data.display_name);
        // You can use this address data as needed
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      geocodeAddress(searchValue);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setSelectedLocation(userLocation);
          centerMap(userLocation);
          setMarkerOnMap(userLocation);
          onLocationSelect(userLocation);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="w-full">
      <div className="flex mb-4 space-x-2">
        <div className="relative flex-grow">
          <div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="Search for address in Kenya"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-500" />
            </div>
            <button 
              type="button"
              onClick={handleSearch}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-emerald-600"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={getUserLocation}
          disabled={isLoading}
          className="flex items-center px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400"
        >
          <FiCrosshair className="mr-2" />
          My Location
        </button>
      </div>

      <div 
        ref={mapRef} 
        className="w-full border border-gray-300 rounded-lg shadow-md h-96"
        style={{ height: '400px' }}
      ></div>
      
      {selectedLocation && (
        <div className="mt-3 text-sm text-gray-600">
          <p>Selected coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center mt-2">
          <div className="w-4 h-4 mr-2 border-2 border-t-2 border-gray-500 rounded-full animate-spin border-t-emerald-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;