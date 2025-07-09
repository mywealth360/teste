import React from 'react';
import { products } from '../../stripe-config';
import PlanCard from '../subscription/PlanCard';
import { Home, Car, Gem, Users, Target, CreditCard, Calendar, CheckCircle, Lock } from 'lucide-react';

export default function PricingSection() {
  // Use the products from stripe-config
  const plans = products.map(product => ({
    name: product.name.replace('My Wealth 360 ', ''),
    price: product.name.includes('Starter') ? 'R$ 79,90' : 'R$ 179,90', 
    period: '/mês',
    description: product.name.includes('Starter') ? 'Controle financeiro essencial' : 'Controle patrimonial completo', 
    features: product.name.includes('Starter') ? [
      'Dashboard básico',
      'Até 500 transações/mês',
      'Gestão de receitas e despesas',
      'Controle de investimentos',
      'Relatórios básicos',
      'Suporte por email'
    ] : [
      'Tudo do Starter',
      'Transações ilimitadas',
      'Gestão completa de patrimônio',
      'Controle de imóveis e veículos',
      'Ativos exóticos e colecionáveis',
      'Gestão de funcionários',
      'IA Financeira avançada',
      'Automação total',
      'Suporte prioritário 24/7',
      'Usuários adicionais: R$ 19,90/mês'
    ],
    priceId: product.priceId,
    popular: product.popular,
    restrictedModules: product.name.includes('Starter') ? [
      { icon: Home, name: 'Imóveis' }, 
      { icon: Car, name: 'Veículos' }, 
      { icon: Gem, name: 'Ativos Exóticos' }, 
      { icon: Users, name: 'Funcionários' }, 
      { icon: Target, name: 'Gestão de Patrimônio' } 
    ] : undefined
  }));

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4"> 
            Planos para cada necessidade
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Escolha o plano ideal para transformar seu patrimônio
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-xl inline-flex">
            <CreditCard className="h-4 w-4 text-blue-500" />
            <span>Experimente grátis por 7 dias - Cancele quando quiser</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className={`bg-white rounded-2xl shadow-lg ${plans[0].popular ? 'border-2 border-blue-500' : 'border border-gray-200'}`}>
            <div className="p-8 border-b border-gray-200">
              <h3 className="font-bold text-xl">{plans[0].name}</h3>
              <p className="text-gray-500 mt-2">{plans[0].description}</p>
              <p className="text-3xl mt-4 font-bold">{plans[0].price}<span className="text-sm text-gray-500">{plans[0].period}</span></p>
              <div className="mt-2 text-green-600 text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>7 dias grátis, depois R$ 79,90/mês</span>
              </div>
            </div>
            
            <div className="p-8">
              <ul className="space-y-4">
                {plans[0].features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-700 mb-3">Módulos bloqueados:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {plans[0].restrictedModules?.map((module, idx) => (
                    <div key={idx} className="flex items-center text-gray-400">
                      <Lock className="h-4 w-4 mr-2" /> 
                      <span className="text-sm">{module.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-8">
              <PlanCard
                name={plans[0].name}
                description={plans[0].description}
                price={plans[0].price}
                period={plans[0].period}
                features={plans[0].features}
                priceId={plans[0].priceId}
                popular={plans[0].popular}
                restrictedModules={plans[0].restrictedModules}
              />
              <p className="text-xs text-center text-gray-500 mt-2">
                Cartão necessário. Sem cobrança nos primeiros 7 dias.
              </p>
            </div>
          </div>
          
          <div className={`bg-white rounded-2xl shadow-lg ${plans[1].popular ? 'border-2 border-blue-500 relative' : 'border border-gray-200'}`}>
            {plans[1].popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </div>
              </div>
            )}
            <div className="p-8 border-b border-gray-200">
              <h3 className="font-bold text-xl">{plans[1].name}</h3>
              <p className="text-gray-500 mt-2">{plans[1].description}</p>
              <p className="text-3xl mt-4 font-bold">{plans[1].price}<span className="text-sm text-gray-500">{plans[1].period}</span></p>
            </div>
            
            <div className="p-8">
              <ul className="space-y-4">
                {plans[1].features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="px-8 pb-8">
              <PlanCard
                name={plans[1].name}
                description={plans[1].description}
                price={plans[1].price}
                period={plans[1].period}
                features={plans[1].features}
                priceId={plans[1].priceId}
                popular={plans[1].popular}
                restrictedModules={undefined}
              />
              <p className="text-xs text-center text-gray-500 mt-2">
                Inclui 7 dias de teste grátis
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 max-w-3xl mx-auto bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-center space-x-4 text-blue-700">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              <span>7 dias grátis</span>
            </div>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
              <span>Cartão necessário</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}