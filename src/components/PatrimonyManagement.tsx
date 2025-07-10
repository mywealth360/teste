import React, { useState, useEffect } from 'react';
import { Building, Car, TrendingUp, Gem, DollarSign, Plus, Edit2, Trash2, Home, PieChart, BarChart, Shield, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DateRangeSelector from './DateRangeSelector';

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
  const [showCharts, setShowCharts] = useState(true);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [realEstateData, investmentsData, vehiclesData, exoticAssetsData] = await Promise.all([
        supabase.from('real_estate').select('*').eq('user_id', user?.id)
          .gte('purchase_date', startDate).lte('purchase_date', endDate),
        supabase.from('investments').select('*').eq('user_id', user?.id)
          .gte('purchase_date', startDate).lte('purchase_date', endDate),
        supabase.from('vehicles').select('*').eq('user_id', user?.id)
          .gte('purchase_date', startDate).lte('purchase_date', endDate),
        supabase.from('exotic_assets').select('*').eq('user_id', user?.id)
          .gte('purchase_date', startDate).lte('purchase_date', endDate)
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

  const calculateAssetDistribution = () => {
    const realEstateValue = realEstate.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0);
    const investmentsValue = investments.reduce((sum, item) => sum + (item.current_price || item.purchase_price || 0) * (item.quantity || 1), 0);
    const vehiclesValue = vehicles.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0);
    const exoticAssetsValue = exoticAssets.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0);
    
    const total = realEstateValue + investmentsValue + vehiclesValue + exoticAssetsValue;
    
    return [
      { name: 'Imóveis', value: realEstateValue, percentage: total > 0 ? (realEstateValue / total) * 100 : 0, color: 'bg-orange-500' },
      { name: 'Investimentos', value: investmentsValue, percentage: total > 0 ? (investmentsValue / total) * 100 : 0, color: 'bg-blue-500' },
      { name: 'Veículos', value: vehiclesValue, percentage: total > 0 ? (vehiclesValue / total) * 100 : 0, color: 'bg-green-500' },
      { name: 'Ativos Exóticos', value: exoticAssetsValue, percentage: total > 0 ? (exoticAssetsValue / total) * 100 : 0, color: 'bg-purple-500' }
    ].sort((a, b) => b.value - a.value);
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

  const assetDistribution = calculateAssetDistribution();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Patrimônio</h1>
          <p className="text-gray-500 mt-1">Visão completa dos seus ativos e investimentos</p>
        </div>
        <div className="flex items-center space-x-4">
          <DateRangeSelector 
            onRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }} 
          />
          <div className="text-right">
            <p className="text-sm text-gray-500">Patrimônio Total</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalValue())}</p>
          </div>
        </div>
      </div>
      
      {/* Asset Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-blue-600" />
            Distribuição de Ativos
          </h2>
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              {assetDistribution.map((asset, index) => {
                // Create a simple pie chart with CSS conic-gradient
                const segments = assetDistribution.map(a => `${a.color} 0 ${a.percentage}%`).join(', ');
                return (
                  <div 
                    key={index}
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      background: `conic-gradient(${segments})`,
                      clipPath: index === 0 ? 'circle(50%)' : 'none'
                    }}
                  ></div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              {assetDistribution.map((asset, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 ${asset.color} rounded-full mr-2`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{asset.name}</p>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">{asset.percentage.toFixed(1)}%</span>
                      <span className="text-xs font-medium">{formatCurrency(asset.value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-blue-600" />
            Evolução Patrimonial
          </h2>
          <div className="h-64 relative">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gray-200"></div>
            <div className="absolute inset-y-0 left-0 w-px bg-gray-200"></div>
            
            {/* Bars */}
            <div className="absolute bottom-0 left-[10%] w-12 h-32 bg-blue-500 rounded-t-lg"></div>
            <div className="absolute bottom-0 left-[25%] w-12 h-40 bg-blue-500 rounded-t-lg"></div>
            <div className="absolute bottom-0 left-[40%] w-12 h-48 bg-blue-500 rounded-t-lg"></div>
            <div className="absolute bottom-0 left-[55%] w-12 h-56 bg-blue-500 rounded-t-lg"></div>
            <div className="absolute bottom-0 left-[70%] w-12 h-60 bg-blue-500 rounded-t-lg"></div>
            <div className="absolute bottom-0 left-[85%] w-12 h-64 bg-blue-500 rounded-t-lg"></div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-[-20px] left-[10%] text-xs text-gray-500">Jan</div>
            <div className="absolute bottom-[-20px] left-[25%] text-xs text-gray-500">Mar</div>
            <div className="absolute bottom-[-20px] left-[40%] text-xs text-gray-500">Mai</div>
            <div className="absolute bottom-[-20px] left-[55%] text-xs text-gray-500">Jul</div>
            <div className="absolute bottom-[-20px] left-[70%] text-xs text-gray-500">Set</div>
            <div className="absolute bottom-[-20px] left-[85%] text-xs text-gray-500">Nov</div>
            
            {/* Y-axis labels */}
            <div className="absolute left-[-30px] bottom-0 text-xs text-gray-500">0</div>
            <div className="absolute left-[-30px] bottom-[32px] text-xs text-gray-500">500k</div>
            <div className="absolute left-[-30px] bottom-[64px] text-xs text-gray-500">1M</div>
            <div className="absolute left-[-30px] bottom-[96px] text-xs text-gray-500">1.5M</div>
            <div className="absolute left-[-30px] bottom-[128px] text-xs text-gray-500">2M</div>
          </div>
        </div>
      </div>
      
      {/* Asset Type Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Imóveis</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(realEstate.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0))}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Home className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{realEstate.length} imóveis cadastrados</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Investimentos</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(investments.reduce((sum, item) => sum + (item.current_price || item.purchase_price || 0) * (item.quantity || 1), 0))}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{investments.length} investimentos cadastrados</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Veículos</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(vehicles.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0))}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Car className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{vehicles.length} veículos cadastrados</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Ativos Exóticos</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(exoticAssets.reduce((sum, item) => sum + (item.current_value || item.purchase_price), 0))}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Gem className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{exoticAssets.length} ativos cadastrados</p>
        </div>
      </div>

      {/* Asset Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
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

        <div className="p-6">
          {activeTab === 'real_estate' && (
            <div className="grid gap-4">
              {realEstate.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum imóvel cadastrado</h3>
                  <p className="text-gray-500 mb-4">Adicione seus imóveis para acompanhar seu patrimônio.</p>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Imóvel
                  </button>
                </div>
              ) : (
                realEstate.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Home className="h-5 w-5 text-orange-600 mr-2" />
                          <h3 className="font-medium text-gray-900">{item.address}</h3>
                        </div>
                        <p className="text-sm text-gray-500 capitalize mt-1">{item.type}</p>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Valor Atual:</p>
                            <p className="font-medium text-gray-900">{formatCurrency(item.current_value || item.purchase_price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Preço de Compra:</p>
                            <p className="font-medium text-gray-900">{formatCurrency(item.purchase_price)}</p>
                          </div>
                          {item.is_rented && (
                            <div>
                              <p className="text-gray-500">Aluguel Mensal:</p>
                              <p className="font-medium text-green-600">{formatCurrency(item.monthly_rent || 0)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500">Valorização:</p>
                            <p className="font-medium text-green-600">
                              +{(((item.current_value || item.purchase_price) / item.purchase_price - 1) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Edit2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Editar</span>
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="grid gap-4">
              {investments.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum investimento cadastrado</h3>
                  <p className="text-gray-500 mb-4">Adicione seus investimentos para acompanhar seu patrimônio.</p>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Investimento
                  </button>
                </div>
              ) : (
                investments.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 capitalize mt-1">{item.type} - {item.broker}</p>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Valor Atual:</p>
                            <p className="font-medium text-gray-900">{formatCurrency((item.current_price || item.purchase_price || 0) * (item.quantity || 1))}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Rentabilidade:</p>
                            <p className="font-medium text-green-600">+{(item.interest_rate || item.dividend_yield || 5).toFixed(2)}%</p>
                          </div>
                          {item.monthly_income > 0 && (
                            <div>
                              <p className="text-gray-500">Renda Mensal:</p>
                              <p className="font-medium text-green-600">{formatCurrency(item.monthly_income)}</p>
                            </div>
                          )}
                          {item.tax_rate > 0 && (
                            <div>
                              <p className="text-gray-500">Imposto:</p>
                              <p className="font-medium text-red-600">{item.tax_rate}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Edit2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Editar</span>
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="grid gap-4">
              {vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum veículo cadastrado</h3>
                  <p className="text-gray-500 mb-4">Adicione seus veículos para acompanhar seu patrimônio.</p>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Veículo
                  </button>
                </div>
              ) : (
                vehicles.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Car className="h-5 w-5 text-green-600 mr-2" />
                          <h3 className="font-medium text-gray-900">{item.brand} {item.model}</h3>
                        </div>
                        <p className="text-sm text-gray-500 capitalize mt-1">{item.type} - {item.year}</p>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Valor Atual:</p>
                            <p className="font-medium text-gray-900">{formatCurrency(item.current_value || item.purchase_price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Depreciação:</p>
                            <p className="font-medium text-red-600">-{item.depreciation_rate}%/ano</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Quilometragem:</p>
                            <p className="font-medium text-gray-900">{item.mileage?.toLocaleString()} km</p>
                          </div>
                          {item.monthly_expenses > 0 && (
                            <div>
                              <p className="text-gray-500">Gastos Mensais:</p>
                              <p className="font-medium text-red-600">{formatCurrency(item.monthly_expenses)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Edit2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Editar</span>
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'exotic_assets' && (
            <div className="grid gap-4">
              {exoticAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Gem className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ativo exótico cadastrado</h3>
                  <p className="text-gray-500 mb-4">Adicione seus ativos exóticos para acompanhar seu patrimônio.</p>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ativo Exótico
                  </button>
                </div>
              ) : (
                exoticAssets.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Gem className="h-5 w-5 text-purple-600 mr-2" />
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 capitalize mt-1">{item.category}</p>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Valor Atual:</p>
                            <p className="font-medium text-gray-900">{formatCurrency(item.current_value || item.purchase_price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Preço de Compra:</p>
                            <p className="font-medium text-gray-900">{formatCurrency(item.purchase_price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Valorização:</p>
                            <p className="font-medium text-green-600">
                              +{(((item.current_value || item.purchase_price) / item.purchase_price - 1) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Condição:</p>
                            <p className="font-medium text-gray-900 capitalize">{item.condition}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Edit2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Editar</span>
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center">
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 text-sm">Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
    
      
      {/* Asset Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Ativos Líquidos</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(calculateTotalValue() * 0.6)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-600 p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Dívidas Totais</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(calculateTotalValue() * 0.15)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-600 p-6 rounded-xl text-white shadow-md">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Patrimônio Líquido</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(calculateTotalValue() * 0.85)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}