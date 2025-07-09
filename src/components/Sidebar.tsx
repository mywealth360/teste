import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingUp, 
  PiggyBank, 
  Brain, 
  Settings,
  CreditCard,
  Building,
  Shield,
  Home,
  AlertTriangle,
  FileText,
  FolderOpen,
  LogOut,
  User,
  Banknote,
  TrendingDown,
  DollarSign,
  Target,
  Car,
  Gem,
  Users,
  Heart,
  Lock,
  ChevronDown,
  ChevronRight,
  Crown,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 
import SubscriptionStatus from './SubscriptionStatus';
import SubscriptionButton from './subscription/SubscriptionButton';
import { products } from '../stripe-config';
import UpgradeModal from './UpgradeModal';
import { Link } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Seções principais
const mainSections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, restricted: false }
];

// Seção de Receitas
const revenueSections = [
  { id: 'revenues', label: 'Gestão de Receitas', icon: TrendingUp, restricted: false },
  { id: 'income', label: 'Fontes de Renda', icon: DollarSign, restricted: false }
];

// Seção de Despesas
const expenseSections = [
  { id: 'expenses', label: 'Gestão de Gastos', icon: TrendingDown, restricted: false },
  { id: 'bills', label: 'Contas', icon: FileText, restricted: false },
  { id: 'loans', label: 'Empréstimos', icon: AlertTriangle, restricted: false }
];

// Seção de Patrimônio
const patrimonySections = [
  { id: 'patrimony', label: 'Gestão de Patrimônio', icon: Target, restricted: true },
  { id: 'bank-accounts', label: 'Contas Bancárias', icon: Banknote, restricted: false },
  { id: 'investments', label: 'Investimentos', icon: Building, restricted: false },
  { id: 'retirement', label: 'Previdência', icon: Shield, restricted: false },
  { id: 'real-estate', label: 'Imóveis', icon: Home, restricted: true },
  { id: 'vehicles', label: 'Veículos', icon: Car, restricted: true },
  { id: 'exotic-assets', label: 'Ativos Exóticos', icon: Gem, restricted: true }
];

// Seção de Outros
const otherSections = [
  { id: 'transactions', label: 'Transações', icon: Receipt, restricted: false },
  { id: 'access', label: 'Gerenciar Acessos', icon: Users, restricted: true },
  { id: 'documents', label: 'Documentos', icon: FolderOpen, restricted: false },
  { id: 'employees', label: 'Funcionários', icon: Users, restricted: true },
  { id: 'insights', label: 'IA Insights', icon: Brain, restricted: true }
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, signOut, isAdmin, userPlan, isInTrial, trialDaysLeft } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState<string | undefined>(undefined);
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    expense: true,
    patrimony: true,
    other: true
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const handleTabClick = (tabId: string, isRestricted: boolean) => {
    // If trial days left is 0, only allow subscription tab
    if (trialDaysLeft === 0 && tabId !== 'subscription') {
      setActiveTab('subscription');
      return;
    }
    
    if (isRestricted && userPlan === 'starter') {
      // Get the feature name from the tab ID
      const feature = 
        patrimonySections.find(s => s.id === tabId)?.label || 
        otherSections.find(s => s.id === tabId)?.label;
      
      setRestrictedFeature(feature);
      setShowUpgradeModal(true);
      return;
    }
    
    if (!isRestricted || userPlan === 'family') {
      setActiveTab(tabId);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderSectionItems = (items: typeof mainSections, isExpanded: boolean) => {
    if (!isExpanded) return null;
    
    return (
      <div className="space-y-1 pl-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isRestricted = item.restricted && userPlan === 'starter';
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id, item.restricted)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : isRestricted
                    ? 'text-gray-400 cursor-not-allowed opacity-70'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
              disabled={isRestricted && userPlan === 'starter'}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {isRestricted && <Lock className="h-3 w-3 text-gray-400" />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white shadow-xl border-r border-gray-100 h-screen fixed left-0 top-0 z-30 overflow-y-auto flex flex-col">
      <div className="p-2 border-b border-gray-100">
        <h1 className="text-xl font-bold text-center text-gray-800 py-4">MyWealth 360</h1>
      </div>
      
      {/* Subscription Status */}
      <div className="p-4 border-b border-gray-100">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 cursor-pointer" onClick={() => setActiveTab('subscription')}>
              <h2 className="text-sm font-bold text-white">
                Plano {userPlan === 'family' ? 'Family' : 'Starter'} 
                {isInTrial && (
                  <span className={`ml-1 text-xs ${trialDaysLeft > 0 ? 'bg-green-500' : 'bg-red-500'} text-white px-1.5 py-0.5 rounded-full`}>
                    {trialDaysLeft > 0 ? 'Trial' : 'Expirado'}
                  </span>
                )}
              </h2>
              <SubscriptionStatus />
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-1">
                <Crown className="h-3 w-3 text-yellow-300" />
                <span className="text-xs text-white font-medium">Admin</span>
              </div> 
            )}
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-1">
          {/* Admin Panel Button - Visible only for admins at the top */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className="w-full flex items-center justify-between px-3 py-3 mb-2 rounded-xl transition-all duration-200 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center space-x-3">
                <Crown className="h-5 w-5" />
                <span>PAINEL ADMIN</span>
              </div>
              <Shield className="h-5 w-5" />
            </button>
          )}
          
          {mainSections.map((item) => {
            const Icon = item.icon;
            const isRestricted = item.restricted && userPlan === 'starter';
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id, item.restricted)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : isRestricted
                      ? 'text-gray-400 cursor-not-allowed opacity-70'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
                disabled={isRestricted && userPlan === 'starter'}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {isRestricted && <Lock className="h-3 w-3 text-gray-400" />}
              </button>
            );
          })}
        </div>

        {/* Seção de Receitas */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('revenue')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Receitas</span>
            </div>
            {expandedSections.revenue ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {renderSectionItems(revenueSections, expandedSections.revenue)}
        </div>

        {/* Seção de Despesas */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('expense')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span>Despesas</span>
            </div>
            {expandedSections.expense ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {renderSectionItems(expenseSections, expandedSections.expense)}
        </div>

        {/* Seção de Patrimônio */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('patrimony')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span>Patrimônio</span>
            </div>
            {expandedSections.patrimony ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {renderSectionItems(patrimonySections, expandedSections.patrimony)}
        </div>

        {/* Seção de Outros */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('other')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span>Outros</span>
            </div>
            {expandedSections.other ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {renderSectionItems(otherSections, expandedSections.other)}
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-8 h-8 ${isAdmin ? 'bg-red-500' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
            {isAdmin ? <Crown className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.email}
            </p>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <p className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  ADMIN
                </p>
              )}
              <p className="text-xs text-blue-600 font-medium">
                Plano {userPlan === 'starter' ? 'Starter' : 'Family'}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Meu Perfil</span>
          </button>
          
          <button
            onClick={() => setActiveTab('subscription')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium ${
              activeTab === 'subscription'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <Crown className="h-4 w-4" />
            <span>Assinatura</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center space-x-3">
                <Crown className="h-5 w-5" />
                <span>PAINEL ADMIN</span>
              </div>
              <Shield className="h-5 w-5" />
            </button>
          )}
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
      
      {/* Modal de Upgrade */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        featureName={restrictedFeature}
      />
    </div>
  );
}