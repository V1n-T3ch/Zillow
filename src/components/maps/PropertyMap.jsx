import { useState, useEffect, useRef } from 'react';

const PropertyMap = ({ location, readOnly = true, height = '400px' }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    // Load Google Maps script
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

  useEffect(() => {
    if (map && location) {
      centerMap(location);
      setMarkerOnMap(location);
    }
  }, [map, location]);

  const initializeMap = () => {
    if (!mapRef.current) return;
    
    // Default center if no location provided
    const defaultLocation = { lat: 0, lng: 0 };
    const mapOptions = {
      center: location || defaultLocation,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      scrollwheel: !readOnly,
      draggable: !readOnly
    };
    
    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // Set marker if location exists
    if (location) {
      setMarkerOnMap(location);
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
      draggable: false
    });
    
    setMarker(newMarker);
  };

  const centerMap = (location) => {
    if (map) {
      map.setCenter(location);
    }
  };

  return (
    <div 
      ref={mapRef} 
      className="w-full border border-gray-200 rounded-lg shadow-md"
      style={{ height }}
    ></div>
  );
};

export default PropertyMap;