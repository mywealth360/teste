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
  tax_rate?: number;
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

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensal';
      case 'weekly': return 'Semanal'; 
      case 'yearly': return 'Anual';
      case 'one-time': return 'Única';
      default: return frequency;
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, frequency: string = 'monthly') => {
    // Format the input to use thousand separators
    let value = e.target.value;
    // Remove any non-digit characters except decimal point
    value = value.replace(/[^\d.,]/g, '');
    // Convert comma to period for calculation
    const calculationValue = value.replace(',', '.');
    // Calculate tax based on the cleaned value
    const amount = Number(calculationValue);
    
    const { rate, amount: taxValue } = calculateTax(amount, frequency);
    setTaxRate(rate);
    setTaxAmount(taxValue);
  };

  // Rest of the code remains the same until the end

  return (
    <div className="space-y-6">
      {/* Rest of the JSX remains the same */}
      
      <input
        type="number"
        value={editForm.amount || ''}
        onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
        className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        placeholder="Valor (R$)"
        step="0.01"
      />
      
      <input
        type="number"
        name="amount"
        placeholder="Valor (R$)"
        step="0.01" 
        required
        onChange={(e) => handleAmountChange(e)}
        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white text-gray-800"
      />
      
      <select
        onChange={(e) => handleFrequencyChange(e, (document.querySelector('input[name="amount"]') as HTMLInputElement)?.value)}
        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white text-gray-800"
      >
        <option value="">Frequência</option>
      </select>
      
      <input
        name="category"
        placeholder="Categoria (ex: Salário, Freelance)"
        required
        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white text-gray-800"
      />
      
      <input
        placeholder="Alíquota de imposto (%)"
        step="0.01"
        value={taxRate > 0 ? taxRate : ''}
        onChange={handleTaxRateChange} 
        className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white text-gray-800"
      />
      <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-600" />
      
      <input
        type="date"
        name="next_payment"
        placeholder="Próximo pagamento"
        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white text-gray-800"
      />
    </div>
  );
}