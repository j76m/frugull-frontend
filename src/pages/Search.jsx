import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker } from '@react-google-maps/api';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import SeagullMascot from '../components/SeagullMascot';
import DealCard from '../components/DealCard';
import DealMap from '../components/DealMap';
import DealDetailModal from '../components/DealDetailModal';
import { fetchDeals } from '../api/deals';
import { useFilters } from '../context/FilterContext';
import { MapPin } from 'lucide-react';

export default function Search() {
  const navigate = useNavigate();
  const { allSelected, selectedSubs } = useFilters();
  const [view, setView] = useState('map'); // 'map' | 'list'
  const [deals, setDeals] = useState([]);
  // Kept separate from `deals` (which narrows when "Search this area" is
  // used) so the city dropdown always reflects everywhere with active
  // deals, not just the currently visible map region.
  const [allDeals, setAllDeals] = useState([]);
  const [dealsError, setDealsError] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [focusPosition, setFocusPosition] = useState(null);

  useEffect(() => {
    fetchDeals()
      .then((results) => {
        setDeals(results);
        setAllDeals(results);
      })
      .catch(() => setDealsError('Could not load deals.'));
  }, []);

  function handleSearchArea(bounds) {
    fetchDeals(bounds)
      .then(setDeals)
      .catch(() => setDealsError('Could not load deals for this area.'));
  }

  // Distinct "City, ST" combos currently posted to, sorted alphabetically.
  const availableCities = useMemo(() => {
    const map = new Map();
    allDeals.forEach((d) => {
      if (!d.city) return;
      const label = d.state ? `${d.city}, ${d.state}` : d.city;
      if (!map.has(label)) map.set(label, { lat: d.latitude, lng: d.longitude });
    });
    return [...map.entries()]
      .map(([label, position]) => ({ label, position }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allDeals]);

  function handleCitySelect(e) {
    const label = e.target.value;
    if (!label) return;
    const city = availableCities.find((c) => c.label === label);
    if (!city) return;
    setDeals(allDeals); // reset to the full set in case a prior area-search narrowed it
    setFocusPosition(city.position);
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
            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none"
              />
              <select
                onChange={handleCitySelect}
                value=""
                className="w-full appearance-none bg-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm text-brand-navy cursor-pointer outline-none"
              >
                <option value="" disabled>
                  {availableCities.length > 0
                    ? 'Jump to a city with active deals'
                    : 'No active cities yet'}
                </option>
                {availableCities.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative h-[60vh]">
            <DealMap
              dealPoints={visibleDeals.map((d) => ({ lat: d.latitude, lng: d.longitude }))}
              onSearchArea={handleSearchArea}
              focusPosition={focusPosition}
            >
              {visibleDeals.map((deal) => (
                <Marker
                  key={deal.id}
                  position={{ lat: deal.latitude, lng: deal.longitude }}
                  title={deal.business_name}
                  onClick={() => setSelectedDealId(deal.id)}
                />
              ))}
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
              onClick={() => setSelectedDealId(deal.id)}
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

      <DealDetailModal deal={selectedDeal} onClose={() => setSelectedDealId(null)} />
    </AppLayout>
  );
}