import { useRef } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../utils/googleMapsLibraries';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Pulls a specific piece (city/state/zip) out of Google's structured
// address_components array, since the formatted_address string alone
// isn't reliably parseable.
function getAddressComponent(components, type, useShortName = false) {
  const match = components?.find((c) => c.types.includes(type));
  if (!match) return null;
  return useShortName ? match.short_name : match.long_name;
}

export default function BusinessSearchInput({ onSelect, selectedName }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const autocompleteRef = useRef(null);

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.place_id || !place.geometry) return;

    const components = place.address_components;

    onSelect({
      name: place.name,
      googlePlaceId: place.place_id,
      address: place.formatted_address ?? '',
      city: getAddressComponent(components, 'locality'),
      state: getAddressComponent(components, 'administrative_area_level_1', true),
      zipCode: getAddressComponent(components, 'postal_code'),
      phone: place.formatted_phone_number ?? null,
      website: place.website ?? null,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
    });
  }

  if (!isLoaded) {
    return (
      <input
        disabled
        placeholder="Loading business search..."
        className="w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-brand-gray"
      />
    );
  }

  return (
    <Autocomplete
      onLoad={(ref) => (autocompleteRef.current = ref)}
      onPlaceChanged={handlePlaceChanged}
      options={{ types: ['establishment'] }}
    >
      <input
        type="text"
        placeholder={selectedName || 'Search for a business...'}
        className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
      />
    </Autocomplete>
  );
}