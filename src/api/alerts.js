import client from './client';

// GET /alerts -> { enabled, zip, radiusMiles, subcategoryIds }
export async function fetchAlertSettings() {
  const { data } = await client.get('/alerts');
  return data;
}

// PUT /alerts replaces the whole setup and returns the saved settings.
// Errors come back as { error } with a user-readable message.
export async function saveAlertSettings({ enabled, zip, radiusMiles, subcategoryIds }) {
  const { data } = await client.put('/alerts', { enabled, zip, radiusMiles, subcategoryIds });
  return data;
}