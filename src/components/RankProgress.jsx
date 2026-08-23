import { TIERS } from '../data/ranks';
import { getRankIconUrl } from '../utils/rankIcons';

export default function RankProgress({ points }) {
  const pts = points ?? 0;

  let currentIndex = 0;
  TIERS.forEach((tier, i) => {
    if (pts >= tier.threshold) currentIndex = i;
  });
  const currentTier = TIERS[currentIndex];
  const nextTier = TIERS[currentIndex + 1];

  let segmentProgress = 1; // 0-1 progress within the current segment
  let remainingText = "You've reached the top rank!";
  if (nextTier) {
    const span = nextTier.threshold - currentTier.threshold;
    const into = pts - currentTier.threshold;
    segmentProgress = Math.min(1, Math.max(0, into / span));
    const remaining = nextTier.threshold - pts;
    remainingText = `${remaining} pt${remaining === 1 ? '' : 's'} to ${nextTier.label}`;
  }

  const overallProgress = ((currentIndex + segmentProgress) / (TIERS.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        {TIERS.map((tier, i) => {
          const achieved = i <= currentIndex;
          const iconUrl = getRankIconUrl(tier.filename);
          // The Frugull icon graphic is light-colored and hard to see on
          // the default light gray "not yet achieved" background — give
          // it a baby-blue backdrop always, regardless of achieved state.
          const isFrugullTier = tier.key === 'frugull';
          return (
            <div key={tier.key} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                  achieved ? 'border-brand-link' : 'border-slate-200'
                } ${isFrugullTier ? 'bg-sky-200' : achieved ? 'bg-white' : 'bg-slate-100'}`}
              >
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={tier.label}
                    className={`w-6 h-6 object-contain ${
                      achieved || isFrugullTier ? '' : 'opacity-30 grayscale'
                    }`}
                  />
                ) : (
                  <span className="text-[10px] text-brand-gray">{tier.label[0]}</span>
                )}
              </div>
              <span
                className={`text-[10px] text-center leading-tight ${
                  achieved ? 'text-brand-navy font-medium' : 'text-brand-gray'
                }`}
              >
                {tier.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative h-1.5 bg-slate-200 rounded-full mt-1 mx-4">
        <div
          className="absolute inset-y-0 left-0 bg-brand-link rounded-full transition-all"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      <p className="text-center text-brand-gray text-xs mt-2">{remainingText}</p>
    </div>
  );
}