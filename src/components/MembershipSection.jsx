import { useEffect, useState } from 'react';
import { fetchSubscriptionStatus, activateUnlimited, cancelUnlimited } from '../api/subscriptions';
import { fetchCreditBalance, purchaseCredits } from '../api/credits';

export default function MembershipSection() {
  const [subscription, setSubscription] = useState(null);
  const [credits, setCredits] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [billingInterval, setBillingInterval] = useState('monthly');
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const [sub, bal] = await Promise.all([fetchSubscriptionStatus(), fetchCreditBalance()]);
      setSubscription(sub);
      setCredits(bal);
    } catch {
      setError('Could not load membership status.');
    }
  }

  async function handleActivate() {
    setBusy(true);
    setError('');
    try {
      const sub = await activateUnlimited(billingInterval, autoRenew);
      setSubscription({
        plan: sub.plan,
        status: sub.status,
        billingInterval: sub.billing_interval,
        autoRenew: sub.auto_renew,
        currentPeriodEnd: sub.current_period_end,
      });
    } catch {
      setError('Could not activate Frugull Unlimited. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError('');
    try {
      await cancelUnlimited();
      await loadStatus();
    } catch {
      setError('Could not cancel. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyCredits(pack) {
    setBusy(true);
    setError('');
    try {
      const result = await purchaseCredits(pack);
      setCredits(result.credits);
    } catch {
      setError('Could not complete credit purchase. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const isUnlimited = subscription?.plan === 'unlimited';

  return (
    <div className="mt-6 pt-4 border-t border-slate-200">
      <div className="max-w-sm mx-auto">
        <p className="text-brand-navy font-medium text-sm px-4 mb-3">Membership</p>

        {error && <p className="text-red-500 text-sm px-4 mb-3">{error}</p>}

        <div className="px-4">
          {isUnlimited ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-brand-navy font-semibold">Frugull Unlimited</p>
              <p className="text-brand-gray text-sm mt-1">
                {subscription.billingInterval === 'six_month' ? '6-month plan' : 'Monthly plan'} ·{' '}
                {subscription.autoRenew ? 'Auto-renews' : 'Ends'} on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
              {subscription.autoRenew && (
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="mt-3 text-sm text-brand-link underline disabled:opacity-50"
                >
                  Turn off auto-renew
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-brand-navy font-semibold">Frugull Free</p>
              <p className="text-brand-gray text-sm mt-1 mb-4">
                1 post per business + subcategory every 7 days.
              </p>

              <p className="text-brand-navy font-medium text-sm mb-2">Upgrade to Unlimited</p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    billingInterval === 'monthly'
                      ? 'bg-brand-navy text-white'
                      : 'bg-slate-100 text-brand-navy'
                  }`}
                >
                  $30/mo
                </button>
                <button
                  onClick={() => setBillingInterval('six_month')}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    billingInterval === 'six_month'
                      ? 'bg-brand-navy text-white'
                      : 'bg-slate-100 text-brand-navy'
                  }`}
                >
                  $150/6mo
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm text-brand-gray mb-4">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                />
                Auto-renew
              </label>

              <button
                onClick={handleActivate}
                disabled={busy}
                className="w-full rounded-xl bg-brand-navy text-white font-medium py-3 disabled:opacity-50"
              >
                Activate Frugull Unlimited
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
            <p className="text-brand-navy font-semibold">Credits</p>
            <p className="text-brand-gray text-sm mt-1 mb-4">
              {credits ?? 0} credit{credits === 1 ? '' : 's'} available · each covers one
              business + subcategory slot for up to 30 days
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBuyCredits('five')}
                disabled={busy}
                className="flex-1 rounded-lg border-2 border-brand-navy text-brand-navy font-medium py-2 text-sm hover:bg-brand-navy hover:text-white transition-colors disabled:opacity-50"
              >
                Buy 5 — $10
              </button>
              <button
                onClick={() => handleBuyCredits('ten')}
                disabled={busy}
                className="flex-1 rounded-lg border-2 border-brand-navy text-brand-navy font-medium py-2 text-sm hover:bg-brand-navy hover:text-white transition-colors disabled:opacity-50"
              >
                Buy 10 — $20
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}