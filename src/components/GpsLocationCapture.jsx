import { useState } from 'react';
import { MapPin, LocateFixed } from 'lucide-react';

function getGpsPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('geolocation-unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 0 }
    );
  });
}

// For categories without a fixed, searchable business (like Farm Stands) -
// captures the poster's current GPS position at the moment of posting,
// which is more accurate than a typed address for something like a stand
// at the end of a rural driveway that wouldn't geocode correctly anyway.
// No IP-based fallback here (unlike the map's own geolocation) - if GPS
// isn't available, posting this way just isn't possible, since an
// approximate city-level location isn't accurate enough to actually find
// a specific farm stand.
export default function GpsLocationCapture({ onLocationReady, name, onNameChange }) {
  const [status, setStatus] = useState('idle'); // idle | locating | done | error
  const [coords, setCoords] = useState(null);

  async function handleCapture() {
    setStatus('locating');
    try {
      const pos = await getGpsPosition();
      setCoords(pos);
      setStatus('done');
      onLocationReady(pos);
    } catch {
      setStatus('error');
      onLocationReady(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-slate-600 mb-1">Stand name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Anderson Family Farm Stand"
          className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-link"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Location</label>
        <button
          type="button"
          onClick={handleCapture}
          disabled={status === 'locating'}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 text-brand-navy font-medium py-3 cursor-pointer hover:bg-slate-200 disabled:opacity-50"
        >
          {status === 'done' ? <MapPin size={18} /> : <LocateFixed size={18} />}
          {status === 'idle' && 'Use my current location'}
          {status === 'locating' && 'Getting your location...'}
          {status === 'done' && 'Location captured'}
          {status === 'error' && 'Try again'}
        </button>
        {status === 'done' && coords && (
          <p className="text-brand-gray text-xs mt-1">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
        {status === 'error' && (
          <p className="text-red-500 text-xs mt-1">
            Could not get your location. Make sure location access is allowed, then try again.
          </p>
        )}
        <p className="text-brand-gray text-xs mt-1">
          Stand somewhere near the stand and tap this to pin its exact location.
        </p>
      </div>
    </div>
  );
}