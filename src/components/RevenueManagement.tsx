import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  PieChart,
  Building,
  Home,
  Briefcase,
  Target,
  AlertTriangle,
  Edit,
  Trash2,
  Star,
  Landmark
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RevenueItem {
  id: string;
  type: 'income_source' | 'investment' | 'real_estate' | 'transaction';
  description: string;
  amount: number;
  category: string;
  date: string;
  source: string;
  frequency: string;
  recurring: boolean;
  tax_rate?: number; // Taxa de imposto
}

export default function RevenueManagement() {
  const { user } = useAuth();
  const [revenues, setRevenues] = useState<RevenueItem[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<RevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');

  useEffect(() => {
    if (user) {
      fetchAllRevenues();
    }
  }, [user]);

  useEffect(() => {
    filterRevenues();
  }, [revenues, searchTerm, selectedCategory, selectedPeriod]);

  const fetchAllRevenues = async () => {
    try {
      setLoading(true);
      setError(null); 

      // Buscar todos os tipos de receitas
      const [
        incomeSourceData,
        investmentData,
        realEstateData,
        transactionData
      ] = await Promise.all([
        supabase.from('income_sources').select('*').eq('user_id', user?.id).eq('is_active', true),
        supabase.from('investments').select('*').eq('user_id', user?.id),
        supabase.from('real_estate').select('*').eq('user_id', user?.id),
        supabase.from('transactions').select('*').eq('user_id', user?.id).eq('type', 'income').order('created_at', { ascending: false })
      ]);

      const allRevenues: RevenueItem[] = [];

      // Processar fontes de renda
      (incomeSourceData.data || []).forEach(income => {
        allRevenues.push({
          id: `income-${income.id}`,
          type: 'income_source',
          description: income.name,
          amount: income.amount,
          category: income.category,
          date: income.next_payment || new Date().toISOString().split('T')[0],
          source: 'Fonte de Renda',
          frequency: income.frequency,
          recurring: true,
          tax_rate: income.tax_rate
        });
      });

      // Processar investimentos com renda
      (investmentData.data || []).forEach(investment => {
        let monthlyIncome = 0;
        
        // Calcular renda mensal com base no tipo de investimento
        if (investment.type === 'acoes' || investment.type === 'fundos-imobiliarios') {
          if (investment.dividend_yield && investment.quantity && investment.current_price) {
            const currentValue = investment.quantity * investment.current_price;
            monthlyIncome = (currentValue * investment.dividend_yield) / 100 / 12;
          } else if (investment.monthly_income) {
            monthlyIncome = investment.monthly_income;
          }
        } else if (investment.interest_rate && investment.amount) {
          monthlyIncome = (investment.amount * investment.interest_rate) / 100 / 12;
        } else if (investment.monthly_income) {
          monthlyIncome = investment.monthly_income;
        }
        
        // Apenas adicionar se houver renda mensal
        if (monthlyIncome > 0) {
          allRevenues.push({
            id: `investment-${investment.id}`,
            type: 'investment',
            description: `Renda de ${investment.name}`,
            amount: monthlyIncome,
            category: 'Investimentos',
            date: new Date().toISOString().split('T')[0],
            source: investment.broker,
            frequency: 'monthly',
            recurring: true,
            tax_rate: investment.tax_rate
          });
        }
      });

      // Processar imóveis com renda
      (realEstateData.data || []).forEach(property => {
        if (property.monthly_rent && property.monthly_rent > 0) {
          const netRent = property.monthly_rent - property.expenses;
          allRevenues.push({
            id: `real-estate-${property.id}`,
            type: 'real_estate',
            description: `Aluguel - ${property.address}`,
            amount: netRent,
            category: 'Imóveis',
            date: new Date().toISOString().split('T')[0],
            source: 'Aluguel',
            frequency: 'monthly',
            recurring: true,
            tax_rate: property.tax_rate
          });
        }
      });

      // Processar transações de receita
      (transactionData.data || []).forEach(transaction => {
        allRevenues.push({
          id: `transaction-${transaction.id}`,
          type: 'transaction',
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          source: 'Transação',
          frequency: transaction.is_recurring ? 'monthly' : 'one-time',
          recurring: transaction.is_recurring,
          tax_rate: transaction.tax_rate
        });
      });

      setRevenues(allRevenues);
    } catch (err) {
      console.error('Error fetching revenues:', err);
      setError('Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  };

  const filterRevenues = () => {
    let filtered = [...revenues];

    // Filtro por período
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filtered = filtered.filter(revenue => {
        const revenueDate = new Date(revenue.date);
        
        switch (selectedPeriod) {
          case 'current-month':
            return revenue.recurring || 
                   (revenueDate.getMonth() === currentMonth && revenueDate.getFullYear() === currentYear);
          case 'last-month':
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return revenueDate.getMonth() === lastMonth && revenueDate.getFullYear() === lastMonthYear;
          case 'current-year':
            return revenueDate.getFullYear() === currentYear;
          default:
            return true;
        }
      });
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(revenue => revenue.category === selectedCategory);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(revenue =>
        revenue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revenue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revenue.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Agrupar por categoria para o gráfico
    const revenuesByCategory = filtered.reduce((acc, revenue) => {
      const monthlyAmount = calculateMonthlyRevenue(revenue);
      acc[revenue.category] = (acc[revenue.category] || 0) + monthlyAmount;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate totals by source type
    const totalsByType = filtered.reduce((acc, revenue) => {
      const monthlyAmount = calculateMonthlyRevenue(revenue);
      if (!acc[revenue.type]) {
        acc[revenue.type] = 0;
      }
      acc[revenue.type] += monthlyAmount;
      return acc;
    }, {} as Record<string, number>);

    // Update localStorage with data for dashboard
    if (typeof window !== 'undefined') {
      // Prepare to update localStorage with category data for dashboard
      localStorage.setItem('revenueCategories', JSON.stringify(revenuesByCategory));
      localStorage.setItem('revenuesByType', JSON.stringify(totalsByType));
    }

    setFilteredRevenues(filtered);
  };

  const getRevenueIcon = (type: string) => {
    switch (type) {
      case 'income_source': return Briefcase;
      case 'investment': return Building;
      case 'real_estate': return Home;
      case 'transaction': return DollarSign;
      default: return TrendingUp;
    }
  };

  const getRevenueColor = (type: string) => {
    switch (type) {
      case 'income_source': return 'bg-green-100 text-green-600';
      case 'investment': return 'bg-blue-100 text-blue-600';
      case 'real_estate': return 'bg-orange-100 text-orange-600';
      case 'transaction': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensal';
      case 'weekly': return 'Semanal';
      case 'yearly': return 'Anual';
      case 'one-time': return 'Única';
      default: return frequency;
    }
  };

  const calculateMonthlyRevenue = (revenue: RevenueItem) => {
    if (!revenue.recurring && revenue.frequency === 'one-time') {
      // Non-recurring one-time revenues shouldn't contribute to monthly calculations
      return 0;
    }
    
    switch (revenue.frequency) {
      case 'weekly': return revenue.amount * 4.33;
      case 'yearly': return revenue.amount / 12;
      case 'monthly':
      default: return revenue.amount;
    }
  };

  // Calcular total de receitas mensais
  const totalRevenues = filteredRevenues.reduce((sum, revenue) => sum + calculateMonthlyRevenue(revenue), 0); 
  
  // Get the current month name for display
  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  
  // Calculate totals by source type
  const totalsByType = filteredRevenues.reduce((acc, revenue) => {
    const monthlyAmount = calculateMonthlyRevenue(revenue);
    if (!acc[revenue.type]) {
      acc[revenue.type] = 0;
    }
    acc[revenue.type] += monthlyAmount;
    return acc;
  }, {} as Record<string, number>);
    
  // Calcular total de impostos
  const totalTaxes = filteredRevenues.reduce((sum, revenue) => {
    if (!revenue.tax_rate) return sum;
    const monthlyAmount = calculateMonthlyRevenue(revenue);
    return sum + (monthlyAmount * revenue.tax_rate / 100);
  }, 0);
  
  // Only include recurring revenues that contribute to monthly income
  const recurringRevenues = filteredRevenues.filter(revenue => 
    revenue.recurring && calculateMonthlyRevenue(revenue) > 0
  );
  
  // Only include one-time revenues
  const oneTimeRevenues = filteredRevenues.filter(revenue => !revenue.recurring);
  
  // Agrupar por categoria para o gráfico
  const revenuesByCategory = filteredRevenues.reduce((acc, revenue) => {
    const monthlyAmount = calculateMonthlyRevenue(revenue);
    acc[revenue.category] = (acc[revenue.category] || 0) + monthlyAmount;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.keys(revenuesByCategory);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Receitas</h1>
          <p className="text-gray-500 mt-1">Visão completa de todas as suas fontes de renda</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Receita Total Mensal</p>
              <p className="text-3xl font-bold mt-1 text-white">
                R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-100 mt-1">Projeção para {currentMonthName}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Impostos Estimados</p>
              <p className="text-3xl font-bold mt-1 text-white">R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Receitas Recorrentes</p>
              <p className="text-3xl font-bold mt-1">R$ {recurringRevenues.reduce((sum, r) => sum + calculateMonthlyRevenue(r), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-blue-100 text-sm">{recurringRevenues.length} fontes</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
      
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Receitas Extras</p>
              <p className="text-3xl font-bold mt-1">R$ {oneTimeRevenues.reduce((sum, r) => sum + r.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-purple-100 text-sm">{oneTimeRevenues.length} itens</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Star className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar receitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          >
            <option value="current-month">Mês atual</option>
            <option value="last-month">Mês passado</option>
            <option value="current-year">Ano atual</option>
            <option value="all">Todos os períodos</option>
          </select>

          <button
            onClick={() => {
              // Export revenue categories data for dashboard
              localStorage.setItem('revenueCategories', JSON.stringify(revenuesByCategory));
            }}
            className="hidden"
          >
            Sync
          </button>
        </div>
      </div>

      {/* Gráfico por categoria */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Receitas por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => {
              const amount = revenuesByCategory[category];
              const percentage = (amount / totalRevenues) * 100;
              
              return (
                <div key={category} className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{category}</h3>
                    <span className="text-sm text-green-600 font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                  <p className="text-lg font-bold text-green-700">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo por tipo de fonte */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Receitas por Fonte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalsByType['income_source'] > 0 && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Fontes de Renda</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {totalsByType['income_source'].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                    style={{ width: `${(totalsByType['income_source'] / totalRevenues) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-green-600 mt-1 text-right">
                  {((totalsByType['income_source'] / totalRevenues) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {totalsByType['investment'] > 0 && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Investimentos</p>
                  <p className="text-2xl font-bold text-blue-700">
                    R$ {totalsByType['investment'].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                    style={{ width: `${(totalsByType['investment'] / totalRevenues) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-1 text-right">
                  {((totalsByType['investment'] / totalRevenues) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {totalsByType['real_estate'] > 0 && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Imóveis</p>
                  <p className="text-2xl font-bold text-orange-700">
                    R$ {totalsByType['real_estate'].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Home className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-orange-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                    style={{ width: `${(totalsByType['real_estate'] / totalRevenues) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-orange-600 mt-1 text-right">
                  {((totalsByType['real_estate'] / totalRevenues) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {totalsByType['transaction'] > 0 && (
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Outras Receitas</p>
                  <p className="text-2xl font-bold text-purple-700">
                    R$ {totalsByType['transaction'].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${(totalsByType['transaction'] / totalRevenues) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-purple-600 mt-1 text-right">
                  {((totalsByType['transaction'] / totalRevenues) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detalhamento de Receitas por Fonte */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Detalhamento de Receitas</h2>
        <p className="text-gray-500 mb-4 text-sm">Lista completa de todas as suas fontes de receita</p>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <h3 className="font-medium text-gray-700">Aluguéis de Imóveis</h3>
          {filteredRevenues.filter(r => r.type === 'real_estate').map((revenue, idx) => (
            <div key={`re-${idx}`} className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-800">{revenue.description}</p>
                  <p className="text-sm text-gray-600">{revenue.source}</p>
                </div>
                <p className="font-semibold text-green-600">R$ {revenue.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          ))}
          
          <h3 className="font-medium text-gray-700 mt-6">Dividendos de Investimentos</h3>
          {filteredRevenues.filter(r => r.type === 'investment').map((revenue, idx) => (
            <div key={`inv-${idx}`} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-800">{revenue.description}</p>
                  <p className="text-sm text-gray-600">{revenue.source}</p>
                </div>
                <p className="font-semibold text-green-600">R$ {revenue.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          ))}
          
          <h3 className="font-medium text-gray-700 mt-6">Fontes de Renda</h3>
          {filteredRevenues.filter(r => r.type === 'income_source').map((revenue, idx) => (
            <div key={`inc-${idx}`} className="bg-green-50 p-3 rounded-lg border border-green-100">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-gray-800">{revenue.description}</p>
                    {revenue.tax_rate && revenue.tax_rate > 0 && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        IRPF {revenue.tax_rate}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{revenue.category} - {getFrequencyLabel(revenue.frequency)}</p>
                </div>
                <p className="font-semibold text-green-600">R$ {revenue.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          ))}
          
          <h3 className="font-medium text-gray-700 mt-6">Outras Receitas</h3>
          {filteredRevenues.filter(r => r.type === 'transaction').map((revenue, idx) => (
            <div key={`trans-${idx}`} className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-800">{revenue.description}</p>
                  <p className="text-sm text-gray-600">{revenue.category}</p>
                </div>
                <p className="font-semibold text-green-600">R$ {revenue.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de receitas */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Todas as Receitas</h2>
          <p className="text-gray-500 text-sm mt-1">{filteredRevenues.length} receitas encontradas</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredRevenues.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma receita encontrada</h3>
              <p className="text-gray-500">Ajuste os filtros para ver mais resultados.</p>
            </div>
          ) : (
            filteredRevenues.map((revenue) => {
              const Icon = getRevenueIcon(revenue.type);
              const colorClass = getRevenueColor(revenue.type);
              const monthlyAmount = calculateMonthlyRevenue(revenue);
              
              // Calcular imposto se houver taxa
              const taxAmount = revenue.tax_rate ? (monthlyAmount * revenue.tax_rate / 100) : 0;
              
              return (
                <div key={revenue.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-800">{revenue.description}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">{revenue.category}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{revenue.source}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {getFrequencyLabel(revenue.frequency)}
                          </span>
                          {revenue.recurring && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Recorrente
                              </span>
                            </>
                          )}
                          {revenue.tax_rate && revenue.tax_rate > 0 && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center space-x-1">
                                <Landmark className="h-3 w-3" />
                                <span>IRPF {revenue.tax_rate}%</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-semibold text-lg text-green-600 whitespace-nowrap">
                        R$ {revenue.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span> 
                      {revenue.frequency !== 'monthly' && (
                        <p className="text-sm text-gray-500">
                          ≈ <span className="font-medium">R$ {monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                        </p>
                      )}
                      {taxAmount > 0 && (
                        <p className="text-sm text-indigo-600 flex items-center mt-1">
                          <Landmark className="h-3 w-3 mr-1" />
                          <span>IRPF: R$ {taxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}