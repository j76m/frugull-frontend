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