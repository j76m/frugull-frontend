import { getCategoryColor } from '../data/categoryColors';

// Sits below the map (in normal document flow, not floating on top of it),
// so it never blocks pins. One shared outline wraps the whole set — not
// individual pills per category — since separate bordered pills read as
// clickable buttons, which these aren't.
export default function MapLegend({ categories }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-3 bg-white">
      <div className="flex items-center gap-3">
        <span className="text-brand-navy text-sm font-medium whitespace-nowrap">Map Legend</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-brand-link rounded-full px-4 py-1.5">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(cat) }}
              />
              <span className="text-brand-navy text-sm font-medium whitespace-nowrap">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-brand-gray text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-gray flex-shrink-0" />
          <span>Deal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-brand-gray flex-shrink-0" />
          <span>Info</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-brand-gray flex-shrink-0">★</span>
          <span>Frugull Unlimited</span>
        </div>
      </div>
    </div>
  );
}