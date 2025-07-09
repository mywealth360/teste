import React, { useState, useEffect } from 'react';
import { Building, Car, TrendingUp, Gem, DollarSign, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RealEstate {
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
}

interface Investment {
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
}

interface Vehicle {
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
}

interface ExoticAsset {
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
}

export default function PatrimonyManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'real_estate' | 'investments' | 'vehicles' | 'exotic_assets'>('real_estate');
  const [realEstate, setRealEstate] = useState<RealEstate[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [exoticAssets, setExoticAssets] = useState<ExoticAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [realEstateData, investmentsData, vehiclesData, exoticAssetsData] = await Promise.all([
        supabase.from('real_estate').select('*').eq('user_id', user?.id),
        supabase.from('investments').select('*').eq('user_id', user?.id),
        supabase.from('vehicles').select('*').eq('user_id', user?.id),
        supabase.from('exotic_assets').select('*').eq('user_id', user?.id)
      ]);

      if (realEstateData.data) setRealEstate(realEstateData.data);
      if (investmentsData.data) setInvestments(investmentsData.data);
      if (vehiclesData.data) setVehicles(vehiclesData.data);
      if (exoticAssetsData.data) setExoticAssets(exoticAssetsData.data);
    } catch (error) {
      console.error('Error fetching patrimony data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = () => {
    const realEstateValue = realEstate.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0);
    const investmentsValue = investments.reduce((sum, item) => sum + (item.current_price || item.purchase_price || 0) * (item.quantity || 1), 0);
    const vehiclesValue = vehicles.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0);
    const exoticAssetsValue = exoticAssets.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0);
    
    return realEstateValue + investmentsValue + vehiclesValue + exoticAssetsValue;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const tabConfig = [
    { id: 'real_estate', label: 'Imóveis', icon: Building, data: realEstate },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp, data: investments },
    { id: 'vehicles', label: 'Veículos', icon: Car, data: vehicles },
    { id: 'exotic_assets', label: 'Ativos Exóticos', icon: Gem, data: exoticAssets }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Patrimônio</h2>
          <div className="text-right">
            <p className="text-sm text-gray-500">Patrimônio Total</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalValue())}</p>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.data.length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          {activeTab === 'real_estate' && (
            <div className="grid gap-4">
              {realEstate.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.address}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Valor Atual:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.current_value || item.purchase_price)}</span>
                        </div>
                        {item.monthly_rent && (
                          <div>
                            <span className="text-gray-500">Aluguel:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.monthly_rent)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="grid gap-4">
              {investments.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.type} - {item.broker}</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Valor Atual:</span>
                          <span className="ml-2 font-medium">{formatCurrency((item.current_price || item.purchase_price || 0) * (item.quantity || 1))}</span>
                        </div>
                        {item.monthly_income && (
                          <div>
                            <span className="text-gray-500">Renda Mensal:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.monthly_income)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="grid gap-4">
              {vehicles.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.brand} {item.model}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.type} - {item.year}</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Valor Atual:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.current_value || item.purchase_price)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Quilometragem:</span>
                          <span className="ml-2 font-medium">{item.mileage?.toLocaleString()} km</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'exotic_assets' && (
            <div className="grid gap-4">
              {exoticAssets.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Valor Atual:</span>
                          <span className="ml-2 font-medium">{formatCurrency(item.current_value || item.purchase_price)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Condição:</span>
                          <span className="ml-2 font-medium capitalize">{item.condition}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tabConfig.find(tab => tab.id === activeTab)?.data.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {tabConfig.find(tab => tab.id === activeTab)?.icon && (
                  <tabConfig.find(tab => tab.id === activeTab)!.icon className="h-12 w-12 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Adicione seu primeiro item para começar a gerenciar seu patrimônio.
              </p>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2 mx-auto">
                <Plus className="h-4 w-4" />
                <span>Adicionar Item</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}