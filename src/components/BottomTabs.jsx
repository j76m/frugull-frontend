import { NavLink, Link } from 'react-router-dom';
import { Search, Plus, User } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Search', Icon: Search, end: true },
  { to: '/create', label: 'Post', Icon: Plus, end: false },
  { to: '/me', label: 'Profile', Icon: User, end: false },
];

export default function BottomTabs() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around py-1.5">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `cursor-pointer flex flex-col items-center justify-center gap-1 py-2 px-5 mx-1 rounded-xl text-xs font-medium text-brand-link transition-colors ${
                isActive ? 'bg-slate-100' : 'hover:bg-slate-100'
              }`
            }
          >
            <Icon size={24} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-slate-100 py-1.5 text-center text-[10px] text-brand-gray">
        © 2026 Frugull LLC ·{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline">
          Terms
        </Link>{' '}
        ·{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
          Privacy
        </Link>{' '}
        ·{' '}
        <a href="mailto:frugull@gmail.com" target="_blank" rel="noopener noreferrer" className="underline">
          Contact
        </a>
      </div>
    </nav>
  );
}