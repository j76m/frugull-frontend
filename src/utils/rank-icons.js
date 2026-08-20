// Loads every tier-ranking icon that actually exists right now. Using
// import.meta.glob instead of static imports means a not-yet-added file
// (like gullfather.png) won't break the build — it just won't render an
// icon for that tier until the file is dropped into the folder.
const rankIconModules = import.meta.glob('../assets/tier-rankings/*.png', {
  eager: true,
  import: 'default',
});

export function getRankIconUrl(filename) {
  const match = Object.entries(rankIconModules).find(([path]) =>
    path.endsWith(`/${filename}.png`)
  );
  return match ? match[1] : null;
}