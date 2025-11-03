import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// custom marker icon
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background-color: #105fb9ff;
    width: 25px;
    height: 25px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      color: white;
      font-size: 12px;
      transform: rotate(45deg);
      font-weight: bold;
    ">📍</div>
  </div>`,
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
});

const LocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null,
  address = '', 
  city = '', 
  state = '' 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

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
        mapInstanceRef.current = newMap;

        // Add click handler
        newMap.on('click', (event) => {
          const clickedLocation = {
            lat: event.latlng.lat,
            lng: event.latlng.lng
          };
          
          setSelectedLocation(clickedLocation);
          setMarkerOnMap(clickedLocation);
          
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
  }, []);

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
      // Create new marker with custom icon
      const newMarker = L.marker([location.lat, location.lng], {
        draggable: true,
        icon: customIcon
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
      
      // Store marker in ref
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=16&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        console.log('Address found:', data.display_name);
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

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        const { latitude, longitude } = geoPosition.coords;
        
        const newPosition = {
          lat: latitude,
          lng: longitude
        };
        
        setSelectedLocation(newPosition);
        setMarkerOnMap(newPosition);
        onLocationSelect(newPosition);
        centerMap(newPosition);
        
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="w-full">
      {/* CSS for custom marker */}
      <style jsx>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
      <div className="flex flex-col gap-3 mb-4 sm:flex-row">
        {/* Search input */}
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            placeholder="Search location (e.g., Nakuru, Karen, Westlands)"
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

        {/* Use My Location button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gettingLocation}
          className="flex items-center justify-center px-4 py-3 text-white transition-colors rounded-lg whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {gettingLocation ? (
            <>
              <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Getting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use My Location
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {locationError && (
        <div className="p-3 mb-3 text-sm text-red-700 bg-red-50 rounded-lg">
          {locationError}
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full border border-gray-300 rounded-lg shadow-md"
        style={{ height: '400px' }}
      ></div>
      
      {/* Selected coordinates display */}
      {selectedLocation && (
        <div className="p-3 mt-3 text-sm rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="font-medium text-emerald-900">✓ Location Selected</p>
          <p className="text-emerald-700">
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;