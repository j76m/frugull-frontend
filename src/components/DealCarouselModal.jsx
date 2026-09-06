import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DealDetailModal from './DealDetailModal';

// Wraps DealDetailModal with prev/next paging through every active post
// at one business+subcategory. DealDetailModal itself stays unaware of
// carousels - it just renders whichever single deal it's handed. The
// paging controls are absolutely positioned relative to this wrapper,
// which sits inside DealDetailModal's own photo area via z-index layering
// rather than floating relative to the screen.
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
    <div className="relative">
      <DealDetailModal
        deal={currentDeal}
        onClose={onClose}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />

      {deals.length > 1 && currentDeal.image_url && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none px-0 sm:px-4">
          <div className="w-full sm:max-w-md">
            <div className="flex items-center justify-center gap-4 -translate-y-16 sm:-translate-y-[calc(35vh)]">
              <button
                type="button"
                onClick={goPrev}
                className="cursor-pointer pointer-events-auto w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-brand-navy"
                aria-label="Previous post"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="pointer-events-auto bg-white/90 shadow-md rounded-full px-3 py-1 text-xs font-medium text-brand-navy">
                {index + 1} / {deals.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="cursor-pointer pointer-events-auto w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-brand-navy"
                aria-label="Next post"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}