import React, { useState, useEffect } from 'react';
import { 
  Bell,
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  Brain,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Home,
  Building,
  Shield,
  CreditCard,
  Banknote,
  Clock,
  X,
  Receipt,
  Calendar,
  FileText,
  Landmark,
  Wallet,
  BarChart3,
  Car,
  Gem,
  Users,
  ChevronRight,
  PiggyBank
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useMonthlyRenewal } from '../hooks/useMonthlyRenewal';
import { aiInsights } from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import AlertsIndicator from './AlertsIndicator';
import WealthEvolutionChart from './WealthEvolutionChart';
import FinancialBreakdown from './FinancialBreakdown';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    netMonthlyIncome,
    totalInvestmentValue,
    totalInvestmentIncome,
    totalRealEstateValue,
    totalRealEstateIncome,
    totalRealEstateExpenses,
    totalRetirementSaved,
    totalRetirementContribution,
    totalDebt,
    totalLoanPayments,
    totalBills,
    totalBankBalance,
    totalVehicleValue,
    totalVehicleDepreciation,
    totalVehicleExpenses,
    totalExoticAssetsValue,
    totalExoticAssetsAppreciation,
    totalFinancialGoals,
    totalAssets,
    netWorth,
    totalTaxes,
    loading,
    error
  } = useSupabaseData();

  // Ativar renovação automática mensal
  useMonthlyRenewal();

  const [selectedBreakdown, setSelectedBreakdown] = useState<string | null>(null);

  // Calculate total monthly expenses including all categories
  const totalMonthlyExpensesComplete = totalMonthlyExpenses + totalLoanPayments + totalBills + 
    totalRetirementContribution + totalRealEstateExpenses + totalVehicleExpenses + 
    totalTaxes;

  // Calculate total monthly income including all sources (ensure it's never negative)
  const totalMonthlyIncomeComplete = Math.max(0, totalMonthlyIncome + totalInvestmentIncome + totalRealEstateIncome);

  // Calculate net monthly income
  const netMonthlyIncomeComplete = totalMonthlyIncomeComplete - totalMonthlyExpensesComplete; 

  // Calculate liquid assets (bank accounts + easily liquidated investments)
  const liquidAssets = totalBankBalance + (totalInvestmentValue * 0.7); // Assuming 70% of investments are liquid

  // Calculate immobilized assets (real estate + retirement + illiquid investments + vehicles + exotic assets)
  const immobilizedAssets = totalRealEstateValue + totalRetirementSaved + (totalInvestmentValue * 0.3) + totalVehicleValue + totalExoticAssetsValue;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'achievement': return CheckCircle;
      case 'suggestion': return Lightbulb;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-orange-500 bg-orange-50';
      case 'achievement': return 'text-green-500 bg-green-50';
      case 'suggestion': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-40 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com Patrimônio Líquido */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard Financeiro</h1>
              <p className="text-slate-300 text-lg">Visão completa do seu patrimônio</p>
            </div>
            <div className="flex items-center space-x-6">
              {/* Alert Indicator */}
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <AlertsIndicator />
              </div>
              
              <div className="text-right">
                <p className="text-slate-300 text-sm mb-1">Patrimônio Líquido</p>
                <p className={`text-4xl font-bold ${netWorth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  R$ {Math.abs(netWorth).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center justify-end mt-2">
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                    netWorth >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {netWorth >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{netWorth >= 0 ? 'Positivo' : 'Negativo'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Goals Quick View */}
      <div 
        onClick={() => navigate('/?tab=financial-goals')} 
        className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 cursor-pointer hover:shadow-xl transition-all duration-200 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Metas Financeiras</h2>
          </div>
          <span className="text-sm text-blue-600 flex items-center">
            Ver todas <ChevronRight className="h-4 w-4 ml-1" />
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-3 rounded-lg">
            <p className="text-sm text-indigo-600">Total de Metas</p>
            <p className="text-xl font-bold text-indigo-700">R$ {totalFinancialGoals.toLocaleString('pt-BR')}</p>
            <div className="flex items-center text-xs text-indigo-500 mt-1">
              <PiggyBank className="h-3 w-3 mr-1" /> Alocação patrimonial
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Renda e Custos */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-green-500 to-red-500 w-1 h-8 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Fluxo de Caixa Mensal (R$)</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Renda Mensal */}
          <div 
            onClick={() => setSelectedBreakdown('income')} 
            className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <DollarSign className="h-6 w-6 opacity-60" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium mb-2">Renda Mensal</p>
                <p className="text-4xl font-bold mb-2 text-white">
                  R$ {totalMonthlyIncomeComplete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="text-sm text-white">Todas as fontes</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {totalMonthlyIncome > 0 && (
                    <div className="bg-green-500/30 px-2 py-0.5 rounded-full text-xs text-white">
                      Receitas: {totalMonthlyIncomeComplete > 0 ? ((totalMonthlyIncome / totalMonthlyIncomeComplete) * 100).toFixed(0) : '0'}%
                    </div>
                  )}
                  {totalInvestmentIncome > 0 && (
                    <div className="bg-blue-500/30 px-2 py-0.5 rounded-full text-xs text-white">
                      Investimentos: {totalMonthlyIncomeComplete > 0 ? ((totalInvestmentIncome / totalMonthlyIncomeComplete) * 100).toFixed(0) : '0'}%
                    </div>
                  )}
                  {totalRealEstateIncome > 0 && (
                    <div className="bg-purple-500/30 px-2 py-0.5 rounded-full text-xs text-white">
                      Imóveis: {totalMonthlyIncomeComplete > 0 ? ((totalRealEstateIncome / totalMonthlyIncomeComplete) * 100).toFixed(0) : '0'}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gastos Mensais */}
          <div 
            onClick={() => setSelectedBreakdown('expenses')}
            className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <TrendingDown className="h-8 w-8" />
                </div>
                <Receipt className="h-6 w-6 opacity-60" />
              </div>
              <div>
                <p className="text-red-100 text-sm font-medium mb-2">Gastos Mensais</p>
                <p className="text-4xl font-bold mb-2 text-white">
                  R$ {totalMonthlyExpensesComplete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="text-sm text-white">Todos os gastos</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <div className="bg-red-500/30 px-2 py-0.5 rounded-full text-xs text-white">
                    Fixos: {totalMonthlyExpensesComplete > 0 ? ((totalBills / totalMonthlyExpensesComplete) * 100).toFixed(0) : '0'}%
                  </div>
                  <div className="bg-orange-500/30 px-2 py-0.5 rounded-full text-xs text-white">
                    Dívidas: {totalMonthlyExpensesComplete > 0 ? ((totalLoanPayments / totalMonthlyExpensesComplete) * 100).toFixed(0) : '0'}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Saldo Mensal */}
          <div 
            onClick={() => setSelectedBreakdown('balance')}
            className={`group relative overflow-hidden bg-gradient-to-br ${netMonthlyIncomeComplete >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600'} rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer hover:scale-105`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <DollarSign className="h-8 w-8" />
                </div>
                <Calendar className="h-6 w-6 opacity-60" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-2">Saldo Mensal</p>
                <p className="text-4xl font-bold mb-2">
                  <span className="text-white">{netMonthlyIncomeComplete < 0 ? '-' : ''}R$ {Math.abs(netMonthlyIncomeComplete).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="text-sm text-white">{netMonthlyIncomeComplete >= 0 ? 'Positivo' : 'Negativo'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <div className="bg-white/30 px-2 py-0.5 rounded-full text-xs text-white">
                    Proporção: {totalMonthlyIncomeComplete > 0 ? 
                      ((totalMonthlyExpensesComplete / totalMonthlyIncomeComplete) * 100).toFixed(0) : '0'}% da renda
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional income details section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalhamento das Fontes de Renda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-green-600 text-sm font-medium">Fontes de Renda</p>
                      <p className="text-lg font-bold text-green-700">R$ {totalMonthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                    {totalMonthlyIncomeComplete > 0 ? ((totalMonthlyIncome / totalMonthlyIncomeComplete) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Investimentos</p>
                      <p className="text-lg font-bold text-blue-700">R$ {totalInvestmentIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    {totalMonthlyIncomeComplete > 0 ? ((totalInvestmentIncome / totalMonthlyIncomeComplete) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Home className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Aluguéis</p>
                      <p className="text-lg font-bold text-purple-700">R$ {totalRealEstateIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">
                    {totalMonthlyIncomeComplete > 0 ? ((totalRealEstateIncome / totalMonthlyIncomeComplete) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalhamento dos Custos Mensais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Transações</p>
                      <p className="text-lg font-bold text-blue-700">R$ {totalMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    {((totalMonthlyExpenses / totalMonthlyExpensesComplete) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-red-600 text-sm font-medium">Empréstimos</p>
                      <p className="text-lg font-bold text-red-700">R$ {totalLoanPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    {((totalLoanPayments / totalMonthlyExpensesComplete) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Contas</p>
                      <p className="text-lg font-bold text-orange-700">R$ {totalBills.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                    {((totalBills / totalMonthlyExpensesComplete) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Previdência</p>
                      <p className="text-lg font-bold text-blue-700">R$ {totalRetirementContribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    {((totalRetirementContribution / totalMonthlyExpensesComplete) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Home className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Imóveis</p>
                      <p className="text-lg font-bold text-purple-700">R$ {totalRealEstateExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">
                    {((totalRealEstateExpenses / totalMonthlyExpensesComplete) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-teal-600" />
                    <div>
                      <p className="text-teal-600 text-sm font-medium">Veículos</p>
                      <p className="text-lg font-bold text-teal-700">R$ {totalVehicleExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-teal-500 bg-teal-50 px-2 py-0.5 rounded-full">
                    {((totalVehicleExpenses / totalMonthlyExpensesComplete) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-indigo-600 text-sm font-medium">Impostos</p>
                      <p className="text-lg font-bold text-indigo-700">R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {((totalTaxes / totalMonthlyExpensesComplete) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="text-pink-600 text-sm font-medium">Funcionários</p>
                      <p className="text-lg font-bold text-pink-700">R$ {(0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="text-xs text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">
                    0%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Investment Expenses Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Alocação para Investimentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-medium text-gray-800">Metas Financeiras</h4>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate('/?tab=financial-goals');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Ver detalhes
                  </button>
                </div>
                <p className="text-xl font-bold text-indigo-700">
                  R$ {totalFinancialGoals > 0 ? (totalFinancialGoals / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}/mês
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-indigo-600">Poupança direcionada a objetivos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Patrimônio */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-1 h-8 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Patrimônio</h2>
        </div>

        {/* Cards Secundários - Ativos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ativos Líquidos */}
          <div 
            onClick={() => setSelectedBreakdown('liquid-assets')}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Wallet className="h-8 w-8" />
                </div>
                <BarChart3 className="h-6 w-6 opacity-60" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-2">Ativos Líquidos</p>
                <p className="text-4xl font-bold mb-2">R$ {liquidAssets.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-sm">Disponível</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setSelectedBreakdown('financial-goals')}
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Target className="h-8 w-8" />
                </div>
                <DollarSign className="h-6 w-6 opacity-60" />
              </div>
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-2">Metas Financeiras</p>
                <p className="text-4xl font-bold mb-2">R$ {totalFinancialGoals.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <PiggyBank className="h-4 w-4 text-indigo-200" />
                  <span className="text-sm text-indigo-100">Alocação para objetivos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ativos Imobilizados */}
          <div 
            onClick={() => setSelectedBreakdown('immobilized-assets')}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Landmark className="h-8 w-8" />
                </div>
                <Building className="h-6 w-6 opacity-60" />
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Ativos Imobilizados</p>
                <p className="text-4xl font-bold mb-2">R$ {immobilizedAssets.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-sm">Longo Prazo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Detalhadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div 
            onClick={() => setSelectedBreakdown('investments')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Investimentos</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalInvestmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +R$ {totalInvestmentIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedBreakdown('real-estate')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Imóveis</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalRealEstateValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +R$ {totalRealEstateIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Home className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setSelectedBreakdown('financial-goals')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-200 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Metas Financeiras</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalFinancialGoals.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-indigo-600 mt-1">
                  Economia direcionada
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedBreakdown('retirement')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Previdência</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalRetirementSaved.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  R$ {totalRetirementContribution.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedBreakdown('vehicles')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Veículos</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalVehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  -R$ {totalVehicleDepreciation.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedBreakdown('exotic-assets')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Ativos Exóticos</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalExoticAssetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className={`text-sm ${totalExoticAssetsAppreciation >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                  {totalExoticAssetsAppreciation >= 0 ? '+' : ''}R$ {totalExoticAssetsAppreciation.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Gem className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedBreakdown('taxes')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Impostos</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-indigo-600 mt-1">
                  Mensal
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Landmark className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedBreakdown('debts')}
            className="bg-white p-6 rounded-2xl shadow-lg border border-red-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Dívidas</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  R$ {totalLoanPayments.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução Patrimonial */}
      <WealthEvolutionChart />

      {/* Insights da IA */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Insights da IA</h2>
          </div>
          <a href="/smart-alerts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center ml-auto">
            <Bell className="h-4 w-4 mr-1" />
            <span>Ver todos os alertas</span>
          </a>
        </div>
        
        <div className="space-y-4">
          {aiInsights.slice(0, 3).map((insight) => {
            const Icon = getInsightIcon(insight.type);
            const colorClass = getInsightColor(insight.type);
            
            return (
              <div key={insight.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{insight.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      Impacto {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                    <span className="text-xs text-gray-500">{insight.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Ficha Técnica */}
      {selectedBreakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">
                Ficha Técnica - {
                  selectedBreakdown === 'liquid-assets' ? 'Ativos Líquidos' :
                  selectedBreakdown === 'immobilized-assets' ? 'Ativos Imobilizados' :
                  selectedBreakdown === 'income' ? 'Renda Mensal' :
                  selectedBreakdown === 'expenses' ? 'Gastos Mensais' :
                  selectedBreakdown === 'balance' ? 'Saldo Mensal' :
                  selectedBreakdown === 'assets' ? 'Total de Ativos' :
                  selectedBreakdown === 'investments' ? 'Investimentos' :
                  selectedBreakdown === 'real-estate' ? 'Imóveis' :
                  selectedBreakdown === 'retirement' ? 'Previdência' :
                  selectedBreakdown === 'bank-accounts' ? 'Contas Bancárias' :
                  selectedBreakdown === 'vehicles' ? 'Veículos' :
                  selectedBreakdown === 'exotic-assets' ? 'Ativos Exóticos' :
                  selectedBreakdown === 'taxes' ? 'Impostos' :
                  selectedBreakdown === 'financial-goals' ? 'Metas Financeiras' :
                  selectedBreakdown === 'debts' ? 'Dívidas' : ''
                }
              </h2>
              <button
                onClick={() => setSelectedBreakdown(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <FinancialBreakdown type={selectedBreakdown} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Financial Goals Breakdown Component
function FinancialGoalsBreakdown() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch goals data - in a real implementation this would come from supabase
    // For now we'll use static data
    setLoading(true);
    
    const mockGoals = [
      {
        id: '1',
        name: 'Viagem para Europa',
        targetAmount: 15000,
        currentAmount: 5000,
        targetDate: '2025-12-20',
        category: 'travel',
        progress: 33.33
      },
      {
        id: '2',
        name: 'Abrir consultoria financeira',
        targetAmount: 50000,
        currentAmount: 12500,
        targetDate: '2026-06-30',
        category: 'business',
        progress: 25
      }
    ];
    
    setTimeout(() => {
      setGoals(mockGoals);
      setLoading(false);
    }, 500);
    
  }, []);
  
  return (
    <div className="p-6 space-y-6">
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-indigo-800 mb-1">Total em Metas Financeiras</h3>
            <p className="text-3xl font-bold text-indigo-700">
              R$ {goals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString('pt-BR')}
            </p>
          </div>
          <Target className="h-8 w-8 text-indigo-600" />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 mb-4">
        <h3 className="font-medium text-indigo-800 mb-2">Sobre Metas Financeiras</h3>
        <p className="text-gray-700">
          Metas financeiras são consideradas uma alocação do seu patrimônio, pois representam capital que você está 
          reservando para objetivos específicos. Ao mesmo tempo, as contribuições mensais para estas metas entram como 
          despesas de investimento no seu fluxo de caixa.
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Suas Metas Financeiras</h3>
        
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma meta financeira configurada.</p>
            <button
              onClick={() => navigate('/?tab=financial-goals')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Configurar Metas
            </button>
          </div>
        ) : (
          goals.map((goal, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between mb-2">
                <h4 className="font-medium text-gray-800">{goal.name}</h4>
                <span className="text-indigo-600 font-medium">
                  {goal.progress}% concluído
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Meta: R$ {goal.targetAmount.toLocaleString('pt-BR')}</span>
                <span className="text-green-600">
                  Economizado: R$ {goal.currentAmount.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate('/?tab=financial-goals')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Target className="h-4 w-4" />
          <span>Gerenciar Metas Financeiras</span>
        </button>
      </div>
    </div>
  );
}