import client from './client';

// product: 'unlimited_monthly' | 'unlimited_six_month' | 'credits_five'
export async function startCheckout(product, autoRenew = true) {
  const { data } = await client.post('/billing/checkout', {
    product,
    autoRenew,
    returnPath: window.location.pathname,
  });
  return data.url;
}