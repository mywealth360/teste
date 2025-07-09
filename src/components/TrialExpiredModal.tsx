import React from 'react';
import { Clock, X, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import SubscriptionButton from './subscription/SubscriptionButton';
import { products } from '../stripe-config';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrialExpiredModal({ isOpen, onClose }: TrialExpiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-slideUp">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Seu período de teste expirou</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-red-700">
              Seu período de teste gratuito de 7 dias chegou ao fim. Para continuar utilizando o MyWealth 360, escolha um plano abaixo.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white border-2 border-blue-500 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">Plano Starter</h3>
                <span className="text-blue-600 font-bold">R$ 79,90/mês</span>
              </div>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Dashboard básico</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Gestão de receitas e despesas</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Controle de investimentos</span>
                </li>
              </ul>
              <SubscriptionButton
                priceId={products[0].priceId}
                mode="subscription"
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assinar Plano Starter
              </SubscriptionButton>
            </div>
            
            <div className="bg-white border-2 border-purple-500 rounded-xl p-4 hover:shadow-md transition-shadow relative">
              <div className="absolute -top-3 right-4 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                Recomendado
              </div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">Plano Family</h3>
                <span className="text-purple-600 font-bold">R$ 179,90/mês</span>
              </div>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Tudo do plano Starter</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Gestão completa de patrimônio</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Imóveis, veículos e ativos exóticos</span>
                </li>
              </ul>
              <SubscriptionButton
                priceId={products[1].priceId}
                mode="subscription"
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-colors"
              >
                Assinar Plano Family
              </SubscriptionButton>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 pt-2">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
              <span>Cartão necessário</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}