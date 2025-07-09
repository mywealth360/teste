import React from 'react';

export default function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">50K+</div>
            <div className="text-blue-100">Usuários Ativos</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">R$ 2B+</div>
            <div className="text-blue-100">Patrimônio Gerenciado</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">98%</div>
            <div className="text-blue-100">Satisfação dos Clientes</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">30%</div>
            <div className="text-blue-100">Economia Média</div>
          </div>
        </div>
      </div>
    </section>
  );
}