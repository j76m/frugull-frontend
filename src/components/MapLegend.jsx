import { getCategoryColor } from '../data/categoryColors';

// Sits below the map (in normal document flow, not floating on top of it),
// so it never blocks pins. Centered as a group, growing left-to-right —
// not a stacked list — since it only ever needs to show a handful of
// categories at a time.
export default function MapLegend({ categories }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 bg-white">
      {categories.map((cat) => (
        <div
          key={cat}
          className="flex items-center gap-1.5 border border-brand-link rounded-full px-3 py-1.5"
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: getCategoryColor(cat) }}
          />
          <span className="text-brand-navy text-sm font-medium whitespace-nowrap">{cat}</span>
        </div>
      ))}
    </div>
  );
}