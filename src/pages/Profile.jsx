import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';

// Loads every tier-ranking icon that actually exists in the folder right
// now. Using import.meta.glob instead of static imports means if a file
// (like gullfather.png) hasn't been added yet, the build doesn't break —
// it just won't show that icon until the file is dropped in.
const rankIcons = import.meta.glob('../assets/tier-rankings/*.png', {
  eager: true,
  import: 'default',
});

// rank_tier values from the backend don't always match filenames exactly
// (e.g. "baby_gull" vs babygull.png), so map each explicitly.
const RANK_TO_FILENAME = {
  egg: 'egg',
  baby_gull: 'babygull',
  gull: 'gull',
  frugull: 'frugull',
  gullfather: 'gullfather',
};

function getRankIconUrl(rankTier) {
  const filename = RANK_TO_FILENAME[rankTier];
  if (!filename) return null;
  const match = Object.entries(rankIcons).find(([path]) =>
    path.endsWith(`/${filename}.png`)
  );
  return match ? match[1] : null;
}

const RANK_LABELS = {
  egg: 'Egg',
  baby_gull: 'Baby Gull',
  gull: 'Gull',
  frugull: 'Frugull',
  gullfather: 'Gullfather',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const rankIconUrl = getRankIconUrl(user?.rank_tier);
  const rankLabel = RANK_LABELS[user?.rank_tier] ?? user?.rank_tier;

  return (
    <AppLayout>
      <TopNav />
      <div className="max-w-sm mx-auto p-4 flex flex-col items-center text-center">
        <div className="w-full bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center gap-2">
          <p className="text-brand-navy font-semibold text-lg">{user?.username}</p>
          <p className="text-brand-gray text-sm">{user?.email}</p>

          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 mt-2">
            {rankIconUrl && (
              <img src={rankIconUrl} alt={rankLabel} className="w-5 h-5 object-contain" />
            )}
            <span className="text-brand-link font-medium text-sm">
              {rankLabel} · {user?.points_balance ?? 0} pts
            </span>
          </div>
        </div>

        <div className="w-full mt-4 pt-4 border-t border-slate-200">
          <p className="text-brand-gray text-sm text-center">
            Post history and full rank progress coming in step 6.
          </p>
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-xl bg-slate-100 text-brand-navy font-medium py-3 cursor-pointer hover:bg-slate-200 transition-colors"
        >
          Log out
        </button>
      </div>
    </AppLayout>
  );
}