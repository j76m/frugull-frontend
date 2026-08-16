import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
