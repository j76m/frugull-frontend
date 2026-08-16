import AppLayout from '../components/AppLayout';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <AppLayout>
      <TopNav />
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-brand-navy font-semibold text-lg">{user?.username}</p>
          <p className="text-brand-gray text-sm">{user?.email}</p>
          <p className="text-brand-link font-medium mt-2 capitalize">
            {user?.rank_tier?.replace('_', ' ')} · {user?.points_balance ?? 0} pts
          </p>
        </div>
        <p className="text-brand-gray mt-4 text-sm text-center">
          Post history and full rank progress coming in step 6.
        </p>
        <button
          onClick={logout}
          className="mt-6 w-full rounded-xl bg-slate-100 text-brand-navy font-medium py-3"
        >
          Log out
        </button>
      </div>
    </AppLayout>
  );
}
