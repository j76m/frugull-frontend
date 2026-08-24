import client from './client';

export async function saveDeal(dealId) {
  const { data } = await client.post('/saved-deals', { dealId });
  return data;
}

export async function unsaveDeal(dealId) {
  const { data } = await client.delete(`/saved-deals/${dealId}`);
  return data;
}

// Full deal objects, ordered soonest-expiring first — used on Profile.
export async function fetchSavedDeals() {
  const { data } = await client.get('/saved-deals');
  return data.deals;
}

// Lightweight id-only list — used to show filled/outline heart state
// without pulling every saved deal's full data just to check membership.
export async function fetchSavedDealIds() {
  const { data } = await client.get('/saved-deals/ids');
  return data.dealIds;
}