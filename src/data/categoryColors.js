// Maps each top-level category name to a pin color for the map. Keep this
// in sync with the category names in src/data/categories.js and whatever
// the backend's categories table actually contains.
const CATEGORY_COLORS = {
  Food: '#22c55e', // green
  Drink: '#ef4444', // red
  'Personal Care': '#eab308', // yellow
  'Auto Care': '#1f2937', // black
  'Home Care': '#78350f', // brown
  Recreation: '#f97316', // orange
  'Public Art': '#a855f7', // purple
  'For Sale by Owner': '#ec4899', // pink
  Employment: '#3b82f6', // blue
  'Property Rental': '#6b7280', // gray
  Retail: '#d4af37', // gold
};

const DEFAULT_COLOR = '#2F6FBB'; // brand blue fallback for any unmapped category

export function getCategoryColor(categoryName) {
  return CATEGORY_COLORS[categoryName] || DEFAULT_COLOR;
}

export default CATEGORY_COLORS;