import React from 'react';
import { Crown, CheckCircle, Lock, Home, Car, Gem, Users, Target, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionButton from './subscription/SubscriptionButton';
import { products } from '../stripe-config';

export default function SubscriptionPage() {
  const { userPlan, isInTrial, trialExpiresAt, trialDaysLeft } = useAuth();
  
  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto px-4 sm:px-0">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-3 sm:mb-4">Planos de Assinatura</h1>
        <p className="text-gray-600 max-w-3xl mx-auto text-sm sm:text-base">
          Escolha o plano ideal para transformar seu patrimônio e alcançar seus objetivos financeiros
        </p>

        {isInTrial && trialDaysLeft === 0 && (
          <div className="mt-3 sm:mt-4 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 max-w-md mx-auto">
            <p className="text-red-700 font-medium text-sm sm:text-base">
              Seu período de teste expirou. Escolha um plano para continuar.
            </p>
          </div>
        )}
        
        {userPlan && (
          <div className="mt-3 sm:mt-4 inline-block">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
              <p className="font-medium flex items-center text-gray-800 text-sm sm:text-base">
                <Crown className="h-5 w-5 mr-2 text-green-600" />
                Plano atual: {userPlan === 'family' ? 'Family' : 'Starter'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
        {/* Starter Plan */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200">
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="font-bold text-lg sm:text-xl text-blue-600">Starter</h3>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Controle financeiro essencial</p>
            <p className="text-2xl sm:text-3xl mt-3 sm:mt-4 font-bold text-blue-600">R$ 79,90<span className="text-xs sm:text-sm text-gray-500">/mês</span></p>
            <div className="mt-1 sm:mt-2 text-green-700 text-xs sm:text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>7 dias grátis, sem cartão necessário</span>
            </div>
            <div className="mt-1 sm:mt-2 text-blue-600 text-xs sm:text-sm flex items-center justify-center">
              <span>Acesso a recursos essenciais</span>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800 text-sm sm:text-base">Dashboard básico</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800 text-sm sm:text-base">Até 500 transações/mês</span>
              </li>
              <li className="flex items-start">
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Controle de investimentos</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Relatórios básicos</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Suporte por email</span>
              </li>
            </ul>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-700 mb-3">Módulos bloqueados:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-gray-600">
                  <Lock className="h-4 w-4 mr-2" /> 
                  <span className="text-sm">Imóveis</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Lock className="h-4 w-4 mr-2" /> 
                  <span className="text-sm">Veículos</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Lock className="h-4 w-4 mr-2" /> 
                  <span className="text-sm">Ativos Exóticos</span>
                </div>
                <div className="flex items-center text-gray-600">
                <div className="flex items-center justify-between sm:justify-start sm:space-x-3">
                  <span className="font-semibold text-red-600 text-sm sm:text-base">
                </div>
                <div className="flex items-center text-gray-600">
                  <Lock className="h-4 w-4 mr-2" /> 
                  <span className="text-sm">Gestão de Patrimônio</span>
                    className="px-2 sm:px-3 py-1 bg-green-500 text-white text-xs sm:text-sm rounded-lg hover:bg-green-600 transition-colors duration-200"
                <div className="flex items-center text-gray-600">
        <div className="bg-green-600 p-4 sm:p-6 rounded-xl text-white shadow-md">
                  <span className="text-sm">IA Insights</span>
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-bold mt-1">{bills.filter(b => b.is_active).length}</p>
          </div>
          
          <div className="px-8 pb-8">
            <SubscriptionButton
              priceId={products[0].priceId}
              mode="subscription"
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        <div className="bg-orange-600 p-4 sm:p-6 rounded-xl text-white shadow-md">
              Começar Gratuitamente
            </SubscriptionButton>
            <p className="text-xs text-center text-green-600 font-medium mt-2">
              <p className="text-xl sm:text-3xl font-bold mt-1">{upcomingBills.length}</p>
            </p>
          </div>
        </div>

        {/* Family Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-blue-600 p-4 sm:p-6 rounded-xl text-white shadow-md">
            <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              <p className="text-xl sm:text-3xl font-bold mt-1">R$ {totalMonthlyBills.toLocaleString('pt-BR')}</p>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Próximas Contas</h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="p-8 border-b border-gray-200">
            <h3 className="font-bold text-xl text-blue-600">Family</h3>
            <p className="text-gray-600 mt-2">Controle patrimonial completo</p>
            <p className="text-3xl mt-4 font-bold text-blue-600">R$ 129,90<span className="text-sm text-gray-500">/mês</span></p>
          </div>
          
              <div key={bill.id} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Tudo do Starter</span>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Transações ilimitadas</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Gestão completa de patrimônio</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{bill.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{bill.company} • {bill.category}</p>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Ativos exóticos e colecionáveis</span>
                  <div className="text-right flex flex-row sm:block items-center justify-between">
                    <p className="font-semibold text-base sm:text-lg text-gray-800">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Gestão de funcionários</span>
                    <p className={`text-xs sm:text-sm ${
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">IA Financeira avançada</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Automação total</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Suporte prioritário 24/7</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-800">Acesso compartilhado para família</span>
              </li>
            </ul>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Todas as Contas</h2>
            <SubscriptionButton
              priceId={products[1].priceId}
              mode="subscription"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 shadow-sm w-full sm:w-auto justify-center sm:justify-start"
            >
              Assinar Agora
            </SubscriptionButton>
            <p className="text-xs text-center text-gray-500 mt-2">
              Inclui 7 dias de teste grátis
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 max-w-3xl mx-auto bg-blue-50 p-6 rounded-xl">
        <div className="flex flex-wrap items-center justify-center gap-4 text-gray-800">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <span>7 dias grátis sem cartão</span>
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