import { useState } from 'react';
import DealDetailModal from './DealDetailModal';

// Thin state wrapper - all the actual carousel UI lives inside
// DealDetailModal itself now (in the same container as the photo and the
// Heart/X buttons), since only DealDetailModal knows where the photo
// really renders. This wrapper just tracks which index is active and
// hands DealDetailModal the props it needs to render controls on top of
// the photo when there's more than one deal to page through.
export default function DealCarouselModal({ deals, onClose, savedDealIds, onToggleSave }) {
  const [index, setIndex] = useState(0);

  if (!deals || deals.length === 0) return null;

  const currentDeal = deals[index];
  const isSaved = savedDealIds?.has(currentDeal.id) ?? false;

  function goPrev() {
    setIndex((i) => (i === 0 ? deals.length - 1 : i - 1));
  }

  function goNext() {
    setIndex((i) => (i === deals.length - 1 ? 0 : i + 1));
  }

  return (
    <DealDetailModal
      deal={currentDeal}
      onClose={onClose}
      isSaved={isSaved}
      onToggleSave={onToggleSave}
      carouselIndex={index}
      carouselTotal={deals.length}
      onCarouselPrev={goPrev}
      onCarouselNext={goNext}
    />
  );
}