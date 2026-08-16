import { NavLink } from 'react-router-dom';
import { Search, Plus, User } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Search', Icon: Search },
  { to: '/create', label: 'Create', Icon: Plus },
  { to: '/me', label: 'Me', Icon: User },
];

export default function BottomTabs() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-2.5 px-6 flex-1 text-xs ${
              isActive ? 'text-brand-link' : 'text-brand-gray'
            }`
          }
        >
          <Icon size={24} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
