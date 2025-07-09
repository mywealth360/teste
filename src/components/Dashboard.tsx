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

export default function Dashboard() {
  const { user } = useAuth();
  const [activeBreakdown, setActiveBreakdown] = useState<string | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<{category: string, amount: number, percentage: number, icon?: React.ComponentType<any>}[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<{category: string, amount: number, percentage: number}[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the dashboard data hook
  const dashboardData = useDashboardData();

  useEffect(() => {
    if (user) {
      fetchExpenseCategories();
      fetchIncomeCategories();
    }
  }, [user, dashboardData]);

  const fetchExpenseCategories = async () => {
    try {
      setLoading(true);
      
      // Define predefined expense categories with their amounts
      const predefinedCategories = [
        { category: 'Utilidades', amount: 350, icon: Building },
        { category: 'Empréstimos', amount: 300, icon: CreditCard },
        { category: 'Encargos Sociais', amount: 1482, icon: Landmark },
        { category: 'Assinatura', amount: 300, icon: FileText },
        { category: 'Investimentos', amount: 3150, icon: TrendingUp },
        { category: 'Previdência', amount: 5000, icon: Shield },
        { category: 'Veículos', amount: 1000, icon: Car },
        { category: 'Impostos', amount: 285.625, icon: Landmark },
        { category: 'Funcionários', amount: 3000, icon: Users },
        { category: 'Metas Financeiras', amount: 300, icon: Target }
      ];
      
      // Calculate total
      const total = predefinedCategories.reduce((sum, cat) => sum + cat.amount, 0);
      
      // Add percentage to each category
      const formattedCategories = predefinedCategories.map(cat => ({
        ...cat,
        percentage: total > 0 ? (cat.amount / total) * 100 : 0
      }));
      
      setExpenseCategories(formattedCategories);
    } catch (err) {
      console.error('Error fetching expense categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeCategories = async () => {
    try {
      setLoading(true);
      
      // Define predefined income categories with their amounts
      const predefinedCategories = [
        { category: 'Invest', amount: 1000, percentage: 76.9 },
        { category: 'Carga', amount: 300, percentage: 23.1 }
      ];
      
      setIncomeCategories(predefinedCategories);
    } catch (err) {
      console.error('Error fetching income categories:', err);
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-3xl font-bold mt-1">{formatCurrency(dashboardData.totalMonthlyIncome || 0)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Despesa Mensal</p>
              <p className="text-3xl font-bold mt-1">R$ 14.867,628</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
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

      {/* Wealth Evolution Chart */}
      <WealthEvolutionChart />

      {/* Breakdown Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Despesas por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {expenseCategories.map((category, index) => {
              const color = getCategoryColor(category.category);
              const Icon = category.icon || FileText;
              return (
                <div key={index} className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{category.category}</p>
                    </div>
                    <div className="text-xs text-gray-500">{formatPercentage(category.percentage)}</div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(category.amount)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${Math.min(100, category.percentage)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Income Categories */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Receitas por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {incomeCategories.map((category, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{category.category}</p>
                  <p className="text-xs text-gray-500">{formatPercentage(category.percentage)}</p>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(category.amount)}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, category.percentage)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Composição do Patrimônio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveBreakdown(activeBreakdown === 'investments' ? null : 'investments')}
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
            onClick={() => setActiveBreakdown(activeBreakdown === 'real-estate' ? null : 'real-estate')}
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
            onClick={() => setActiveBreakdown(activeBreakdown === 'retirement' ? null : 'retirement')}
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
            onClick={() => setActiveBreakdown(activeBreakdown === 'vehicles' ? null : 'vehicles')}
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
            onClick={() => setActiveBreakdown(activeBreakdown === 'exotic-assets' ? null : 'exotic-assets')}
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
            onClick={() => setActiveBreakdown(activeBreakdown === 'financial-goals' ? null : 'financial-goals')}
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
          </button>
        </div>
        
        {/* Detailed breakdown */}
        {activeBreakdown && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <FinancialBreakdown type={activeBreakdown} />
          </div>
        )}
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