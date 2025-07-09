import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, DollarSign, AlertTriangle, CheckCircle, TrendingUp,
  Clock, Car, Home, Users, CreditCard, Shield, Gem, X,
  ChevronRight, FileText, Filter, Mail, Settings
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AlertType = 'bill' | 'employee' | 'expense' | 'achievement' | 'tax' | 'asset' | 'investment';
type AlertPriority = 'high' | 'medium' | 'low';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
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
  
  const {
    totalMonthlyExpenses,
    totalMonthlyIncome,
    totalLoanPayments,
    totalBills,
    netWorth,
  } = useSupabaseData();

  // Function to generate smart alerts based on financial data
  const generateAlerts = async () => {
    if (!user) return;

    try {
      setLoading(true);
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
      const today = new Date();
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
        const today = new Date();
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
          <p className="text-gray-500 mt-1">Acompanhe eventos importantes e fique por dentro de suas finanças</p>
          <p className="text-sm text-blue-600 mt-1 flex items-center cursor-pointer" onClick={navigateToEmailSettings}>
            <Mail className="h-3 w-3 mr-1" />
            <span>Configurar alertas por email</span>
          </p>
        </div>
        <div className="bg-blue-500 p-2 rounded-full text-white relative">
          <Bell className="h-6 w-6" />
          {alerts.filter(a => !a.isRead).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {alerts.filter(a => !a.isRead).length}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-700">{error}</p>
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
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeBackground(alert.type)}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{alert.title}</h3>
                            <span className={`inline-flex items-center rounded-full w-2 h-2 ${getPriorityColor(alert.priority)}`}></span>
                          </div>
                          <p className="text-gray-600 mt-1">{alert.description}</p>
                        </div>
                        
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {new Date(alert.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        {alert.actionPath && (
                          <button
                            onClick={() => handleAlertAction(alert)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                          >
                            <span>{alert.actionLabel || 'Ver detalhes'}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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