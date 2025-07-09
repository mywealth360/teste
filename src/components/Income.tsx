import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign, Calendar, Edit, Trash2, Save, X, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly' | 'one-time';
  category: string;
  next_payment?: string;
  is_active: boolean;
  tax_rate?: number; // Nova propriedade: taxa de imposto
  created_at: string;
  updated_at: string;
}

export default function Income() {
  const { user } = useAuth();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<IncomeSource>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [showTaxInfo, setShowTaxInfo] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchIncomeSources();
    }
  }, [user]);

  const fetchIncomeSources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncomeSources(data || []);
    } catch (err) {
      console.error('Error fetching income sources:', err);
      setError('Erro ao carregar fontes de renda');
    } finally {
      setLoading(false);
    }
  };

  const calculateTax = (amount: number, frequency: string = 'monthly'): { rate: number, amount: number } => {
    let monthlyAmount = amount;
    
    // Converter para valor mensal equivalente
    if (frequency === 'weekly') {
      monthlyAmount = amount * 4.33; // Média de semanas por mês
    } else if (frequency === 'yearly') {
      monthlyAmount = amount / 12;
    }
    
    // Simular cálculo de imposto baseado no valor mensal
    if (monthlyAmount > 5000) {
      return { rate: 27.5, amount: monthlyAmount * 0.275 };
    } else if (monthlyAmount > 3000) {
      return { rate: 15, amount: monthlyAmount * 0.15 };
    } else if (monthlyAmount > 1900) {
      return { rate: 7.5, amount: monthlyAmount * 0.075 };
    }
    
    return { rate: 0, amount: 0 };
  };

  const handleAddIncomeSource = async (incomeData: Omit<IncomeSource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calcular taxa de imposto automaticamente
      const { rate } = calculateTax(incomeData.amount, incomeData.frequency);
      
      const { error } = await supabase
        .from('income_sources')
        .insert([{
          ...incomeData,
          tax_rate: incomeData.tax_rate !== undefined ? incomeData.tax_rate : rate,
          user_id: user?.id,
        }]);

      if (error) throw error;
      
      setShowAddModal(false);
      fetchIncomeSources();
    } catch (err) {
      console.error('Error adding income source:', err);
      setError('Erro ao adicionar fonte de renda');
    }
  };

  const handleEditSource = (source: IncomeSource) => {
    setEditingId(source.id);
    setEditForm({
      name: source.name,
      amount: source.amount,
      frequency: source.frequency,
      category: source.category,
      next_payment: source.next_payment,
      is_active: source.is_active,
      tax_rate: source.tax_rate
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      // Recalcular taxa de imposto se o valor ou frequência mudou
      let updatedForm = { ...editForm };
      
      if (editForm.amount !== undefined || editForm.frequency !== undefined) {
        const sourceToUpdate = incomeSources.find(s => s.id === editingId);
        if (sourceToUpdate) {
          const amount = editForm.amount !== undefined ? editForm.amount : sourceToUpdate.amount;
          const frequency = editForm.frequency !== undefined ? editForm.frequency : sourceToUpdate.frequency;
          
          // Só recalcular automaticamente se o usuário não definiu manualmente
          if (editForm.tax_rate === undefined) {
            const { rate } = calculateTax(amount, frequency);
            updatedForm.tax_rate = rate;
          }
        }
      }

      const { error } = await supabase
        .from('income_sources')
        .update({
          ...updatedForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;
      
      setEditingId(null);
      setEditForm({});
      fetchIncomeSources();
    } catch (err) {
      console.error('Error updating income source:', err);
      setError('Erro ao atualizar fonte de renda');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fonte de renda?')) return;

    try {
      const { error } = await supabase
        .from('income_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchIncomeSources();
    } catch (err) {
      console.error('Error deleting income source:', err);
      setError('Erro ao excluir fonte de renda');
    }
  };

  const totalMonthlyIncome = incomeSources
    .filter(source => source.is_active)
    .reduce((sum, source) => {
      switch (source.frequency) {
        case 'monthly': return sum + source.amount;
        case 'weekly': return sum + (source.amount * 4.33);
        case 'yearly': return sum + (source.amount / 12);
        default: return sum;
      }
    }, 0);

  // Calcular total de impostos
  const totalTaxes = incomeSources
    .filter(source => source.is_active && source.tax_rate && source.tax_rate > 0)
    .reduce((sum, source) => {
      let monthlyAmount = source.amount;
      switch (source.frequency) {
        case 'weekly': monthlyAmount = source.amount * 4.33; break;
        case 'yearly': monthlyAmount = source.amount / 12; break;
      }
      return sum + (monthlyAmount * (source.tax_rate || 0) / 100);
    }, 0);

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensal';
      case 'weekly': return 'Semanal';
      case 'yearly': return 'Anual';
      case 'one-time': return 'Única';
      default: return frequency;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'bg-blue-100 text-blue-700';
      case 'weekly': return 'bg-green-100 text-green-700';
      case 'yearly': return 'bg-purple-100 text-purple-700';
      case 'one-time': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, frequency: string = 'monthly') => {
    const amount = Number(e.target.value);
    const { rate, amount: taxValue } = calculateTax(amount, frequency);
    setTaxRate(rate);
    setTaxAmount(taxValue);
    setShowTaxInfo(taxValue > 0);
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>, amount: string) => {
    if (amount) {
      const { rate, amount: taxValue } = calculateTax(Number(amount), e.target.value);
      setTaxRate(rate);
      setTaxAmount(taxValue);
      setShowTaxInfo(taxValue > 0);
    }
  };

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTaxRate = Number(e.target.value);
    setTaxRate(newTaxRate);
    
    // Recalcular o valor do imposto com base na nova alíquota
    const amountInput = document.querySelector('input[name="amount"]') as HTMLInputElement;
    if (amountInput && amountInput.value) {
      const amount = Number(amountInput.value);
      const frequencySelect = document.querySelector('select[name="frequency"]') as HTMLSelectElement;
      const frequency = frequencySelect ? frequencySelect.value : 'monthly';
      
      let monthlyAmount = amount;
      if (frequency === 'weekly') {
        monthlyAmount = amount * 4.33;
      } else if (frequency === 'yearly') {
        monthlyAmount = amount / 12;
      }
      
      setTaxAmount(monthlyAmount * newTaxRate / 100);
      setShowTaxInfo(newTaxRate > 0);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Fontes de Renda</h1>
          <p className="text-gray-500 mt-1">Gerencie suas receitas e projete seu futuro</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Fonte</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Renda Mensal Total</p>
              <p className="text-3xl font-bold mt-1">R$ {totalMonthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Impostos Estimados</p>
              <p className="text-3xl font-bold mt-1">R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Fontes Ativas</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {incomeSources.filter(s => s.is_active).length}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Próximo Pagamento</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {incomeSources
                  .filter(s => s.next_payment && s.is_active)
                  .sort((a, b) => new Date(a.next_payment!).getTime() - new Date(b.next_payment!).getTime())[0]
                  ?.next_payment 
                  ? new Date(incomeSources
                      .filter(s => s.next_payment && s.is_active)
                      .sort((a, b) => new Date(a.next_payment!).getTime() - new Date(b.next_payment!).getTime())[0]
                      .next_payment!).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de fontes de renda */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Suas Fontes de Renda</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {incomeSources.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma fonte de renda cadastrada</h3>
              <p className="text-gray-500">Adicione suas fontes de renda para acompanhar seus ganhos.</p>
            </div>
          ) : (
            incomeSources.map((source) => {
              // Calcular imposto para exibição
              const { rate, amount: taxValue } = calculateTax(source.amount, source.frequency);
              
              return (
                <div key={source.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  {editingId === source.id ? (
                    // Modo de edição
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          placeholder="Nome da fonte"
                        />
                        <input
                          type="number"
                          value={editForm.amount || ''}
                          onChange={(e) => {
                            setEditForm({ ...editForm, amount: Number(e.target.value) });
                            handleAmountChange(e, editForm.frequency || source.frequency);
                          }}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          placeholder="Valor"
                          step="0.01"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                          value={editForm.frequency || ''}
                          onChange={(e) => {
                            setEditForm({ ...editForm, frequency: e.target.value as any });
                            handleFrequencyChange(e, editForm.amount?.toString() || source.amount.toString());
                          }}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        >
                          <option value="monthly">Mensal</option>
                          <option value="weekly">Semanal</option>
                          <option value="yearly">Anual</option>
                          <option value="one-time">Única</option>
                        </select>
                        <input
                          type="text"
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          placeholder="Categoria"
                        />
                        <input
                          type="date"
                          value={editForm.next_payment || ''}
                          onChange={(e) => setEditForm({ ...editForm, next_payment: e.target.value })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editForm.is_active || false}
                            onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            className="rounded text-green-600"
                          />
                          <span className="text-gray-700">Ativa</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editForm.tax_rate !== undefined ? editForm.tax_rate : ''}
                            onChange={(e) => setEditForm({ ...editForm, tax_rate: Number(e.target.value) || 0 })}
                            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            placeholder="Alíquota de imposto (%)"
                            step="0.01"
                          />
                          <Landmark className="h-4 w-4 text-indigo-600" />
                        </div>
                      </div>
                      
                      <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                        <div className="flex items-center space-x-2">
                          <Landmark className="h-4 w-4 text-indigo-600" />
                          <p className="text-sm text-indigo-700 font-medium">
                            Imposto estimado: R$ {
                              editForm.amount && (editForm.tax_rate !== undefined ? editForm.tax_rate : taxRate) > 0 
                                ? ((editForm.amount * (editForm.tax_rate !== undefined ? editForm.tax_rate : taxRate)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                : '0,00'
                            } ({editForm.tax_rate !== undefined ? editForm.tax_rate : taxRate}%)
                          </p>
                        </div>
                        <p className="text-xs text-indigo-600 mt-1">
                          Esta taxa será salva automaticamente e usada para cálculos de impostos.
                        </p>
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
                          source.is_active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <TrendingUp className={`h-6 w-6 ${
                            source.is_active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-800">{source.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getFrequencyColor(source.frequency)}`}>
                              {getFrequencyLabel(source.frequency)}
                            </span>
                            {!source.is_active && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                Inativa
                              </span>
                            )}
                            {source.tax_rate && source.tax_rate > 0 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 flex items-center space-x-1">
                                <Landmark className="h-3 w-3" />
                                <span>IRPF {source.tax_rate}%</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">{source.category}</span>
                            {source.next_payment && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-500">
                                  Próximo: {new Date(source.next_payment).toLocaleDateString('pt-BR')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-semibold text-xl text-green-600">
                            R$ {source.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {source.tax_rate && source.tax_rate > 0 && (
                            <p className="text-sm text-indigo-600">
                              Imposto: R$ {((source.amount * source.tax_rate) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEditSource(source)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSource(source.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de adicionar fonte de renda */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Nova Fonte de Renda</h2>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const amount = Number(formData.get('amount'));
              const frequency = formData.get('frequency') as 'monthly' | 'weekly' | 'yearly' | 'one-time';
              const manualTaxRate = formData.get('tax_rate') ? Number(formData.get('tax_rate')) : undefined;
              
              // Calcular taxa de imposto se não foi informada manualmente
              const { rate } = calculateTax(amount, frequency);
              const finalTaxRate = manualTaxRate !== undefined ? manualTaxRate : rate;
              
              handleAddIncomeSource({
                name: formData.get('name') as string,
                amount,
                frequency,
                category: formData.get('category') as string,
                next_payment: formData.get('next_payment') as string || undefined,
                is_active: true,
                tax_rate: finalTaxRate
              });
            }} className="p-6 space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Nome da fonte de renda"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="amount"
                  placeholder="Valor (R$)"
                  step="0.01"
                  required
                  onChange={(e) => handleAmountChange(e)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                
                <select
                  name="frequency"
                  required
                  onChange={(e) => handleFrequencyChange(e, (document.querySelector('input[name="amount"]') as HTMLInputElement)?.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">Frequência</option>
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="yearly">Anual</option>
                  <option value="one-time">Única</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="category"
                  placeholder="Categoria (ex: Salário, Freelance)"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                
                <div className="relative">
                  <input
                    type="number"
                    name="tax_rate"
                    placeholder="Alíquota de imposto (%)"
                    step="0.01"
                    value={taxRate > 0 ? taxRate : ''}
                    onChange={handleTaxRateChange}
                    className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                  <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-600" />
                </div>
              </div>
              
              {showTaxInfo && (
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <div className="flex items-center space-x-2">
                    <Landmark className="h-4 w-4 text-indigo-600" />
                    <p className="text-sm text-indigo-700 font-medium">
                      Imposto estimado: R$ {taxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({taxRate}%)
                    </p>
                  </div>
                  <p className="text-xs text-indigo-600 mt-1">
                    Esta taxa será salva automaticamente e usada para cálculos de impostos na gestão de gastos.
                  </p>
                </div>
              )}
              
              <input
                type="date"
                name="next_payment"
                placeholder="Próximo pagamento"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              
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
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200"
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