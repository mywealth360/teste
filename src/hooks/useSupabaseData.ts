import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface DataFetchOptions {
  table: string;
  columns?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface UseSupabaseDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
}

export function useSupabaseData<T = any>(options: DataFetchOptions): UseSupabaseDataResult<T> {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from(options.table)
        .select(options.columns || '*')
        .eq('user_id', user.id);

      // Apply additional filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error } = await query;

      if (error) throw error;
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async (newData: Partial<T>): Promise<T | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      const { data: result, error } = await supabase
        .from(options.table)
        .insert([{ ...newData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setData(prev => [result, ...prev]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      console.error('Error creating data:', err);
      return null;
    }
  };

  const update = async (id: string, updateData: Partial<T>): Promise<T | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      const { data: result, error } = await supabase
        .from(options.table)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setData(prev => prev.map(item => 
        (item as any).id === id ? result : item
      ));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      console.error('Error updating data:', err);
      return null;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      const { error } = await supabase
        .from(options.table)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state
      setData(prev => prev.filter(item => (item as any).id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      console.error('Error deleting data:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, options.table, JSON.stringify(options.filter)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    delete: deleteItem
  };
}

// Specific hooks for common tables
export function useIncomeSources() {
  return useSupabaseData<{
    id: string;
    name: string;
    amount: number;
    frequency: string;
    category: string;
    next_payment: string;
    is_active: boolean;
    tax_rate: number;
  }>({
    table: 'income_sources',
    orderBy: { column: 'created_at', ascending: false }
  });
}

export function useTransactions() {
  return useSupabaseData<{
    id: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    is_recurring: boolean;
    tax_rate: number;
  }>({
    table: 'transactions',
    orderBy: { column: 'date', ascending: false }
  });
}

export function useInvestments() {
  return useSupabaseData<{
    id: string;
    type: string;
    name: string;
    broker: string;
    amount: number;
    purchase_price: number;
    current_price: number;
    interest_rate: number;
    monthly_income: number;
    purchase_date: string;
    maturity_date: string;
    dividend_yield: number;
    quantity: number;
    tax_rate: number;
  }>({
    table: 'investments',
    orderBy: { column: 'purchase_date', ascending: false }
  });
}

export function useRealEstate() {
  return useSupabaseData<{
    id: string;
    type: string;
    address: string;
    purchase_price: number;
    current_value: number;
    monthly_rent: number;
    expenses: number;
    purchase_date: string;
    is_rented: boolean;
    dividend_yield: number;
    tax_rate: number;
  }>({
    table: 'real_estate',
    orderBy: { column: 'purchase_date', ascending: false }
  });
}

export function useVehicles() {
  return useSupabaseData<{
    id: string;
    type: string;
    brand: string;
    model: string;
    year: number;
    purchase_price: number;
    current_value: number;
    mileage: number;
    purchase_date: string;
    depreciation_rate: number;
    monthly_expenses: number;
    is_financed: boolean;
  }>({
    table: 'vehicles',
    orderBy: { column: 'purchase_date', ascending: false }
  });
}

export function useExoticAssets() {
  return useSupabaseData<{
    id: string;
    name: string;
    category: string;
    custom_tags: string[];
    purchase_price: number;
    current_value: number;
    purchase_date: string;
    condition: string;
    description: string;
    location: string;
    insurance_value: number;
  }>({
    table: 'exotic_assets',
    orderBy: { column: 'purchase_date', ascending: false }
  });
}

export function useBills() {
  return useSupabaseData<{
    id: string;
    name: string;
    company: string;
    amount: number;
    due_day: number;
    category: string;
    is_recurring: boolean;
    is_active: boolean;
    last_paid: string;
    next_due: string;
    payment_status: string;
    payment_date: string;
    payment_amount: number;
    payment_method: string;
    send_email_reminder: boolean;
    reminder_days_before: number;
  }>({
    table: 'bills',
    orderBy: { column: 'next_due', ascending: true }
  });
}

export function useEmployees() {
  return useSupabaseData<{
    id: string;
    name: string;
    role: string;
    salary: number;
    hiring_date: string;
    document_number: string;
    document_type: string;
    address: string;
    phone: string;
    email: string;
    status: string;
    vacation_start: string;
    vacation_end: string;
    last_vacation: string;
    next_vacation: string;
    fgts_percentage: number;
    inss_percentage: number;
    irrf_percentage: number;
    other_benefits: number;
  }>({
    table: 'employees',
    orderBy: { column: 'hiring_date', ascending: false }
  });
}

export function useFinancialGoals() {
  return useSupabaseData<{
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    category: string;
    description: string;
    status: string;
    priority: string;
  }>({
    table: 'financial_goals',
    orderBy: { column: 'target_date', ascending: true }
  });
}

export function useAlerts() {
  return useSupabaseData<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    priority: string;
    is_read: boolean;
    related_id: string;
    related_entity: string;
    action_path: string;
    action_label: string;
    expires_at: string;
  }>({
    table: 'alerts',
    orderBy: { column: 'date', ascending: false }
  });
}