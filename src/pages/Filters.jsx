import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TopNav from '../components/TopNav';
import CATEGORIES from '../data/categories';
import { useFilters } from '../context/FilterContext';

export default function Filters() {
  const navigate = useNavigate();
  const { allSelected, selectedSubs, toggleAll, toggleSub, clearSelections } = useFilters();
  // Starts pre-expanded for any category that already has a selection
  // (so arriving on this screen shows what's active), but after that it's
  // entirely user-controlled — selecting/deselecting items never
  // auto-collapses or auto-expands anything on its own.
  const [expanded, setExpanded] = useState(() => {
    const initial = new Set();
    CATEGORIES.forEach((cat) => {
      const items = cat.subcategories.length > 0 ? cat.subcategories : [cat.name];
      if (items.some((i) => selectedSubs.has(i))) initial.add(cat.name);
    });
    return initial;
  });

  function toggleExpanded(name) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  // Toggles every item within a category at once. Categories with no real
  // subcategories (e.g. Retail) use their own name as a stand-in "item" so
  // they go through the exact same expand/All pattern as every other
  // category, instead of needing a separate visual treatment.
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

        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const items = cat.subcategories.length > 0 ? cat.subcategories : [cat.name];
            const sortedItems = [...items].sort((a, b) => a.localeCompare(b));
            const allInCategorySelected = items.every((s) => selectedSubs.has(s));
            const isFlat = cat.subcategories.length === 0;
            const selectedCount = items.filter((s) => selectedSubs.has(s)).length;
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
                        onChange={() => toggleCategoryAll(items)}
                        className="w-4 h-4 accent-brand-link cursor-pointer"
                      />
                      <span className="text-brand-navy text-sm font-medium">
                        All {cat.name}
                      </span>
                    </label>

                    {!isFlat &&
                      sortedItems.map((sub) => (
                        <label
                          key={sub}
                          className="flex items-center gap-2 py-1 cursor-pointer"
                        >
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