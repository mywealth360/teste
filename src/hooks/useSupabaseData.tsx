import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Bill {
  id: string;
  name: string;
  company: string;
  amount: number;
  due_day: number;
  payment_status?: 'pending' | 'paid' | 'overdue' | 'partial';
  payment_date?: string;
  payment_amount?: number;
  payment_method?: string;
  send_email_reminder?: boolean;
  reminder_days_before?: number;
  category: string;
  is_recurring: boolean;
  is_active: boolean;
  last_paid?: string;
  next_due: string;
  created_at: string;
  updated_at: string;
  associated_with?: 'property' | 'vehicle' | 'employee' | 'loan';
  associated_id?: string;
  associated_name?: string;
  financial_goal_id?: string;
  is_goal_contribution?: boolean;
}

interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
}

export function useSupabaseData() {
  const { user } = useAuth();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Properties, Vehicles, and Employees for associating bills
  const [properties, setProperties] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchBills();
      fetchFinancialGoals();
      fetchAssociatedEntities();
    }
  }, [user]);

  useEffect(() => {
    // Atualizar contagem de contas pendentes
    const pending = bills.filter(bill => {
      const dueDate = new Date(bill.next_due);
      const today = new Date();
      return bill.is_active && dueDate <= today;
    }).length;
    
    setPendingCount(pending);
  }, [bills]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user?.id)
        .order('next_due', { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAssociatedEntities = async () => {
    if (!user) return;
    
    try {
      // Fetch properties, vehicles, and employees in parallel
      const [propertiesResult, vehiclesResult, employeesResult, loansResult] = await Promise.all([
        supabase.from('real_estate').select('id, address, type').eq('user_id', user.id),
        supabase.from('vehicles').select('id, brand, model').eq('user_id', user.id),
        supabase.from('employees').select('id, name, role').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('loans').select('id, bank, type').eq('user_id', user.id)
      ]);
      
      if (propertiesResult.data) setProperties(propertiesResult.data);
      if (vehiclesResult.data) setVehicles(vehiclesResult.data);
      if (employeesResult.data) setEmployees(employeesResult.data);
      if (loansResult.data) setLoans(loansResult.data);
    } catch (err) {
      console.error('Error fetching associated entities:', err);
    }
  };
  
  // Fetch financial goals for bill association
  const fetchFinancialGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('id, name, target_amount, current_amount, target_date, status')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      setFinancialGoals(data || []);
    } catch (err) {
      console.error('Error fetching financial goals:', err);
    }
  };

  const handleAddBill = async (billData: Omit<Bill, 'id' | 'created_at' | 'updated_at' | 'next_due'>) => {
    try {
      const today = new Date();
      const nextDue = new Date(today.getFullYear(), today.getMonth(), billData.due_day);
      if (nextDue <= today) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }

      const { error } = await supabase
        .from('bills')
        .insert([{
          ...billData,
          user_id: user?.id,
          next_due: nextDue.toISOString().split('T')[0],
        }]);

      if (error) throw error;
      
      fetchBills();
    } catch (err) {
      console.error('Error adding bill:', err);
      setError('Erro ao adicionar conta');
    }
  };

  const handleUpdateBill = async (billId: string, billData: Partial<Bill>) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({
          ...billData,
          updated_at: new Date().toISOString()
        })
        .eq('id', billId);

      if (error) throw error;
      
      fetchBills();
    } catch (err) {
      console.error('Error updating bill:', err);
      setError('Erro ao atualizar conta');
    }
  };

  const handleDeleteBill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBills();
    } catch (err) {
      console.error('Error deleting bill:', err);
      setError('Erro ao excluir conta');
    }
  };

  // Mark bill as paid
  const markAsPaid = async (billId: string, amount?: number, paymentMethod?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Call the mark_bill_as_paid database function
      const { data, error } = await supabase.rpc('mark_bill_as_paid', {
        bill_id: billId,
        payment_date_val: today,
        payment_amount_val: amount,
        payment_method_val: paymentMethod
      });

      if (error) throw error;
      fetchBills();
    } catch (err) {
      console.error('Error marking bill as paid:', err);
      setError('Erro ao marcar conta como paga');
    }
  };

  const markAllAsPaid = async () => {
    try {
      const today = new Date();
      const pendingBills = bills.filter(bill => {
        const dueDate = new Date(bill.next_due);
        return bill.is_active && dueDate <= today;
      });

      if (pendingBills.length === 0) {
        alert('Não há contas pendentes para pagar.');
        return;
      }

      const updates = pendingBills.map(bill => {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, bill.due_day);
        return supabase
          .from('bills')
          .update({
            last_paid: today.toISOString().split('T')[0],
            next_due: nextMonth.toISOString().split('T')[0]
          })
          .eq('id', bill.id);
      });

      await Promise.all(updates);
      fetchBills();
    } catch (err) {
      console.error('Error marking all bills as paid:', err);
      setError('Erro ao marcar todas as contas como pagas');
    }
  };

  const getBillStatus = (bill: Bill) => {
    if (bill.payment_status === 'paid') {
      return 'paid';
    }
    
    if (bill.payment_status === 'partial') {
      return 'partial';
    }
    
    if (bill.payment_status === 'overdue' || 
        (bill.next_due && new Date(bill.next_due) < new Date())) {
      return 'overdue';
    }
    
    return 'pending';
  };

  // Toggle email reminder for a bill
  const toggleEmailReminder = async (billId: string) => {
    try {
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;
      
      const { error } = await supabase
        .from('bills')
        .update({
          send_email_reminder: !bill.send_email_reminder
        })
        .eq('id', billId);

      if (error) throw error;
      fetchBills();
    } catch (err) {
      console.error('Error toggling email reminder:', err);
      setError('Erro ao atualizar preferência de notificação');
    }
  };

  // Associate bill with financial goal
  const associateBillWithGoal = async (billId: string, goalId: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({
          financial_goal_id: goalId,
          is_goal_contribution: true
        })
        .eq('id', billId);
      
      if (error) throw error;
      fetchBills();
    } catch (err) {
      console.error('Error associating bill with goal:', err);
      setError('Erro ao associar conta à meta financeira');
    }
  };

  // Computed values
  const totalMonthlyBills = bills
    .filter(bill => bill.is_active && bill.is_recurring)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const upcomingBills = bills
    .filter(bill => bill.is_active)
    .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())
    .slice(0, 5);

  const overdueBills = bills.filter(bill => {
    const dueDate = new Date(bill.next_due);
    const today = new Date();
    return bill.is_active && dueDate < today;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if bill is associated with a financial goal
  const isGoalContribution = (bill: Bill) => {
    return bill.is_goal_contribution && bill.financial_goal_id;
  };

  return {
    // Data
    bills,
    financialGoals,
    properties,
    vehicles,
    employees,
    loans,
    loading,
    error,
    pendingCount,
    
    // Computed values
    totalMonthlyBills,
    upcomingBills,
    overdueBills,
    
    // Actions
    handleAddBill,
    handleUpdateBill,
    handleDeleteBill,
    markAsPaid,
    markAllAsPaid,
    toggleEmailReminder,
    associateBillWithGoal,
    
    // Utility functions
    getBillStatus,
    getDaysUntilDue,
    isGoalContribution,
    
    // Refresh functions
    fetchBills,
    fetchFinancialGoals,
    fetchAssociatedEntities,
    
    // Setters for external control
    setError
  };
}