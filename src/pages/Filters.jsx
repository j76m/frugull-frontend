import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import CATEGORIES from '../data/categories';

export default function Filters() {
  const navigate = useNavigate();
  // Empty set = "show everything" (no filter applied)
  const [selected, setSelected] = useState(new Set());

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} rightLabel="Apply" onRight={() => navigate(-1)} />
      <div className="p-4">
        <p className="text-brand-gray text-sm mb-4">
          Select categories to show on the map. Leave nothing selected to see everything.
        </p>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.name}
              className="flex items-center justify-between py-3 border-b border-slate-100"
            >
              <span className="text-brand-navy">{cat.name}</span>
              <input
                type="checkbox"
                checked={selected.has(cat.name)}
                onChange={() => toggle(cat.name)}
                className="w-5 h-5 accent-brand-link"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
