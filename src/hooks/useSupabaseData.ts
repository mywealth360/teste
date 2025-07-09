import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useSupabaseData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Financial data
  const [totalMonthlyIncome, setTotalMonthlyIncome] = useState(0);
  const [totalMonthlyExpenses, setTotalMonthlyExpenses] = useState(0);
  const [netMonthlyIncome, setNetMonthlyIncome] = useState(0);
  const [totalInvestmentValue, setTotalInvestmentValue] = useState(0);
  const [totalInvestmentIncome, setTotalInvestmentIncome] = useState(0);
  const [totalRealEstateValue, setTotalRealEstateValue] = useState(0);
  const [totalRealEstateIncome, setTotalRealEstateIncome] = useState(0);
  const [totalRealEstateExpenses, setTotalRealEstateExpenses] = useState(0);
  const [totalRetirementSaved, setTotalRetirementSaved] = useState(0);
  const [totalRetirementContribution, setTotalRetirementContribution] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalLoanPayments, setTotalLoanPayments] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [totalBankBalance, setTotalBankBalance] = useState(0);
  const [totalVehicleValue, setTotalVehicleValue] = useState(0);
  const [totalVehicleDepreciation, setTotalVehicleDepreciation] = useState(0);
  const [totalVehicleExpenses, setTotalVehicleExpenses] = useState(0);
  const [totalExoticAssetsValue, setTotalExoticAssetsValue] = useState(0);
  const [totalExoticAssetsAppreciation, setTotalExoticAssetsAppreciation] = useState(0);
  const [totalFinancialGoals, setTotalFinancialGoals] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [totalTaxes, setTotalTaxes] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel - income must be fetched first as other functions depend on it
      // First fetch income since other functions depend on it
      await fetchIncome();
      
      // Then fetch the rest in parallel
      await Promise.all([
        fetchExpenses(),
        fetchInvestments(),
        fetchRealEstate(),
        fetchRetirement(),
        fetchLoans(),
        fetchBills(),
        fetchBankAccounts(),
        fetchVehicles(),
        fetchExoticAssets(),
        fetchFinancialGoals()
      ]);

      // Calculate total assets
      const totalAssetsValue = 
        totalInvestmentValue + 
        totalRealEstateValue + 
        totalRetirementSaved + 
        totalBankBalance +
        totalVehicleValue +
        totalExoticAssetsValue +
        totalFinancialGoals;
      
      setTotalAssets(totalAssetsValue);
      
      // Calculate net worth
      const netWorthValue = totalAssetsValue - totalDebt;
      setNetWorth(netWorthValue);
      
      // Final validation to ensure consistent totals
      // Make sure total monthly income includes all sources
      const validatedTotalMonthlyIncome = totalMonthlyIncome + totalInvestmentIncome + totalRealEstateIncome;
      
      // Only update if we have income - otherwise keep previous calculation
      if (validatedTotalMonthlyIncome > 0) {
        setTotalMonthlyIncome(validatedTotalMonthlyIncome);
      }

      // Calculate total taxes
      await calculateTotalTaxes();

      setLoading(false);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Erro ao carregar dados financeiros');
      setLoading(false);
    }
  };

  const fetchIncome = async () => {
    try {
      const { data, error } = await supabase
        .from('income_sources')
        .select('id, name, amount, frequency, category, is_active, tax_rate')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      let monthlyTotal = 0;
      
      (data || []).forEach(income => {
        // Only count active income sources
        switch (income.frequency) {
        case 'monthly':
          monthlyTotal += income.amount;
          break;
        case 'weekly':
          monthlyTotal += income.amount * 4.33; // Average weeks per month
          break;
        case 'yearly':
          monthlyTotal += income.amount / 12;
          break;
        // One-time income not included in monthly calculations
        }
      });

      setTotalMonthlyIncome(monthlyTotal);
      return data;
    } catch (err) {
      console.error('Error fetching income:', err);
      return [];
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, is_recurring')
        .eq('user_id', user?.id)
        .eq('type', 'expense');

      if (error) throw error;

      // Calculate monthly expenses (only recurring ones)
      const monthlyExpenses = (data || [])
        .filter(expense => expense.is_recurring)
        .reduce((sum, expense) => sum + expense.amount, 0);

      setTotalMonthlyExpenses(monthlyExpenses);
      setNetMonthlyIncome(totalMonthlyIncome - monthlyExpenses);
      
      return data;
    } catch (err) {
      console.error('Error fetching expenses:', err);
      return [];
    }
  };

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('id, name, type, broker, amount, purchase_price, current_price, interest_rate, monthly_income, purchase_date, maturity_date, quantity, dividend_yield, tax_rate, created_at, updated_at')
        .eq('user_id', user?.id)

      if (error) throw error;

      // Calculate total investment value
      let totalValue = 0;
      let monthlyIncome = 0;
      let validInvestmentsExist = false;

      (data || []).forEach(investment => {
        let currentInvestmentMonthlyIncome = 0;
        let validInvestment = false;
        
        // For stocks and REITs with quantity and current price
        if ((investment.type === 'acoes' || investment.type === 'fundos-imobiliarios') && 
            investment.quantity && investment.current_price) {
          totalValue += investment.quantity * investment.current_price;
          validInvestment = true;
          
          // Calculate dividend income if dividend yield is provided
          if (investment.dividend_yield) {
            const annualDividend = (investment.quantity * investment.current_price * investment.dividend_yield) / 100;
            currentInvestmentMonthlyIncome = annualDividend / 12;
            validInvestment = true;
          }
          
        } 
        // For fixed income with interest rate
        else if (investment.interest_rate && investment.amount) {
          totalValue += investment.amount || 0;
          if (investment.amount && investment.interest_rate) {
            const annualInterest = (investment.amount * investment.interest_rate) / 100;
            currentInvestmentMonthlyIncome = annualInterest / 12;
          }
        }
        // For dividends on investments without quantity/price but with dividend yield
        else if (investment.dividend_yield && investment.amount) {
          totalValue += investment.amount || 0;
          const annualDividend = (investment.amount * investment.dividend_yield) / 100;
          currentInvestmentMonthlyIncome = annualDividend / 12;
          validInvestment = true;
        }
        // Fallback to amount
        else {
          totalValue += investment.amount || 0;
          validInvestment = true;
          
          validInvestment = investment.amount > 0;
          // Use monthly_income if provided
          if (investment.monthly_income && investment.monthly_income > 0) {
            currentInvestmentMonthlyIncome = investment.monthly_income;
          } else if (investment.dividend_yield && investment.amount) {
            validInvestment = true;
            // If amount and dividend yield are available (for funds without quantity/price)
            currentInvestmentMonthlyIncome = (investment.amount * investment.dividend_yield) / 100 / 12;
            validInvestment = true;
            validInvestment = true;
          }
        }
        
        // Only add income if this is a valid investment
        if (validInvestment && currentInvestmentMonthlyIncome > 0) {
          monthlyIncome += currentInvestmentMonthlyIncome;
          validInvestmentsExist = true;
        }
      });

      // Only set investment values if we have valid investments
      if (validInvestmentsExist) {
        setTotalInvestmentValue(totalValue);
        setTotalInvestmentIncome(monthlyIncome);
      } else {
        setTotalInvestmentValue(0);
        setTotalInvestmentIncome(0);
      }
      
      // Calculate percentage of income from investments for display
      const investmentIncomePercentage = totalMonthlyIncome > 0 ? (monthlyIncome / totalMonthlyIncome) * 100 : 0;
      
      return { data, monthlyIncome, investmentIncomePercentage };
    } catch (err) {
      console.error('Error fetching investments:', err);
      return [];
    }
  };

  const fetchRealEstate = async () => {
    try {
      const { data, error } = await supabase
        .from('real_estate')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate total real estate value and income
      let totalValue = 0;
      let monthlyIncome = 0;
      let totalExpenses = 0;

      (data || []).forEach(property => {
        // Use current value if available, otherwise use purchase price
        totalValue += property.current_value || property.purchase_price || 0;

        // Calculate monthly income from rented properties (net of expenses)
        if (property.is_rented && property.monthly_rent) {
          monthlyIncome += property.monthly_rent || 0;
        }
        
        // Add property expenses
        totalExpenses += property.expenses || 0;
      });

      setTotalRealEstateValue(totalValue);
      setTotalRealEstateIncome(monthlyIncome);
      setTotalRealEstateExpenses(totalExpenses);

      // Calculate percentage of income from real estate for display
      const realEstateIncomePercentage = totalMonthlyIncome > 0 ? (monthlyIncome / totalMonthlyIncome) * 100 : 0;
      
      return { data, monthlyIncome, realEstateIncomePercentage };
    } catch (err) {
      console.error('Error fetching real estate:', err);
      return [];
    }
  };

  const fetchRetirement = async () => {
    try {
      const { data, error } = await supabase
        .from('retirement_plans')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate total retirement savings and monthly contributions
      const totalSaved = (data || []).reduce((sum, plan) => sum + plan.total_contributed, 0);
      const monthlyContribution = (data || []).reduce((sum, plan) => sum + plan.monthly_contribution, 0);

      // Calculate percentage of expenses for retirement contributions
      const retirementExpensePercentage = totalMonthlyExpenses > 0 ? (monthlyContribution / totalMonthlyExpenses) * 100 : 0;

      setTotalRetirementSaved(totalSaved);
      setTotalRetirementContribution(monthlyContribution);
      
      return { data, monthlyContribution, retirementExpensePercentage };
    } catch (err) {
      console.error('Error fetching retirement plans:', err);
      return [];
    }
  };

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate total debt and monthly payments
      const totalRemainingAmount = (data || []).reduce((sum, loan) => sum + loan.remaining_amount, 0);
      const totalMonthlyPayment = (data || []).reduce((sum, loan) => sum + loan.monthly_payment, 0);

      setTotalDebt(totalRemainingAmount);
      setTotalLoanPayments(totalMonthlyPayment);

      // Calculate percentage of expenses for loan payments
      const loanExpensePercentage = totalMonthlyExpenses > 0 ? (totalMonthlyPayment / totalMonthlyExpenses) * 100 : 0;
      
      return { data, totalMonthlyPayment, loanExpensePercentage };
    } catch (err) {
      console.error('Error fetching loans:', err);
      return [];
    }
  };

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      // Calculate total monthly bills
      const totalMonthlyBills = (data || []).reduce((sum, bill) => sum + bill.amount, 0);
      
      // Calculate percentage of expenses for bills
      const billsExpensePercentage = totalMonthlyExpenses > 0 ? (totalMonthlyBills / totalMonthlyExpenses) * 100 : 0;

      setTotalBills(totalMonthlyBills);
      
      return { data, totalMonthlyBills, billsExpensePercentage };
    } catch (err) {
      console.error('Error fetching bills:', err);
      return [];
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate total bank balance
      const totalBalance = (data || []).reduce((sum, account) => sum + account.balance, 0);
      
      // Set percentage of total assets
      const bankBalancePercentage = totalAssets > 0 ? (totalBalance / totalAssets) * 100 : 0;

      setTotalBankBalance(totalBalance);
      
      return { data, totalBalance, bankBalancePercentage };
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      return [];
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate total vehicle value, depreciation, and expenses
      let totalValue = 0;
      let totalDepreciation = 0;
      let totalExpenses = 0;

      (data || []).forEach(vehicle => {
        // Use current value if available, otherwise calculate based on purchase price and depreciation
        if (vehicle.current_value) {
          totalValue += vehicle.current_value;
          totalDepreciation += vehicle.purchase_price - vehicle.current_value;
        } else {
          // Simple depreciation calculation
          const purchaseDate = new Date(vehicle.purchase_date);
          const now = new Date();
          const yearsOwned = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
          
          // Apply depreciation rate (default to 10% if not specified)
          const depreciationRate = vehicle.depreciation_rate || 10;
          const currentValue = vehicle.purchase_price * Math.pow(1 - (depreciationRate / 100), yearsOwned);
          
          totalValue += currentValue;
          totalDepreciation += vehicle.purchase_price - currentValue;
        }
        
        // Add monthly expenses
        totalExpenses += vehicle.monthly_expenses || 0;
      });

      setTotalVehicleValue(totalValue);
      setTotalVehicleDepreciation(totalDepreciation);
      setTotalVehicleExpenses(totalExpenses);

      // Calculate percentage of expenses for vehicle expenses
      const vehicleExpensePercentage = totalMonthlyExpenses > 0 ? (totalExpenses / totalMonthlyExpenses) * 100 : 0;
      
      // Calculate percentage of total assets
      const vehicleAssetPercentage = totalAssets > 0 ? (totalValue / totalAssets) * 100 : 0;
      
      return { 
        data, 
        totalValue,
        totalExpenses, 
        vehicleExpensePercentage,
        vehicleAssetPercentage
      };
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      return [];
    }
  };

  const fetchFinancialGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      // Calculate total amount allocated to financial goals
      let totalGoals = 0;
      
      (data || []).forEach(goal => {
        if (goal.current_amount > 0) {
          totalGoals += goal.current_amount;
        }
      });

      setTotalFinancialGoals(totalGoals);
      return data;
    } catch (err) {
      console.error('Error fetching financial goals:', err);
      return [];
    }
  };

  const fetchExoticAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('exotic_assets')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate total exotic assets value and appreciation
      let totalValue = 0;
      let totalAppreciation = 0;

      (data || []).forEach(asset => {
        // Use current value if available, otherwise use purchase price
        const currentValue = asset.current_value || asset.purchase_price;
        totalValue += currentValue;
        
        // Calculate appreciation
        totalAppreciation += currentValue - asset.purchase_price;
      });

      setTotalExoticAssetsValue(totalValue);
      setTotalExoticAssetsAppreciation(totalAppreciation);

      // Calculate percentage of total assets
      const exoticAssetPercentage = totalAssets > 0 ? (totalValue / totalAssets) * 100 : 0;
      
      return { data, totalValue, exoticAssetPercentage };
    } catch (err) {
      console.error('Error fetching exotic assets:', err);
      return [];
    }
  };

  const calculateTotalTaxes = async () => {
    try {
      let totalTaxAmount = 0;
      
      // Fetch income sources with tax rates
      const { data: incomeSources, error: incomeError } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .not('tax_rate', 'is', null);
      
      if (incomeError) throw incomeError;
      
      // Calculate income taxes
      (incomeSources || []).forEach(income => {
        if (income.tax_rate) {
          let monthlyAmount = income.amount;
          
          // Convert to monthly equivalent
          if (income.frequency === 'weekly') {
            monthlyAmount = income.amount * 4.33;
          } else if (income.frequency === 'yearly') {
            monthlyAmount = income.amount / 12;
          }
          
          const taxAmount = (monthlyAmount * income.tax_rate) / 100;
          totalTaxAmount += taxAmount;
        }
      });
      
      // Fetch investments with tax rates
      const { data: investments, error: investmentError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user?.id)
        .not('tax_rate', 'is', null);
      
      if (investmentError) throw investmentError;
      
      // Calculate investment taxes
      (investments || []).forEach(investment => {
        if (investment.tax_rate) {
          let monthlyIncome = 0;
          
          // Calculate monthly income based on investment type
          if (investment.type === 'acoes' || investment.type === 'fundos-imobiliarios') {
            if (investment.dividend_yield && investment.quantity && investment.current_price) {
              const currentValue = investment.quantity * investment.current_price;
              monthlyIncome = (currentValue * investment.dividend_yield) / 100 / 12;
            } else if (investment.monthly_income) {
              monthlyIncome = investment.monthly_income;
            } else if (inv.monthly_income) {
              currentInvestmentMonthlyIncome = inv.monthly_income;
            }
          } else if (investment.interest_rate && investment.amount) {
            monthlyIncome = (investment.amount * investment.interest_rate) / 100 / 12;
          } else if (investment.monthly_income) {
            monthlyIncome = investment.monthly_income;
          }
          
          const taxAmount = (monthlyIncome * investment.tax_rate) / 100;
          totalTaxAmount += taxAmount;
        }
      });
      
      // Fetch real estate with tax rates
      const { data: properties, error: propertyError } = await supabase
        .from('real_estate')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_rented', true)
        .not('tax_rate', 'is', null);
      
      if (propertyError) throw propertyError;
      
      // Calculate real estate rental taxes
      (properties || []).forEach(property => {
        if (property.tax_rate && property.monthly_rent) {
          const taxAmount = (property.monthly_rent * property.tax_rate) / 100;
          totalTaxAmount += taxAmount;
        }
      });
      
      // Fetch employees for payroll taxes
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');
      
      if (employeeError) throw employeeError;
      
      // Calculate employee taxes (FGTS, INSS, IRRF)
      (employees || []).forEach(employee => {
        // FGTS (8% by default)
        const fgtsAmount = employee.salary * (employee.fgts_percentage / 100);
        totalTaxAmount += fgtsAmount;
        
        // INSS
        if (employee.inss_percentage > 0) {
          const inssAmount = employee.salary * (employee.inss_percentage / 100);
          totalTaxAmount += inssAmount;
        }
        
        // IRRF
        if (employee.irrf_percentage > 0) {
          const irrfAmount = employee.salary * (employee.irrf_percentage / 100);
          totalTaxAmount += irrfAmount;
        }
      });
      
      setTotalTaxes(totalTaxAmount);

      // Calculate percentage of expenses for taxes
      const taxExpensePercentage = totalMonthlyExpenses > 0 ? (totalTaxAmount / totalMonthlyExpenses) * 100 : 0;
      
      return { totalTaxAmount, taxExpensePercentage };
    } catch (err) {
      console.error('Error calculating taxes:', err);
    }
  };

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    netMonthlyIncome,
    totalInvestmentValue,
    totalInvestmentIncome,
    totalRealEstateValue,
    totalRealEstateIncome,
    totalRealEstateExpenses,
    totalRetirementSaved,
    totalRetirementContribution,
    totalDebt,
    totalLoanPayments,
    totalBills,
    totalBankBalance,
    totalVehicleValue,
    totalVehicleDepreciation,
    totalVehicleExpenses,
    totalExoticAssetsValue,
    totalExoticAssetsAppreciation,
    totalFinancialGoals,
    totalAssets,
    netWorth,
    totalTaxes,
    loading,
    error
  };
}