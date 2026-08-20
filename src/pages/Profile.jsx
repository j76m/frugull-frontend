import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import RankProgress from '../components/RankProgress';
import { useAuth } from '../context/AuthContext';
import { TIERS } from '../data/ranks';
import { getRankIconUrl } from '../utils/rankIcons';

export default function Profile() {
  const { user, logout } = useAuth();
  const currentTier = TIERS.find((t) => t.key === user?.rank_tier);
  const rankIconUrl = currentTier ? getRankIconUrl(currentTier.filename) : null;

  return (
    <AppLayout>
      <TopNav />
      <div className="max-w-sm mx-auto p-4 flex flex-col items-center text-center">
        <div className="w-full mb-6">
          <RankProgress points={user?.points_balance} />
        </div>

        <div className="w-full bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center gap-2">
          <p className="text-brand-navy font-semibold text-lg">{user?.username}</p>

          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 mt-1">
            {rankIconUrl && (
              <img src={rankIconUrl} alt={currentTier?.label} className="w-5 h-5 object-contain" />
            )}
            <span className="text-brand-link font-medium text-sm">
              {currentTier?.label ?? user?.rank_tier} · {user?.points_balance ?? 0} pts
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