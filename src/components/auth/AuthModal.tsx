import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';
import { useAuth } from "../../contexts/AuthContext";
import RegisterWithPhone from './RegisterWithPhone';
import LoginForm from './LoginForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-slideUp">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {mode === 'login' 
                  ? 'Acesse sua conta PROSPERA.AI' 
                  : 'Comece a controlar suas finanças'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm 
              onSuccess={onClose}
              onRegisterClick={() => setMode('register')}
            />
          ) : (
            <RegisterWithPhone 
              onSuccess={() => {
                setMode('login');
              }}
              onBack={() => setMode('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}