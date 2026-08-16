// TEMPORARY mock data so the List view has something to render before
// we wire up real GET /deals calls. Replace this with a real fetch once
// businesses/deals exist in the database for testing.
const MOCK_DEALS = [
  {
    id: 1,
    businessName: 'Shortstop Gunbarrel',
    distance: '3.66 mi',
    views: 1,
    imageUrl: null,
  },
  {
    id: 2,
    businessName: 'Baseline Road & Broadway',
    distance: '4.12 mi',
    views: 3,
    imageUrl: null,
  },
];

export default MOCK_DEALS;
