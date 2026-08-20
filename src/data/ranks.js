// Single source of truth for rank tiers, matching the confirmed gamification
// system: 1 point per deal posted, thresholds per project notes.
export const TIERS = [
  { key: 'egg', label: 'Egg', filename: 'egg', threshold: 0 },
  { key: 'baby_gull', label: 'Baby Gull', filename: 'babygull', threshold: 1 },
  { key: 'gull', label: 'Gull', filename: 'gull', threshold: 10 },
  { key: 'frugull', label: 'Frugull', filename: 'frugull', threshold: 50 },
  { key: 'gullfather', label: 'Gullfather', filename: 'gullfather', threshold: 250 },
];