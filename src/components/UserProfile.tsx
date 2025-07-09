import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Settings, Phone, Calendar, MapPin, Mail, Shield, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import PhoneVerification from './PhoneVerification';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  plan: string;
  is_in_trial: boolean;
  trial_days_left: number;
  phone_verified: boolean;
  created_at: string;
  phone_verification_code?: string;
  phone_verification_expires?: string;
  phone_verification_status?: string;
}

export default function UserProfile() {
  const { user, isAdmin, userPlan, isInTrial, trialExpiresAt } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    birth_date: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
        birth_date: data.birth_date || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true); 
    try {      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          address: formData.address || null,
          birth_date: formData.birth_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProfile();
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Erro ao carregar perfil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <User className="w-6 h-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          </div>
        </div>

        <div className="p-6">
          {/* Account Status Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Status da Conta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600">Plano Atual</p>
                <div className="flex items-center mt-1">
                  <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
                  <div className="flex items-center">
                    <p className="font-semibold text-gray-900 capitalize">
                      {userPlan === 'family' ? 'Family' : 'Starter'}
                      {isInTrial && <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">Trial</span>}
                    </p>
                    <button 
                      onClick={() => navigate('/?tab=subscription')}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Alterar
                    </button>
                  </div>
                    </p>
                    <Link 
                      to="#" 
                      onClick={() => setActiveTab('subscription')}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Alterar
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600">Status do Trial</p>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-green-600 mr-2" />
                  <p className="font-semibold text-gray-900">
                    {isInTrial 
                      ? `${profile.trial_days_left} dias restantes` 
                      : 'Não está em trial'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600">Telefone Verificado</p>
                <div className="flex items-center mt-1">
                  {profile.phone_verified ? (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <p className="font-semibold text-green-600">Verificado</p>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                      <p className="font-semibold text-orange-600">Não verificado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Phone Verification Component */}
          {showPhoneVerification && (
            <PhoneVerification 
              onVerified={() => {
                setShowPhoneVerification(false);
                fetchProfile();
              }}
              className="mb-8"
            />
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profile.phone || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      placeholder="(11) 99999-9999"
                    />
                    {profile.phone_verified && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificado
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhoneVerification(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {profile.phone ? (profile.phone_verified ? 'Alterar' : 'Verificar') : 'Adicionar'}
                  </button>
                </div>
                {profile.phone && !profile.phone_verified && !showPhoneVerification && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Telefone não verificado. Clique em "Verificar" para confirmar seu número.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Endereço
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu endereço completo"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Account Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Conta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Conta criada em</p>
                <p className="font-medium text-gray-800">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">ID do usuário</p>
                <p className="font-medium text-gray-800 truncate">{profile.user_id}</p>
              </div>
            </div>
            
            {isAdmin && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-red-600 mr-2" />
                  <p className="font-medium text-red-700">Você tem privilégios de administrador</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}