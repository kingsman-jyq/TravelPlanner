import React, { useEffect, useRef, useState } from 'react';
import type { Itinerary } from '../types'; // Import the shared Itinerary type

interface GeocodedActivity {
  day: number;
  start_time: string;
  end_time: string;
  activity_type: string;
  description: string;
  location_name: string;
  address: string;
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
    Driving: new (opts?: any) => AMapDriving; // Add Driving
  }

  interface AMapGeocoder {
    getLocation: (address: string, callback: (status: string, result: AMapGeocoderResult) => void) => void;
  }

  interface AMapGeocoderResult {
    info: string;
    geocodes: Array<{ location: { lng: number; lat: number } }>;
    // Add other properties of GeocoderResult if needed
  }

  interface AMapDriving {
    search: (
      start: any, // AMap.LngLat or string
      end: any,   // AMap.LngLat or string
      options: { waypoints?: any[] }, // AMap.LngLat[] or string[]
      callback: (status: string, result: AMapDrivingResult) => void
    ) => void;
    clear: () => void;
  }

  interface AMapDrivingResult {
    info: string;
    routes: Array<any>; // Detailed route information
    // ... other properties
  }
}

const MapComponent = ({ itinerary, selectedDay }: { itinerary: Itinerary | null; selectedDay: number }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef<any>(null);
  const [geocodedActivities, setGeocodedActivities] = useState<GeocodedActivity[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false); // New state to track script loading
  const [drivingService, setDrivingService] = useState<AMapDriving | null>(null);
  const [markers, setMarkers] = useState<any[]>([]); // State to hold AMap.Marker instances

  const apiKey = import.meta.env.VITE_AMAP_API_KEY;
  const securityKey = import.meta.env.VITE_AMAP_SECURITY_KEY; // Get security key

  useEffect(() => {
    // Configure AMap security key BEFORE loading the script
    if (securityKey && !(window as any)._AMapSecurityConfig) {
      (window as any)._AMapSecurityConfig = {
        securityJsCode: securityKey,
      };
    }

    const loadMapAndPlugins = () => {
      if (window.AMap && mapRef.current) {
        if (!mapInstance.current) {
          mapInstance.current = new window.AMap.Map(mapRef.current, {
            zoom: 11,
            center: [116.397428, 39.90923],
          });
        }
        window.AMap.plugin(['AMap.Driving'], () => {
          setDrivingService(new window.AMap.Driving({
            map: mapInstance.current,
            autoFitView: true,
            showMarker: false,
          }));
          setIsMapLoaded(true);
        });
      }
    };

    if (window.AMap) {
      loadMapAndPlugins();
    } else {
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
      script.async = true;
      script.onload = () => {
        loadMapAndPlugins();
      };
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [apiKey, securityKey]);

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
    console.log("processItinerary useEffect triggered. itinerary:", JSON.stringify(itinerary, null, 2)); // Deep log itinerary
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
    if (!mapInstance.current || !geocodedActivities.length || !drivingService) {
      return;
    }

    // 1. Clear previous overlays from the map
    drivingService.clear();
    markers.forEach(marker => marker.setMap(null));

    const currentDayActivities = geocodedActivities.filter(activity => activity.day === selectedDay);

    if (currentDayActivities.length === 0) {
      setMarkers([]); // No activities, ensure no markers are tracked
      return;
    }

    // 2. Prepare path for the driving service
    const path = currentDayActivities
      .filter(activity => activity.longitude && activity.latitude)
      .map(activity => new window.AMap.LngLat(activity.longitude!, activity.latitude!));

    // 3. Use driving service to draw the route
    if (path.length > 1) {
      const start = path[0];
      const end = path[path.length - 1];
      const waypoints = path.slice(1, -1);

      drivingService.search(start, end, { waypoints: waypoints }, (status: string, result: AMapDrivingResult) => {
        if (status === 'complete' && result.routes.length) {
          console.log('Driving route search complete. Adding markers.');
          // 4. Create and set new markers AFTER the route is drawn
          const newMarkers = currentDayActivities.map((activity, index) => {
            if (activity.longitude && activity.latitude) {
              return new window.AMap.Marker({
                position: new window.AMap.LngLat(activity.longitude, activity.latitude),
                title: activity.location_name,
                map: mapInstance.current,
                label: { content: `${index + 1}`, direction: 'right', offset: new window.AMap.Pixel(10, 0) }
              });
            }
            return null;
          }).filter(Boolean);
          setMarkers(newMarkers as any[]);
        } else {
          console.error('Driving route search failed:', status, result);
          setMarkers([]); // Clear marker tracking on failure
        }
      });
    } else if (path.length === 1) {
      // Handle single point case
      const activity = currentDayActivities[0];
      const marker = new window.AMap.Marker({
        position: new window.AMap.LngLat(activity.longitude!, activity.latitude!),
        title: activity.location_name,
        map: mapInstance.current,
        label: { content: `1`, direction: 'right', offset: new window.AMap.Pixel(10, 0) }
      });
      setMarkers([marker]);
      mapInstance.current.setCenter(path[0]);
      mapInstance.current.setZoom(15);
    } else {
      setMarkers([]); // No valid path, clear markers
    }

  }, [geocodedActivities, selectedDay, drivingService]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapComponent;
