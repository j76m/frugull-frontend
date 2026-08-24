import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import RankProgress from '../components/RankProgress';
import DealCard from '../components/DealCard';
import DealDetailModal from '../components/DealDetailModal';
import { useAuth } from '../context/AuthContext';
import { TIERS } from '../data/ranks';
import { getRankIconUrl } from '../utils/rankIcons';
import { fetchSavedDeals, unsaveDeal } from '../api/savedDeals';

export default function Profile() {
  const { user, logout } = useAuth();
  const currentTier = TIERS.find((t) => t.key === user?.rank_tier);
  const rankIconUrl = currentTier ? getRankIconUrl(currentTier.filename) : null;

  const [savedDeals, setSavedDeals] = useState([]);
  const [savedError, setSavedError] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(null);

  useEffect(() => {
    fetchSavedDeals()
      .then(setSavedDeals)
      .catch(() => setSavedError('Could not load saved deals.'));
  }, []);

  const selectedDeal = savedDeals.find((d) => d.id === selectedDealId);

  async function handleUnsave(deal) {
    setSavedDeals((prev) => prev.filter((d) => d.id !== deal.id));
    try {
      await unsaveDeal(deal.id);
    } catch {
      setSavedDeals((prev) => [...prev, deal]);
    }
  }

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

        <div className="w-full mt-6 pt-4 border-t border-slate-200">
          <p className="text-brand-navy font-medium text-sm mb-3 text-left">Saved Deals</p>

          {savedError && <p className="text-red-500 text-sm">{savedError}</p>}

          {!savedError && savedDeals.length === 0 && (
            <p className="text-brand-gray text-sm">
              Nothing saved yet — tap the heart on any deal to keep it here.
            </p>
          )}

          {savedDeals.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {savedDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  onClick={() => setSelectedDealId(deal.id)}
                  deal={{
                    id: deal.id,
                    businessName: deal.business_name,
                    subcategoryName: deal.subcategory_name,
                    views: deal.view_count,
                    imageUrl: deal.image_url,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-xl bg-slate-100 text-brand-navy font-medium py-3 cursor-pointer hover:bg-slate-200 transition-colors"
        >
          Log out
        </button>
      </div>

      <DealDetailModal
        deal={selectedDeal}
        onClose={() => setSelectedDealId(null)}
        isSaved={true}
        onToggleSave={handleUnsave}
      />
    </AppLayout>
  );
}