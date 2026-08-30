import client from './client';

// Read-only check of what posting to this business+subcategory would look
// like right now (which method applies, and the max duration allowed) -
// used by the Post screen to show an accurate duration picker before
// submitting. Never consumes a credit, unlike the actual post itself.
export async function fetchPreviewAllowance(businessId, subcategoryId) {
  const { data } = await client.get('/deals/preview-allowance', {
    params: { businessId, subcategoryId: subcategoryId || undefined },
  });
  return data;
}

// businessId, categoryId, subcategoryId, caption, imageUrl are required.
// requestedDurationDays and validDaysOfWeek are Pro/Credit-tier fields —
// safe to omit for Free tier, which gets the fixed duration automatically
// regardless of what's sent (7 days for a Deal, 30 for General Info).
// discountTags is optional for any tier: array of 'college' | 'teacher' |
// 'senior' | 'military' | 'first_responder'.
// postType is 'deal' (default) or 'info'.
export async function createDeal({
  businessId,
  categoryId,
  subcategoryId,
  caption,
  imageUrl,
  requestedDurationDays,
  validDaysOfWeek,
  discountTags,
  postType,
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
    postType,
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
// Optional postType = 'deal' | 'info' - only deals of that exact type are
// returned; omit to get both (used by the map's All/Deals/Info toggle).
export async function fetchDeals(bounds, discountTags, postType) {
  const params = bounds
    ? { north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west }
    : {};
  if (discountTags && discountTags.length > 0) {
    params.discountTags = discountTags.join(',');
  }
  if (postType) {
    params.postType = postType;
  }
  const { data } = await client.get('/deals', { params });
  return data.deals;
}