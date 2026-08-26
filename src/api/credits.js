import client from './client';

// pack: 'five' | 'ten'
export async function purchaseCredits(pack) {
  const { data } = await client.post('/credits/purchase', { pack });
  return data.credits;
}

export async function fetchCreditBalance() {
  const { data } = await client.get('/credits/me');
  return data.credits;
}