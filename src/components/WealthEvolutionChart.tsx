import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Simulated data for wealth evolution
const generateWealthData = () => {
  const months = [ 
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  const currentYear = new Date().getFullYear();
  const data = [];
  
  let baseValue = 450000;
  let investmentsValue = 200000;
  let realEstateValue = 150000;
  let bankValue = 50000;
  let otherValue = 50000; 
  
  for (let i = 0; i < 12; i++) {
    // Simulate some growth and fluctuation with more realistic monthly variations
    const investmentGrowth = investmentsValue * (0.005 + Math.random() * 0.01);
    const realEstateGrowth = realEstateValue * (0.001 + Math.random() * 0.003); // More consistent for real estate
    const bankGrowth = bankValue * 0.001;
    const otherGrowth = otherValue * (0.001 + Math.random() * 0.005);
    
    investmentsValue += investmentGrowth;
    realEstateValue += realEstateGrowth;
    bankValue += bankGrowth;
    otherValue += otherGrowth;
    
    baseValue = investmentsValue + realEstateValue + bankValue + otherValue;
    
    data.push({
      month: `${months[i]}/${currentYear}`,
      total: Math.round(baseValue), 
      percentChange: i > 0 ? ((baseValue / data[i-1].total - 1) * 100).toFixed(1) + '%' : '0%',
      investimentos: Math.round(investmentsValue),
      imoveis: Math.round(realEstateValue),
      contas: Math.round(bankValue),
      outros: Math.round(otherValue)
    });
  }
  
  return data;
};

const wealthData = generateWealthData();

export default function WealthEvolutionChart() {
  return (
    <div className="p-4 sm:p-6 pt-0">
      <div className="h-64 sm:h-80 mt-2">
        <ResponsiveContainer width="100%" height="100%" className="overflow-x-auto">
          <LineChart
            data={wealthData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }} 
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="total" 
              name="Total"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="investimentos"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={{ fill: '#10b981', strokeWidth: 1, r: 2 }}
              name="Investimentos"
            />
            <Line
              type="monotone"
              dataKey="imoveis"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={{ fill: '#f59e0b', strokeWidth: 1, r: 2 }}
              name="Imóveis"
            />
            <Line
              type="monotone"
              dataKey="contas"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 2 }}
              name="Contas"
            />
            <Line
              type="monotone"
              dataKey="outros"
              stroke="#ec4899"
              strokeWidth={1.5}
              dot={{ fill: '#ec4899', strokeWidth: 1, r: 2 }}
              name="Outros"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}