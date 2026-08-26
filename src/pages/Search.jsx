import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Marker } from '@react-google-maps/api';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import SeagullMascot from '../components/SeagullMascot';
import DealCard from '../components/DealCard';
import DealMap from '../components/DealMap';
import DealDetailModal from '../components/DealDetailModal';
import MapLegend from '../components/MapLegend';
import { fetchDeals } from '../api/deals';
import { fetchSavedDealIds, saveDeal, unsaveDeal } from '../api/savedDeals';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { getCategoryColor } from '../data/categoryColors';
import { MapPin } from 'lucide-react';

const POST_TYPE_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'deal', label: 'Deals' },
  { value: 'info', label: 'Info' },
];

export default function Search() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const { allSelected, selectedSubs, selectedDiscountTags, selectedDays } = useFilters();
  // Stored in the URL (not plain local state) so it survives navigating
  // to Filters and back — that round trip fully remounts this page, which
  // would otherwise silently reset the toggle back to Map every time.
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'list' ? 'list' : 'map';
  function setView(next) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('view', next);
      return params;
    });
  }
  const [deals, setDeals] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [dealsError, setDealsError] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [focusPosition, setFocusPosition] = useState(null);
  const [savedDealIds, setSavedDealIds] = useState(new Set());
  // null = All, 'deal' = Deals only, 'info' = General Info only.
  const [postTypeFilter, setPostTypeFilter] = useState(null);

  useEffect(() => {
    fetchDeals()
      .then((results) => {
        setDeals(results);
        setAllDeals(results);
        const dealIdFromUrl = new URLSearchParams(window.location.search).get('deal');
        if (dealIdFromUrl) {
          const found = results.find((d) => d.id === dealIdFromUrl);
          if (found) {
            setSelectedDealId(found.id);
            setFocusPosition({ lat: found.latitude, lng: found.longitude });
          }
          window.history.replaceState({}, '', window.location.pathname);
        }
      })
      .catch(() => setDealsError('Could not load deals.'));
  }, []);

  useEffect(() => {
    if (status !== 'authed') return;
    fetchSavedDealIds()
      .then((ids) => setSavedDealIds(new Set(ids)))
      .catch(() => {});
  }, [status]);

  async function handleToggleSave(deal) {
    if (status !== 'authed') {
      navigate('/login');
      return;
    }
    const isSaved = savedDealIds.has(deal.id);
    setSavedDealIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(deal.id);
      else next.add(deal.id);
      return next;
    });
    try {
      if (isSaved) await unsaveDeal(deal.id);
      else await saveDeal(deal.id);
    } catch {
      setSavedDealIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(deal.id);
        else next.delete(deal.id);
        return next;
      });
    }
  }

  function handleSearchArea(bounds) {
    fetchDeals(bounds)
      .then(setDeals)
      .catch(() => setDealsError('Could not load deals for this area.'));
  }

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
    setDeals(allDeals);
    setFocusPosition(city.position);
  }

  const visibleDeals = (allSelected ? deals : deals.filter((deal) => selectedSubs.has(deal.subcategory_name)))
    .filter(
      (deal) =>
        selectedDiscountTags.size === 0 ||
        (deal.discount_tags || []).some((tag) => selectedDiscountTags.has(tag))
    )
    .filter((deal) => {
      // No day filter selected -> show everything, regardless of each
      // deal's own day tagging.
      if (selectedDays.size === 0) return true;
      // A day filter IS active -> only show deals explicitly tagged for
      // at least one selected day. Untagged/"any day" deals are excluded
      // here on purpose - mixing them in would clutter a day-specific
      // search and defeat the point of filtering by day.
      if (!deal.valid_days_of_week || deal.valid_days_of_week.length === 0) return false;
      return deal.valid_days_of_week.some((day) => selectedDays.has(day));
    })
    .filter((deal) => postTypeFilter === null || deal.post_type === postTypeFilter);

  const selectedDeal = visibleDeals.find((d) => d.id === selectedDealId);

  // A stable string that changes only when the actual filter selection
  // changes — used to trigger the map's "re-fit to everything matching"
  // behavior without re-triggering on every unrelated re-render.
  const filterSignal = allSelected ? 'all' : [...selectedSubs].sort().join('|');

  // Distinct category names currently on the map — feeds the legend so it
  // only ever shows colors that are actually in use right now.
  const visibleCategories = useMemo(() => {
    return [...new Set(visibleDeals.map((d) => d.category_name).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [visibleDeals]);

  return (
    <AppLayout>
      <TopNav
        leftLabel="Filter"
        onLeft={() => navigate('/filters')}
        rightLabel={view === 'map' ? 'List' : 'Map'}
        onRight={() => setView(view === 'map' ? 'list' : 'map')}
      />

      {view === 'map' && (
        <>
          <div className="px-4 py-3 flex items-center gap-2">
            <div className="relative w-[150px] flex-shrink-0">
              <MapPin
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none"
              />
              <select
                onChange={handleCitySelect}
                value=""
                className="w-full appearance-none bg-slate-100 rounded-xl pl-9 pr-2 py-3 text-sm text-brand-navy cursor-pointer outline-none"
              >
                <option value="" disabled>
                  {availableCities.length > 0 ? 'Jump to a city' : 'No cities yet'}
                </option>
                {availableCities.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex justify-center gap-1.5">
              {POST_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPostTypeFilter(opt.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
                    postTypeFilter === opt.value
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-brand-link border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Invisible spacer matching the dropdown's width, so the pills
                land dead-center on the full row instead of just the space
                remaining after the dropdown. */}
            <div className="w-[150px] flex-shrink-0" aria-hidden="true" />
          </div>

          <div className="relative h-[60vh]">
            <DealMap
              dealPoints={visibleDeals.map((d) => ({ lat: d.latitude, lng: d.longitude }))}
              onSearchArea={handleSearchArea}
              focusPosition={focusPosition}
              filterSignal={filterSignal}
            >
              {visibleDeals.map((deal) => (
                <Marker
                  key={deal.id}
                  position={{ lat: deal.latitude, lng: deal.longitude }}
                  title={deal.business_name}
                  onClick={() => setSelectedDealId(deal.id)}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE,
                    scale: 9,
                    fillColor: getCategoryColor(deal.category_name),
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                  }}
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

          <MapLegend categories={visibleCategories} />

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
                imageUrl: deal.image_url,
              }}
            />
          ))}
        </div>
      )}

      <DealDetailModal
        deal={selectedDeal}
        onClose={() => setSelectedDealId(null)}
        isSaved={selectedDeal ? savedDealIds.has(selectedDeal.id) : false}
        onToggleSave={handleToggleSave}
      />
    </AppLayout>
  );
}