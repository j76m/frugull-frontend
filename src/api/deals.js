import client from './client';

// businessId, categoryId, subcategoryId, caption, imageUrl are required.
// requestedDurationDays and validDaysOfWeek are Pro/Credit-tier fields —
// safe to omit for Free tier, which gets the fixed 7-day expiration
// automatically regardless of what's sent.
// discountTags is optional for any tier: array of 'college' | 'teacher' |
// 'senior' | 'military' | 'first_responder'.
export async function createDeal({
  businessId,
  categoryId,
  subcategoryId,
  caption,
  imageUrl,
  requestedDurationDays,
  validDaysOfWeek,
  discountTags,
}) {
  const { data } = await client.post('/deals', {
    businessId,
    categoryId,
    subcategoryId,
    caption,
    imageUrl,
    requestedDurationDays,
    validDaysOfWeek,
    discountTags,
  });
  return data.deal ?? data;
}

// Response includes business_name, latitude, longitude joined in already —
// no separate business lookup needed to place pins on the map.
// Optional bounds = { north, south, east, west } scopes the query to a
// specific map region — this is what powers the "Search this area" button
// instead of always fetching every active deal in the database.
// Optional discountTags = array of tag strings - only deals matching at
// least one of the given tags are returned.
export async function fetchDeals(bounds, discountTags) {
  const params = bounds
    ? { north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west }
    : {};
  if (discountTags && discountTags.length > 0) {
    params.discountTags = discountTags.join(',');
  }
  const { data } = await client.get('/deals', { params });
  return data.deals;
}