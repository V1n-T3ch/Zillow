import { useState, useEffect, useRef } from 'react';
import { FiCrosshair, FiSearch } from 'react-icons/fi';

const LocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null,
  address = '', 
  city = '', 
  state = '' 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);

  // Initialize the map
  useEffect(() => {
    const googleMapScript = document.createElement('script');
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;
    window.document.body.appendChild(googleMapScript);

    googleMapScript.addEventListener('load', () => {
      initializeMap();
    });

    return () => {
      googleMapScript.removeEventListener('load', initializeMap);
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

  const initializeMap = () => {
    if (!mapRef.current) return;
    
    // Default center at a neutral location if no initial location
    const defaultLocation = { lat: 0, lng: 0 };
    const mapOptions = {
      center: initialLocation || defaultLocation,
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    };
    
    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // Add click handler
    newMap.addListener('click', (event) => {
      const clickedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
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
  };

  const setMarkerOnMap = (location) => {
    // Remove existing marker if any
    if (marker) {
      marker.setMap(null);
    }
    
    // Create new marker
    const newMarker = new window.google.maps.Marker({
      position: location,
      map: map,
      animation: window.google.maps.Animation.DROP,
      draggable: true
    });
    
    // Add drag end event
    newMarker.addListener('dragend', () => {
      const newPosition = {
        lat: newMarker.getPosition().lat(),
        lng: newMarker.getPosition().lng()
      };
      
      setSelectedLocation(newPosition);
      reverseGeocode(newPosition);
      onLocationSelect(newPosition);
    });
    
    setMarker(newMarker);
  };

  const centerMap = (location) => {
    if (map) {
      map.setCenter(location);
      map.setZoom(16);
    }
  };

  const geocodeAddress = async (addressString) => {
    if (!addressString) return;
    
    setIsLoading(true);
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: addressString }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          
          setSelectedLocation(location);
          centerMap(location);
          setMarkerOnMap(location);
          onLocationSelect(location);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      setIsLoading(false);
    }
  };

  const reverseGeocode = (location) => {
    if (!location) return;
    
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        console.log('Address found:', results[0].formatted_address);
      }
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    geocodeAddress(searchValue);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
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
        },
        (error) => {
          console.error('Error getting location:', error);
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
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search for address"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-500" />
            </div>
            <button 
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-emerald-600"
            >
              Search
            </button>
          </form>
        </div>
        <button
          type="button"
          onClick={getUserLocation}
          className="flex items-center px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
        >
          <FiCrosshair className="mr-2" />
          My Location
        </button>
      </div>

      <div 
        ref={mapRef} 
        className="w-full border border-gray-300 rounded-lg shadow-md h-96"
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