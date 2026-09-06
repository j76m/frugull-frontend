import client from './client';

export async function fetchDealsAtLocation(businessId, subcategoryId, postType) {
  const params = { businessId, subcategoryId };
  if (postType) params.postType = postType;
  const { data } = await client.get('/deals/at-location', { params });
  return data.deals;
}