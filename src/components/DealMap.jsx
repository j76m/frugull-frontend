import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { LocateFixed, Search as SearchIcon } from 'lucide-react';
import { GOOGLE_MAPS_LIBRARIES } from '../utils/googleMapsLibraries';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Fallback center if geolocation is denied/unavailable: Boulder, CO
// (matches the reference screenshots from the old app).
const DEFAULT_CENTER = { lat: 40.015, lng: -105.2705 };

const MAX_ZOOM_AFTER_FIT = 15;
const FALLBACK_ZOOM = 12; // used only when there are zero matching deals at all

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

export default function DealMap({ dealPoints = [], onSearchArea, focusPosition, filterSignal, children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapRef = useRef(null);

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [hasRealLocation, setHasRealLocation] = useState(false);
  const [showSearchArea, setShowSearchArea] = useState(false);

  const isProgrammaticMove = useRef(false);

  const onLoad = useCallback((map) => {
    mapRef.current = map;

    map.addListener('dragstart', () => {
      if (!isProgrammaticMove.current) setShowSearchArea(true);
    });
    map.addListener('zoom_changed', () => {
      if (!isProgrammaticMove.current) setShowSearchArea(true);
    });
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  function centerOnMyLocation() {
    if (!navigator.geolocation) return;
    isProgrammaticMove.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(next);
        setHasRealLocation(true);
        mapRef.current?.panTo(next);
        mapRef.current?.setZoom(14);
        setTimeout(() => (isProgrammaticMove.current = false), 300);
      },
      () => {
        isProgrammaticMove.current = false;
      }
    );
  }

  useEffect(() => {
    if (isLoaded) centerOnMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  function handleSearchArea() {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    onSearchArea?.({
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    });
    setShowSearchArea(false);
  }

  useEffect(() => {
    if (!focusPosition || !mapRef.current) return;
    isProgrammaticMove.current = true;
    mapRef.current.panTo(focusPosition);
    mapRef.current.setZoom(13);
    setShowSearchArea(false);
    setTimeout(() => (isProgrammaticMove.current = false), 300);
  }, [focusPosition]);

  // The core "what should the map be showing" logic, kept reactive rather
  // than a one-time effect — this is what makes it correctly handle both
  // the very first load AND navigating to Filters and back (which fully
  // remounts this component, so any "only run once" guard would silently
  // never fire on that return trip).
  //
  // For now this always fits to EVERY currently matching deal, with no
  // distance cap — given how few deals exist at this stage, showing
  // nothing nearby would look broken. Once real deal density grows large
  // enough that this would zoom out to the whole country, this should be
  // revisited (e.g. reintroducing a "search this area" first-load flow).
  useEffect(() => {
    if (!mapRef.current || !window.google || !hasRealLocation) return;

    isProgrammaticMove.current = true;

    if (dealPoints.length === 0) {
      mapRef.current.panTo(center);
      mapRef.current.setZoom(FALLBACK_ZOOM);
      setTimeout(() => (isProgrammaticMove.current = false), 300);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(center);
    dealPoints.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds);
    window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
      if (mapRef.current.getZoom() > MAX_ZOOM_AFTER_FIT) {
        mapRef.current.setZoom(MAX_ZOOM_AFTER_FIT);
      }
      setTimeout(() => (isProgrammaticMove.current = false), 300);
    });
    setShowSearchArea(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRealLocation, filterSignal, dealPoints.length]);

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
              <span className="absolute inset-0 rounded-full bg-brand-link opacity-60 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-brand-link border-2 border-white shadow" />
            </div>
          </OverlayView>
        )}
        {children}
      </GoogleMap>

      {showSearchArea && (
        <button
          type="button"
          onClick={handleSearchArea}
          className="cursor-pointer absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white shadow-md rounded-full px-4 py-2 text-brand-link text-sm font-semibold hover:bg-slate-50"
        >
          <SearchIcon size={16} />
          Search this area
        </button>
      )}

      <button
        type="button"
        onClick={centerOnMyLocation}
        aria-label="Center on my location"
        className="cursor-pointer absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-brand-navy"
      >
        <LocateFixed size={22} />
      </button>
    </div>
  );
}