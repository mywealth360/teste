import React, { useState, useEffect } from 'react';
import { Plus, Target, Trash2, Edit, TrendingUp, Calendar, AlertTriangle, Info, ChevronRight, ChevronDown, PiggyBank, Airplay as Airplane, Briefcase, Home, GraduationCap, Package, Calculator, DollarSign, Check, Clock, X, Save, File } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'abandoned';
  priority: 'high' | 'medium' | 'low';
}

interface GoalContribution {
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  notes?: string;
}

interface GoalFormData {
  name: string;
  target_amount: string;
  category: string;
  target_date: string;
  description: string;
  priority: string;
  monthly_contribution: string;
}

// Define goal categories with icons
const goalCategories = [
  { value: 'travel', label: 'Viagem', icon: Airplane, color: 'bg-blue-500' },
  { value: 'business', label: 'Negócio', icon: Briefcase, color: 'bg-purple-500' },
  { value: 'wealth', label: 'Patrimônio', icon: PiggyBank, color: 'bg-green-500' },
  { value: 'home', label: 'Casa', icon: Home, color: 'bg-orange-500' },
  { value: 'education', label: 'Educação', icon: GraduationCap, color: 'bg-red-500' },
  { value: 'other', label: 'Outro', icon: Package, color: 'bg-gray-500' }
];

const goalPriorities = [
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'low', label: 'Baixa', color: 'bg-blue-100 text-blue-700' }
];

export default function FinancialGoals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [contributions, setContributions] = useState<Record<string, GoalContribution[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmGoalId, setDeleteConfirmGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState<GoalFormData>({
    name: '',
    target_amount: '',
    category: 'travel',
    target_date: '',
    description: '',
    priority: 'medium',
    monthly_contribution: ''
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    savedAmount: 0,
    remainingAmount: 0,
    avgCompletion: 0,
    nextDeadline: null as string | null,
    monthlySavingsNeeded: 0
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('status', { ascending: false })
        .order('target_date', { ascending: true });
      
      if (error) throw error;
      
      setGoals(data || []);
      
      // Fetch contributions for each goal
      await fetchAllContributions(data || []);
      
      // Calculate stats
      calculateStats(data || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Erro ao carregar metas financeiras');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllContributions = async (goalsList: FinancialGoal[]) => {
    try {
      // Get all contributions for all goals at once for better performance
      if (goalsList.length === 0) return;
      
      const goalIds = goalsList.map(g => g.id);
      
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('*')
        .in('goal_id', goalIds)
        .order('contribution_date', { ascending: false });
      
      if (error) throw error;
      
      // Group contributions by goal_id
      const contributionsMap: Record<string, GoalContribution[]> = {};
      
      (data || []).forEach(contribution => {
        if (!contributionsMap[contribution.goal_id]) {
          contributionsMap[contribution.goal_id] = [];
        }
        contributionsMap[contribution.goal_id].push(contribution);
      });
      
      setContributions(contributionsMap);
    } catch (err) {
      console.error('Error fetching contributions:', err);
    }
  };
  
  const calculateStats = (goalsList: FinancialGoal[]) => {
    const activeGoals = goalsList.filter(g => g.status === 'active');
    
    if (activeGoals.length === 0) {
      setStats({
        totalAmount: 0,
        savedAmount: 0,
        remainingAmount: 0,
        avgCompletion: 0,
        nextDeadline: null,
        monthlySavingsNeeded: 0
      });
      return;
    }
    
    const totalAmount = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
    const savedAmount = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
    const remainingAmount = totalAmount - savedAmount;
    
    // Calculate average completion percentage
    const avgCompletion = savedAmount / totalAmount * 100;
    
    // Find next deadline
    const upcomingGoals = [...activeGoals].sort((a, b) => 
      new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    );
    
    const nextDeadline = upcomingGoals.length > 0 ? upcomingGoals[0].target_date : null;
    
    // Calculate total monthly savings needed
    let totalMonthlySavingsNeeded = 0;
    
    activeGoals.forEach(goal => {
      // Calculate months left until target date
      const targetDate = new Date(goal.target_date);
      const now = new Date();
      
      if (targetDate > now) {
        // Months between dates
        const monthsLeft = (targetDate.getFullYear() - now.getFullYear()) * 12 + 
          (targetDate.getMonth() - now.getMonth());
        
        // If target date is in the future
        if (monthsLeft > 0) {
          // Remaining amount for this goal
          const goalRemainingAmount = goal.target_amount - goal.current_amount;
          
          // Monthly savings needed for this goal
          const monthlySavingsForGoal = goalRemainingAmount / monthsLeft;
          
          totalMonthlySavingsNeeded += monthlySavingsForGoal;
        }
      }
    });
    
    setStats({
      totalAmount,
      savedAmount,
      remainingAmount,
      avgCompletion,
      nextDeadline,
      monthlySavingsNeeded: totalMonthlySavingsNeeded
    });
  };

  const handleAddGoal = async () => {
    try {
      // Validation
      if (!formData.name || !formData.target_amount || !formData.target_date || !formData.category) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const targetAmount = parseFloat(formData.target_amount);
      const monthlyContribution = parseFloat(formData.monthly_contribution || '0');
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        setError('O valor da meta deve ser maior que zero');
        return;
      }
      
      if (monthlyContribution < 0) {
        setError('A contribuição mensal não pode ser negativa');
        return;
      }
      
      // Add goal to database
      const { data: goalData, error: goalError } = await supabase
        .from('financial_goals')
        .insert([{
          user_id: user?.id,
          name: formData.name,
          target_amount: targetAmount,
          current_amount: 0,
          target_date: formData.target_date,
          category: formData.category,
          description: formData.description || null,
          priority: formData.priority
        }])
        .select()
        .single();
      
      if (goalError) throw goalError;
      
      // If monthly contribution is set, create a recurring bill
      if (monthlyContribution > 0 && goalData) {
        const { error: billError } = await supabase.rpc('create_goal_contribution_bill', {
          goal_id: goalData.id,
          monthly_amount: monthlyContribution,
          due_day: 5, // Default to 5th of month
          start_date: new Date().toISOString().split('T')[0]
        });
        
        if (billError) {
          console.error('Error creating bill for goal:', billError);
          // Continue despite bill creation error
        }
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        target_amount: '',
        category: 'travel',
        target_date: '',
        description: '',
        priority: 'medium',
        monthly_contribution: ''
      });
      
      setShowAddModal(false);
      
      // Refresh goals
      fetchGoals();
    } catch (err) {
      console.error('Error adding goal:', err);
      setError('Erro ao adicionar meta financeira');
    }
  };
  
  const handleUpdateGoal = async (goalId: string) => {
    try {
      // Validation
      if (!formData.name || !formData.target_amount || !formData.target_date || !formData.category) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const targetAmount = parseFloat(formData.target_amount);
      const monthlyContribution = parseFloat(formData.monthly_contribution || '0');
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        setError('O valor da meta deve ser maior que zero');
        return;
      }
      
      if (monthlyContribution < 0) {
        setError('A contribuição mensal não pode ser negativa');
        return;
      }
      
      // Get current goal data
      const { data: currentGoal, error: fetchError } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('id', goalId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update goal in database
      const { error: updateError } = await supabase
        .from('financial_goals')
        .update({
          name: formData.name,
          target_amount: targetAmount,
          target_date: formData.target_date,
          category: formData.category,
          description: formData.description || null,
          priority: formData.priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
      
      if (updateError) throw updateError;
      
      // Check if monthly contribution changed
      if (monthlyContribution > 0) {
        // Try to update existing contribution bill first
        const updateResult = await supabase.rpc('update_goal_contribution_bill', {
          goal_id: goalId,
          monthly_amount: monthlyContribution
        });
        
        // If update fails (no bill exists), create a new one
        if (!updateResult.data) {
          const { error: billError } = await supabase.rpc('create_goal_contribution_bill', {
            goal_id: goalId,
            monthly_amount: monthlyContribution,
            due_day: 5, // Default to 5th of month
            start_date: new Date().toISOString().split('T')[0]
          });
          
          if (billError) {
            console.error('Error creating bill for goal:', billError);
          }
        }
      }
      
      // Reset form and exit edit mode
      setFormData({
        name: '',
        target_amount: '',
        category: 'travel',
        target_date: '',
        description: '',
        priority: 'medium',
        monthly_contribution: ''
      });
      
      setEditingGoalId(null);
      
      // Refresh goals
      fetchGoals();
    } catch (err) {
      console.error('Error updating goal:', err);
      setError('Erro ao atualizar meta financeira');
    }
  };
  
  const handleDeleteGoal = async () => {
    if (!deleteConfirmGoalId) return;
    
    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', deleteConfirmGoalId);
      
      if (error) throw error;
      
      // Reset delete confirmation
      setDeleteConfirmGoalId(null);
      
      // Refresh goals
      fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError('Erro ao excluir meta financeira');
    }
  };
  
  const startEditGoal = (goal: FinancialGoal) => {
    // Find associated bill for monthly contribution
    const fetchBill = async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('amount')
        .eq('financial_goal_id', goal.id)
        .eq('is_goal_contribution', true)
        .single();
      
      const monthlyContribution = data?.amount || '';
      
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount.toString(),
        category: goal.category,
        target_date: goal.target_date,
        description: goal.description || '',
        priority: goal.priority,
        monthly_contribution: monthlyContribution ? monthlyContribution.toString() : ''
      });
    };
    
    fetchBill();
    setEditingGoalId(goal.id);
  };
  
  const handleAddContribution = async (goalId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      
      const contributionAmount = prompt(`Quanto você deseja contribuir para a meta "${goal.name}"?`);
      if (!contributionAmount) return;
      
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Por favor, insira um valor válido maior que zero');
        return;
      }
      
      // Add contribution
      const { error: contributionError } = await supabase
        .from('goal_contributions')
        .insert([{
          goal_id: goalId,
          user_id: user?.id,
          amount,
          notes: 'Contribuição manual'
        }]);
      
      if (contributionError) throw contributionError;
      
      // Update goal's current amount
      const newAmount = goal.current_amount + amount;
      const newStatus = newAmount >= goal.target_amount ? 'completed' : 'active';
      
      const { error: updateError } = await supabase
        .from('financial_goals')
        .update({
          current_amount: newAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
      
      if (updateError) throw updateError;
      
      // Refresh goals
      fetchGoals();
    } catch (err) {
      console.error('Error adding contribution:', err);
      setError('Erro ao adicionar contribuição');
    }
  };
  
  const toggleExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };
  
  const getCategoryInfo = (categoryValue: string) => {
    return goalCategories.find(c => c.value === categoryValue) || goalCategories[0];
  };
  
  const getPriorityInfo = (priorityValue: string) => {
    return goalPriorities.find(p => p.value === priorityValue) || goalPriorities[1];
  };
  
  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  };
  
  const calculateMonthlyAmount = (goal: FinancialGoal) => {
    const targetDate = new Date(goal.target_date);
    const now = new Date();
    
    if (targetDate <= now) return 0;
    
    const monthsLeft = (targetDate.getFullYear() - now.getFullYear()) * 12 + 
      (targetDate.getMonth() - now.getMonth());
    
    if (monthsLeft <= 0) return 0;
    
    const remainingAmount = goal.target_amount - goal.current_amount;
    
    return remainingAmount / monthsLeft;
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  const getMonthsUntil = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const now = new Date();
    
    if (targetDate <= now) return 0;
    
    return (targetDate.getFullYear() - now.getFullYear()) * 12 + 
      (targetDate.getMonth() - now.getMonth());
  };
  
  // Reset form for new goal
  const openNewGoalModal = () => {
    setFormData({
      name: '',
      target_amount: '',
      category: 'travel',
      target_date: '',
      description: '',
      priority: 'medium',
      monthly_contribution: ''
    });
    setShowAddModal(true);
  };
  
  // Close modal and reset form
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingGoalId(null);
    setError(null);
    setFormData({
      name: '',
      target_amount: '',
      category: 'travel',
      target_date: '',
      description: '',
      priority: 'medium',
      monthly_contribution: ''
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Metas Financeiras</h1>
            <p className="text-gray-500 mt-1">Estabeleça metas claras e acompanhe seu progresso</p>
          </div>
        </div>
        
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Metas Financeiras</h1>
          <p className="text-gray-500 mt-1">Estabeleça metas claras e acompanhe seu progresso</p>
        </div>
        <button 
          onClick={openNewGoalModal}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total em Metas</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-indigo-100 text-xs mt-1">
                {goals.filter(g => g.status === 'active').length} metas ativas
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Target className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Já Economizado</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats.savedAmount)}</p>
              <p className="text-green-100 text-xs mt-1">
                {stats.avgCompletion.toFixed(1)}% do total
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <PiggyBank className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Economia Mensal Sugerida</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats.monthlySavingsNeeded)}</p>
              <p className="text-purple-100 text-xs mt-1">
                {stats.nextDeadline 
                  ? `Próximo prazo: ${formatDate(stats.nextDeadline)}` 
                  : 'Nenhum prazo próximo'}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Calculator className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Card */}
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 p-3 rounded-xl">
            <Info className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Como funcionam as Metas Financeiras</h2>
            <div className="text-blue-700 space-y-2">
              <p>
                Suas metas financeiras são tratadas como parte do seu patrimônio e também como um investimento 
                mensal no seu fluxo de caixa.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="bg-white/50 p-3 rounded-lg">
                  <h3 className="font-medium text-blue-800 flex items-center">
                    <PiggyBank className="h-4 w-4 mr-2" /> 
                    Alocação Patrimonial
                  </h3>
                  <p className="text-sm mt-1">O valor já economizado é considerado parte do seu patrimônio.</p>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <h3 className="font-medium text-blue-800 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" /> 
                    Investimento Mensal
                  </h3>
                  <p className="text-sm mt-1">As contribuições são tratadas como despesas de investimento.</p>
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                Quando você define uma contribuição mensal, o sistema cria automaticamente uma conta 
                recorrente na seção de Contas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* List of Financial Goals */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Suas Metas Financeiras</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {goals.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta financeira cadastrada</h3>
              <p className="text-gray-500 mb-6">Adicione metas para acompanhar seu progresso financeiro e direcionar seus investimentos.</p>
              <button
                onClick={openNewGoalModal}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200"
              >
                Criar Primeira Meta
              </button>
            </div>
          ) : (
            <>
              {goals.map((goal) => {
                const categoryInfo = getCategoryInfo(goal.category);
                const priorityInfo = getPriorityInfo(goal.priority);
                const progress = calculateProgress(goal.current_amount, goal.target_amount);
                const monthlyAmount = calculateMonthlyAmount(goal);
                const isExpanded = expandedGoals.has(goal.id);
                const CategoryIcon = categoryInfo.icon;
                
                return (
                  <div key={goal.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryInfo.color}`}>
                            <CategoryIcon className="h-6 w-6 text-white" />
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-gray-800">{goal.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
                                {priorityInfo.label}
                              </span>
                              {goal.status === 'completed' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                  Completa
                                </span>
                              )}
                              {goal.status === 'abandoned' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  Abandonada
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                              <span>{formatCurrency(goal.target_amount)}</span>
                              <span>•</span>
                              <span>Prazo: {formatDate(goal.target_date)}</span>
                              {goal.status === 'active' && getMonthsUntil(goal.target_date) > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{getMonthsUntil(goal.target_date)} meses restantes</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {goal.status === 'active' && (
                            <button
                              onClick={() => handleAddContribution(goal.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Adicionar Contribuição"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startEditGoal(goal)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmGoalId(goal.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleExpand(goal.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{formatCurrency(goal.current_amount)}</span>
                          <span className="text-gray-600">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Monthly Calculation */}
                      {goal.status === 'active' && (
                        <div className="bg-indigo-50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-indigo-700">
                              <Calculator className="h-4 w-4 mr-2" />
                              <span>Economia mensal necessária:</span>
                            </div>
                            <span className="font-semibold text-indigo-900">
                              {formatCurrency(monthlyAmount)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Details (expandable) */}
                      {isExpanded && (
                        <div className="pt-4 mt-2 border-t border-gray-100">
                          <div className="space-y-4">
                            {/* Goal Description */}
                            {goal.description && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Descrição</h4>
                                <p className="text-gray-600 text-sm">{goal.description}</p>
                              </div>
                            )}
                            
                            {/* Contributions History */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Histórico de Contribuições</h4>
                              {contributions[goal.id] && contributions[goal.id].length > 0 ? (
                                <div className="max-h-40 overflow-y-auto pr-2">
                                  <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left">Data</th>
                                        <th className="px-3 py-2 text-right">Valor</th>
                                        <th className="px-3 py-2 text-left">Notas</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {contributions[goal.id].map(contribution => (
                                        <tr key={contribution.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {formatDate(contribution.contribution_date)}
                                          </td>
                                          <td className="px-3 py-2 text-right font-medium text-green-600">
                                            {formatCurrency(contribution.amount)}
                                          </td>
                                          <td className="px-3 py-2 text-gray-500">
                                            {contribution.notes || '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">Nenhuma contribuição registrada</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Goal Modal */}
      {(showAddModal || editingGoalId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingGoalId ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              
              {/* Goal Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Meta
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {goalCategories.map(category => (
                    <div key={category.value} 
                      className={`flex flex-col items-center p-3 cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                        formData.category === category.value 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setFormData({...formData, category: category.value})}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}>
                        <category.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs mt-1 text-center">{category.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Goal Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Meta
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Viagem para Europa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              
              {/* Goal Amount & Target Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Alvo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                      placeholder="10000"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Alvo
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {/* Priority & Monthly Contribution */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {goalPriorities.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contribuição Mensal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      value={formData.monthly_contribution}
                      onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
                      placeholder="Opcional"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes adicionais sobre esta meta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              
              {/* Simulação Section */}
              {formData.target_amount && formData.target_date && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-medium text-indigo-800 mb-2">Simulação</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Valor total a economizar:</span>
                      <span className="font-semibold text-indigo-900">
                        {formatCurrency(parseFloat(formData.target_amount) || 0)}
                      </span>
                    </div>
                    
                    {/* Only show if date is in the future */}
                    {new Date(formData.target_date) > new Date() && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Economia mensal necessária:</span>
                          <span className="font-semibold text-indigo-900">
                            {formatCurrency((parseFloat(formData.target_amount) || 0) / 
                              Math.max(1, getMonthsUntil(formData.target_date)))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Percentual da renda mensal:</span>
                          <span className="font-semibold text-indigo-900">
                            N/A
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Recurring Bill Notice */}
              {formData.monthly_contribution && parseFloat(formData.monthly_contribution) > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                  <File className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    Será criada uma conta recorrente de R$ {parseFloat(formData.monthly_contribution).toLocaleString('pt-BR', {minimumFractionDigits: 2})}/mês para esta meta.
                    Esta conta aparecerá na seção de Contas para você gerenciar.
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => editingGoalId ? handleUpdateGoal(editingGoalId) : handleAddGoal()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingGoalId ? 'Atualizar' : 'Criar Meta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmGoalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Confirmar Exclusão</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">Tem certeza?</h3>
                    <p className="text-red-700 text-sm">
                      Esta ação não pode ser desfeita. Todos os dados desta meta financeira serão permanentemente removidos.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmGoalId(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGoal}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}