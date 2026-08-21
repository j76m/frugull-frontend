// @react-google-maps/api requires every useJsApiLoader call sharing the
// same `id` to also pass an identical `libraries` array reference-wise
// (or at least equivalent) — otherwise it throws a reload warning/error.
// Centralizing this avoids that footgun across DealMap and the business
// search input on the Post screen.
export const GOOGLE_MAPS_LIBRARIES = ['places'];