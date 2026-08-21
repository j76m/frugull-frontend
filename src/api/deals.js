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
// Optional bounds = { north, south, east, west } scopes the query to a
// specific map region — this is what powers the "Search this area" button
// instead of always fetching every active deal in the database.
export async function fetchDeals(bounds) {
  const params = bounds
    ? { north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west }
    : {};
  const { data } = await client.get('/deals', { params });
  return data.deals;
}