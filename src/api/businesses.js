import client from './client';

// POST /businesses does find-or-create: if a business with the given
// googlePlaceId already exists, it's returned as-is; otherwise a new row
// is created. This prevents the same real-world business (e.g. a coffee
// shop) from getting duplicated every time a different user tags it.
export async function findOrCreateBusiness({
  name,
  googlePlaceId,
  address,
  phone,
  website,
  latitude,
  longitude,
}) {
  const { data } = await client.post('/businesses', {
    name,
    googlePlaceId,
    address,
    phone,
    website,
    latitude,
    longitude,
  });
  return data.business ?? data;
}