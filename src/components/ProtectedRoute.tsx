import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectToSubscription?: boolean;
}

export default function ProtectedRoute({ children, redirectToSubscription = false }: ProtectedRouteProps) {
  const { user, loading, isInTrial, trialExpiresAt } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal isOpen={true} onClose={() => {}} />;
  }

  // If redirectToSubscription is true and we're coming from a registration,
  // we'll let the App component handle the redirect to subscription page
  
  return <>{children}</>;
}