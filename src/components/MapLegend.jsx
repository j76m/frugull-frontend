import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getCategoryColor } from '../data/categoryColors';

export default function MapLegend({ categories }) {
  const [expanded, setExpanded] = useState(true);

  if (categories.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white rounded-xl shadow-md text-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 cursor-pointer"
      >
        <span className="text-brand-navy font-medium">Key</span>
        {expanded ? (
          <ChevronDown size={16} className="text-brand-gray" />
        ) : (
          <ChevronUp size={16} className="text-brand-gray" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(cat) }}
              />
              <span className="text-brand-navy text-xs whitespace-nowrap">{cat}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}