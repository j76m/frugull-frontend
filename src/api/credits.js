import client from './client';

export async function fetchCreditBalance() {
  const { data } = await client.get('/credits/me');
  return data.credits;
}