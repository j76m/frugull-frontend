import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import SeagullMascot from '../components/SeagullMascot';
import DealCard from '../components/DealCard';
import DealMap from '../components/DealMap';
import MOCK_DEALS from '../data/mockDeals';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const navigate = useNavigate();
  const [view, setView] = useState('map'); // 'map' | 'list'
  // Demo only: once real deal pins exist on the map, this flips to true
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

          <div className="relative h-[60vh]">
            <DealMap />

            {/* Tight white circle backdrop so the mascot pops against busy map tiles */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-20 h-20 rounded-full bg-white flex items-center justify-center">
              <SeagullMascot
                isOpen={mascotOpen}
                onClick={() => setMascotOpen((o) => !o)}
                className="w-16 h-16"
              />
            </div>
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