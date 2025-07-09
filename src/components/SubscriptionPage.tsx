import React from 'react';
import { Crown, CheckCircle, Lock, Home, Car, Gem, Users, Target, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionButton from './subscription/SubscriptionButton';
import { products } from '../stripe-config';

export default function SubscriptionPage() {
  const { userPlan, isInTrial, trialExpiresAt } = useAuth();
  
  // Define the plans with updated pricing
  const plans = [
    {
      name: 'Starter',
      price: 'R$ 79,90',
      period: '/mês',
      description: 'Controle financeiro essencial',
      features: [
        'Dashboard básico',
        'Até 500 transações/mês',
        'Gestão de receitas e despesas',
        'Controle de investimentos',
        'Relatórios básicos',
        'Suporte por email'
      ],
      priceId: products[0].priceId,
      popular: false,
      restrictedModules: [
        { icon: Home, name: 'Imóveis' }, 
        { icon: Car, name: 'Veículos' }, 
        { icon: Gem, name: 'Ativos Exóticos' }, 
        { icon: Users, name: 'Funcionários' }, 
        { icon: Target, name: 'Gestão de Patrimônio' },
        { icon: Brain, name: 'IA Insights' }
      ]
    },
    {
      name: 'Family',
      price: 'R$ 129,90',
      period: '/mês',
      description: 'Controle patrimonial completo',
      features: [
        'Tudo do Starter',
        'Transações ilimitadas',
        'Gestão completa de patrimônio',
        'Controle de imóveis e veículos',
        'Ativos exóticos e colecionáveis',
        'Gestão de funcionários',
        'IA Financeira avançada',
        'Automação total',
        'Suporte prioritário 24/7',
        'Acesso compartilhado para família'
      ],
      priceId: products[1].priceId,
      popular: true
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Planos de Assinatura</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Escolha o plano ideal para transformar seu patrimônio e alcançar seus objetivos financeiros
        </p>
        
        {isInTrial && trialExpiresAt && (
          <div className="mt-4 bg-blue-50 text-blue-700 p-4 rounded-xl inline-block">
            <p className="font-medium">
              Seu período de teste termina em {Math.ceil((trialExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
            </p>
          </div>
        )}
        
        {userPlan && (
          <div className="mt-4 bg-green-50 text-green-700 p-4 rounded-xl inline-block">
            <p className="font-medium flex items-center">
              <Crown className="h-5 w-5 mr-2" />
              Plano atual: {userPlan === 'family' ? 'Family' : 'Starter'}
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {plans.map((plan, index) => (
          <div key={index} className={`bg-white rounded-2xl shadow-lg ${plan.popular ? 'border-2 border-blue-500 relative' : 'border border-gray-200'}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </div>
              </div>
            )}
            
            <div className="p-8 border-b border-gray-200">
              <h3 className="font-bold text-xl">{plan.name}</h3>
              <p className="text-gray-500 mt-2">{plan.description}</p>
              <p className="text-3xl mt-4 font-bold">{plan.price}<span className="text-sm text-gray-500">{plan.period}</span></p>
              {plan.name === 'Starter' && (
                <div className="mt-2 text-green-700 text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>7 dias grátis, depois {plan.price}/mês</span>
                </div>
              )}
            </div>
            
            <div className="p-8">
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-800">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.restrictedModules && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-medium text-gray-700 mb-3">Módulos bloqueados:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {plan.restrictedModules.map((module, idx) => (
                      <div key={idx} className="flex items-center text-gray-600">
                        <Lock className="h-4 w-4 mr-2" /> 
                        <span className="text-sm">{module.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-8 pb-8">
              <SubscriptionButton
                priceId={plan.priceId}
                mode="subscription"
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {plan.name === 'Starter' ? 'Começar Gratuitamente' : 'Assinar Agora'}
              </SubscriptionButton>
              <p className="text-xs text-center text-gray-500 mt-2">
                <span className="text-gray-600">{plan.name === 'Starter' 
                  ? 'Cartão necessário. Sem cobrança nos primeiros 7 dias.'
                  : 'Inclui 7 dias de teste grátis'}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 max-w-3xl mx-auto bg-blue-50 p-6 rounded-xl">
        <div className="flex items-center justify-center space-x-4 text-blue-800">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <span>7 dias grátis</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <span>Cartão necessário</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </div>
  );
}