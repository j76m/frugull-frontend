import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TopNav from '../components/TopNav';
import CATEGORIES from '../data/categories';
import { fetchDeals } from '../api/deals';
import { useFilters } from '../context/FilterContext';

export default function Filters() {
  const navigate = useNavigate();
  const { allSelected, selectedSubs, toggleAll, toggleSub, clearSelections } = useFilters();
  const [deals, setDeals] = useState(null); // null = still loading
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchDeals()
      .then(setDeals)
      .catch(() => setLoadError('Could not load current deal types.'));
  }, []);

  // Only show categories/subcategories that have at least one active deal
  // right now — showing the full static taxonomy here would let people
  // filter down to something with zero results, which is misleading. The
  // full list still lives on the Post screen so people can post into a
  // brand-new subcategory even before anyone else has.
  const ACTIVE_CATEGORIES = useMemo(() => {
    if (!deals) return [];
    const activeNames = new Set(deals.map((d) => d.subcategory_name));
    return CATEGORIES.map((cat) => ({
      ...cat,
      subcategories: cat.subcategories.filter((s) => activeNames.has(s)),
    })).filter((cat) => cat.subcategories.length > 0);
  }, [deals]);

  // Starts pre-expanded for any category that already has a selection
  // (so arriving on this screen shows what's active), but after that it's
  // entirely user-controlled — selecting/deselecting items never
  // auto-collapses or auto-expands anything on its own.
  const [expanded, setExpanded] = useState(new Set());
  useEffect(() => {
    const initial = new Set();
    ACTIVE_CATEGORIES.forEach((cat) => {
      if (cat.subcategories.some((i) => selectedSubs.has(i))) initial.add(cat.name);
    });
    setExpanded(initial);
    // Only run this once, right when the active category list first
    // becomes available — not on every selection change afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals !== null]);

  function toggleExpanded(name) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleCategoryAll(items) {
    const allSelectedInGroup = items.every((s) => selectedSubs.has(s));
    items.forEach((item) => {
      const isSelected = selectedSubs.has(item);
      if (allSelectedInGroup && isSelected) toggleSub(item);
      if (!allSelectedInGroup && !isSelected) toggleSub(item);
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} rightLabel="Apply" onRight={() => navigate(-1)} />
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-brand-gray text-sm">Select categories to show on the map.</p>
          <button
            type="button"
            onClick={clearSelections}
            className="text-brand-link text-xs font-medium cursor-pointer hover:underline whitespace-nowrap ml-3"
          >
            Clear Selections
          </button>
        </div>

        <label className="flex items-center gap-2 py-3 border-b border-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 accent-brand-link cursor-pointer"
          />
          <span className="text-brand-navy font-semibold">All</span>
        </label>

        {loadError && <p className="text-red-500 text-sm text-center mt-4">{loadError}</p>}

        {deals === null && !loadError && (
          <p className="text-brand-gray text-sm text-center mt-4">Loading current deal types...</p>
        )}

        {deals !== null && ACTIVE_CATEGORIES.length === 0 && !loadError && (
          <p className="text-brand-gray text-sm text-center mt-4">
            No active deals yet — check back soon.
          </p>
        )}

        <div className="space-y-1">
          {ACTIVE_CATEGORIES.map((cat) => {
            const sortedItems = [...cat.subcategories].sort((a, b) => a.localeCompare(b));
            const allInCategorySelected = cat.subcategories.every((s) => selectedSubs.has(s));
            const selectedCount = cat.subcategories.filter((s) => selectedSubs.has(s)).length;
            const hasSelections = selectedCount > 0;
            const isExpanded = expanded.has(cat.name);

            return (
              <div key={cat.name} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleExpanded(cat.name)}
                  className="w-full flex items-center justify-between py-3 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        hasSelections ? 'text-brand-link' : 'text-brand-navy'
                      }`}
                    >
                      {cat.name}
                    </span>
                    {hasSelections && (
                      <span className="text-[11px] font-semibold text-brand-link bg-blue-50 rounded-full px-2 py-0.5">
                        {selectedCount}
                      </span>
                    )}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={18} className={hasSelections ? 'text-brand-link' : 'text-brand-gray'} />
                  ) : (
                    <ChevronDown size={18} className={hasSelections ? 'text-brand-link' : 'text-brand-gray'} />
                  )}
                </button>

                {isExpanded && (
                  <div className="pb-3 pl-2 space-y-2">
                    <label className="flex items-center gap-2 py-1 cursor-pointer border-b border-slate-100 pb-2 mb-1">
                      <input
                        type="checkbox"
                        checked={allInCategorySelected}
                        onChange={() => toggleCategoryAll(cat.subcategories)}
                        className="w-4 h-4 accent-brand-link cursor-pointer"
                      />
                      <span className="text-brand-navy text-sm font-medium">
                        All {cat.name}
                      </span>
                    </label>

                    {sortedItems.map((sub) => (
                      <label key={sub} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSubs.has(sub)}
                          onChange={() => toggleSub(sub)}
                          className="w-4 h-4 accent-brand-link cursor-pointer"
                        />
                        <span className="text-brand-navy text-sm">{sub}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}