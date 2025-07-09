import React from 'react';
import { Zap, ArrowRight, MessageCircle, CheckCircle, CreditCard } from 'lucide-react';
import Button from '../ui/Button';
import { products } from '../../stripe-config';
import SubscriptionButton from '../subscription/SubscriptionButton';

interface HeroSectionProps {
  onRegisterClick: () => void;
}

export default function HeroSection({ onRegisterClick }: HeroSectionProps) {
  return (
    <section className="pt-24 pb-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            <span>Teste Grátis por 7 Dias • Cancele quando quiser</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Controle Patrimonial
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Familiar Inteligente</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            A primeira plataforma de gestão patrimonial com IA que integra receitas, despesas e ativos para maximizar seu patrimônio e acelerar o crescimento da sua riqueza.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SubscriptionButton
              priceId={products[0].priceId}
              mode="subscription"
              className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2"
            >
              <span>Começar Teste Grátis</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </SubscriptionButton>
            
            <Button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Ver Demo</span>
            </Button>
          </div>
          
          <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>7 dias grátis, sem cobranças</span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span>Cartão necessário</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}