import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">MyWealth 360</h1>
            <p className="text-sm text-gray-500 ml-2">Gestão Financeira Familiar</p>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="#features" className="text-gray-600 hover:text-gray-800 transition-colors">Recursos</Link>
            <Link to="#pricing" className="text-gray-600 hover:text-gray-800 transition-colors">Preços</Link>
            <Link to="#testimonials" className="text-gray-600 hover:text-gray-800 transition-colors">Depoimentos</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={onLoginClick}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Entrar
            </button>
            <Button
              onClick={onRegisterClick}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}