import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker, InfoWindow } from '@react-google-maps/api';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import SeagullMascot from '../components/SeagullMascot';
import DealCard from '../components/DealCard';
import DealMap from '../components/DealMap';
import { fetchDeals } from '../api/deals';
import { useFilters } from '../context/FilterContext';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const navigate = useNavigate();
  const { allSelected, selectedSubs } = useFilters();
  const [view, setView] = useState('map'); // 'map' | 'list'
  const [deals, setDeals] = useState([]);
  const [dealsError, setDealsError] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(null);

  useEffect(() => {
    fetchDeals()
      .then(setDeals)
      .catch(() => setDealsError('Could not load deals.'));
  }, []);

  function handleSearchArea(bounds) {
    fetchDeals(bounds)
      .then(setDeals)
      .catch(() => setDealsError('Could not load deals for this area.'));
  }

  // "All" shows everything unfiltered. Otherwise only keep deals whose
  // subcategory is one of the ones checked on the Filter screen.
  const visibleDeals = allSelected
    ? deals
    : deals.filter((deal) => selectedSubs.has(deal.subcategory_name));

  const selectedDeal = visibleDeals.find((d) => d.id === selectedDealId);

  return (
    <AppLayout>
      <TopNav
        leftLabel="Filter"
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
            <DealMap
              dealPoints={visibleDeals.map((d) => ({ lat: d.latitude, lng: d.longitude }))}
              onSearchArea={handleSearchArea}
            >
              {visibleDeals.map((deal) => (
                <Marker
                  key={deal.id}
                  position={{ lat: deal.latitude, lng: deal.longitude }}
                  title={deal.business_name}
                  onClick={() => setSelectedDealId(deal.id)}
                />
              ))}

              {selectedDeal && (
                <InfoWindow
                  position={{ lat: selectedDeal.latitude, lng: selectedDeal.longitude }}
                  onCloseClick={() => setSelectedDealId(null)}
                >
                  <div className="max-w-[200px]">
                    <p className="font-semibold text-brand-navy text-sm">
                      {selectedDeal.business_name}
                    </p>
                    <p className="text-xs text-brand-link font-medium">
                      {selectedDeal.subcategory_name}
                    </p>
                    {selectedDeal.image_url && (
                      <img
                        src={selectedDeal.image_url}
                        alt={selectedDeal.business_name}
                        className="w-full h-24 object-cover rounded mt-1"
                      />
                    )}
                    <p className="text-xs text-slate-600 mt-1">{selectedDeal.caption}</p>
                    <p className="text-[11px] text-brand-gray mt-1">
                      Posted by {selectedDeal.posted_by}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </DealMap>

            {/* Tight white circle backdrop so the mascot pops against busy map tiles */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-20 h-20 rounded-full bg-white flex items-center justify-center">
              <SeagullMascot
                isOpen={!!selectedDeal}
                onClick={() => setSelectedDealId(null)}
                className="w-16 h-16"
              />
            </div>
          </div>
          {dealsError && <p className="text-red-500 text-sm text-center mt-2">{dealsError}</p>}
        </>
      )}

      {view === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
          {dealsError && <p className="text-red-500 text-sm col-span-full text-center">{dealsError}</p>}
          {deals.length === 0 && !dealsError && (
            <p className="text-brand-gray text-sm col-span-full text-center">No deals posted yet.</p>
          )}
          {visibleDeals.length === 0 && deals.length > 0 && !dealsError && (
            <p className="text-brand-gray text-sm col-span-full text-center">
              No deals match your current filter.
            </p>
          )}
          {visibleDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={{
                id: deal.id,
                businessName: deal.business_name,
                subcategoryName: deal.subcategory_name,
                views: deal.view_count,
                imageUrl: deal.image_url,
              }}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}