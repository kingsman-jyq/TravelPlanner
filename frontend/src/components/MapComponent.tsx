import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    _amapInit: () => void;
    AMap: any;
  }
}

const MapComponent = ({ itinerary }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const apiKey = import.meta.env.VITE_AMAP_API_KEY;

  useEffect(() => {
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&callback=_amapInit`;
      script.async = true;
      document.head.appendChild(script);
    };

    window._amapInit = () => {
      if (mapRef.current) {
        mapInstance.current = new window.AMap.Map(mapRef.current, {
          zoom: 11,
          center: [116.397428, 39.90923],
        });
      }
    };

    if (!window.AMap) {
      loadScript();
    } else {
      window._amapInit();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (mapInstance.current && itinerary && itinerary.itinerary) {
      // Clear previous markers
      mapInstance.current.clearMap();

      const markers = [];
      const locations = [];

      itinerary.itinerary.forEach(day => {
        day.activities.forEach(activity => {
          if (activity.address) { // Assuming address can be used for geocoding
            locations.push(activity.location_name);
          }
        });
      });
      
      // For simplicity, we'll just center the map on the first location found.
      // A better implementation would use geocoding to get coordinates for all addresses.
      if (locations.length > 0) {
        mapInstance.current.setCity(locations[0], () => {
            mapInstance.current.setZoom(12);
        });
      }
    }
  }, [itinerary]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};

export default MapComponent;
