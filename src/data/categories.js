// Matches the confirmed v1 taxonomy. This is hardcoded for now — once the
// filter screen needs to be wired to real deal search (later step), this
// should be replaced with a fetch to GET /categories so it stays in sync
// with the database instead of two sources of truth.
const CATEGORIES = [
  { name: 'Food', subcategories: ['Sushi', 'Pizza', 'BBQ', 'Burgers', 'Mexican', 'Asian', 'Italian', 'Bakery', 'Breakfast/Brunch', 'Food Truck', 'Vegan/Vegetarian', 'Dessert/Ice Cream'] },
  { name: 'Drink', subcategories: ['Beer', 'Cocktails', 'Wine', 'Coffee', 'Boba/Tea', 'Happy Hour'] },
  { name: 'Personal Care', subcategories: ['Hair Cuts', 'Nails', 'Spa/Massage', 'Skincare', 'Barber', 'Gym/Fitness', 'Yoga'] },
  { name: 'Auto Care', subcategories: ['Oil Change', 'Brakes', 'Tires', 'Car Wash', 'Detailing'] },
  { name: 'Home Care', subcategories: ['Cleaning', 'Landscaping', 'HVAC', 'Plumbing', 'Pest Control'] },
  { name: 'Recreation', subcategories: ['Concerts', 'Events', 'Classes', 'Sports/Rec Leagues'] },
  { name: 'Public Art', subcategories: ['Murals', 'Sculptures', 'Installations'] },
  { name: 'For Sale by Owner', subcategories: ['Furniture', 'Electronics', 'Vehicles', 'Other'] },
  { name: 'Employment', subcategories: ['Full-time', 'Part-time', 'Gig/Freelance'] },
  { name: 'Property Rental', subcategories: ['Apartments', 'Rooms', 'Commercial'] },
  { name: 'Retail', subcategories: ['Auto Products', 'Beauty Products', 'Clothing', 'Electronics', 'Grocery', 'Home Goods', 'Home Improvement', 'Other'] },
];

export default CATEGORIES;
