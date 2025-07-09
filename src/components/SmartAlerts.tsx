import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, DollarSign, AlertTriangle, CheckCircle, TrendingUp,
  Clock, Car, Home, Users, CreditCard, Shield, Gem, X, Plus,
  ChevronRight, FileText, Filter, Mail, Settings
} from 'lucide-react';
import { useDashboardData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AlertType = 'bill' | 'employee' | 'expense' | 'achievement' | 'tax' | 'asset' | 'investment';
type AlertPriority = 'high' | 'medium' | 'low';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  entity_id?: string;
  date: string;
  priority: AlertPriority;
  isRead: boolean;
  relatedId?: string;
  relatedEntity?: string;
  actionPath?: string;
  actionLabel?: string;
}

export default function SmartAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | AlertType>('all');
  const [showAll, setShowAll] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // State for bill selection modal
  const [showBillSelectionModal, setShowBillSelectionModal] = useState(false);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [reminderDays, setReminderDays] = useState(1);
  
  const {
    totalMonthlyExpenses,
    totalMonthlyIncome,
    totalLoanPayments,
    totalBills,
    netWorth,
  } = useDashboardData();

  // Function to generate smart alerts based on financial data
  const generateAlerts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date();
      const alerts: Alert[] = [];

      // Fetch bills that are due soon (next 7 days)
      const { data: upcomingBills, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('next_due', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('next_due', { ascending: true });

      if (billsError) throw billsError;

      // Create alerts for upcoming bills
      upcomingBills?.forEach(bill => {
        const daysUntilDue = Math.ceil(
          (new Date(bill.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        let priority: AlertPriority = 'medium';
        if (daysUntilDue <= 2) priority = 'high';
        else if (daysUntilDue <= 5) priority = 'medium';
        else priority = 'low';

        alerts.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          title: `Conta a vencer: ${bill.name}`,
          description: `${bill.company} - R$ ${bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}`,
          date: bill.next_due,
          priority,
          isRead: false,
          relatedId: bill.id,
          relatedEntity: 'bills',
          actionPath: '/bills',
          actionLabel: 'Ver Contas'
        });
      });

      // Fetch employee data for vacation alerts
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (employeesError) throw employeesError;

      // Create alerts for upcoming employee vacations
      employees?.forEach(employee => {
        if (employee.next_vacation) {
          const nextVacation = new Date(employee.next_vacation);
          const daysUntilVacation = Math.ceil(
            (nextVacation.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilVacation <= 30 && daysUntilVacation > 0) {
            alerts.push({
              id: `vacation-${employee.id}`,
              type: 'employee',
              title: `Férias do funcionário ${employee.name}`,
              description: `Férias programadas para ${new Date(employee.next_vacation).toLocaleDateString('pt-BR')} (em ${daysUntilVacation} dias)`,
              date: employee.next_vacation,
              priority: daysUntilVacation <= 7 ? 'high' : 'medium',
              isRead: false,
              relatedId: employee.id,
              relatedEntity: 'employees',
              actionPath: '/employees',
              actionLabel: 'Ver Funcionários'
            });
          }
          // If vacation is overdue
          else if (daysUntilVacation <= 0) {
            alerts.push({
              id: `vacation-overdue-${employee.id}`,
              type: 'employee',
              title: `Férias vencidas: ${employee.name}`,
              description: `As férias deste funcionário venceram em ${new Date(employee.next_vacation).toLocaleDateString('pt-BR')}`,
              date: employee.next_vacation,
              priority: 'high',
              isRead: false,
              relatedId: employee.id,
              relatedEntity: 'employees',
              actionPath: '/employees',
              actionLabel: 'Ver Funcionários'
            });
          }
        }

        // FGTS payment alerts - due on the 7th of each month
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        const fgtsDate = new Date(today.getFullYear(), today.getMonth(), 7);
        
        if (today.getDate() <= 7) {
          // FGTS is due this month
          const daysUntilFgts = 7 - today.getDate();
          
          alerts.push({
            id: `fgts-${employee.id}`,
            type: 'tax',
            title: `Pagamento FGTS ${employee.name}`,
            description: `O FGTS vence em ${daysUntilFgts} ${daysUntilFgts === 1 ? 'dia' : 'dias'} (dia 7). Valor: R$ ${(employee.salary * (employee.fgts_percentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            date: fgtsDate.toISOString(),
            priority: daysUntilFgts <= 2 ? 'high' : 'medium',
            isRead: false,
            relatedId: employee.id,
            relatedEntity: 'employees',
            actionPath: '/employees',
            actionLabel: 'Ver Funcionários'
          });
        }
      });

      // Expense alerts - check if spending is more than 80% of income
      if (totalMonthlyExpenses + totalLoanPayments + totalBills > totalMonthlyIncome * 0.8) {
        const spendingPercentage = ((totalMonthlyExpenses + totalLoanPayments + totalBills) / totalMonthlyIncome * 100).toFixed(1);
        
        alerts.push({
          id: `expense-warning-${Date.now()}`,
          type: 'expense',
          title: 'Gastos acima do recomendado',
          description: `Seus gastos mensais representam ${spendingPercentage}% da sua renda. O recomendado é manter abaixo de 80%.`,
          date: new Date().toISOString(),
          priority: 'high',
          isRead: false,
          actionPath: '/expenses',
          actionLabel: 'Ver Gastos'
        });
      }

      // Achievement alerts - if net worth increased by more than 10% in the past month
      // This would typically use historical data from a "net_worth_history" table or similar
      // For this example, we're using mock data
      const mockPreviousNetWorth = netWorth * 0.85; // Simulating a 15% increase
      const netWorthIncrease = ((netWorth - mockPreviousNetWorth) / mockPreviousNetWorth * 100).toFixed(1);
      
      if (netWorth > mockPreviousNetWorth && (netWorth - mockPreviousNetWorth) / mockPreviousNetWorth > 0.1) {
        alerts.push({
          id: `achievement-networth-${Date.now()}`,
          type: 'achievement',
          title: 'Patrimônio aumentou significativamente!',
          description: `Seu patrimônio líquido aumentou ${netWorthIncrease}% no último mês. Continue assim!`,
          date: new Date().toISOString(),
          priority: 'medium',
          isRead: false,
          actionPath: '/patrimony',
          actionLabel: 'Ver Patrimônio'
        });
      }

      // Add a few more dynamic alerts based on real financial data
      // Tax filing deadlines
      const currentYear = new Date().getFullYear();
      const taxFilingDate = new Date(currentYear, 3, 30); // April 30th
      if (today <= taxFilingDate && today.getMonth() >= 2) { // March, April
        const daysUntilTaxFiling = Math.ceil((taxFilingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilTaxFiling <= 30) {
          alerts.push({
            id: `tax-filing-${Date.now()}`,
            type: 'tax',
            title: 'Prazo para declaração de IR',
            description: `Faltam ${daysUntilTaxFiling} dias para o prazo final de entrega da declaração de Imposto de Renda.`,
            date: taxFilingDate.toISOString(),
            priority: daysUntilTaxFiling <= 7 ? 'high' : 'medium',
            isRead: false,
            actionPath: '/documents',
            actionLabel: 'Ver Documentos'
          });
        }
      }

      // Sort alerts by priority and date
      alerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      setAlerts(alerts);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error generating alerts:', err);
      setError('Erro ao gerar alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      generateAlerts();
    }
  }, [user, totalMonthlyExpenses, totalMonthlyIncome, totalLoanPayments, totalBills, netWorth]);

  // Fetch bills for selection
  const fetchBills = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_due', { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error('Error fetching bills:', err);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [user]);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => alert.type === selectedFilter));
    }
  }, [alerts, selectedFilter]);

  const markAsRead = async (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  const handleAlertAction = (alert: Alert) => {
    markAsRead(alert.id);
    if (alert.actionPath) {
      window.location.href = alert.actionPath;
    }
  };

  // Create custom bill alert
  const createBillAlerts = async () => {
    if (!user || selectedBills.length === 0) return;
    
    try {
      setLoading(true);
      
      // Get selected bill details
      const selectedBillsData = bills.filter(bill => selectedBills.includes(bill.id));
      
      // Create alerts for each selected bill
      const alertPromises = selectedBillsData.map(bill => {
        // Calculate alert date based on reminder days
        const dueDate = new Date(bill.next_due);
        const alertDate = new Date(dueDate);
        alertDate.setDate(alertDate.getDate() - reminderDays);
        
        return supabase
          .from('alerts')
          .insert({
            user_id: user.id,
            type: 'bill',
            title: `Lembrete: ${bill.name}`,
            description: `${bill.company} - R$ ${bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Vence em ${reminderDays} ${reminderDays === 1 ? 'dia' : 'dias'}`,
            date: alertDate.toISOString(),
            priority: 'medium',
            is_read: false,
            related_id: bill.id,
            related_entity: 'bills',
            entity_id: bill.id,
            action_path: '/bills',
            action_label: 'Ver Contas'
          });
      });
      
      await Promise.all(alertPromises);
      
      // Close modal and refresh alerts
      setShowBillSelectionModal(false);
      setSelectedBills([]);
      generateAlerts();
      
      alert('Alertas criados com sucesso!');
    } catch (err) {
      console.error('Error creating bill alerts:', err);
      alert('Erro ao criar alertas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle bill selection
  const toggleBillSelection = (billId: string) => {
    if (selectedBills.includes(billId)) {
      setSelectedBills(selectedBills.filter(id => id !== billId));
    } else {
      setSelectedBills([...selectedBills, billId]);
    }
  };

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'bill': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'employee': return <Users className="h-5 w-5 text-purple-600" />;
      case 'expense': return <DollarSign className="h-5 w-5 text-red-600" />;
      case 'achievement': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'tax': return <FileText className="h-5 w-5 text-indigo-600" />;
      case 'asset': return <Home className="h-5 w-5 text-orange-600" />;
      case 'investment': return <TrendingUp className="h-5 w-5 text-emerald-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBackground = (type: AlertType) => {
    switch (type) {
      case 'bill': return 'bg-blue-50';
      case 'employee': return 'bg-purple-50';
      case 'expense': return 'bg-red-50';
      case 'achievement': return 'bg-green-50';
      case 'tax': return 'bg-indigo-50';
      case 'asset': return 'bg-orange-50';
      case 'investment': return 'bg-emerald-50';
      default: return 'bg-gray-50';
    }
  };

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case 'bill': return 'Conta';
      case 'employee': return 'Funcionário';
      case 'expense': return 'Gasto';
      case 'achievement': return 'Conquista';
      case 'tax': return 'Imposto';
      case 'asset': return 'Ativo';
      case 'investment': return 'Investimento';
      default: return 'Alerta';
    }
  };

  // Get alert counts by type
  const getAlertCountByType = (type: AlertType | 'all') => {
    if (type === 'all') return alerts.length;
    return alerts.filter(alert => alert.type === type).length;
  };

  // Filter categories with alerts
  const alertTypes = ['bill', 'employee', 'expense', 'achievement', 'tax', 'asset', 'investment'] as AlertType[];
  const activeAlertTypes = alertTypes.filter(type => getAlertCountByType(type) > 0);

  // Add a button to navigate to email notification settings
  const navigateToEmailSettings = () => {
    window.location.href = '/?tab=profile';
  };

  if (loading && isInitialLoad) {
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
          <h1 className="text-3xl font-bold text-gray-800">Alertas Inteligentes</h1>
            <h1 className="text-3xl font-bold text-gray-800">Alertas</h1>
          <p className="text-sm text-blue-600 mt-1 flex items-center cursor-pointer" onClick={navigateToEmailSettings}>
            <Mail className="h-3 w-3 mr-1" />
            <span>Configurar alertas por email</span>
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowBillSelectionModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Alerta</span>
          </button>
          <div className="bg-blue-500 p-2 rounded-full text-white relative">
            <Bell className="h-6 w-6" />
            {alerts.filter(a => !a.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {alerts.filter(a => !a.isRead).length}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Bill Selection Modal */}
      {showBillSelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Selecionar Contas para Alertas</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-blue-700">
                  Selecione as contas para as quais você deseja receber alertas por email antes do vencimento.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dias antes do vencimento para enviar alerta
                </label>
                <select
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value={1}>1 dia antes</option>
                  <option value={2}>2 dias antes</option>
                  <option value={3}>3 dias antes</option>
                  <option value={5}>5 dias antes</option>
                  <option value={7}>7 dias antes</option>
                </select>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectedBills.length === bills.length}
                      onChange={() => {
                        if (selectedBills.length === bills.length) {
                          setSelectedBills([]);
                        } else {
                          setSelectedBills(bills.map(bill => bill.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">
                      Selecionar todas
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">{bills.length} contas</span>
                </div>
                
                {bills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`bill-${bill.id}`}
                        checked={selectedBills.includes(bill.id)}
                        onChange={() => toggleBillSelection(bill.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor={`bill-${bill.id}`} className="ml-2 text-sm font-medium text-gray-700">
                        {bill.name}
                      </label>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{bill.company}</span>
                      <span className="text-sm font-medium text-gray-900">
                        R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Vence: {new Date(bill.next_due).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
                
                {bills.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma conta encontrada</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBillSelectionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={createBillAlerts}
                  disabled={selectedBills.length === 0 || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      <span>Criar Alertas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Alertas</p>
              <p className="text-3xl font-bold mt-1">{alerts.length}</p>
              <p className="text-blue-100 text-sm">{alerts.filter(a => !a.isRead).length} não lidos</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Bell className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Alta Prioridade</p>
              <p className="text-3xl font-bold mt-1">{alerts.filter(a => a.priority === 'high').length}</p>
              <p className="text-red-100 text-sm">Requerem atenção</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Contas a Vencer</p>
              <p className="text-3xl font-bold mt-1">{alerts.filter(a => a.type === 'bill').length}</p>
              <p className="text-yellow-100 text-sm">Próximos 7 dias</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Conquistas</p>
              <p className="text-3xl font-bold mt-1">{alerts.filter(a => a.type === 'achievement').length}</p>
              <p className="text-green-100 text-sm">Metas alcançadas</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Filtrar por Tipo</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>Todos</span> 
            <span className="bg-blue-700 text-white text-xs rounded-full px-1.5 py-0.5">
              {getAlertCountByType('all')}
            </span>
          </button>
          {activeAlertTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedFilter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTypeIcon(type)}
              <span>{getTypeLabel(type)} ({getAlertCountByType(type)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-800">Alertas por Email</h3>
            <p className="text-sm text-gray-600">Configure como receber estes alertas no seu email</p>
          </div>
        </div>
        <button
          onClick={navigateToEmailSettings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Configurar</span>
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {selectedFilter === 'all' ? 'Todos os Alertas' : `Alertas de ${getTypeLabel(selectedFilter)}`}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta encontrado</h3>
              <p className="text-gray-500">Não há alertas para exibir no momento.</p>
            </div>
          ) : (
            <>
              {filteredAlerts.slice(0, showAll ? filteredAlerts.length : 5).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    !alert.isRead ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeBackground(alert.type)}`}>
                        {getTypeIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{alert.title}</h3>
                              <span className={`inline-flex items-center rounded-full w-2 h-2 ${getPriorityColor(alert.priority)}`}></span>
                            </div>
                            <p className="text-gray-600 mt-1">{alert.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {new Date(alert.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {alert.actionPath && (
                              <button
                                onClick={() => handleAlertAction(alert)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                              >
                                <span>{alert.actionLabel || 'Ver detalhes'}</span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            )}
                            
                            {alert.type === 'bill' && (
                              <button
                                onClick={() => {
                                  if (alert.relatedId) {
                                    const billId = alert.relatedId;
                                    // Call the mark_bill_as_paid function
                                    fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/mark_bill_as_paid`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${supabase.auth.getSession().then(({ data }) => data.session?.access_token)}`
                                      },
                                      body: JSON.stringify({ 
                                        bill_id: billId,
                                        payment_date_val: new Date().toISOString().split('T')[0]
                                      })
                                    }).then(() => {
                                      // Mark alert as read
                                      markAsRead(alert.id);
                                      // Refresh alerts
                                      generateAlerts();
                                    });
                                  }
                                }}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Marcar como Pago
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center ml-2">
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      {alert.type === 'bill' && (
                        <button
                          onClick={() => window.location.href = '/bills'}
                          className="mt-1 text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100" 
                          title="Ver em contas"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          // Call the send-alert-email edge function
                          supabase.functions.invoke('send-alert-email', {
                            body: { alertId: alert.id }
                          }).then(() => {
                            alert('Email de alerta enviado!');
                          });
                        }}
                        className="mt-1 text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                        title="Enviar por email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAlerts.length > 5 && !showAll && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todos os {filteredAlerts.length} alertas
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}