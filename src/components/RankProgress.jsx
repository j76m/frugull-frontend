import { TIERS } from '../data/ranks';
import { getRankIconUrl } from '../utils/rankIcons';

// Point gaps between tiers vary wildly (1pt, 9pts, 40pts, 200pts). Equal
// spacing would misrepresent how much bigger the later jumps are — but
// pure proportional spacing crowds the early icons (and their text labels)
// together too tightly on narrow mobile screens. So every gap gets a
// guaranteed minimum width, and only the space left over after that gets
// distributed proportionally based on the real point gaps.
const MIN_GAP_PERCENT = 16;

function getTierPositions() {
  const gaps = TIERS.slice(1).map((tier, i) => tier.threshold - TIERS[i].threshold);
  const weights = gaps.map((g) => Math.sqrt(g));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const bonusPool = 100 - MIN_GAP_PERCENT * gaps.length;

  const positions = [0];
  let cumulative = 0;
  weights.forEach((w) => {
    cumulative += MIN_GAP_PERCENT + (w / totalWeight) * bonusPool;
    positions.push(cumulative);
  });
  return positions;
}

export default function RankProgress({ points }) {
  const pts = points ?? 0;
  const positions = getTierPositions();

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

  const overallProgress = nextTier
    ? positions[currentIndex] + segmentProgress * (positions[currentIndex + 1] - positions[currentIndex])
    : 100;

  return (
    <div className="w-full">
      <div className="relative h-16 mx-4">
        {TIERS.map((tier, i) => {
          const achieved = i <= currentIndex;
          const iconUrl = getRankIconUrl(tier.filename);
          const isFrugullTier = tier.key === 'frugull';
          return (
            <div
              key={tier.key}
              className="absolute top-0 flex flex-col items-center gap-1"
              style={{ left: `${positions[i]}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                  isFrugullTier
                    ? 'bg-brand-link border-brand-link'
                    : achieved
                    ? 'bg-white border-brand-link'
                    : 'bg-slate-100 border-slate-200'
                }`}
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
                className={`text-[10px] text-center leading-tight whitespace-nowrap ${
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