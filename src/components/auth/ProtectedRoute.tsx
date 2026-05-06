import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, reverse = false }: { children: ReactNode, reverse?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
        <h1 className="mb-4 text-3xl font-black text-[var(--primary)]">FlowState</h1>
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // Reverse = true: access for logged OUT users only (e.g. Login Page)
  if (reverse) {
    return user ? <Navigate to="/" /> : <>{children}</>;
  }

  // Normal: access for logged IN users only (e.g. Dashboard)
  return user ? <>{children}</> : <Navigate to="/login" />;
}
