import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { LocateFixed } from 'lucide-react';
import { GOOGLE_MAPS_LIBRARIES } from '../utils/googleMapsLibraries';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Fallback center if geolocation is denied/unavailable: Boulder, CO
// (matches the reference screenshots from the old app).
const DEFAULT_CENTER = { lat: 40.015, lng: -105.2705 };

// Roughly 1 degree of lat/lng ≈ 60-70 miles at Colorado's latitude. Only
// deals within this rough box count toward the auto-fit view — this is
// what keeps a single out-of-state deal from zooming the map out to show
// the whole country once there's more data. Deals farther away still
// exist and are still fetched — the user just has to pan to find them,
// same as any normal map app.
const NEARBY_DEGREE_RADIUS = 1;
const MAX_ZOOM_AFTER_FIT = 15;

// Muted, mostly-grayscale style matching the old app: hides Google's
// default business/POI icons (Target, Costco, restaurants, etc.) and
// transit markers so only OUR deal pins stand out, keeps roads in
// grayscale, and leaves water a soft light blue for contrast.
const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ saturation: -100 }, { lightness: 20 }] },
  { elementType: 'labels.text.fill', stylers: [{ saturation: -100 }, { lightness: 30 }] },
  { elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: -100 }, { lightness: 40 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dae1' }] },
];

export default function DealMap({ dealPoints = [], children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapRef = useRef(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [hasRealLocation, setHasRealLocation] = useState(false);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  function centerOnMyLocation(zoomIn = true) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(next);
        setHasRealLocation(true);
        mapRef.current?.panTo(next);
        if (zoomIn) mapRef.current?.setZoom(14);
      },
      () => {
        // Permission denied or unavailable — silently keep the fallback
        // center rather than blocking the map from rendering.
      }
    );
  }

  useEffect(() => {
    if (isLoaded) centerOnMyLocation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Once we have the user's real location, auto-fit the map to show
  // every nearby deal (within NEARBY_DEGREE_RADIUS) instead of staying
  // locked to a fixed zoom level around the user's exact spot.
  const dealPointsKey = dealPoints.map((p) => `${p.lat},${p.lng}`).join('|');
  useEffect(() => {
    if (!hasRealLocation || !mapRef.current || !window.google) return;

    const nearby = dealPoints.filter(
      (p) =>
        Math.abs(p.lat - center.lat) <= NEARBY_DEGREE_RADIUS &&
        Math.abs(p.lng - center.lng) <= NEARBY_DEGREE_RADIUS
    );

    if (nearby.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(center);
    nearby.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds);

    // fitBounds can zoom in too far for a single nearby point — cap it.
    window.google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
      if (mapRef.current.getZoom() > MAX_ZOOM_AFTER_FIT) {
        mapRef.current.setZoom(MAX_ZOOM_AFTER_FIT);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRealLocation, dealPointsKey]);

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
          styles: MAP_STYLES,
        }}
      >
        {hasRealLocation && (
          <OverlayView position={center} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative w-4 h-4 -translate-x-1/2 -translate-y-1/2">
              {/* Pulsing halo, matching the old app's animated blue dot */}
              <span className="absolute inset-0 rounded-full bg-brand-link opacity-60 animate-ping" />
              {/* Solid center dot */}
              <span className="absolute inset-0 rounded-full bg-brand-link border-2 border-white shadow" />
            </div>
          </OverlayView>
        )}
        {children}
      </GoogleMap>

      <button
        type="button"
        onClick={() => centerOnMyLocation(true)}
        aria-label="Center on my location"
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-brand-navy"
      >
        <LocateFixed size={22} />
      </button>
    </div>
  );
}