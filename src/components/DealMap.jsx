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

// Roughly 1 degree of lat/lng ≈ 60-70 miles at Colorado's latitude — wide
// enough to comfortably span neighboring towns (e.g. Longmont <-> Boulder,
// ~25 miles apart). Deals within this box count toward "nearby" whenever
// we locate the user, whether that's automatic on load or a manual tap
// of the locate-me button — both do the exact same thing, consistently.
const NEARBY_DEGREE_RADIUS = 1;
const MAX_ZOOM_AFTER_FIT = 15;
const FALLBACK_ZOOM = 12; // used only if there are no nearby deals to fit to

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

export default function DealMap({ dealPoints = [], onSearchArea, focusPosition, children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapRef = useRef(null);
  const dealPointsRef = useRef(dealPoints);
  dealPointsRef.current = dealPoints;

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [hasRealLocation, setHasRealLocation] = useState(false);
  const [showSearchArea, setShowSearchArea] = useState(false);

  // Tracks whether the map's current movement was triggered by our own
  // code (geolocation centering, auto-fit) vs. an actual user drag/scroll.
  // Only real user movement should reveal the "Search this area" button.
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

  // The one consistent "locate me" behavior: center on the user's real
  // location, then zoom out just enough to also show any deals nearby
  // (within NEARBY_DEGREE_RADIUS). If there are none nearby, fall back to
  // a plain city-level zoom. This runs identically whether triggered
  // automatically on first load or by tapping the locate-me button.
  function centerOnMyLocation() {
    if (!navigator.geolocation) return;
    isProgrammaticMove.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(next);
        setHasRealLocation(true);

        if (!mapRef.current || !window.google) return;

        const nearby = dealPointsRef.current.filter(
          (p) =>
            Math.abs(p.lat - next.lat) <= NEARBY_DEGREE_RADIUS &&
            Math.abs(p.lng - next.lng) <= NEARBY_DEGREE_RADIUS
        );

        if (nearby.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(next);
          nearby.forEach((p) => bounds.extend(p));
          mapRef.current.fitBounds(bounds);
          window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
            if (mapRef.current.getZoom() > MAX_ZOOM_AFTER_FIT) {
              mapRef.current.setZoom(MAX_ZOOM_AFTER_FIT);
            }
            setTimeout(() => (isProgrammaticMove.current = false), 300);
          });
        } else {
          mapRef.current.panTo(next);
          mapRef.current.setZoom(FALLBACK_ZOOM);
          setTimeout(() => (isProgrammaticMove.current = false), 300);
        }
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

  // Jump the map to a specific point (e.g. picking a city from the
  // dropdown) without treating it as a user-initiated pan.
  useEffect(() => {
    if (!focusPosition || !mapRef.current) return;
    isProgrammaticMove.current = true;
    mapRef.current.panTo(focusPosition);
    mapRef.current.setZoom(13);
    setShowSearchArea(false);
    setTimeout(() => (isProgrammaticMove.current = false), 300);
  }, [focusPosition]);

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

      {showSearchArea && (
        <button
          type="button"
          onClick={handleSearchArea}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white shadow-md rounded-full px-4 py-2 text-brand-link text-sm font-semibold cursor-pointer hover:bg-slate-50"
        >
          <SearchIcon size={16} />
          Search this area
        </button>
      )}

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