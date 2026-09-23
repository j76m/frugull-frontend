import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Search, Plus, User } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Search', Icon: Search, end: true },
  { to: '/create', label: 'Post', Icon: Plus, end: false },
  { to: '/me', label: 'Profile', Icon: User, end: false },
];

// Input types that don't open the keyboard or a picker.
const NON_TYPING_INPUT_TYPES = ['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color'];

// True for fields that open the iPhone keyboard or date picker.
function isTypingField(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return !NON_TYPING_INPUT_TYPES.includes(type);
  }
  return false;
}

export default function BottomTabs() {
  // iPhone Safari knocks position:fixed bars out of place when the
  // keyboard or date picker opens, leaving the bar stuck mid-page.
  // Hiding the bar while a field is active avoids it entirely.
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const onFocusIn = (e) => {
      if (isTypingField(e.target)) setTyping(true);
    };

    // Moving between fields fires focusout then focusin - the short delay
    // keeps the bar from flashing back in between.
    let timer;
    const onFocusOut = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setTyping(isTypingField(document.activeElement));
      }, 100);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (typing) return null;

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

      <div className="border-t border-slate-100 py-3 text-center text-[10px] text-brand-gray">
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