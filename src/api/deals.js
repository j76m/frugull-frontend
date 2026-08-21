import client from './client';

// businessId, categoryId, subcategoryId, caption, imageUrl are required.
// requestedDurationDays and validDaysOfWeek are Pro-tier fields — omitted
// here since Free tier gets the fixed 7-day expiration automatically.
export async function createDeal({ businessId, categoryId, subcategoryId, caption, imageUrl }) {
  const { data } = await client.post('/deals', {
    businessId,
    categoryId,
    subcategoryId,
    caption,
    imageUrl,
  });
  return data.deal ?? data;
}

// Response includes business_name, latitude, longitude joined in already —
// no separate business lookup needed to place pins on the map.
export async function fetchDeals() {
  const { data } = await client.get('/deals');
  return data.deals;
}