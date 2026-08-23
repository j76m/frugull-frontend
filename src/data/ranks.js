// Single source of truth for rank tiers, matching the confirmed gamification
// system: 1 point per deal posted. "Gullfather" is retired as an earnable
// rank — it's Jeremy's own reserved title, not something users can reach
// through points. "Frugull" (the app's own name) is now the top tier.
export const TIERS = [
  { key: 'egg', label: 'Egg', filename: 'egg', threshold: 0 },
  { key: 'baby_gull', label: 'Baby Gull', filename: 'babygull', threshold: 1 },
  { key: 'gull', label: 'Gull', filename: 'gull', threshold: 10 },
  { key: 'gull_star', label: 'Gull Star', filename: 'gullstar', threshold: 50 },
  { key: 'frugull', label: 'Frugull', filename: 'frugull', threshold: 250 },
];