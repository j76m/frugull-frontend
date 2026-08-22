import client from './client';

// reason must be one of: spam | inappropriate | deal_no_longer_valid | other
export async function submitReport({ dealId, reason }) {
  const { data } = await client.post('/reports', { dealId, reason });
  return data.report ?? data;
}