import React from 'react';
import { Link } from 'react-router-dom';
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
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">PROSPERA.AI</h1>
            <span className="text-sm text-gray-500 border-l border-gray-200 pl-2">Gestão Financeira</span>
          </div>
          
          {/* Center - Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="#features" className="text-gray-600 hover:text-gray-800 transition-colors">Recursos</Link>
            <Link to="#pricing" className="text-gray-600 hover:text-gray-800 transition-colors">Preços</Link>
            <Link to="#testimonials" className="text-gray-600 hover:text-gray-800 transition-colors">Depoimentos</Link>
          </nav>

          {/* Right side - Auth buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onLoginClick}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Entrar
            </button>
            <Button
              onClick={onRegisterClick}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}