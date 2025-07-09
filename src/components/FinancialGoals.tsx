import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Target, 
  Plane, 
  Briefcase, 
  Home, 
  GraduationCap,
  Package, 
  Trash2, 
  Edit,
  AlertTriangle,
  PiggyBank,
  Calendar,
  Lightbulb,
  Check,
  X,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  description: string | null;
  status: 'active' | 'completed' | 'abandoned';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
}

interface GoalContribution {
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  notes: string | null;
}

interface GoalRecommendation {
  id: string;
  goal_id: string | null;
  title: string;
  description: string;
  potential_savings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  is_applied: boolean;
  created_at: string;
  applied_at: string | null;
}

interface LinkedBill {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  next_due: string;
  is_active: boolean;
}

const goalTypes = [
  { value: 'travel', label: 'Viagem', icon: Plane, color: 'bg-blue-500' },
  { value: 'business', label: 'Negócio', icon: Briefcase, color: 'bg-purple-500' },
  { value: 'wealth', label: 'Patrimônio', icon: PiggyBank, color: 'bg-green-500' },
  { value: 'home', label: 'Casa', icon: Home, color: 'bg-orange-500' },
  { value: 'education', label: 'Educação', icon: GraduationCap, color: 'bg-red-500' },
  { value: 'other', label: 'Outro', icon: Package, color: 'bg-gray-500' }
];

const priorityOptions = [
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Baixa', color: 'bg-blue-100 text-blue-800' }
];

const FinancialGoals: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [contributions, setContributions] = useState<{[goalId: string]: GoalContribution[]}>({});
  const [recommendations, setRecommendations] = useState<GoalRecommendation[]>([]);
  const [linkedBills, setLinkedBills] = useState<{[goalId: string]: LinkedBill[]}>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [totalMonthlyIncome, setTotalMonthlyIncome] = useState(0);
  
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    target_amount: '',
    target_date: '',
    priority: 'medium',
    description: '',
    monthly_contribution: '',
    due_day: '5'
  });
  
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchMonthlyIncome();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      
      if (goalsData) {
        setGoals(goalsData);
        
        // Fetch contributions for each goal
        const contributionsMap: {[goalId: string]: GoalContribution[]} = {};
        const billsMap: {[goalId: string]: LinkedBill[]} = {};
        
        for (const goal of goalsData) {
          // Fetch contributions
          const { data: contributionsData, error: contributionsError } = await supabase
            .from('goal_contributions')
            .select('*')
            .eq('goal_id', goal.id)
            .order('contribution_date', { ascending: false });
            
          if (!contributionsError) {
            contributionsMap[goal.id] = contributionsData || [];
          }
          
          // Fetch linked bills
          const { data: billsData, error: billsError } = await supabase
            .from('bills')
            .select('id, name, amount, due_day, next_due, is_active')
            .eq('financial_goal_id', goal.id)
            .eq('is_goal_contribution', true);
            
          if (!billsError) {
            billsMap[goal.id] = billsData || [];
          }
        }
        
        setContributions(contributionsMap);
        setLinkedBills(billsMap);
        
        // Fetch recommendations
        const { data: recommendationsData, error: recommendationsError } = await supabase
          .from('goal_recommendations')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
          
        if (!recommendationsError) {
          setRecommendations(recommendationsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyIncome = async () => {
    try {
      // Fetch total monthly income for calculation
      const { data: incomeData, error: incomeError } = await supabase
        .from('income_sources')
        .select('amount, frequency')
        .eq('user_id', user?.id)
        .eq('is_active', true);
        
      if (incomeError) throw incomeError;
      
      let totalMonthly = 0;
      
      if (incomeData) {
        incomeData.forEach(income => {
          switch (income.frequency) {
            case 'monthly':
              totalMonthly += income.amount;
              break;
            case 'weekly':
              totalMonthly += income.amount * 4.33; // Average weeks per month
              break;
            case 'yearly':
              totalMonthly += income.amount / 12;
              break;
          }
        });
      }
      
      setTotalMonthlyIncome(totalMonthly);
    } catch (error) {
      console.error('Error fetching income:', error);
    }
  };

  const handleAddGoal = async () => {
    try {
      // Validate form data
      if (!formData.type || !formData.name || !formData.target_amount || !formData.target_date) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      
      const targetAmount = parseFloat(formData.target_amount);
      const monthlyContribution = parseFloat(formData.monthly_contribution || '0');
      const dueDay = parseInt(formData.due_day || '5', 10);
      
      // Add the goal
      const { data: goalData, error: goalError } = await supabase
        .from('financial_goals')
        .insert([{
          user_id: user?.id,
          name: formData.name,
          target_amount: targetAmount,
          current_amount: 0,
          target_date: formData.target_date,
          category: formData.type,
          description: formData.description,
          priority: formData.priority as 'high' | 'medium' | 'low',
          status: 'active'
        }])
        .select('*')
        .single();
        
      if (goalError) throw goalError;
      
      // If monthly contribution is set, create a recurring bill
      if (goalData && monthlyContribution > 0) {
        // Call the create_goal_contribution_bill function
        const { data: functionResult, error: functionError } = await supabase
          .rpc('create_goal_contribution_bill', {
            goal_id: goalData.id,
            monthly_amount: monthlyContribution,
            due_day: dueDay,
            start_date: new Date().toISOString().split('T')[0]
          });
          
        if (functionError) throw functionError;
      }
      
      // Reset form and close modal
      setFormData({
        type: '',
        name: '',
        target_amount: '',
        target_date: '',
        priority: 'medium',
        description: '',
        monthly_contribution: '',
        due_day: '5'
      });
      setShowAddModal(false);
      
      // Refresh goals
      fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Erro ao adicionar meta. Por favor, tente novamente.');
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    if (deleteConfirmation !== goalToDelete.name) {
      alert('O nome da meta não corresponde. Tente novamente.');
      return;
    }
    
    try {
      // Delete the goal (will cascade to contributions and unlink bills)
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalToDelete.id);
        
      if (error) throw error;
      
      // Close modal and refresh goals
      setShowDeleteModal(false);
      setGoalToDelete(null);
      setDeleteConfirmation('');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Erro ao excluir meta. Por favor, tente novamente.');
    }
  };

  const handleViewDetails = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setShowDetailModal(true);
  };

  const calculateProgress = (goal: FinancialGoal) => {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    return Math.min(progress, 100); // Cap at 100%
  };

  const calculateTimeProgress = (goal: FinancialGoal) => {
    const startDate = new Date(goal.created_at);
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    const totalDays = (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const progress = (daysElapsed / totalDays) * 100;
    return Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
  };

  const isGoalAhead = (goal: FinancialGoal) => {
    const moneyProgress = calculateProgress(goal);
    const timeProgress = calculateTimeProgress(goal);
    
    return moneyProgress > timeProgress;
  };

  const calculateMonthlyRequired = (goal: FinancialGoal) => {
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    // If target date is in the past, return 0
    if (targetDate < today) return 0;
    
    const remainingAmount = goal.target_amount - goal.current_amount;
    
    // Calculate months between now and target date
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                 (targetDate.getMonth() - today.getMonth());
    
    // If less than a month, return full remaining amount
    if (months < 1) return remainingAmount;
    
    return remainingAmount / months;
  };

  const getStatusColor = (goal: FinancialGoal) => {
    if (goal.status === 'completed') return 'bg-green-500';
    if (goal.status === 'abandoned') return 'bg-red-500';
    
    // Active goals
    if (isGoalAhead(goal)) return 'bg-blue-500';
    
    // Calculate if on track
    const moneyProgress = calculateProgress(goal);
    const timeProgress = calculateTimeProgress(goal);
    
    if (timeProgress - moneyProgress > 20) return 'bg-red-500'; // Seriously behind
    if (timeProgress - moneyProgress > 10) return 'bg-yellow-500'; // Slightly behind
    return 'bg-green-500'; // On track
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalTypeInfo = (type: string) => {
    return goalTypes.find(t => t.value === type) || goalTypes[5]; // Default to 'other'
  };

  const getRemainingDays = (goal: FinancialGoal) => {
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleApplyRecommendation = async (recommendation: GoalRecommendation) => {
    try {
      // Mark recommendation as applied
      const { error } = await supabase
        .from('goal_recommendations')
        .update({
          is_applied: true,
          applied_at: new Date().toISOString()
        })
        .eq('id', recommendation.id);
        
      if (error) throw error;
      
      // Refresh recommendations
      const { data: updatedRecommendations, error: recommendationsError } = await supabase
        .from('goal_recommendations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (recommendationsError) throw recommendationsError;
      setRecommendations(updatedRecommendations || []);
    } catch (error) {
      console.error('Error applying recommendation:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // For form validation
  const calculateSimulation = () => {
    if (!formData.target_amount || !formData.target_date) return { 
      totalAmount: 0,
      monthlyAmount: 0,
      percentOfIncome: 0
    };
    
    const targetAmount = parseFloat(formData.target_amount);
    const targetDate = new Date(formData.target_date);
    const today = new Date();
    
    // Calculate months between now and target date
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                 (targetDate.getMonth() - today.getMonth());
    
    // If target date is in the past or less than a month away
    if (months < 1) return {
      totalAmount: targetAmount,
      monthlyAmount: targetAmount,
      percentOfIncome: totalMonthlyIncome > 0 ? (targetAmount / totalMonthlyIncome) * 100 : 0
    };
    
    const monthlyAmount = targetAmount / months;
    
    return {
      totalAmount: targetAmount,
      monthlyAmount,
      percentOfIncome: totalMonthlyIncome > 0 ? (monthlyAmount / totalMonthlyIncome) * 100 : 0
    };
  };

  // UI Helper to get a compact modal size
  const getModalMaxHeight = () => {
    // Get viewport height
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    // Use 90% of viewport height
    return `${vh * 0.9}px`;
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const abandonedGoals = goals.filter(g => g.status === 'abandoned');
  
  const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
  
  const simulation = calculateSimulation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Metas Financeiras</h1>
          <p className="text-gray-500 mt-1">Estabeleça metas claras e acompanhe seu progresso</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowRecommendationsModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md"
          >
            <Lightbulb className="h-4 w-4" />
            <span>Recomendações IA</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total em Metas</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalTargetAmount)}</p>
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
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalCurrentAmount)}</p>
              <p className="text-green-100 text-sm">
                {totalTargetAmount > 0 && `${((totalCurrentAmount / totalTargetAmount) * 100).toFixed(1)}%`}
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
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(activeGoals.reduce((sum, goal) => sum + calculateMonthlyRequired(goal), 0))}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Economias Potenciais com IA */}
      {recommendations.filter(r => !r.is_applied).length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">Economias Potenciais com IA</h2>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  Total identificado pela IA:
                </p>
                <p className="text-purple-700 text-lg font-bold">
                  {formatCurrency(recommendations.filter(r => !r.is_applied).reduce((sum, r) => sum + r.potential_savings, 0))}/mês
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  {recommendations.filter(r => !r.is_applied).length} sugestões disponíveis
                </p>
              </div>
              <button
                onClick={() => setShowRecommendationsModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors text-sm"
              >
                Ver Todas as Sugestões
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metas Ativas */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Metas Ativas</h2>
        </div>
        
        <div className="p-6">
          {activeGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta ativa</h3>
              <p className="text-gray-500 mb-4">Crie sua primeira meta para começar a planejar seu futuro financeiro.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Meta
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeGoals.map(goal => {
                const goalTypeInfo = getGoalTypeInfo(goal.category);
                const Icon = goalTypeInfo.icon;
                const progress = calculateProgress(goal);
                const timeProgress = calculateTimeProgress(goal);
                const remainingDays = getRemainingDays(goal);
                const monthlyRequired = calculateMonthlyRequired(goal);
                const statusColor = getStatusColor(goal);
                const priorityStyle = priorityOptions.find(p => p.value === goal.priority)?.color || '';
                
                return (
                  <div 
                    key={goal.id} 
                    className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
                    style={{
                      borderLeftWidth: '6px',
                      borderLeftColor: remainingDays < 0 ? '#ef4444' : '#3b82f6'
                    }}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-lg ${goalTypeInfo.color} flex items-center justify-center mr-3`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{goal.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityStyle}`}>
                                {goal.priority === 'high' ? 'Alta Prioridade' : 
                                 goal.priority === 'medium' ? 'Média Prioridade' : 
                                 'Baixa Prioridade'}
                              </span>
                              {remainingDays < 0 && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Meta atrasada
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm">
                              {goalTypeInfo.label} • Vencimento: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewDetails(goal)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setGoalToDelete(goal);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-baseline mb-1">
                          <div className="text-gray-800 font-medium">
                            {formatCurrency(goal.current_amount)} <span className="text-gray-500 text-sm">de {formatCurrency(goal.target_amount)}</span>
                          </div>
                          <div className="text-gray-500 text-sm">
                            {progress.toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div 
                            className={`h-2.5 rounded-full ${statusColor}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{remainingDays > 0 ? `${remainingDays} dias restantes` : 'Prazo vencido'}</span>
                          <span>
                            {monthlyRequired > 0 && `${formatCurrency(monthlyRequired)}/mês necessário`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Linked bills section */}
                      {linkedBills[goal.id] && linkedBills[goal.id].length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Contribuição Mensal:</span>
                            <span className="text-gray-700 font-medium ml-1">
                              {formatCurrency(linkedBills[goal.id].reduce((sum, bill) => sum + bill.amount, 0))}/mês
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Metas Concluídas e Abandonadas */}
      {(completedGoals.length > 0 || abandonedGoals.length > 0) && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Metas Finalizadas</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Completed goals */}
            {completedGoals.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Concluídas
                </h3>
                
                <div className="space-y-4">
                  {completedGoals.map(goal => {
                    const goalTypeInfo = getGoalTypeInfo(goal.category);
                    const Icon = goalTypeInfo.icon;
                    
                    return (
                      <div 
                        key={goal.id} 
                        className="border border-green-200 rounded-lg p-4 bg-green-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center mr-3">
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{goal.name}</h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <span>{formatCurrency(goal.current_amount)}</span>
                                <span className="text-gray-400 mx-1">•</span>
                                <span>Concluída em {new Date(goal.updated_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleViewDetails(goal)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Abandoned goals */}
            {abandonedGoals.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-red-700 mb-3 flex items-center">
                  <X className="h-5 w-5 mr-2" />
                  Abandonadas
                </h3>
                
                <div className="space-y-4">
                  {abandonedGoals.map(goal => {
                    const goalTypeInfo = getGoalTypeInfo(goal.category);
                    const Icon = goalTypeInfo.icon;
                    const progress = calculateProgress(goal);
                    
                    return (
                      <div 
                        key={goal.id} 
                        className="border border-red-200 rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center mr-3">
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{goal.name}</h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <span>{formatCurrency(goal.current_amount)} ({progress.toFixed(1)}%)</span>
                                <span className="text-gray-400 mx-1">•</span>
                                <span>Abandonada em {new Date(goal.updated_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleViewDetails(goal)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Goal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto"
            style={{ maxHeight: getModalMaxHeight() }}
          >
            <div className="p-5 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Nova Meta Financeira</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Meta</label>
                <div className="grid grid-cols-3 gap-2">
                  {goalTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        formData.type === type.value
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      }`}
                      onClick={() => setFormData({...formData, type: type.value})}
                    >
                      <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center mb-1`}>
                        <type.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className={formData.type === type.value ? 'text-blue-600' : 'text-gray-300 text-sm'}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Meta</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Viagem para Europa"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor Alvo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      R$
                    </span>
                    <input 
                      type="number"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                      placeholder="10000"
                      min="0"
                      step="0.01"
                      className="w-full p-3 pl-8 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Data Alvo</label>
                  <input 
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Prioridade</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descrição (opcional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva sua meta em mais detalhes..."
                  rows={3}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white resize-none"
                />
              </div>
              
              <div className="bg-blue-900/40 p-4 rounded-xl">
                <h3 className="text-lg font-medium text-white mb-2">Simulação</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Valor total a economizar:</span>
                    <span className="text-white font-medium">{formatCurrency(parseFloat(formData.target_amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Economia mensal necessária:</span>
                    <span className="text-white font-medium">{formatCurrency(simulation.monthlyAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Percentual da renda mensal:</span>
                    <span className="text-white font-medium">
                      {totalMonthlyIncome > 0 ? `${simulation.percentOfIncome.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="bg-blue-900/40 p-4 rounded-xl">
                  <h3 className="font-medium text-white mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-blue-300" />
                    <span>Conta Recorrente</span>
                  </h3>
                  <p className="text-sm text-blue-200 mb-3">
                    Será criada uma conta recorrente mensal para ajudar você a atingir esta meta.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-1">Valor Mensal</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          R$
                        </span>
                        <input 
                          type="number"
                          value={formData.monthly_contribution}
                          onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
                          placeholder={simulation.monthlyAmount.toFixed(2)}
                          min="0"
                          step="0.01"
                          className="w-full p-3 pl-8 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-1">Dia do Mês</label>
                      <input 
                        type="number"
                        value={formData.due_day}
                        onChange={(e) => setFormData({...formData, due_day: e.target.value})}
                        placeholder="5"
                        min="1"
                        max="28"
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-white"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-blue-200 mt-2 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Esta conta aparecerá na seção de Contas para você gerenciar
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  Criar Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Delete Confirmation */}
      {showDeleteModal && goalToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Excluir Meta</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="font-medium text-red-700">Esta ação não pode ser desfeita</h3>
                    <p className="text-sm text-red-600 mt-1">
                      Todo o progresso e contribuições serão perdidos. Contas associadas serão desvinculadas.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700">
                Para confirmar, digite o nome da meta: <span className="font-medium">{goalToDelete.name}</span>
              </p>
              
              <input 
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Digite o nome da meta"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGoalToDelete(null);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGoal}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200"
                  disabled={deleteConfirmation !== goalToDelete.name}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Goal Details */}
      {showDetailModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto"
            style={{ maxHeight: getModalMaxHeight() }}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Detalhes da Meta</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl ${getGoalTypeInfo(selectedGoal.category).color} flex items-center justify-center flex-shrink-0`}>
                  {React.createElement(getGoalTypeInfo(selectedGoal.category).icon, { className: "h-6 w-6 text-white" })}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{selectedGoal.name}</h3>
                      <p className="text-gray-600">{getGoalTypeInfo(selectedGoal.category).label}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedGoal.priority)}`}>
                      {selectedGoal.priority === 'high' ? 'Alta Prioridade' : 
                       selectedGoal.priority === 'medium' ? 'Média Prioridade' : 
                       'Baixa Prioridade'}
                    </span>
                  </div>
                  
                  {selectedGoal.description && (
                    <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded-lg">
                      {selectedGoal.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-blue-600">Valor Alvo</p>
                  <p className="text-xl font-semibold text-blue-700">
                    {formatCurrency(selectedGoal.target_amount)}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-green-600">Acumulado</p>
                  <p className="text-xl font-semibold text-green-700">
                    {formatCurrency(selectedGoal.current_amount)}
                    <span className="text-sm font-normal ml-1">
                      ({calculateProgress(selectedGoal).toFixed(0)}%)
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progresso Financeiro</span>
                  <span>{calculateProgress(selectedGoal).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getStatusColor(selectedGoal)}`}
                    style={{ width: `${calculateProgress(selectedGoal)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600 mt-3">
                  <span>Progresso Temporal</span>
                  <span>{calculateTimeProgress(selectedGoal).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-blue-500"
                    style={{ width: `${calculateTimeProgress(selectedGoal)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    Data Limite
                  </p>
                  <p className="font-medium text-gray-700">
                    {new Date(selectedGoal.target_date).toLocaleDateString('pt-BR')}
                    <span className="ml-2 text-xs text-gray-500">
                      ({getRemainingDays(selectedGoal)} dias restantes)
                    </span>
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                    Necessário Mensal
                  </p>
                  <p className="font-medium text-gray-700">
                    {formatCurrency(calculateMonthlyRequired(selectedGoal))}
                  </p>
                </div>
              </div>
              
              {/* Linked Bills */}
              {linkedBills[selectedGoal.id] && linkedBills[selectedGoal.id].length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Contas Vinculadas</h3>
                  <div className="space-y-2">
                    {linkedBills[selectedGoal.id].map(bill => (
                      <div key={bill.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{bill.name}</p>
                            <p className="text-sm text-gray-500">
                              Próximo vencimento: {new Date(bill.next_due).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <p className="font-medium text-green-600">
                            {formatCurrency(bill.amount)}/mês
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Contributions */}
              {contributions[selectedGoal.id] && contributions[selectedGoal.id].length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Contribuições Recentes</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {contributions[selectedGoal.id].slice(0, 5).map(contribution => (
                      <div key={contribution.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-600 text-sm">
                              {new Date(contribution.contribution_date).toLocaleDateString('pt-BR')}
                            </p>
                            {contribution.notes && (
                              <p className="text-sm text-gray-500">{contribution.notes}</p>
                            )}
                          </div>
                          <p className="font-medium text-green-600">
                            +{formatCurrency(contribution.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Goal Recommendations */}
              {recommendations.filter(r => r.goal_id === selectedGoal.id && !r.is_applied).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-purple-700 mb-3 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Recomendações da IA
                  </h3>
                  
                  <div className="space-y-2">
                    {recommendations
                      .filter(r => r.goal_id === selectedGoal.id && !r.is_applied)
                      .map(recommendation => (
                        <div key={recommendation.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-purple-700">{recommendation.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                              <p className="text-xs mt-2">
                                <span className={`px-2 py-0.5 rounded-full ${getDifficultyColor(recommendation.difficulty)}`}>
                                  {recommendation.difficulty === 'easy' ? 'Fácil' : 
                                   recommendation.difficulty === 'medium' ? 'Moderado' : 
                                   'Difícil'}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                +{formatCurrency(recommendation.potential_savings)}/mês
                              </p>
                              <button
                                onClick={() => handleApplyRecommendation(recommendation)}
                                className="mt-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition-colors"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedGoal(null);
                  }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Fechar
                </button>
                
                {selectedGoal.status === 'active' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        // Mark goal as completed or abandoned
                        await supabase
                          .from('financial_goals')
                          .update({
                            status: 'abandoned',
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedGoal.id);
                        
                        // Close modal and refresh goals
                        setShowDetailModal(false);
                        setSelectedGoal(null);
                        fetchGoals();
                      } catch (error) {
                        console.error('Error abandoning goal:', error);
                      }
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200"
                  >
                    Abandonar Meta
                  </button>
                )}
                
                {selectedGoal.status !== 'active' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        // Reactivate goal
                        await supabase
                          .from('financial_goals')
                          .update({
                            status: 'active',
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedGoal.id);
                        
                        // Close modal and refresh goals
                        setShowDetailModal(false);
                        setSelectedGoal(null);
                        fetchGoals();
                      } catch (error) {
                        console.error('Error reactivating goal:', error);
                      }
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                  >
                    Reativar Meta
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Recommendations */}
      {showRecommendationsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-y-auto"
            style={{ maxHeight: getModalMaxHeight() }}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Recomendações de Economia</h2>
                <button
                  onClick={() => setShowRecommendationsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl mb-6">
                <div className="flex items-start">
                  <Lightbulb className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-purple-800 mb-1">IA Financeira Personalizada</h3>
                    <p className="text-sm text-purple-700">
                      Nossa IA analisou suas finanças e encontrou oportunidades para otimizar seus gastos
                      e alcançar suas metas mais rapidamente. Aqui estão as recomendações personalizadas:
                    </p>
                  </div>
                </div>
              </div>
              
              {recommendations.filter(r => !r.is_applied).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma recomendação disponível</h3>
                  <p className="text-gray-500">
                    Continue gerenciando suas finanças e em breve nossa IA terá novas sugestões para você.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active recommendations */}
                  <div className="space-y-4">
                    {recommendations
                      .filter(r => !r.is_applied)
                      .map(recommendation => {
                        const goalInfo = recommendation.goal_id ? 
                          goals.find(g => g.id === recommendation.goal_id) : 
                          null;
                        
                        return (
                          <div key={recommendation.id} className="border border-purple-200 rounded-xl overflow-hidden">
                            <div className="p-4">
                              <div className="flex justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <h4 className="font-medium text-gray-800">{recommendation.title}</h4>
                                    <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(recommendation.difficulty)}`}>
                                      {recommendation.difficulty === 'easy' ? 'Fácil' : 
                                      recommendation.difficulty === 'medium' ? 'Moderado' : 
                                      'Difícil'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-gray-600 mt-2">{recommendation.description}</p>
                                  
                                  {goalInfo && (
                                    <div className="mt-2 flex items-center text-sm">
                                      <Target className="h-3 w-3 text-blue-600 mr-1" />
                                      <span className="text-blue-600">Meta: {goalInfo.name}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-4 flex flex-col items-end">
                                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                                    +{formatCurrency(recommendation.potential_savings)}/mês
                                  </div>
                                  
                                  <button
                                    onClick={() => handleApplyRecommendation(recommendation)}
                                    className="mt-3 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                  >
                                    Aplicar Sugestão
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                  
                  {/* Applied recommendations */}
                  {recommendations.filter(r => r.is_applied).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        Sugestões Aplicadas
                      </h3>
                      
                      <div className="space-y-3">
                        {recommendations
                          .filter(r => r.is_applied)
                          .map(recommendation => (
                            <div key={recommendation.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-medium text-gray-800">{recommendation.title}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Aplicada em {new Date(recommendation.applied_at || '').toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="text-green-600 font-medium">
                                  +{formatCurrency(recommendation.potential_savings)}/mês
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowRecommendationsModal(false)}
                className="mt-6 w-full py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialGoals;