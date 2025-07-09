import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, X, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Alert {
  id: string;
  user_id: string;
  type: 'bill' | 'employee' | 'expense' | 'achievement' | 'tax' | 'asset' | 'investment';
  title: string;
  description: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
  related_id?: string;
  related_entity?: string;
  action_path?: string;
  action_label?: string;
  created_at: string;
  expires_at?: string;
}

export default function SmartAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getAlertIcon = (type: string, priority: string) => {
    const iconClass = priority === 'high' ? 'text-red-500' : 
                     priority === 'medium' ? 'text-yellow-500' : 'text-blue-500';
    
    switch (type) {
      case 'bill':
        return <AlertTriangle className={`h-5 w-5 ${iconClass}`} />;
      case 'achievement':
        return <CheckCircle className={`h-5 w-5 ${iconClass}`} />;
      default:
        return <Bell className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unread':
        return !alert.is_read;
      case 'high':
        return alert.priority === 'high';
      default:
        return true;
    }
  });

  const displayedAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Alertas Inteligentes</h1>
          <p className="text-gray-500 mt-1">Notificações importantes sobre suas finanças</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="unread">Não lidos</option>
              <option value="high">Alta prioridade</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-600 p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Alta Prioridade</p>
              <p className="text-3xl font-bold mt-1">
                {alerts.filter(a => a.priority === 'high' && !a.is_read).length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-600 p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Não Lidos</p>
              <p className="text-3xl font-bold mt-1">
                {alerts.filter(a => !a.is_read).length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Bell className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-green-600 p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold mt-1">{alerts.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Seus Alertas</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta encontrado</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'Você não tem alertas no momento.'
                  : `Nenhum alerta ${filter === 'unread' ? 'não lido' : 'de alta prioridade'} encontrado.`
                }
              </p>
            </div>
          ) : (
            <>
              {displayedAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-6 border-l-4 ${getPriorityColor(alert.priority)} ${
                    !alert.is_read ? 'bg-opacity-100' : 'bg-opacity-50'
                  } hover:bg-opacity-75 transition-all duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        {getAlertIcon(alert.type, alert.priority)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`font-medium ${!alert.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {alert.title}
                          </h3>
                          {!alert.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            alert.priority === 'high' ? 'bg-red-100 text-red-700' :
                            alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {alert.priority === 'high' ? 'Alta' : 
                             alert.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        
                        <p className={`text-sm mb-3 ${!alert.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {alert.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(alert.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {alert.expires_at && (
                            <div className="flex items-center space-x-1">
                              <span>Expira em:</span>
                              <span>
                                {new Date(alert.expires_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!alert.is_read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Marcar como lido"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Excluir alerta"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAlerts.length > 5 && !showAll && (
                <div className="p-4 text-center border-t border-gray-100">
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors duration-200"
                  >
                    Ver mais {filteredAlerts.length - 5} alertas
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