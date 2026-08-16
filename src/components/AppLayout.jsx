import BottomTabs from './BottomTabs';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <main className="pb-20">{children}</main>
      <BottomTabs />
    </div>
  );
}
