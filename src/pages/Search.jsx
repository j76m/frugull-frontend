import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import SeagullMascot from '../components/SeagullMascot';
import DealCard from '../components/DealCard';
import MOCK_DEALS from '../data/mockDeals';
import { Search as SearchIcon, LocateFixed } from 'lucide-react';

export default function Search() {
  const navigate = useNavigate();
  const [view, setView] = useState('map'); // 'map' | 'list'
  // Demo only: once real map + deal markers exist, this flips to true
  // when a deal marker/card is selected, not a manual click toggle.
  const [mascotOpen, setMascotOpen] = useState(false);

  return (
    <AppLayout>
      <TopNav
        leftLabel="Settings"
        onLeft={() => navigate('/filters')}
        rightLabel={view === 'map' ? 'List' : 'Map'}
        onRight={() => setView((v) => (v === 'map' ? 'list' : 'map'))}
      />

      {view === 'map' && (
        <>
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-3 text-brand-gray">
              <SearchIcon size={18} />
              <span className="text-sm">Search for Deals (coming soon)</span>
            </div>
          </div>

          {/* Map placeholder — real Google Map with category pins needs a
              Google Maps API key in .env (VITE_GOOGLE_MAPS_API_KEY) before
              this can be wired up for real. */}
          <div className="relative bg-slate-200 h-[60vh] flex items-center justify-center">
            <p className="text-brand-gray text-sm px-6 text-center">
              Real map pins go here once we have a Google Maps API key set up.
            </p>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <SeagullMascot
                isOpen={mascotOpen}
                onClick={() => setMascotOpen((o) => !o)}
                className="w-16 h-16"
              />
            </div>

            <button
              type="button"
              aria-label="Center on my location"
              className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-brand-navy"
            >
              <LocateFixed size={22} />
            </button>
          </div>
        </>
      )}

      {view === 'list' && (
        <div className="p-4">
          {MOCK_DEALS.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
