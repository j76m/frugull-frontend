import client from './client';

// Response shape confirmed from backend: { categories: [{ id, name, slug,
// sort_order, subcategories: [{ id, category_id, name, slug, sort_order }] }] }
export async function fetchCategories() {
  const { data } = await client.get('/categories');
  return data.categories;
}