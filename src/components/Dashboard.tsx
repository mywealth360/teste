import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  Bell, 
  FileText,
  Home,
  Car,
  Gem,
  Users,
  Target,
  Building,
  Shield,
  Landmark
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import WealthEvolutionChart from './WealthEvolutionChart';
import FinancialBreakdown from './FinancialBreakdown';
import { useDashboardData } from '../hooks/useSupabaseData';
import { useNavigate } from 'react-router-dom';

// Quick Guide component
const QuickGuide = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Guia Rápido</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Finanças
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <a href="/revenues" className="hover:underline">Gestão de Receitas</a>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <a href="/expenses" className="hover:underline">Gestão de Gastos</a>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <a href="/bills" className="hover:underline">Contas a Pagar</a>
            </li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <h3 className="font-medium text-green-800 mb-2 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Patrimônio
          </h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <a href="/investments" className="hover:underline">Investimentos</a>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <a href="/real-estate" className="hover:underline">Imóveis</a>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <a href="/vehicles" className="hover:underline">Veículos</a>
            </li>
          </ul>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <h3 className="font-medium text-purple-800 mb-2 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Planejamento
          </h3>
          <ul className="space-y-2 text-sm text-purple-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              <a href="/financial-goals" className="hover:underline">Metas Financeiras</a>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              <a href="/retirement" className="hover:underline">Previdência</a>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              <a href="/smart-alerts" className="hover:underline">Alertas Inteligentes</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeBreakdown, setActiveBreakdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use the dashboard data hook
  const dashboardData = useDashboardData();

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user, dashboardData]);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Map of expense category colors
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Utilidades': 'bg-blue-500',
      'Empréstimos': 'bg-orange-500',
      'Encargos Sociais': 'bg-purple-500',
      'Assinatura': 'bg-green-500',
      'Investimentos': 'bg-indigo-500',
      'Previdência': 'bg-teal-500',
      'Veículos': 'bg-red-500',
      'Funcionários': 'bg-pink-500',
      'Impostos': 'bg-yellow-500'
    };
    
    return colorMap[category] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral das suas finanças</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            <Calendar className="h-5 w-5" />
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Receita Mensal</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(dashboardData.totalMonthlyIncome || 1300)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl cursor-pointer" onClick={() => navigate('/revenues')}>
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Despesa Mensal</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(dashboardData.totalMonthlyExpenses || 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl cursor-pointer" onClick={() => navigate('/expenses')}>
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${dashboardData.netMonthlyIncome >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} p-6 rounded-2xl text-white shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Saldo Mensal</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(Math.abs(dashboardData.netMonthlyIncome || 0))}</p>
              <p className="text-white/80 text-sm">{dashboardData.netMonthlyIncome >= 0 ? 'Positivo' : 'Negativo'}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Guide */}
      <QuickGuide />

      {/* Wealth Evolution Chart */}
      <WealthEvolutionChart />

      {/* Asset Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Composição do Patrimônio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onClick={(e) => e.currentTarget === e.target && setActiveBreakdown(null)}>
          <button
            onClick={() => navigate('/investments')}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeBreakdown === 'investments' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Building className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Investimentos</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalInvestmentValue || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Renda: {formatCurrency(dashboardData.totalInvestmentIncome || 0)}/mês</p>
          </button>
          
          <button
            onClick={() => navigate('/real-estate')}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeBreakdown === 'real-estate' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Home className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Imóveis</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalRealEstateValue || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Renda: {formatCurrency(dashboardData.totalRealEstateIncome || 0)}/mês</p>
          </button>
          
          <button
            onClick={() => navigate('/retirement')}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeBreakdown === 'retirement' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Previdência</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalRetirementSaved || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Contribuição: {formatCurrency(dashboardData.totalRetirementContribution || 0)}/mês</p>
          </button>
          
          <button
            onClick={() => navigate('/vehicles')}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeBreakdown === 'vehicles' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Veículos</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalVehicleValue || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Despesas: {formatCurrency(dashboardData.totalVehicleExpenses || 0)}/mês</p>
          </button>
          
          <button
            onClick={() => navigate('/exotic-assets')}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeBreakdown === 'exotic-assets' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Gem className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Ativos Exóticos</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalExoticAssetsValue || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Apreciação: {formatCurrency(dashboardData.totalExoticAssetsAppreciation || 0)}</p>
          </button>
          
          <button
            onClick={() => navigate('/financial-goals')}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeBreakdown === 'financial-goals' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Metas Financeiras</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalFinancialGoals || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Valor já economizado</p>
          </button>
        </div>
        
        {/* Detailed breakdown */}
        {activeBreakdown && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <FinancialBreakdown type={activeBreakdown} />
          </div>
        )}
      </div>

      {/* Asset Distribution Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Distribuição de Patrimônio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Por Categoria</h3>
            <div className="relative h-64">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-8 border-blue-500 relative">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-green-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-purple-500" style={{ clipPath: 'polygon(100% 0, 100% 100%, 75% 100%, 75% 50%, 100% 50%)' }}></div>
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-orange-500" style={{ clipPath: 'polygon(0 50%, 75% 50%, 75% 100%, 0 100%)' }}></div>
                </div>
              </div>
              <div className="absolute bottom-0 w-full">
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Investimentos (40%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Imóveis (35%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Veículos (15%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Outros (10%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Evolução Patrimonial</h3>
            <div className="h-64 relative">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gray-200"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gray-200"></div>
              
              {/* Bars */}
              <div className="absolute bottom-0 left-10 w-12 h-32 bg-blue-500 rounded-t-lg"></div>
              <div className="absolute bottom-0 left-32 w-12 h-40 bg-blue-500 rounded-t-lg"></div>
              <div className="absolute bottom-0 left-54 w-12 h-48 bg-blue-500 rounded-t-lg"></div>
              <div className="absolute bottom-0 left-76 w-12 h-56 bg-blue-500 rounded-t-lg"></div>
              <div className="absolute bottom-0 left-98 w-12 h-60 bg-blue-500 rounded-t-lg"></div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-[-20px] left-10 text-xs text-gray-500">Jan</div>
              <div className="absolute bottom-[-20px] left-32 text-xs text-gray-500">Mar</div>
              <div className="absolute bottom-[-20px] left-54 text-xs text-gray-500">Mai</div>
              <div className="absolute bottom-[-20px] left-76 text-xs text-gray-500">Jul</div>
              <div className="absolute bottom-[-20px] left-98 text-xs text-gray-500">Set</div>
              
              {/* Y-axis labels */}
              <div className="absolute left-[-30px] bottom-0 text-xs text-gray-500">0</div>
              <div className="absolute left-[-30px] bottom-[30px] text-xs text-gray-500">500k</div>
              <div className="absolute left-[-30px] bottom-[60px] text-xs text-gray-500">1M</div>
            </div>
          </div>
        </div>
      </div>

      {/* Debt Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Visão Geral de Dívidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Dívida Total</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData.totalDebt || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Pagamento: {formatCurrency(dashboardData.totalLoanPayments || 0)}/mês</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Contas Mensais</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(dashboardData.totalBills || 0)}</p>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Landmark className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Impostos</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(dashboardData.totalTaxes || 0)}</p>
            <button
              onClick={() => setActiveBreakdown(activeBreakdown === 'taxes' ? null : 'taxes')}
              className="text-xs text-indigo-600 mt-2 hover:underline"
            >
              Ver detalhes
            </button>
          </div>
        </div>
        
        {activeBreakdown === 'taxes' && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <FinancialBreakdown type="taxes" />
          </div>
        )}
      </div>

      {/* Net Worth */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Patrimônio Líquido</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Total de Ativos</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.totalAssets || 0)}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Total de Passivos</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData.totalDebt || 0)}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Patrimônio Líquido</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(dashboardData.netWorth || 0)}</p>
            <button
              onClick={() => setActiveBreakdown(activeBreakdown === 'balance' ? null : 'balance')}
              className="text-xs text-blue-600 mt-2 hover:underline"
            >
              Ver detalhes
            </button>
          </div>
        </div>
        
        {activeBreakdown === 'balance' && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <FinancialBreakdown type="balance" />
          </div>
        )}
      </div>
    </div>
  );
}