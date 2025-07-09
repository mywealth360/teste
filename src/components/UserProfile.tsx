import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Settings, Phone, Calendar, MapPin, Mail, Shield, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [showVerificationForm, setShowVerificationForm] = useState(false);
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
      
      // Check if verification is in progress
      if (data.phone && !data.phone_verified && data.phone_verification_code) {
        setShowVerificationForm(true);
      }
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
      // Check if phone number changed
      const phoneChanged = profile.phone !== formData.phone;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          address: formData.address || null,
          birth_date: formData.birth_date || null,
          // If phone changed, reset verification
          ...(phoneChanged && {
            phone_verified: false,
            phone_verification_status: 'pending'
          }),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // If phone changed and new phone provided, show verification form
      if (phoneChanged && formData.phone) {
        setShowVerificationForm(true);
        // In a real app, this would trigger an SMS via Twilio
        // For demo, we'll simulate it
        await simulateSendVerificationCode();
      }

      await fetchProfile();
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const simulateSendVerificationCode = async () => {
    if (!user) return;
    
    try {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          phone_verification_code: code,
          phone_verification_expires: expiresAt.toISOString(),
          phone_verification_attempts: 0,
          phone_verification_status: 'pending'
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // In a real app, this would send an SMS via Twilio
      console.log(`Verification code: ${code}`); // For demo purposes only
      
      // Show success message
      setVerificationSuccess('Código de verificação enviado para seu telefone.');
      setTimeout(() => setVerificationSuccess(''), 5000);
      
    } catch (error) {
      console.error('Error sending verification code:', error);
      setVerificationError('Erro ao enviar código de verificação.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    try {
      // In a real app, this would verify against the database
      // For demo, we'll simulate it
      
      // Check if code matches and hasn't expired
      const { data, error } = await supabase
        .from('profiles')
        .select('phone_verification_code, phone_verification_expires, phone_verification_attempts')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      // Check if code has expired
      if (data.phone_verification_expires && new Date(data.phone_verification_expires) < new Date()) {
        setVerificationError('Código expirado. Solicite um novo código.');
        return;
      }
      
      // Check if too many attempts
      if (data.phone_verification_attempts >= 5) {
        setVerificationError('Muitas tentativas. Solicite um novo código.');
        return;
      }
      
      // Increment attempts
      await supabase
        .from('profiles')
        .update({
          phone_verification_attempts: (data.phone_verification_attempts || 0) + 1
        })
        .eq('user_id', user.id);
      
      // Check if code matches
      if (data.phone_verification_code !== verificationCode) {
        setVerificationError('Código inválido. Tente novamente.');
        return;
      }
      
      // Code is valid, mark phone as verified
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone_verified: true,
          phone_verification_status: 'verified',
          phone_verification_code: null,
          phone_verification_expires: null
        })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Show success and refresh
      setVerificationSuccess('Telefone verificado com sucesso!');
      setShowVerificationForm(false);
      setVerificationCode('');
      await fetchProfile();
      
    } catch (error) {
      console.error('Error verifying code:', error);
      setVerificationError('Erro ao verificar código.');
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
          {/* Account Status */}
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
                  <p className="font-semibold text-gray-900 capitalize">
                    {userPlan === 'family' ? 'Family' : 'Starter'}
                    {isInTrial && <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">Trial</span>}
                  </p>
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
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <p className="font-semibold text-green-600">Verificado</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                      <p className="font-semibold text-orange-600">Não verificado</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Phone Verification Form */}
          {showVerificationForm && (
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Verificar Telefone</h3>
              <p className="text-sm text-blue-700 mb-4">
                Um código de verificação foi enviado para o seu telefone. Por favor, insira o código abaixo para verificar seu número.
              </p>
              
              {verificationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {verificationError}
                </div>
              )}
              
              {verificationSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {verificationSuccess}
                </div>
              )}
              
              <form onSubmit={handleVerifyCode} className="flex space-x-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Código de verificação"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verificar
                </button>
                <button
                  type="button"
                  onClick={simulateSendVerificationCode}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reenviar
                </button>
              </form>
            </div>
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                {profile.phone && !profile.phone_verified && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Telefone não verificado. Atualize para receber um código de verificação.
                  </p>
                )}
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