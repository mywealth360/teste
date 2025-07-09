import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import SubscriptionPage from './components/SubscriptionPage';
import InviteAccept from './components/InviteAccept';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import Transactions from './components/Transactions';
import Income from './components/Income';
import BankAccounts from './components/BankAccounts';
import Investments from './components/Investments';
import Retirement from './components/Retirement';
import RealEstate from './components/RealEstate';
import Vehicles from './components/Vehicles';
import ExoticAssets from './components/ExoticAssets';
import Loans from './components/Loans';
import Bills from './components/Bills';
import Documents from './components/Documents';
import Employees from './components/Employees';
import AIInsights from './components/AIInsights';
import ExpenseManagement from './components/ExpenseManagement';
import RevenueManagement from './components/RevenueManagement';
import PatrimonyManagement from './components/PatrimonyManagement';
import FloatingChatButton from './components/FloatingChatButton';
import LandingPage from './components/LandingPage';
import SubscriptionPage from './components/SubscriptionPage';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import UserProfile from './components/UserProfile';
import TrialExpiredModal from './components/TrialExpiredModal';
import PaymentFailedModal from './components/PaymentFailedModal';
import AdminPanel from './components/AdminPanel';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAdmin, isInTrial, trialExpiresAt, userPlan } = useAuth();
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false);
  
  // Check if trial has expired
  React.useEffect(() => {
    if (isInTrial && trialExpiresAt) {
      const now = new Date();
      if (trialExpiresAt < now) {
        setShowTrialExpiredModal(true);
      }
    }
  }, [isInTrial, trialExpiresAt]);
  
  // Listen for payment failed events (in a real app, this would come from a webhook)
  React.useEffect(() => {
    const handlePaymentFailed = () => {
      setShowPaymentFailedModal(true);
    };
    
    // Simulate a payment failed event after 10 seconds (for demo purposes)
    // In a real app, this would be triggered by a webhook from Stripe
    // const timer = setTimeout(() => {
    //   handlePaymentFailed();
    // }, 10000);
    
    // Listen for custom event from webhook handler
    window.addEventListener('paymentFailed', handlePaymentFailed);
    
    return () => {
      // clearTimeout(timer);
      window.removeEventListener('paymentFailed', handlePaymentFailed);
    };
  }, []);

  // Check if we should show subscription page
  const shouldShowSubscriptionPage = () => {
    // If trial has expired or subscription has ended, only show subscription page
    if ((isInTrial && trialExpiresAt && trialExpiresAt < new Date()) || 
        (!isInTrial && !userPlan)) {
      return true;
    }
    // Otherwise, show the selected tab content
    return false;
  };

  const renderContent = () => {
    // If trial expired or no subscription, force subscription page
    if (shouldShowSubscriptionPage()) {
      return <SubscriptionPage />;
    }
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'revenues':
        return <RevenueManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'patrimony':
        return <PatrimonyManagement />;
      case 'transactions':
        return <Transactions />;
      case 'income':
        return <Income />;
      case 'bank-accounts':
        return <BankAccounts />;
      case 'investments':
        return <Investments />;
      case 'retirement':
        return <Retirement />;
      case 'real-estate':
        return <RealEstate />;
      case 'vehicles':
        return <Vehicles />;
      case 'exotic-assets':
        return <ExoticAssets />;
      case 'loans':
        return <Loans />;
      case 'bills':
        return <Bills />;
      case 'documents':
        return <Documents />;
      case 'employees':
        return <Employees />;
      case 'insights':
        return <AIInsights />;
      case 'profile':
        return <UserProfile />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'cards':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Cartões</h2>
            <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Configurações</h2>
            <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="ml-64 p-8">
        {renderContent()}
      </main>
      <FloatingChatButton />
      
      {/* Modals */}
      <TrialExpiredModal 
        isOpen={showTrialExpiredModal} 
        onClose={() => setShowTrialExpiredModal(false)} 
      />
      <PaymentFailedModal 
        isOpen={showPaymentFailedModal} 
        onClose={() => setShowPaymentFailedModal(false)} 
      />
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <ProtectedRoute redirectToSubscription={true}>
      <AppContent />
    </ProtectedRoute>
  );
}

function PublicApp() {
  return <LandingPage />;
}

function AppRouter() {
  const { user, loading } = useAuth();

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

  return user ? <AuthenticatedApp /> : <PublicApp />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} /> 
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="*" element={<AppRouter />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;