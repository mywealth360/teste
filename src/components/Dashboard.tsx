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
import DateRangeSelector from './DateRangeSelector';
import { useDashboardData } from '../hooks/useSupabaseData';
import { useNavigate } from 'react-router-dom';

// Quick Guide component
const QuickGuide = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Guia Rápido</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-blue-200">
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
        
        <div className="bg-white p-4 rounded-xl border border-green-200">
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
        
        <div className="bg-white p-4 rounded-xl border border-indigo-200">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Visão geral das suas finanças</p>
        </div>
        <div className="flex space-x-3 self-end sm:self-auto">
          <DateRangeSelector
            onRangeChange={(startDate, endDate) => {
              console.log('Date range changed:', startDate, endDate);
              // Here you would fetch data for the selected date range
            }} 
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-green-600 p-4 sm:p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Receita Mensal</p>
              <p className="text-xl sm:text-3xl font-bold mt-1">{formatCurrency(dashboardData.totalMonthlyIncome || 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg cursor-pointer" onClick={() => navigate('/revenues')}>
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-red-600 p-4 sm:p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Despesa Mensal</p>
              <p className="text-xl sm:text-3xl font-bold mt-1">{formatCurrency(dashboardData.totalMonthlyExpenses || 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg cursor-pointer" onClick={() => navigate('/expenses')}>
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className={`${dashboardData.netMonthlyIncome >= 0 ? 'bg-blue-600' : 'bg-orange-600'} p-4 sm:p-6 rounded-xl text-white shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Saldo Mensal</p>
              <p className="text-xl sm:text-3xl font-bold mt-1">{formatCurrency(Math.abs(dashboardData.netMonthlyIncome || 0))}</p>
              <p className="text-white/80 text-xs sm:text-sm">{dashboardData.netMonthlyIncome >= 0 ? 'Positivo' : 'Negativo'}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Guide */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Guia Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center text-sm sm:text-base">
              <DollarSign className="h-4 w-4 mr-2" />
              Finanças
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-700">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/revenues" className="hover:underline">Gestão de Receitas</a>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/expenses" className="hover:underline">Gestão de Gastos</a>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/bills" className="hover:underline">Contas a Pagar</a>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-green-200">
            <h3 className="font-medium text-green-800 mb-2 flex items-center text-sm sm:text-base">
              <Building className="h-4 w-4 mr-2" />
              Patrimônio
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-green-700">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/investments" className="hover:underline">Investimentos</a>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/real-estate" className="hover:underline">Imóveis</a>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/vehicles" className="hover:underline">Veículos</a>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-indigo-200">
            <h3 className="font-medium text-purple-800 mb-2 flex items-center text-sm sm:text-base">
              <Target className="h-4 w-4 mr-2" />
              Planejamento
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-purple-700">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/financial-goals" className="hover:underline">Metas Financeiras</a>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/retirement" className="hover:underline">Previdência</a>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full mr-1 sm:mr-2"></span>
                <a href="/smart-alerts" className="hover:underline">Alertas Inteligentes</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Wealth Evolution Chart */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-2 sm:p-0">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Evolução Patrimonial
          </h2>
          <DateRangeSelector 
            onRangeChange={(startDate, endDate) => {
              console.log('Chart date range changed:', startDate, endDate);
              // Here you would update the chart data for the selected date range
            }} 
          />
        </div>
        <WealthEvolutionChart />
      </div>

      {/* Asset Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Composição do Patrimônio</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" onClick={(e) => e.currentTarget === e.target && setActiveBreakdown(null)}>
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
          <div className="mt-4 sm:mt-6 bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
            <FinancialBreakdown type={activeBreakdown} />
          </div>
        )}
      </div>

    

      {/* Debt Overview */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Visão Geral de Dívidas</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-4 rounded-xl border border-red-200">
            <div className="flex items-center space-x-3 mb-3">
              <CreditCard className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-gray-800">Dívida Total</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData.totalDebt || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Pagamento: {formatCurrency(dashboardData.totalLoanPayments || 0)}/mês</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-orange-200">
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-800">Contas Mensais</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(dashboardData.totalBills || 0)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center space-x-3 mb-3">
              <Landmark className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Impostos</h3>
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
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
            <FinancialBreakdown type="taxes" />
          </div>
        )}
      </div>

      {/* Net Worth */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Patrimônio Líquido</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-4 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Total de Ativos</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.totalAssets || 0)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-red-200">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-gray-800">Total de Passivos</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData.totalDebt || 0)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Patrimônio Líquido</h3>
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
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
            <FinancialBreakdown type="balance" />
          </div>
        )}
      </div>
    </div>
  );
}