// Maps each top-level category name to a pin color for the map. Keep this
// in sync with the category names in src/data/categories.js and whatever
// the backend's categories table actually contains.
//
// Each live category gets one distinct hue, paired by color psychology.
// Names must match the categories table exactly - an unmatched name
// silently falls back to DEFAULT_COLOR (this caused several categories
// to render as the same blue before 9/28/26). Green is reserved for
// Farm Stands only.
const CATEGORY_COLORS = {
  Restaurants: '#ef4444', // red - appetite, urgency
  Beverages: '#3b82f6', // blue - refreshing
  'Personal Care': '#a855f7', // purple - pampering, self-care
  'Auto Care': '#64748b', // slate - steel, dependable
  Activities: '#f97316', // orange - energy, fun
  Retail: '#eab308', // yellow - attention, sale signs
  Dispensary: '#111827', // near-black - discreet, premium
  'Community Happenings': '#ec4899', // pink - celebration
  'Farm Stands': '#16a34a', // green - fresh, natural (only green)
  'Yard/Garage Sale': '#92400e', // brown - cardboard boxes, secondhand
  'Help Wanted': '#0891b2', // teal - opportunity, fresh start

  // Hidden categories - no live pins. If any are re-enabled, pick a
  // color that doesn't collide with the live set above.
  'Food Trucks': '#16a34a',
  'Home Care': '#78350f',
  'Public Art': '#6366f1',
  'For Sale by Owner': '#ec4899',
  'Property Rental': '#6b7280',
};

const DEFAULT_COLOR = '#2F6FBB'; // brand blue fallback for any unmapped category

export function getCategoryColor(categoryName) {
  return CATEGORY_COLORS[categoryName] || DEFAULT_COLOR;
}

export default CATEGORY_COLORS;