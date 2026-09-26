import { useEffect, useState } from 'react';
import {
  fetchSubscriptionStatus,
  cancelUnlimited,
  resumeUnlimited,
  addLocationSlot,
  removeLocationSlot,
} from '../api/subscriptions';
import { fetchCreditBalance } from '../api/credits';
import { startCheckout } from '../api/billing';

export default function MembershipSection() {
  const [subscription, setSubscription] = useState(null);
  const [credits, setCredits] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [billingInterval, setBillingInterval] = useState('monthly');
  const [autoRenew, setAutoRenew] = useState(true);

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

  async function handleCheckout(product, renew) {
    setBusy(true);
    setError('');
    try {
      const url = await startCheckout(product, renew);
      window.location.href = url;
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not start checkout. Please try again.');
      setBusy(false);
    }
  }

  function handleUpgrade() {
    const product = billingInterval === 'six_month' ? 'unlimited_six_month' : 'unlimited_monthly';
    handleCheckout(product, autoRenew);
  }

  function handleBuyCredits() {
    handleCheckout('credits_five', true);
  }

  async function runAction(action, successMessage, fallbackMessage) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await loadStatus();
      if (successMessage) {
        setNotice(successMessage);
        setTimeout(() => setNotice(''), 6000);
      }
    } catch (err) {
      setError(err?.response?.data?.error || fallbackMessage);
    } finally {
      setBusy(false);
    }
  }

  function handleToggleAutoRenew(turnOn) {
    runAction(
      turnOn ? resumeUnlimited : cancelUnlimited,
      null,
      `Could not turn ${turnOn ? 'on' : 'off'} auto-renew. Please try again.`
    );
  }

  const isUnlimited = subscription?.plan === 'unlimited';
  const isSixMonth = subscription?.billingInterval === 'six_month';
  const addPrice = isSixMonth ? '$75/6mo' : '$15/mo';
  const slots = subscription?.locationSlots ?? 1;
  const slotBusinesses = subscription?.slotBusinesses ?? [];
  const used = slotBusinesses.length;
  const showLocations = isUnlimited && !subscription?.isComped && subscription?.currentPeriodEnd;

  function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function handleAddLocation() {
    const ok = window.confirm(
      `Add a location for ${addPrice}? You'll be charged a prorated amount today for the rest of your current billing period, then ${addPrice} with each renewal.`
    );
    if (!ok) return;
    runAction(addLocationSlot, 'Location added.', 'Could not add a location. Please try again.');
  }

  function handleRemoveLocation() {
    const ok = window.confirm(
      'Remove one unused location slot? Unused time is credited toward your next bill.'
    );
    if (!ok) return;
    runAction(
      removeLocationSlot,
      'Location slot removed.',
      'Could not remove the location slot. Please try again.'
    );
  }

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

              {subscription.isComped ? (
                subscription.currentPeriodEnd ? (
                  <p className="text-brand-gray text-sm mt-1">
                    Complimentary Unlimited through {formatDate(subscription.currentPeriodEnd)}.
                    Your account returns to Free after that. Upgrade anytime from this page.
                  </p>
                ) : (
                  <p className="text-brand-gray text-sm mt-1">Comped account · unlimited locations</p>
                )
              ) : (
                <p className="text-brand-gray text-sm mt-1">
                  {isSixMonth ? '6-month plan' : 'Monthly plan'}
                  {subscription.currentPeriodEnd && (
                    <>
                      {' · '}
                      {subscription.autoRenew ? 'Auto-renews' : 'Ends'} on{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </>
                  )}
                </p>
              )}

              {!subscription.isComped && subscription.currentPeriodEnd && (
                <button
                  onClick={() => handleToggleAutoRenew(!subscription.autoRenew)}
                  disabled={busy}
                  className="mt-3 text-sm text-brand-link underline disabled:opacity-50"
                >
                  {subscription.autoRenew ? 'Turn off auto-renew' : 'Turn on auto-renew'}
                </button>
              )}

              {showLocations && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-brand-navy font-medium text-sm">
                    Locations: {used} of {slots} used
                  </p>

                  {used > 0 ? (
                    <ul className="mt-1 text-sm text-brand-gray">
                      {slotBusinesses.map((b) => (
                        <li key={b.id}>{b.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-brand-gray text-sm mt-1">
                      Your first post for a business claims a location slot.
                    </p>
                  )}

                  <button
                    onClick={handleAddLocation}
                    disabled={busy}
                    className="mt-3 w-full rounded-lg border-2 border-brand-navy text-brand-navy font-medium py-2 text-sm hover:bg-brand-navy hover:text-white transition-colors disabled:opacity-50"
                  >
                    Add a location — {addPrice}
                  </button>

                  {slots > 1 && slots > used && (
                    <button
                      onClick={handleRemoveLocation}
                      disabled={busy}
                      className="mt-2 w-full text-sm text-brand-link underline disabled:opacity-50"
                    >
                      Remove an unused slot
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-brand-navy font-semibold">Frugull Free</p>
              <p className="text-brand-gray text-sm mt-1 mb-4">
                1 post per business per subcategory every 7 days.
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
                onClick={handleUpgrade}
                disabled={busy}
                className="w-full rounded-xl bg-brand-navy text-white font-medium py-3 disabled:opacity-50"
              >
                Upgrade to Frugull Unlimited
              </button>
              <p className="text-brand-gray text-xs mt-2 text-center">
                Covers one business location. Add more for $15/mo each.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
            <p className="text-brand-navy font-semibold">Credits</p>
            <p className="text-brand-gray text-sm mt-1 mb-4">
              {credits ?? 0} credit{credits === 1 ? '' : 's'} available · each covers one
              business per subcategory for up to 30 days
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