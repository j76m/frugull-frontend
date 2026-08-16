import Wordmark from './Wordmark';

export default function TopNav({ leftLabel, onLeft, rightLabel, onRight }) {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={onLeft}
          className={`text-brand-link text-base min-w-[60px] text-left ${
            !leftLabel && 'invisible'
          }`}
        >
          {leftLabel}
        </button>
        <Wordmark className="h-10" />
        <button
          onClick={onRight}
          className={`text-brand-link text-base min-w-[60px] text-right ${
            !rightLabel && 'invisible'
          }`}
        >
          {rightLabel}
        </button>
      </div>
    </header>
  );
}
