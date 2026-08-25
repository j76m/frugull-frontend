// Maps each top-level category name to a pin color for the map. Keep this
// in sync with the category names in src/data/categories.js and whatever
// the backend's categories table actually contains.
//
// The 6 original active categories use the 3 primary colors plus their 3
// blends — evenly spaced around the whole color wheel instead of
// clustering in one temperature zone. Dispensary uses black instead of a
// 7th hue: any new color has to sit near one of the existing six on the
// wheel, but black stands apart on lightness/contrast instead, so it
// reads as unmistakably different rather than "close to but different
// from" everything else.
const CATEGORY_COLORS = {
  Food: '#22c55e', // green
  Beverages: '#3b82f6', // blue
  'Personal Care': '#a855f7', // purple
  'Auto Care': '#ef4444', // red
  Recreation: '#f97316', // orange
  Retail: '#eab308', // yellow
  Dispensary: '#111827', // near-black

  // Hidden from Post for now — kept distinct in case these categories
  // ever get re-enabled, but not a priority to perfectly harmonize since
  // they won't have live pins on the map currently.
  'Home Care': '#78350f', // brown
  'Public Art': '#6366f1', // indigo
  'For Sale by Owner': '#ec4899', // pink
  Employment: '#64748b', // slate
  'Property Rental': '#6b7280', // gray
};

const DEFAULT_COLOR = '#2F6FBB'; // brand blue fallback for any unmapped category

export function getCategoryColor(categoryName) {
  return CATEGORY_COLORS[categoryName] || DEFAULT_COLOR;
}

export default CATEGORY_COLORS;