import client from './client';

export async function fetchDealsAtLocation(businessId, subcategoryId, postType) {
  const params = { businessId };
  if (subcategoryId) params.subcategoryId = subcategoryId;
  if (postType) params.postType = postType;
  const { data } = await client.get('/deals/at-location', { params });
  return data.deals;
}