import React, { useState } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  TrendingDown, 
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Zap,
  Users,
  Share2,
  Lock
} from 'lucide-react';
import { aiInsights } from '../data/mockData';

const additionalInsights = [
  {
    id: '4', 
    type: 'feature',
    title: 'Novo recurso: Compartilhamento Familiar',
    description: 'Agora você pode compartilhar o acesso à sua conta com até 5 membros da família no plano Family.',
    impact: 'high',
    date: '2025-07-09',
  },
  {
    id: '5',
    type: 'feature',
    title: 'Novo recurso: Convites por Email',
    description: 'Envie convites por email para compartilhar sua conta com níveis de acesso personalizados.',
    impact: 'medium',
    date: '2025-07-09',
  },
  {
    id: '6',
    type: 'suggestion',
    title: 'Otimize seus investimentos',
    description: 'Com base no seu perfil, considere diversificar 15% da sua poupança em fundos de índice.',
    impact: 'high',
    date: '2024-01-12',
  },
  {
    id: '7',
    type: 'warning',
    title: 'Padrão de gastos identificado',
    description: 'Seus gastos com entretenimento aumentam 40% nos finais de semana.',
    impact: 'medium',
    date: '2024-01-11',
  },
  {
    id: '8',
    type: 'achievement',
    title: 'Hábito financeiro melhorado',
    description: 'Você manteve gastos dentro do orçamento por 3 meses consecutivos!',
    impact: 'high',
    date: '2024-01-10',
  },
];

const allInsights = [...aiInsights, ...additionalInsights];

export default function AIInsights() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'warning' | 'suggestion' | 'achievement' | 'feature'>('all');

  const filteredInsights = selectedFilter === 'all' 
    ? allInsights 
    : allInsights.filter(insight => insight.type === selectedFilter);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'achievement': return CheckCircle;
      case 'suggestion': return Lightbulb;
      case 'feature': return Zap;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        button: 'bg-orange-500 hover:bg-orange-600'
      };
      case 'achievement': return {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        button: 'bg-green-500 hover:bg-green-600'
      };
      case 'suggestion': return {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        button: 'bg-blue-500 hover:bg-blue-600'
      };
      case 'feature': return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        button: 'bg-indigo-500 hover:bg-indigo-600'
      };
      default: return {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        button: 'bg-gray-500 hover:bg-gray-600'
      };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'warning': return 'Alertas';
      case 'achievement': return 'Conquistas';
      case 'suggestion': return 'Sugestões';
      case 'feature': return 'Novidades';
      default: return 'Todos';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">IA Financial Insights</h1>
          <p className="text-gray-500 mt-1">Análises inteligentes do seu comportamento financeiro</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl">
          <Brain className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Alertas Ativos</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {allInsights.filter(i => i.type === 'warning').length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Sugestões</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {allInsights.filter(i => i.type === 'suggestion').length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Conquistas</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {allInsights.filter(i => i.type === 'achievement').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium">Novos Recursos</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {allInsights.filter(i => i.type === 'feature').length}
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-xl">
              <Zap className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Score IA</p>
              <p className="text-2xl font-bold mt-1">87/100</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Zap className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-wrap gap-3">
          {['all', 'feature', 'warning', 'suggestion', 'achievement'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedFilter === filter
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getTypeLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de insights */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          const colors = getInsightColor(insight.type);
          
          return (
            <div key={insight.id} className={`bg-white rounded-2xl shadow-lg border ${colors.border} overflow-hidden hover:shadow-xl transition-all duration-300`}>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-800">{insight.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          insight.impact === 'high' 
                            ? 'bg-red-100 text-red-700' 
                            : insight.impact === 'medium' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-700'
                        }`}>
                          Impacto {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">{insight.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(insight.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      <div className="flex space-x-3">
                        {insight.type === 'suggestion' && (
                          <button className={`px-4 py-2 ${colors.button} text-white rounded-lg text-sm font-medium transition-colors duration-200`}>
                            Aplicar Sugestão
                          </button>
                        )}
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção de análise avançada */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">IA Financial Insights</h2>
          <p className="text-gray-600">Nossa IA analisa continuamente seus hábitos para fornecer insights personalizados</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Padrões de Gastos</h3>
            <p className="text-sm text-gray-600">Identificamos tendências nos seus gastos para alertá-lo sobre mudanças</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Share2 className="h-8 w-8 text-indigo-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Compartilhamento Familiar</h3>
            <p className="text-sm text-gray-600">Compartilhe acesso com membros da família e colaboradores</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Target className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Metas Inteligentes</h3>
            <p className="text-sm text-gray-600">Sugerimos metas realistas baseadas no seu histórico financeiro</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Lock className="h-8 w-8 text-purple-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Oportunidades</h3>
            <p className="text-sm text-gray-600">Encontramos oportunidades de economia e investimento personalizadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}