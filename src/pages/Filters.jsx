import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TopNav from '../components/TopNav';
import CATEGORIES from '../data/categories';

export default function Filters() {
  const navigate = useNavigate();
  const [allSelected, setAllSelected] = useState(true);
  const [selectedSubs, setSelectedSubs] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());

  function selectAll() {
    setAllSelected(true);
    setSelectedSubs(new Set());
  }

  function toggleExpanded(name) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleSub(subName) {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(subName)) next.delete(subName);
      else next.add(subName);
      // Picking any specific subcategory means we're no longer showing
      // everything. If they uncheck their way back down to nothing
      // selected, fall back to "All" rather than showing zero results.
      setAllSelected(next.size === 0);
      return next;
    });
  }

  // Selects/clears every subcategory within a single category at once —
  // scoped to that category rather than the whole site, since a single
  // global "everything" toggle doesn't hold up once there's real deal volume.
  function toggleCategoryAll(cat) {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      const allInCategorySelected = cat.subcategories.every((s) => next.has(s));
      if (allInCategorySelected) {
        cat.subcategories.forEach((s) => next.delete(s));
      } else {
        cat.subcategories.forEach((s) => next.add(s));
      }
      setAllSelected(next.size === 0);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} rightLabel="Apply" onRight={() => navigate(-1)} />
      <div className="max-w-md mx-auto p-4">
        <p className="text-brand-gray text-sm mb-4 text-center">
          Select categories to show on the map.
        </p>

        <label className="flex items-center gap-2 py-3 border-b border-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={selectAll}
            className="w-4 h-4 accent-brand-link cursor-pointer"
          />
          <span className="text-brand-navy font-semibold">All</span>
        </label>

        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isExpanded = expanded.has(cat.name);
            const sortedSubs = [...cat.subcategories].sort((a, b) => a.localeCompare(b));
            const allInCategorySelected = cat.subcategories.every((s) => selectedSubs.has(s));

            return (
              <div key={cat.name} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleExpanded(cat.name)}
                  className="w-full flex items-center justify-between py-3 cursor-pointer"
                >
                  <span className="text-brand-navy font-medium">{cat.name}</span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-brand-gray" />
                  ) : (
                    <ChevronDown size={18} className="text-brand-gray" />
                  )}
                </button>

                {isExpanded && (
                  <div className="pb-3 pl-2 space-y-2">
                    <label className="flex items-center gap-2 py-1 cursor-pointer border-b border-slate-100 pb-2 mb-1">
                      <input
                        type="checkbox"
                        checked={allInCategorySelected}
                        onChange={() => toggleCategoryAll(cat)}
                        className="w-4 h-4 accent-brand-link cursor-pointer"
                      />
                      <span className="text-brand-navy text-sm font-medium">
                        All {cat.name}
                      </span>
                    </label>

                    {sortedSubs.map((sub) => (
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