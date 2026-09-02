import { Link } from 'react-router-dom';
import BottomTabs from './BottomTabs';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <main className="pb-20">
        {children}
        <div className="text-center text-brand-gray text-xs py-6 px-4 space-y-1">
          <p>© 2026 Frugull LLC. All rights reserved.</p>
          <p>Frugull™ is owned and operated by Frugull LLC, a Colorado limited liability company.</p>
          <p>
            <Link to="/terms" className="underline">Terms of Service</Link>
            {' '}|{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>
            {' '}|{' '}
            <a href="mailto:frugull@gmail.com" className="underline">Contact</a>
          </p>
        </div>
      </main>
      <BottomTabs />
    </div>
  );
}