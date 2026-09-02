import { useEffect, useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import RankProgress from '../components/RankProgress';
import DealCard from '../components/DealCard';
import DealDetailModal from '../components/DealDetailModal';
import MembershipSection from '../components/MembershipSection';
import { useAuth } from '../context/AuthContext';
import { TIERS } from '../data/ranks';
import { getRankIconUrl } from '../utils/rankIcons';
import { fetchSavedDeals, unsaveDeal } from '../api/savedDeals';
import { fetchSubscriptionStatus } from '../api/subscriptions';
import { fetchMyDeals, updateDeal, deleteDeal } from '../api/deals';

function formatExpiration(expiresAt) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (diffDays <= 0) return `Expired ${dateLabel}`;
  if (diffDays === 1) return `Expires tomorrow`;
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  return `Expires ${dateLabel}`;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const currentTier = TIERS.find((t) => t.key === user?.rank_tier);
  const rankIconUrl = currentTier ? getRankIconUrl(currentTier.filename) : null;

  const [savedDeals, setSavedDeals] = useState([]);
  const [savedError, setSavedError] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [expandedSavedId, setExpandedSavedId] = useState(null);

  const [plan, setPlan] = useState(null);
  const [myDeals, setMyDeals] = useState([]);
  const [myDealsError, setMyDealsError] = useState('');
  const [expandedDealId, setExpandedDealId] = useState(null);
  const [editingDealId, setEditingDealId] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchSavedDeals()
      .then(setSavedDeals)
      .catch(() => setSavedError('Could not load saved deals.'));
  }, []);

  useEffect(() => {
    fetchSubscriptionStatus()
      .then((sub) => setPlan(sub?.plan ?? 'free'))
      .catch(() => setPlan('free'));
  }, []);

  useEffect(() => {
    if (plan !== 'unlimited') return;
    fetchMyDeals()
      .then(setMyDeals)
      .catch(() => setMyDealsError('Could not load your posts.'));
  }, [plan]);

  const selectedDeal = savedDeals.find((d) => d.id === selectedDealId);

  async function handleUnsave(deal) {
    setSavedDeals((prev) => prev.filter((d) => d.id !== deal.id));
    try {
      await unsaveDeal(deal.id);
    } catch {
      setSavedDeals((prev) => [...prev, deal]);
    }
  }

  function startEdit(deal) {
    setEditingDealId(deal.id);
    setEditCaption(deal.caption || '');
  }

  function cancelEdit() {
    setEditingDealId(null);
    setEditCaption('');
  }

  async function saveEdit(dealId) {
    setSavingEdit(true);
    try {
      const updated = await updateDeal(dealId, { caption: editCaption });
      setMyDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...updated } : d)));
      setEditingDealId(null);
    } catch {
      setMyDealsError('Could not save changes. Try again.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(dealId) {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    const prev = myDeals;
    setMyDeals((cur) => cur.filter((d) => d.id !== dealId));
    try {
      await deleteDeal(dealId);
    } catch {
      setMyDeals(prev);
      setMyDealsError('Could not delete post. Try again.');
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
      </div>

      <MembershipSection />

      {plan === 'unlimited' && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-brand-navy font-medium text-sm px-4 mb-3">My Posts</p>

          {myDealsError && <p className="text-red-500 text-sm px-4">{myDealsError}</p>}

          {!myDealsError && myDeals.length === 0 && (
            <p className="text-brand-gray text-sm px-4">
              No active posts yet — deals you post will show up here for editing.
            </p>
          )}

          <div className="flex flex-col gap-3 px-4">
            {myDeals.map((deal) => {
              const isExpanded = expandedDealId === deal.id;
              const isEditing = editingDealId === deal.id;
              const expirationLabel = formatExpiration(deal.expires_at);

              return (
                <div key={deal.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}
                    className="cursor-pointer w-full flex items-start justify-between gap-3 p-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-brand-navy font-medium text-sm truncate">{deal.business_name}</p>
                      <p className="text-brand-gray text-xs">{deal.subcategory_name}</p>
                      {deal.caption && (
                        <p className="text-brand-gray text-xs mt-1 line-clamp-1">{deal.caption}</p>
                      )}
                      {expirationLabel && (
                        <p className="text-brand-link text-xs font-medium mt-1">{expirationLabel}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 pt-0.5">
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-brand-gray" />
                      ) : (
                        <ChevronDown size={18} className="text-brand-gray" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {deal.image_url && (
                        <div className="w-full bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          <img
                            src={deal.image_url}
                            alt={deal.business_name}
                            className="w-full max-h-80 object-contain"
                          />
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-brand-navy text-xs font-medium">Post description</label>
                          <textarea
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border-2 border-slate-300 focus:border-brand-link p-2 text-sm text-brand-navy outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(deal.id)}
                              disabled={savingEdit}
                              className="cursor-pointer flex-1 rounded-lg bg-brand-navy text-white text-sm font-medium py-2 disabled:opacity-50"
                            >
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="cursor-pointer flex-1 rounded-lg bg-slate-100 text-brand-navy text-sm font-medium py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {deal.caption && (
                            <p className="text-brand-gray text-sm mb-3 whitespace-pre-wrap">{deal.caption}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(deal)}
                              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-brand-navy text-sm font-medium py-2 hover:bg-slate-200"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(deal.id)}
                              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium py-2 hover:bg-red-100"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-brand-navy font-medium text-sm px-4 mb-3">Saved Deals</p>

        {savedError && <p className="text-red-500 text-sm px-4">{savedError}</p>}

        {!savedError && savedDeals.length === 0 && (
          <p className="text-brand-gray text-sm px-4">
            Nothing saved yet — tap the heart on any deal to keep it here.
          </p>
        )}

        <div className="flex flex-col gap-3 px-4">
          {savedDeals.map((deal) => {
            const isExpanded = expandedSavedId === deal.id;

            return (
              <div key={deal.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSavedId(isExpanded ? null : deal.id)}
                  className="cursor-pointer w-full flex items-start justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-brand-navy font-medium text-sm truncate">{deal.business_name}</p>
                    {deal.subcategory_name && (
                      <p className="text-brand-gray text-xs">{deal.subcategory_name}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-brand-gray" />
                    ) : (
                      <ChevronDown size={18} className="text-brand-gray" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    {deal.image_url && (
                      <div className="w-full bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={deal.image_url}
                          alt={deal.business_name}
                          className="w-full max-h-80 object-contain"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDealId(deal.id)}
                        className="cursor-pointer flex-1 rounded-lg bg-slate-100 text-brand-navy text-sm font-medium py-2 hover:bg-slate-200"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnsave(deal)}
                        className="cursor-pointer flex-1 rounded-lg bg-red-50 text-red-600 text-sm font-medium py-2 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-sm mx-auto p-4">
        <button
          onClick={logout}
          className="w-full rounded-xl bg-slate-100 text-brand-navy font-medium py-3 cursor-pointer hover:bg-slate-200 transition-colors"
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