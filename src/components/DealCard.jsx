export default function DealCard({ deal }) {
  return (
    <div className="mb-6">
      <p className="text-brand-navy font-semibold mb-2">{deal.businessName}</p>
      <div className="w-full aspect-square bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt={deal.businessName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-brand-gray text-sm">No photo yet</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-brand-gray">{deal.distance}</span>
        <span className="text-brand-link">{deal.views} Views</span>
      </div>
    </div>
  );
}
