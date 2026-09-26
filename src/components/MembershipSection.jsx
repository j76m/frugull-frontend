import { useEffect, useState } from 'react';
import { fetchSubscriptionStatus, cancelUnlimited } from '../api/subscriptions';
import { fetchCreditBalance } from '../api/credits';
import { startCheckout } from '../api/billing';

export default function MembershipSection() {
  const [subscription, setSubscription] = useState(null);
  const [credits, setCredits] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [billingInterval, setBillingInterval] = useState('monthly');

  useEffect(() => {
    loadStatus();

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const timers = [];

    if (checkout === 'success') {
      setNotice('Payment received. Updating your membership…');
      [1500, 4000, 8000].forEach((delay) => {
        timers.push(setTimeout(loadStatus, delay));
      });
      timers.push(setTimeout(() => setNotice(''), 9000));
    } else if (checkout === 'canceled') {
      setNotice('Checkout canceled. You were not charged.');
      timers.push(setTimeout(() => setNotice(''), 6000));
    }

    if (checkout) {
      params.delete('checkout');
      const query = params.toString();
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (query ? `?${query}` : '') + window.location.hash
      );
    }

    function handlePageShow(e) {
      if (e.persisted) setBusy(false);
    }
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('pageshow', handlePageShow);
    };
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

  async function handleCheckout(product, fallbackMessage) {
    setBusy(true);
    setError('');
    try {
      const url = await startCheckout(product);
      window.location.href = url;
    } catch (err) {
      setError(err?.response?.data?.error || fallbackMessage);
      setBusy(false);
    }
  }

  function handleUpgrade() {
    const product = billingInterval === 'six_month' ? 'unlimited_six_month' : 'unlimited_monthly';
    handleCheckout(product, 'Could not start checkout. Please try again.');
  }

  function handleBuyCredits() {
    handleCheckout('credits_five', 'Could not start checkout. Please try again.');
  }

  async function handleCancel() {
    setBusy(true);
    setError('');
    try {
      await cancelUnlimited();
      await loadStatus();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not cancel. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const isUnlimited = subscription?.plan === 'unlimited';

  return (
    <div className="mt-6 pt-4 border-t border-slate-200">
      <div className="max-w-sm mx-auto">
        <p className="text-brand-navy font-medium text-sm px-4 mb-3">Membership</p>

        {notice && <p className="text-brand-navy text-sm px-4 mb-3">{notice}</p>}
        {error && <p className="text-red-500 text-sm px-4 mb-3">{error}</p>}

        <div className="px-4">
          {isUnlimited ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-brand-navy font-semibold">Frugull Unlimited</p>
              <p className="text-brand-gray text-sm mt-1">
                {subscription.billingInterval === 'six_month' ? '6-month plan' : 'Monthly plan'}
                {subscription.currentPeriodEnd && (
                  <>
                    {' · '}
                    {subscription.autoRenew ? 'Auto-renews' : 'Ends'} on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </>
                )}
              </p>
              {subscription.autoRenew && subscription.currentPeriodEnd && (
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
              <div className="flex gap-2 mb-4">
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

              <button
                onClick={handleUpgrade}
                disabled={busy}
                className="w-full rounded-xl bg-brand-navy text-white font-medium py-3 disabled:opacity-50"
              >
                Upgrade to Frugull Unlimited
              </button>
              <p className="text-brand-gray text-xs mt-2 text-center">
                Renews automatically. Turn off anytime.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
            <p className="text-brand-navy font-semibold">Credits</p>
            <p className="text-brand-gray text-sm mt-1 mb-4">
              {credits ?? 0} credit{credits === 1 ? '' : 's'} available · each covers one
              business + subcategory slot for up to 30 days
            </p>
            <button
              onClick={handleBuyCredits}
              disabled={busy}
              className="w-full rounded-lg border-2 border-brand-navy text-brand-navy font-medium py-2 text-sm hover:bg-brand-navy hover:text-white transition-colors disabled:opacity-50"
            >
              Buy 5 — $15
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}