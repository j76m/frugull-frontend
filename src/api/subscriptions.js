import client from './client';

export async function cancelUnlimited() {
  const { data } = await client.post('/subscriptions/cancel');
  return data.subscription;
}

export async function resumeUnlimited() {
  const { data } = await client.post('/subscriptions/resume');
  return data.subscription;
}

export async function fetchSubscriptionStatus() {
  const { data } = await client.get('/subscriptions/me');
  return data.subscription;
}