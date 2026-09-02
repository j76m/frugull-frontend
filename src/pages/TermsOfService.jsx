import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <TopNav leftLabel="Back" onLeft={() => navigate(-1)} />
      <div className="px-5 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-brand-navy mb-4">Terms of Service</h1>
        <p className="text-brand-gray text-sm">Coming soon.</p>
      </div>
    </AppLayout>
  );
}