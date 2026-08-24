export default function DealCard({ deal, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center text-center cursor-pointer"
    >
      <div className="w-40 h-40 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt={deal.businessName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-brand-gray text-xs px-2">No photo yet</span>
        )}
      </div>
      <p className="text-brand-navy font-semibold mt-2 text-sm">{deal.businessName}</p>
      {deal.subcategoryName && (
        <p className="text-brand-link text-xs font-medium">{deal.subcategoryName}</p>
      )}
      {deal.distance && <p className="text-brand-gray text-xs mt-1">{deal.distance}</p>}
    </button>
  );
}