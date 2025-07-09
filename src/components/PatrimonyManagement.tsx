import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Building,
  Home,
  Shield,
  Banknote,
  PieChart,
  BarChart3,
  Calendar,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Landmark,
  AlertTriangle,
  CheckCircle,
  Info,
  Car,
  Gem
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

// Dados simulados de evolução patrimonial vs inflação e CDI
const generatePatrimonyEvolution = () => {
  const months = [
    'Jan 2023', 'Fev 2023', 'Mar 2023', 'Abr 2023', 'Mai 2023', 'Jun 2023',
    'Jul 2023', 'Ago 2023', 'Set 2023', 'Out 2023', 'Nov 2023', 'Dez 2023',
    'Jan 2024', 'Fev 2024', 'Mar 2024', 'Abr 2024', 'Mai 2024', 'Jun 2024'
  ];

  const cdiRates = [13.75, 13.75, 13.75, 13.75, 13.75, 13.75, 13.75, 13.25, 12.75, 12.25, 11.75, 11.25, 10.75, 10.50, 10.25, 10.00, 9.75, 9.50];
  const inflationRates = [5.77, 5.60, 4.65, 4.18, 3.94, 3.16, 3.99, 4.24, 5.19, 4.82, 4.68, 4.62, 4.50, 4.35, 4.20, 4.05, 3.90, 3.75];

  let basePatrimony = 450000;
  let cdiAccumulated = 100000;
  let inflationAdjusted = 450000;
  
  return months.map((month, index) => {
    const monthlyGrowth = (basePatrimony * (cdiRates[index] / 100 / 12)) + 3500;
    basePatrimony += monthlyGrowth;
    
    cdiAccumulated *= (1 + cdiRates[index] / 100 / 12);
    inflationAdjusted *= (1 - inflationRates[index] / 100 / 12);

    return {
      month,
      patrimonio: Math.round(basePatrimony),
      cdi: cdiRates[index],
      inflacao: inflationRates[index],
      patrimonioVsCDI: Math.round(cdiAccumulated),
      patrimonioReal: Math.round(inflationAdjusted)
    };
  });
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#0284c7', '#7c3aed'];

export default function PatrimonyManagement() {
  const {
    totalInvestmentValue,
    totalRealEstateValue,
    totalRetirementSaved,
    totalBankBalance,
    totalVehicleValue,
    totalExoticAssetsValue,
    totalAssets,
    netWorth,
    totalDebt,
    loading,
    error
  } = useSupabaseData();

  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '1y' | '2y'>('1y');
  const [evolutionData, setEvolutionData] = useState<any[]>([]);

  useEffect(() => {
    const data = generatePatrimonyEvolution();
    
    let filteredData = data;
    if (selectedPeriod === '6m') {
      filteredData = data.slice(-6);
    } else if (selectedPeriod === '1y') {
      filteredData = data.slice(-12);
    }
    
    setEvolutionData(filteredData);
  }, [selectedPeriod]);

  // Calcular ativos líquidos e imobilizados
  const liquidAssets = totalBankBalance + (totalInvestmentValue * 0.7);
  const immobilizedAssets = totalRealEstateValue + totalRetirementSaved + (totalInvestmentValue * 0.3) + totalVehicleValue + totalExoticAssetsValue;

  // Distribuição do patrimônio
  const assetDistribution = [
    { name: 'Investimentos', value: totalInvestmentValue, color: '#3b82f6' },
    { name: 'Imóveis', value: totalRealEstateValue, color: '#f59e0b' },
    { name: 'Previdência', value: totalRetirementSaved, color: '#10b981' },
    { name: 'Contas Bancárias', value: totalBankBalance, color: '#06b6d4' },
    { name: 'Veículos', value: totalVehicleValue, color: '#0284c7' },
    { name: 'Ativos Exóticos', value: totalExoticAssetsValue, color: '#7c3aed' }
  ].filter(item => item.value > 0);

  // Métricas de performance
  const currentPatrimony = evolutionData[evolutionData.length - 1]?.patrimonio || netWorth;
  const previousPatrimony = evolutionData[evolutionData.length - 2]?.patrimonio || netWorth;
  const patrimonyGrowth = currentPatrimony - previousPatrimony;
  const patrimonyGrowthPercentage = previousPatrimony > 0 ? ((patrimonyGrowth / previousPatrimony) * 100) : 0;

  const currentCDI = evolutionData[evolutionData.length - 1]?.cdi || 9.5;
  const currentInflation = evolutionData[evolutionData.length - 1]?.inflacao || 3.75;

  // Análise de liquidez
  const liquidityRatio = totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0;
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-40 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Patrimônio</h1>
          <p className="text-gray-500 mt-1">Análise completa dos seus ativos e evolução patrimonial</p>
        </div>
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último ano</option>
            <option value="2y">Últimos 2 anos</option>
          </select>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Patrimônio Total</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalAssets)}</p>
              <div className="flex items-center space-x-1 mt-2">
                {patrimonyGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-200" />
                )}
                <span className="text-sm text-emerald-100">
                  {patrimonyGrowthPercentage >= 0 ? '+' : ''}{patrimonyGrowthPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Target className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Ativos Líquidos</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(liquidAssets)}</p>
              <div className="flex items-center space-x-1 mt-2">
                <Wallet className="h-4 w-4 text-blue-200" />
                <span className="text-sm text-blue-100">
                  {liquidityRatio.toFixed(1)}% do total
                </span>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Ativos Imobilizados</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(immobilizedAssets)}</p>
              <div className="flex items-center space-x-1 mt-2">
                <Landmark className="h-4 w-4 text-indigo-200" />
                <span className="text-sm text-indigo-100">
                  {(100 - liquidityRatio).toFixed(1)}% do total
                </span>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Landmark className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${netWorth >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} p-6 rounded-3xl text-white shadow-2xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Patrimônio Líquido</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(Math.abs(netWorth))}</p>
              <div className="flex items-center space-x-1 mt-2">
                {netWorth >= 0 ? (
                  <CheckCircle className="h-4 w-4 text-white/80" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-white/80" />
                )}
                <span className="text-sm text-white/80">
                  {netWorth >= 0 ? 'Positivo' : 'Negativo'}
                </span>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição de Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Distribuição de Ativos</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Análise de Liquidez</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Liquidez dos Ativos</span>
                <span className="font-semibold text-blue-600">{liquidityRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                  style={{ width: `${liquidityRatio}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {liquidityRatio > 50 ? 'Boa liquidez' : liquidityRatio > 30 ? 'Liquidez moderada' : 'Baixa liquidez'}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Endividamento</span>
                <span className={`font-semibold ${debtToAssetRatio > 30 ? 'text-red-600' : 'text-green-600'}`}>
                  {debtToAssetRatio.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${debtToAssetRatio > 30 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}
                  style={{ width: `${Math.min(debtToAssetRatio, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {debtToAssetRatio < 20 ? 'Baixo endividamento' : debtToAssetRatio < 40 ? 'Endividamento moderado' : 'Alto endividamento'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-blue-600 text-sm font-medium">Ativos Líquidos</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(liquidAssets)}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl">
                <p className="text-indigo-600 text-sm font-medium">Ativos Imobilizados</p>
                <p className="text-xl font-bold text-indigo-700">{formatCurrency(immobilizedAssets)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evolução Patrimonial vs Indicadores */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Evolução Patrimonial vs Indicadores</h2>
            <p className="text-gray-500 text-sm mt-1">Compare seu patrimônio com CDI e inflação</p>
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                yAxisId="patrimony"
                orientation="left"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                yAxisId="rate"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'patrimonio' || name === 'patrimonioVsCDI' || name === 'patrimonioReal') {
                    return [formatCurrency(value), 
                      name === 'patrimonio' ? 'Patrimônio' : 
                      name === 'patrimonioVsCDI' ? 'Patrimônio vs CDI' : 
                      'Patrimônio Real'
                    ];
                  }
                  return [formatPercentage(value), name === 'inflacao' ? 'Inflação' : 'CDI'];
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              
              <Line
                yAxisId="patrimony"
                type="monotone"
                dataKey="patrimonio"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                name="Patrimônio"
              />
              <Line
                yAxisId="patrimony"
                type="monotone"
                dataKey="patrimonioVsCDI"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                name="Patrimônio vs CDI"
              />
              <Line
                yAxisId="patrimony"
                type="monotone"
                dataKey="patrimonioReal"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                name="Patrimônio Real"
              />
              
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="cdi"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                name="CDI"
              />
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="inflacao"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                name="Inflação"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicadores de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-500 p-2 rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-green-800">Performance vs CDI</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-green-700">CDI Atual:</span>
              <span className="font-semibold text-green-800">{formatPercentage(currentCDI)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Seu Crescimento:</span>
              <span className="font-semibold text-green-800">{formatPercentage(Math.abs(patrimonyGrowthPercentage))}</span>
            </div>
            <div className="pt-2 border-t border-green-200">
              <p className="text-sm text-green-600">
                {patrimonyGrowthPercentage > currentCDI ? 
                  '✅ Superando o CDI' : 
                  '⚠️ Abaixo do CDI'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-500 p-2 rounded-xl">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-blue-800">Proteção Inflação</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-blue-700">Inflação Atual:</span>
              <span className="font-semibold text-blue-800">{formatPercentage(currentInflation)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Seu Crescimento:</span>
              <span className="font-semibold text-blue-800">{formatPercentage(Math.abs(patrimonyGrowthPercentage))}</span>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <p className="text-sm text-blue-600">
                {patrimonyGrowthPercentage > currentInflation ? 
                  '✅ Protegido da inflação' : 
                  '⚠️ Perdendo para inflação'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-500 p-2 rounded-xl">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-purple-800">Saúde Financeira</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-purple-700">Liquidez:</span>
              <span className="font-semibold text-purple-800">{liquidityRatio.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Endividamento:</span>
              <span className="font-semibold text-purple-800">{debtToAssetRatio.toFixed(1)}%</span>
            </div>
            <div className="pt-2 border-t border-purple-200">
              <p className="text-sm text-purple-600">
                {debtToAssetRatio < 20 && liquidityRatio > 30 ? 
                  '✅ Excelente saúde' : 
                  debtToAssetRatio < 40 && liquidityRatio > 20 ?
                  '⚠️ Saúde moderada' :
                  '🔴 Atenção necessária'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recomendações */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Recomendações Personalizadas</h2>
          <p className="text-gray-600">Baseadas na análise do seu patrimônio</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">💡 Otimização de Liquidez</h3>
            <p className="text-sm text-gray-600">
              {liquidityRatio < 30 ? 
                'Considere aumentar seus ativos líquidos para ter mais flexibilidade financeira.' :
                liquidityRatio > 70 ?
                'Você tem boa liquidez. Considere investir parte em ativos de longo prazo para maior rentabilidade.' :
                'Sua liquidez está equilibrada. Mantenha essa proporção.'
              }
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">📈 Estratégia de Crescimento</h3>
            <p className="text-sm text-gray-600">
              {patrimonyGrowthPercentage < currentCDI ?
                'Seu patrimônio está crescendo abaixo do CDI. Revise sua estratégia de investimentos.' :
                patrimonyGrowthPercentage > currentCDI * 1.5 ?
                'Excelente performance! Continue diversificando para manter o crescimento.' :
                'Boa performance. Considere aumentar a exposição a ativos de maior rentabilidade.'
              }
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">🚗 Gestão de Depreciação</h3>
            <p className="text-sm text-gray-600">
              {totalVehicleValue > totalAssets * 0.2 ?
                'Seus veículos representam uma parte significativa do seu patrimônio. Considere diversificar mais em ativos que não depreciam.' :
                'Sua alocação em veículos está equilibrada. Lembre-se de considerar a depreciação no planejamento financeiro.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}