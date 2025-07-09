import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly' | 'one-time';
  category: string;
  next_payment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tax_rate: number;
}

export default function RevenueManagement() {
  const { user } = useAuth();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as const,
    category: '',
    next_payment: '',
    tax_rate: ''
  });

  useEffect(() => {
    if (user) {
      fetchIncomeSources();
    }
  }, [user]);

  const fetchIncomeSources = async () => {
    setLoading(true);
    try {
      // Fetch income sources from income_sources table
      const { data: incomeSources, error: incomeError } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user?.id);

      if (incomeError) throw incomeError;
      
      // Fetch rental income from real_estate table
      const { data: realEstateData, error: realEstateError } = await supabase
        .from('real_estate')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_rented', true);
        
      if (realEstateError) throw realEstateError;
      
      // Fetch dividend income from investments table
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user?.id);
        
      if (investmentsError) throw investmentsError;
      
      // Convert rental properties to income sources format
      const rentalIncome = (realEstateData || []).map(property => ({
        id: `rental-${property.id}`,
        user_id: property.user_id,
        name: `Aluguel: ${property.address}`,
        amount: property.monthly_rent || 0,
        frequency: 'monthly' as const,
        category: 'Aluguel',
        is_active: true,
        tax_rate: property.tax_rate || 0,
        created_at: property.created_at,
        updated_at: property.updated_at
      }));
      
      // Convert investments with dividends to income sources format
      const dividendIncome = (investmentsData || [])
        .filter(investment => investment.dividend_yield || investment.monthly_income)
        .map(investment => {
          let monthlyAmount = 0;
          
          if (investment.dividend_yield && investment.quantity && investment.current_price) {
            const currentValue = investment.quantity * investment.current_price;
            monthlyAmount = (currentValue * investment.dividend_yield) / 100 / 12;
          } else if (investment.monthly_income) {
            monthlyAmount = investment.monthly_income;
          }
          
          return {
            id: `dividend-${investment.id}`,
            user_id: investment.user_id,
            name: `Dividendos: ${investment.name}`,
            amount: monthlyAmount,
            frequency: 'monthly' as const,
            category: 'Dividendos',
            is_active: true,
            tax_rate: investment.tax_rate || 0,
            created_at: investment.created_at,
            updated_at: investment.updated_at
          };
        });
      
      // Combine all income sources
      const allIncomeSources = [
        ...(incomeSources || []),
        ...rentalIncome,
        ...dividendIncome
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setIncomeSources(allIncomeSources);
    } catch (error) {
      console.error('Error fetching income sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('income_sources')
        .insert([{
          user_id: user.id,
          name: formData.name,
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
          category: formData.category,
          next_payment: formData.next_payment || null,
          tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : null
        }]);

      if (error) throw error;
      
      setFormData({
        name: '',
        amount: '',
        frequency: 'monthly',
        category: '',
        next_payment: '',
        tax_rate: ''
      });
      setShowAddForm(false);
      fetchIncomeSources();
    } catch (error) {
      console.error('Error adding income source:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fonte de renda?')) return;

    try {
      const { error } = await supabase
        .from('income_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchIncomeSources();
    } catch (error) {
      console.error('Error deleting income source:', error);
    }
  };

  const calculateTotalMonthlyIncome = () => {
    return incomeSources
      .filter(source => source.is_active)
      .reduce((total, source) => {
        let monthlyAmount = source.amount;
        
        switch (source.frequency) {
          case 'weekly':
            monthlyAmount = source.amount * 4.33;
            break;
          case 'yearly':
            monthlyAmount = source.amount / 12;
            break;
          case 'one-time':
            monthlyAmount = 0;
            break;
        }
        
        return total + monthlyAmount;
      }, 0);
  };

  const calculateTotalYearlyIncome = () => {
    return incomeSources
      .filter(source => source.is_active)
      .reduce((total, source) => {
        let yearlyAmount = source.amount;
        
        switch (source.frequency) {
          case 'monthly':
            yearlyAmount = source.amount * 12;
            break;
          case 'weekly':
            yearlyAmount = source.amount * 52;
            break;
          case 'one-time':
            yearlyAmount = 0;
            break;
        }
        
        return total + yearlyAmount;
      }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatFrequency = (frequency: string) => {
    const frequencies = {
      monthly: 'Mensal',
      weekly: 'Semanal',
      yearly: 'Anual',
      'one-time': 'Única'
    };
    return frequencies[frequency as keyof typeof frequencies] || frequency;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Receitas</h2>
          <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Fonte de Renda</span>
          </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-green-600">Renda Mensal</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(calculateTotalMonthlyIncome())}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-blue-600">Renda Anual</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculateTotalYearlyIncome())}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{incomeSources.filter(s => s.is_active).length}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-purple-600">Fontes Ativas</p>
                <p className="text-2xl font-bold text-purple-900">{incomeSources.length} Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Nova Fonte de Renda</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                    <option value="one-time">Única</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Próximo Pagamento</label>
                  <input
                    type="date"
                    value={formData.next_payment}
                    onChange={(e) => setFormData({...formData, next_payment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taxa de Imposto (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Income Sources List */}
        <div className="space-y-4">
          {incomeSources.map((source) => (
            <div key={source.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{source.name}</h3>
                    {source.id.startsWith('rental-') && (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Aluguel
                      </span>
                    )}
                    {source.id.startsWith('dividend-') && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Dividendo
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      source.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {source.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{source.category}</p>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Valor:</span>
                      <span className="ml-2 font-medium">{formatCurrency(source.amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Frequência:</span>
                      <span className="ml-2 font-medium">{formatFrequency(source.frequency)}</span>
                    </div>
                    {source.next_payment && (
                      <div>
                        <span className="text-gray-500">Próximo:</span>
                        <span className="ml-2 font-medium">{new Date(source.next_payment).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {source.tax_rate && (
                      <div>
                        <span className="text-gray-500">Imposto:</span>
                        <span className="ml-2 font-medium">{source.tax_rate}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!source.id.startsWith('rental-') && !source.id.startsWith('dividend-') && (
                    <>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {incomeSources.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma fonte de renda encontrada
            </h3>
            <p className="text-gray-500 mb-4">
              Adicione sua primeira fonte de renda para começar a gerenciar suas receitas.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Primeira Fonte</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}