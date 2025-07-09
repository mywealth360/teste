import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Receipt, 
  TrendingDown, 
  Calendar, 
  PieChart,
  FileText,
  CreditCard,
  Shield,
  Home,
  Building,
  AlertTriangle,
  Edit,
  Trash2,
  Car,
  Landmark,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ExpenseItem {
  id: string;
  type: 'transaction' | 'loan' | 'bill' | 'retirement' | 'real_estate_expense' | 'vehicle_expense' | 'tax' | 'employee_expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  source: string;
  recurring: boolean;
}

export default function ExpenseManagement() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');

  useEffect(() => {
    if (user) {
      fetchAllExpenses();
    }
  }, [user]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, selectedCategory, selectedPeriod]);

  const fetchAllExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todos os tipos de despesas
      const [
        transactionData,
        loanData,
        billData,
        retirementData,
        realEstateData,
        vehicleData,
        incomeData,
        employeeData
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user?.id).eq('type', 'expense'),
        supabase.from('loans').select('*').eq('user_id', user?.id),
        supabase.from('bills').select('*').eq('user_id', user?.id).eq('is_active', true),
        supabase.from('retirement_plans').select('*').eq('user_id', user?.id),
        supabase.from('real_estate').select('*').eq('user_id', user?.id),
        supabase.from('vehicles').select('*').eq('user_id', user?.id),
        supabase.from('income_sources').select('*').eq('user_id', user?.id).eq('is_active', true),
        supabase.from('employees').select('*').eq('user_id', user?.id).eq('status', 'active')
      ]);

      const allExpenses: ExpenseItem[] = [];

      // Processar transações de despesa
      (transactionData.data || []).forEach(transaction => {
        allExpenses.push({
          id: `transaction-${transaction.id}`,
          type: 'transaction',
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          source: 'Transação',
          recurring: transaction.is_recurring
        });
      });

      // Processar empréstimos
      (loanData.data || []).forEach(loan => {
        allExpenses.push({
          id: `loan-${loan.id}`,
          type: 'loan',
          description: `Pagamento ${loan.type} - ${loan.bank}`,
          amount: loan.monthly_payment,
          category: 'Empréstimos',
          date: loan.due_date,
          source: 'Empréstimo',
          recurring: true
        });
      });

      // Processar contas
      (billData.data || []).forEach(bill => {
        allExpenses.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          description: `${bill.name} - ${bill.company}`,
          amount: bill.amount,
          category: bill.category,
          date: bill.next_due,
          source: 'Conta',
          recurring: bill.is_recurring
        });
      });

      // Processar previdência
      (retirementData.data || []).forEach(retirement => {
        allExpenses.push({
          id: `retirement-${retirement.id}`,
          type: 'retirement',
          description: `Contribuição ${retirement.name}`,
          amount: retirement.monthly_contribution,
          category: 'Previdência',
          date: new Date().toISOString().split('T')[0], // Data atual para contribuições mensais
          source: 'Previdência',
          recurring: true
        });
      });

      // Processar despesas de imóveis
      (realEstateData.data || []).forEach(property => {
        if (property.expenses > 0) {
          allExpenses.push({
            id: `real-estate-${property.id}`,
            type: 'real_estate_expense',
            description: `Despesas ${property.address}`,
            amount: property.expenses,
            category: 'Imóveis',
            date: new Date().toISOString().split('T')[0],
            source: 'Imóvel',
            recurring: true
          });
        }
      });

      // Processar despesas de veículos
      (vehicleData.data || []).forEach(vehicle => {
        if (vehicle.monthly_expenses > 0) {
          allExpenses.push({
            id: `vehicle-${vehicle.id}`,
            type: 'vehicle_expense',
            description: `Despesas ${vehicle.brand} ${vehicle.model}`,
            amount: vehicle.monthly_expenses,
            category: 'Veículos',
            date: new Date().toISOString().split('T')[0],
            source: 'Veículo',
            recurring: true
          });
        }
      });

      // Processar impostos de renda
      (incomeData.data || []).forEach(income => {
        if (income.is_active && income.tax_rate && income.tax_rate > 0) {
          // Calcular imposto baseado na renda e taxa
          let taxAmount = 0;
          let taxDescription = '';
          
          // Calcular imposto baseado na taxa informada
          switch (income.frequency) {
            case 'monthly':
              taxAmount = income.amount * (income.tax_rate / 100);
              taxDescription = `IRPF (${income.tax_rate}%) - ${income.name}`;
              break;
            case 'weekly':
              const monthlyEquivalent = income.amount * 4.33;
              taxAmount = monthlyEquivalent * (income.tax_rate / 100) / 4.33;
              taxDescription = `IRPF (${income.tax_rate}%) - ${income.name}`;
              break;
            case 'yearly':
              const monthlyYearlyEquivalent = income.amount / 12;
              taxAmount = monthlyYearlyEquivalent * (income.tax_rate / 100);
              taxDescription = `IRPF (${income.tax_rate}%) - ${income.name}`;
              break;
            default:
              break;
          }
          
          if (taxAmount > 0) {
            allExpenses.push({
              id: `tax-${income.id}`,
              type: 'tax',
              description: taxDescription,
              amount: taxAmount,
              category: 'Impostos',
              date: new Date().toISOString().split('T')[0],
              source: 'Imposto de Renda',
              recurring: true
            });
          }
        }
      });

      // Processar impostos de investimentos
      (await supabase.from('investments').select('*').eq('user_id', user?.id)).data?.forEach(investment => {
        if (investment.tax_rate && investment.tax_rate > 0) {
          let monthlyIncome = 0;
          
          // Calcular renda mensal para diferentes tipos de investimento
          if (investment.type === 'acoes' || investment.type === 'fundos-imobiliarios') {
            if (investment.dividend_yield && investment.quantity && investment.current_price) {
              const currentValue = investment.quantity * investment.current_price;
              monthlyIncome = (currentValue * investment.dividend_yield) / 100 / 12;
            } else if (investment.monthly_income) {
              monthlyIncome = investment.monthly_income;
            }
          } else if (investment.interest_rate && investment.amount) {
            monthlyIncome = (investment.amount * investment.interest_rate) / 100 / 12;
          } else if (investment.monthly_income) {
            monthlyIncome = investment.monthly_income;
          }
          
          if (monthlyIncome > 0) {
            const taxAmount = monthlyIncome * (investment.tax_rate / 100);
            
            allExpenses.push({
              id: `investment-tax-${investment.id}`,
              type: 'tax',
              description: `IRPF (${investment.tax_rate}%) - ${investment.name}`,
              amount: taxAmount,
              category: 'Impostos',
              date: new Date().toISOString().split('T')[0],
              source: 'Imposto sobre Investimentos',
              recurring: true
            });
          }
        }
      });

      // Processar impostos de aluguel de imóveis
      (realEstateData.data || []).forEach(property => {
        if (property.is_rented && property.monthly_rent && property.tax_rate && property.tax_rate > 0) {
          const taxAmount = property.monthly_rent * (property.tax_rate / 100);
          
          allExpenses.push({
            id: `real-estate-tax-${property.id}`,
            type: 'tax',
            description: `IRPF (${property.tax_rate}%) - Aluguel ${property.address}`,
            amount: taxAmount,
            category: 'Impostos',
            date: new Date().toISOString().split('T')[0],
            source: 'Imposto sobre Aluguel',
            recurring: true
          });
        }
      });

      // Processar despesas com funcionários
      (employeeData.data || []).forEach(employee => {
        // Salário
        allExpenses.push({
          id: `employee-salary-${employee.id}`,
          type: 'employee_expense',
          description: `Salário - ${employee.name}`,
          amount: employee.salary,
          category: 'Funcionários',
          date: new Date().toISOString().split('T')[0],
          source: 'Salário',
          recurring: true
        });

        // FGTS
        const fgtsAmount = employee.salary * (employee.fgts_percentage / 100);
        allExpenses.push({
          id: `employee-fgts-${employee.id}`,
          type: 'employee_expense',
          description: `FGTS - ${employee.name}`,
          amount: fgtsAmount,
          category: 'Encargos Sociais',
          date: new Date().toISOString().split('T')[0],
          source: 'FGTS',
          recurring: true
        });

        // INSS
        if (employee.inss_percentage > 0) {
          const inssAmount = employee.salary * (employee.inss_percentage / 100);
          allExpenses.push({
            id: `employee-inss-${employee.id}`,
            type: 'employee_expense',
            description: `INSS - ${employee.name}`,
            amount: inssAmount,
            category: 'Encargos Sociais',
            date: new Date().toISOString().split('T')[0],
            source: 'INSS',
            recurring: true
          });
        }

        // IRRF
        if (employee.irrf_percentage > 0) {
          const irrfAmount = employee.salary * (employee.irrf_percentage / 100);
          allExpenses.push({
            id: `employee-irrf-${employee.id}`,
            type: 'employee_expense',
            description: `IRRF - ${employee.name}`,
            amount: irrfAmount,
            category: 'Impostos',
            date: new Date().toISOString().split('T')[0],
            source: 'Imposto de Renda',
            recurring: true
          });
        }

        // Benefícios
        if (employee.other_benefits > 0) {
          allExpenses.push({
            id: `employee-benefits-${employee.id}`,
            type: 'employee_expense',
            description: `Benefícios - ${employee.name}`,
            amount: employee.other_benefits,
            category: 'Funcionários',
            date: new Date().toISOString().split('T')[0],
            source: 'Benefícios',
            recurring: true
          });
        }
      });

      setExpenses(allExpenses);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    // Filtro por período - também inclui despesas recorrentes 
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);

        switch (selectedPeriod) {  
          case 'current-month':
            return expense.recurring || 
                   (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear);
          case 'last-month':
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
          case 'current-year':
            return expenseDate.getFullYear() === currentYear;
          default:
            return true;
        }
      });
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  };

  const getExpenseIcon = (type: string) => {
    switch (type) {
      case 'transaction': return Receipt;
      case 'loan': return CreditCard;
      case 'bill': return FileText;
      case 'retirement': return Shield;
      case 'real_estate_expense': return Home;
      case 'vehicle_expense': return Car;
      case 'tax': return Landmark;
      case 'employee_expense': return Users;
      default: return Receipt;
    }
  };

  const getExpenseColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-red-100 text-red-600';
      case 'loan': return 'bg-orange-100 text-orange-600';
      case 'bill': return 'bg-yellow-100 text-yellow-600';
      case 'retirement': return 'bg-blue-100 text-blue-600';
      case 'real_estate_expense': return 'bg-purple-100 text-purple-600';
      case 'vehicle_expense': return 'bg-teal-100 text-teal-600';
      case 'tax': return 'bg-indigo-100 text-indigo-600';
      case 'employee_expense': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const recurringExpenses = filteredExpenses.filter(expense => expense.recurring);
  const oneTimeExpenses = filteredExpenses.filter(expense => !expense.recurring);

  // Agrupar por categoria para o gráfico
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.keys(expensesByCategory);

  // Calcular total de impostos
  const totalTaxes = filteredExpenses
    .filter(expense => expense.type === 'tax' || (expense.type === 'employee_expense' && expense.source === 'Imposto de Renda'))
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calcular total de despesas com veículos
  const totalVehicleExpenses = filteredExpenses
    .filter(expense => expense.type === 'vehicle_expense')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calcular total de despesas com funcionários
  const totalEmployeeExpenses = filteredExpenses
    .filter(expense => expense.type === 'employee_expense')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calcular total de encargos sociais
  const totalSocialCharges = filteredExpenses
    .filter(expense => expense.category === 'Encargos Sociais')
    .reduce((sum, expense) => sum + expense.amount, 0);

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
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Gastos</h1>
          <p className="text-gray-500 mt-1">Visão completa de todas as suas despesas</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total de Gastos</p>
              <p className="text-3xl font-bold mt-1">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Gastos Recorrentes</p>
              <p className="text-3xl font-bold mt-1">R$ {recurringExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-orange-100 text-sm">{recurringExpenses.length} itens</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Gastos Únicos</p>
              <p className="text-3xl font-bold mt-1">R$ {oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-purple-100 text-sm">{oneTimeExpenses.length} itens</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <PieChart className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Destaques de Funcionários, Impostos e Veículos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Funcionários</p>
              <p className="text-3xl font-bold mt-1">R$ {totalEmployeeExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-pink-100 text-sm">{filteredExpenses.filter(e => e.type === 'employee_expense' && e.source === 'Salário').length} funcionários</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Impostos</p>
              <p className="text-3xl font-bold mt-1">R$ {totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-indigo-100 text-sm">{filteredExpenses.filter(e => e.type === 'tax' || (e.type === 'employee_expense' && e.source === 'Imposto de Renda')).length} impostos</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Encargos Sociais</p>
              <p className="text-3xl font-bold mt-1">R$ {totalSocialCharges.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-blue-100 text-sm">{filteredExpenses.filter(e => e.category === 'Encargos Sociais').length} encargos</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Veículos</p>
              <p className="text-3xl font-bold mt-1">R$ {totalVehicleExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-teal-100 text-sm">{filteredExpenses.filter(e => e.type === 'vehicle_expense').length} veículos</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Car className="h-6 w-6" />
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
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="current-month">Mês atual</option>
            <option value="last-month">Mês passado</option>
            <option value="current-year">Ano atual</option>
            <option value="all">Todos os períodos</option>
          </select>
        </div>
      </div>

      {/* Gráfico por categoria */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Gastos por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => {
              const amount = expensesByCategory[category];
              const percentage = (amount / totalExpenses) * 100;
              
              return (
                <div key={category} className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{category}</h3>
                    <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de despesas */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Todas as Despesas</h2>
          <p className="text-gray-500 text-sm mt-1">{filteredExpenses.length} despesas encontradas</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma despesa encontrada</h3>
              <p className="text-gray-500">Ajuste os filtros para ver mais resultados.</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const Icon = getExpenseIcon(expense.type);
              const colorClass = getExpenseColor(expense.type);
              
              return (
                <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-800">{expense.description}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">{expense.category}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{expense.source}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                          </span>
                          {expense.recurring && (
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
                      <span className="font-semibold text-lg text-red-600 whitespace-nowrap">
                        R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}