import { Link } from 'react-router-dom';
import Wordmark from './Wordmark';

export default function TopNav({ leftLabel, onLeft, rightLabel, onRight }) {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={onLeft}
          className={`cursor-pointer text-brand-link text-sm font-semibold rounded-full border border-brand-link/40 bg-white hover:bg-brand-link hover:text-white px-3 py-1.5 min-w-[70px] text-center transition-colors ${
            !leftLabel && 'invisible'
          }`}
        >
          {leftLabel}
        </button>
        <Link to="/" className="cursor-pointer">
          <Wordmark className="h-10" />
        </Link>
        <button
          onClick={onRight}
          className={`cursor-pointer text-brand-link text-sm font-semibold rounded-full border border-brand-link/40 bg-white hover:bg-brand-link hover:text-white px-3 py-1.5 min-w-[70px] text-center transition-colors ${
            !rightLabel && 'invisible'
          }`}
        >
          {rightLabel}
        </button>
      </div>
    </header>
  );
}