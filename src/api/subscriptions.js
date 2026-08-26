import client from './client';

// billingInterval: 'monthly' | 'six_month'
export async function activateUnlimited(billingInterval, autoRenew) {
  const { data } = await client.post('/subscriptions/activate', {
    billingInterval,
    autoRenew,
  });
  return data.subscription;
}

export async function cancelUnlimited() {
  const { data } = await client.post('/subscriptions/cancel');
  return data.subscription;
}

export async function fetchSubscriptionStatus() {
  const { data } = await client.get('/subscriptions/me');
  return data.subscription;
}