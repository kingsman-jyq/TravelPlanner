import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Activity {
  start_time: string;
  end_time: string;
  activity_type: string;
  description: string;
  location_name: string;
  address: string;
}

interface ItineraryDay {
  day: number;
  theme: string;
  activities: Activity[];
}

interface ItineraryProp {
  itinerary: ItineraryDay[];
  // Add other properties of the itinerary object if needed, e.g., trip_id, estimated_cost
}

interface GeocodedActivity extends Activity {
  day: number;
  longitude?: number;
  latitude?: number;
}

declare global {
  interface Window {
    _amapInit: () => void;
    AMap: AMapGlobal;
  }
}

declare global {
  interface AMapGlobal {
    Map: new (container: string | HTMLElement, opts?: any) => any;
    Geocoder: new (opts?: any) => AMapGeocoder;
    LngLat: new (lng: number, lat: number) => any;
    Marker: new (opts?: any) => any;
    Polyline: new (opts?: any) => any;
    Pixel: new (x: number, y: number) => any;
    plugin: (plugins: string[], callback: () => void) => void;
  }

  interface AMapGeocoder {
    getLocation: (address: string, callback: (status: string, result: AMapGeocoderResult) => void) => void;
  }

  interface AMapGeocoderResult {
    info: string;
    geocodes: Array<{ location: { lng: number; lat: number } }>;
    // Add other properties of GeocoderResult if needed
  }
}

const MapComponent = ({ itinerary, selectedDay }: { itinerary: ItineraryProp; selectedDay: number }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [geocodedActivities, setGeocodedActivities] = useState<GeocodedActivity[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false); // New state to track script loading

  const apiKey = import.meta.env.VITE_AMAP_API_KEY;
  const securityKey = import.meta.env.VITE_AMAP_SECURITY_KEY; // Get security key

  useEffect(() => {
    // Configure AMap security key BEFORE loading the script
    if (securityKey && !(window as any)._AMapSecurityConfig) {
      (window as any)._AMapSecurityConfig = {
        securityJsCode: securityKey,
      };
    }

    if (window.AMap && mapRef.current) {
      // If AMap is already loaded and ref is ready, initialize directly
      mapInstance.current = new window.AMap.Map(mapRef.current, {
        zoom: 11,
        center: [116.397428, 39.90923],
      });
      setIsMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`; // Correct way for v2.0
    script.async = true;
    script.onload = () => {
      setIsMapLoaded(true); // Script loaded
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [apiKey, securityKey, mapRef.current]); // Add securityKey to dependencies

  useEffect(() => {
    if (isMapLoaded && mapRef.current && !mapInstance.current) {
      // Initialize map once script is loaded and mapRef is ready
      mapInstance.current = new window.AMap.Map(mapRef.current, {
        zoom: 11,
        center: [116.397428, 39.90923],
      });
    }
  }, [isMapLoaded, mapRef.current]); // Depend on isMapLoaded and mapRef.current

  useEffect(() => {
    console.log("processItinerary useEffect triggered. itinerary:", itinerary);
    const processItinerary = () => { // No longer async
      if (!itinerary || !itinerary.itinerary) {
        console.log("Itinerary not ready (inside processItinerary).", { itinerary });
        return;
      }

      const allGeocoded: GeocodedActivity[] = [];
      for (const day of itinerary.itinerary) {
        for (const activity of day.activities) {
          // Activities now come with longitude and latitude from the backend
          allGeocoded.push({ ...activity, day: day.day });
        }
      }
      console.log("All geocoded activities:", allGeocoded);
      setGeocodedActivities(allGeocoded);
    };

    processItinerary();
  }, [itinerary]); // Remove geocoderReady from dependency array

  useEffect(() => {
    if (!mapInstance.current || !geocodedActivities.length) {
      console.log("Map instance or geocoded activities not ready for rendering.", { mapInstance: mapInstance.current, geocodedActivities });
      return;
    }

    mapInstance.current.clearMap(); // Clear existing markers and lines

    const currentDayActivities = geocodedActivities.filter(activity => activity.day === selectedDay);
    console.log(`Rendering activities for Day ${selectedDay}:`, currentDayActivities);

    if (currentDayActivities.length === 0) {
      console.log(`No activities for Day ${selectedDay} to render.`);
      return;
    }

    const path = [];
    currentDayActivities.forEach((activity, index) => {
      if (activity.longitude && activity.latitude) {
        const marker = new window.AMap.Marker({
          position: new window.AMap.LngLat(activity.longitude, activity.latitude),
          title: activity.location_name,
          map: mapInstance.current,
          label: {
            content: `${index + 1}`,
            direction: 'right',
            offset: new window.AMap.Pixel(10, 0)
          }
        });
        marker.on('click', () => {
          mapInstance.current.setCenter([activity.longitude, activity.latitude]);
          mapInstance.current.setZoom(15);
        });
        path.push([activity.longitude, activity.latitude]);
      }
    });

    console.log("Path for polyline:", path);

    if (path.length > 1) {
      const polyline = new window.AMap.Polyline({
        path: path,
        strokeColor: '#0000FF',
        strokeWeight: 4,
        map: mapInstance.current,
      });
    }

    if (path.length > 0) {
      mapInstance.current.setFitView();
    }
  }, [geocodedActivities, selectedDay]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};

export default MapComponent;
