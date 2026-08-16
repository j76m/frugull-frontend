import { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { LocateFixed } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Fallback center if geolocation is denied/unavailable: Boulder, CO
// (matches the reference screenshots from the old app).
const DEFAULT_CENTER = { lat: 40.015, lng: -105.2705 };

export default function DealMap({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  function centerOnMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(next);
        mapRef.current?.panTo(next);
        mapRef.current?.setZoom(14);
      },
      () => {
        // Permission denied or unavailable — silently keep the fallback
        // center rather than blocking the map from rendering.
      }
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-200 px-6 text-center">
        <p className="text-brand-gray text-sm">
          Missing VITE_GOOGLE_MAPS_API_KEY in .env — map can't load without it.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-200 px-6 text-center">
        <p className="text-brand-gray text-sm">
          Google Maps failed to load. Check the API key restrictions match this
          site's origin.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-200">
        <p className="text-brand-gray text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          clickableIcons: false,
        }}
      >
        {children}
      </GoogleMap>

      <button
        type="button"
        onClick={centerOnMyLocation}
        aria-label="Center on my location"
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-brand-navy"
      >
        <LocateFixed size={22} />
      </button>
    </div>
  );
}