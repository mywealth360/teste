import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Edit, 
  Trash2, 
  Save, 
  X 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      if (selectedPeriod !== 'all') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        if (selectedPeriod === 'current-month') {
          const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
          const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
          query = query.gte('date', startOfMonth).lte('date', endOfMonth);
        } else if (selectedPeriod === 'last-month') {
          const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
          const endOfLastMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
          query = query.gte('date', startOfLastMonth).lte('date', endOfLastMonth);
        } else if (selectedPeriod === 'current-year') {
          const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
          const endOfYear = new Date(currentYear, 11, 31).toISOString().split('T')[0];
          query = query.gte('date', startOfYear).lte('date', endOfYear);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          user_id: user?.id,
        }]);

      if (error) throw error;
      
      setShowAddModal(false);
      fetchTransactions();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('Erro ao adicionar transação');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      is_recurring: transaction.is_recurring
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;
      
      setEditingId(null);
      setEditForm({});
      fetchTransactions();
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError('Erro ao atualizar transação');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Erro ao excluir transação');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (searchTerm === '') return true;
    
    return (
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

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
          <h1 className="text-3xl font-bold text-gray-800">Transações</h1>
          <p className="text-gray-500 mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Transação</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Receitas</p>
              <p className="text-3xl font-bold mt-1">R$ {totalIncome.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Despesas</p>
              <p className="text-3xl font-bold mt-1">R$ {totalExpense.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} p-6 rounded-2xl text-white shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Saldo</p>
              <p className="text-3xl font-bold mt-1">R$ {Math.abs(balance).toLocaleString('pt-BR')}</p>
              <p className="text-white/80 text-sm">{balance >= 0 ? 'Positivo' : 'Negativo'}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="h-6 w-6" />
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
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              fetchTransactions();
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              fetchTransactions();
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="current-month">Mês atual</option>
            <option value="last-month">Mês passado</option>
            <option value="current-year">Ano atual</option>
            <option value="all">Todos os períodos</option>
          </select>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Suas Transações</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
              <p className="text-gray-500">Adicione transações para acompanhar suas finanças.</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                {editingId === transaction.id ? (
                  // Modo de edição
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={editForm.type || ''}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'income' | 'expense' })}
                        className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="income">Receita</option>
                        <option value="expense">Despesa</option>
                      </select>
                      <input
                        type="number"
                        value={editForm.amount || ''}
                        onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                        className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Valor"
                        step="0.01"
                      />
                    </div>
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Descrição"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Categoria"
                      />
                      <input
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_recurring || false}
                        onChange={(e) => setEditForm({ ...editForm, is_recurring: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="text-gray-700">Recorrente</span>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo de visualização
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-800">{transaction.description}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">{transaction.category}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </span>
                          {transaction.is_recurring && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Recorrente
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`font-semibold text-lg ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR')}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de adicionar transação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Nova Transação</h2>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddTransaction({
                type: formData.get('type') as 'income' | 'expense',
                amount: Number(formData.get('amount')),
                category: formData.get('category') as string,
                description: formData.get('description') as string,
                date: formData.get('date') as string,
                is_recurring: formData.has('is_recurring'),
              });
            }} className="p-6 space-y-4">
              <select
                name="type"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Tipo de Transação</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
              
              <input
                type="number"
                name="amount"
                placeholder="Valor (R$)"
                step="0.01"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              
              <input
                type="text"
                name="description"
                placeholder="Descrição"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              
              <input
                type="text"
                name="category"
                placeholder="Categoria (ex: Alimentação, Transporte)"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              
              <input
                type="date"
                name="date"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="is_recurring" className="rounded text-blue-600" />
                <span className="text-gray-700">Transação recorrente</span>
              </label>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}