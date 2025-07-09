import React, { useState, useEffect } from 'react';
import { Plus, Home, MapPin, DollarSign, Calendar, Edit, Trash2, TrendingUp, Paperclip, Upload, Save, X, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RealEstateProperty {
  id: string;
  type: 'residencial' | 'comercial' | 'terreno' | 'fundo-imobiliario';
  address: string;
  purchase_price: number;
  current_value: number | null;
  monthly_rent: number | null;
  expenses: number;
  purchase_date: string;
  is_rented: boolean;
  dividend_yield?: number; // Calculado automaticamente baseado no aluguel
  tax_rate?: number; // Taxa de imposto sobre aluguel
  created_at: string;
  updated_at: string;
}

interface PropertyAttachment {
  id: string;
  property_id: string;
  file_name: string;
  file_url: string | null;
  created_at: string;
}

const propertyTypes = [
  { value: 'residencial', label: 'Residencial', color: 'bg-blue-500' },
  { value: 'comercial', label: 'Comercial', color: 'bg-green-500' },
  { value: 'terreno', label: 'Terreno', color: 'bg-yellow-500' },
  { value: 'fundo-imobiliario', label: 'Fundo Imobiliário', color: 'bg-purple-500' }
];

export default function RealEstate() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [attachments, setAttachments] = useState<PropertyAttachment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<RealEstateProperty | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RealEstateProperty>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRentalStatus, setSelectedRentalStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    monthly_rent: '',
    current_value: '',
    purchase_price: '',
    calculated_yield: '',
    tax_rate: ''
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchAttachments();
    }
  }, [user]);

  // Auto-calculate yield when rent or value changes
  useEffect(() => {
    if (selectedRentalStatus === 'rented' && formData.monthly_rent) {
      // Usar o valor atual se disponível, senão usar o preço de compra
      const valueToUse = formData.current_value 
        ? Number(formData.current_value) 
        : Number(formData.purchase_price);
      
      if (valueToUse > 0) {
        const annualRent = Number(formData.monthly_rent) * 12;
        const calculatedYield = (annualRent / valueToUse) * 100;
        setFormData(prev => ({ ...prev, calculated_yield: calculatedYield.toFixed(2) }));
        
        // Calcular taxa de imposto para aluguel
        const taxRate = calculateRentalTaxRate(Number(formData.monthly_rent));
        setFormData(prev => ({ ...prev, tax_rate: taxRate.toString() }));
      }
    } else {
      setFormData(prev => ({ ...prev, calculated_yield: '', tax_rate: '' }));
    }
  }, [formData.monthly_rent, formData.current_value, formData.purchase_price, selectedRentalStatus]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('real_estate')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Erro ao carregar imóveis');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('property_attachments')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setAttachments(data || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    }
  };

  // Calcular taxa de imposto para aluguel
  const calculateRentalTaxRate = (monthlyRent: number): number => {
    const annualRent = monthlyRent * 12;
    
    // Regras simplificadas de IR para aluguel
    if (annualRent > 60000) {
      return 27.5; // Alíquota máxima
    } else if (annualRent > 36000) {
      return 15;
    } else if (annualRent > 24000) {
      return 7.5;
    }
    
    return 0; // Isento para valores menores
  };

  const calculateDividendYield = (property: RealEstateProperty) => {
    if (!property.is_rented || !property.monthly_rent) return 0;
    
    // Usar o valor atual se disponível, senão usar o preço de compra
    const valueToUse = property.current_value || property.purchase_price;
    if (!valueToUse || valueToUse <= 0) return 0;
    
    // Calcular yield anual: (aluguel anual / valor) * 100
    const annualRent = property.monthly_rent * 12;
    return (annualRent / valueToUse) * 100;
  };

  const calculateMonthlyIncome = (property: RealEstateProperty) => {
    if (!property.is_rented || !property.monthly_rent) return 0;
    // Calculate net rental income (rent minus expenses)
    return property.monthly_rent - property.expenses;
  };

  const calculateMonthlyTax = (property: RealEstateProperty) => {
    if (!property.is_rented || !property.monthly_rent || !property.tax_rate) return 0;
    return property.monthly_rent * (property.tax_rate / 100);
  };

  const handleAddProperty = async (propertyData: Omit<RealEstateProperty, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calcular dividend yield automaticamente se for imóvel alugado
      let calculatedYield = undefined;
      let taxRate = undefined;
      
      if (propertyData.is_rented && propertyData.monthly_rent) {
        // Usar o valor atual se disponível, senão usar o preço de compra
        const valueToUse = propertyData.current_value || propertyData.purchase_price;
        
        if (valueToUse > 0) {
          const annualRent = propertyData.monthly_rent * 12;
          calculatedYield = (annualRent / valueToUse) * 100;
          taxRate = calculateRentalTaxRate(propertyData.monthly_rent);
        }
      }

      const { error } = await supabase
        .from('real_estate')
        .insert([{
          ...propertyData,
          dividend_yield: calculatedYield,
          tax_rate: taxRate,
          user_id: user?.id,
        }]);

      if (error) throw error;
      
      setShowAddModal(false);
      setSelectedRentalStatus('');
      setFormData({ monthly_rent: '', current_value: '', purchase_price: '', calculated_yield: '', tax_rate: '' });
      fetchProperties();
    } catch (err) {
      console.error('Error adding property:', err);
      setError('Erro ao adicionar imóvel');
    }
  };

  const handleEditProperty = (property: RealEstateProperty) => {
    setEditingId(property.id);
    setEditForm({
      type: property.type,
      address: property.address,
      purchase_price: property.purchase_price,
      current_value: property.current_value,
      monthly_rent: property.monthly_rent,
      expenses: property.expenses,
      purchase_date: property.purchase_date,
      is_rented: property.is_rented,
      dividend_yield: property.dividend_yield,
      tax_rate: property.tax_rate
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      // Recalcular dividend yield automaticamente
      let calculatedYield = undefined;
      let taxRate = undefined;
      
      if (editForm.is_rented && editForm.monthly_rent) {
        // Usar o valor atual se disponível, senão usar o preço de compra
        const valueToUse = editForm.current_value || editForm.purchase_price;
        
        if (valueToUse && valueToUse > 0) {
          const annualRent = editForm.monthly_rent * 12;
          calculatedYield = (annualRent / valueToUse) * 100;
          
          // Manter a taxa de imposto existente ou calcular uma nova
          taxRate = editForm.tax_rate || calculateRentalTaxRate(editForm.monthly_rent);
        }
      }

      const { error } = await supabase
        .from('real_estate')
        .update({
          ...editForm,
          dividend_yield: calculatedYield,
          tax_rate: taxRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;
      
      setEditingId(null);
      setEditForm({});
      fetchProperties();
    } catch (err) {
      console.error('Error updating property:', err);
      setError('Erro ao atualizar imóvel');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;

    try {
      const { error } = await supabase
        .from('real_estate')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Erro ao excluir imóvel');
    }
  };

  const handleAddAttachment = async (propertyId: string, fileName: string) => {
    try {
      const { error } = await supabase
        .from('property_attachments')
        .insert([{
          user_id: user?.id,
          property_id: propertyId,
          file_name: fileName,
        }]);

      if (error) throw error;
      fetchAttachments();
    } catch (err) {
      console.error('Error adding attachment:', err);
      setError('Erro ao adicionar anexo');
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('property_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      fetchAttachments();
    } catch (err) {
      console.error('Error removing attachment:', err);
      setError('Erro ao remover anexo');
    }
  };

  const getPropertyAttachments = (propertyId: string) => {
    return attachments.filter(att => att.property_id === propertyId);
  };

  const totalInvested = properties.reduce((sum, prop) => sum + prop.purchase_price, 0);
  const totalCurrentValue = properties.reduce((sum, prop) => sum + (prop.current_value || prop.purchase_price), 0);
  const totalMonthlyRent = properties.reduce((sum, prop) => sum + calculateMonthlyIncome(prop), 0);
  const totalExpenses = properties.reduce((sum, prop) => sum + prop.expenses, 0);
  const netMonthlyIncome = totalMonthlyRent;
  
  // Calcular total de impostos
  const totalTaxes = properties.reduce((sum, prop) => sum + calculateMonthlyTax(prop), 0);

  // Calcular yield médio corretamente
  const rentedProperties = properties.filter(p => p.is_rented);
  
  // Calcular yield médio apenas para imóveis alugados com valor atual
  const rentedPropertiesWithValues = rentedProperties.filter(p => 
    p.monthly_rent && (p.current_value || p.purchase_price)
  );
  
  const averageYield = rentedPropertiesWithValues.length > 0 
    ? rentedPropertiesWithValues.reduce((sum, p) => {
        const valueToUse = p.current_value || p.purchase_price;
        const annualRent = p.monthly_rent! * 12;
        const yieldValue = (annualRent / valueToUse) * 100;
        return sum + yieldValue;
      }, 0) / rentedPropertiesWithValues.length
    : 0;

  const getTypeLabel = (type: string) => {
    return propertyTypes.find(t => t.value === type)?.label || type;
  };

  const getTypeColor = (type: string) => {
    return propertyTypes.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const handleRentalStatusSelection = (status: string) => {
    setSelectedRentalStatus(status);
    setFormData({ monthly_rent: '', current_value: '', purchase_price: '', calculated_yield: '', tax_rate: '' });
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Imóveis</h1>
          <p className="text-gray-500 mt-1">Gerencie seu portfólio imobiliário</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Imóvel</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Valor Investido</p>
              <p className="text-3xl font-bold mt-1">R$ {totalInvested.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Valor Atual</p>
              <p className="text-3xl font-bold mt-1">R$ {totalCurrentValue.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Renda Líquida</p>
              <p className="text-3xl font-bold mt-1">R$ {totalMonthlyRent.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Home className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Impostos</p>
              <p className="text-3xl font-bold mt-1">R$ {totalTaxes.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Yield Médio</p>
              <p className="text-3xl font-bold mt-1">{averageYield.toFixed(2)}%</p>
              <p className="text-emerald-100 text-sm">{rentedProperties.length} imóveis alugados</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de imóveis */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Seu Portfólio</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {properties.length === 0 ? (
            <div className="p-12 text-center">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum imóvel cadastrado</h3>
              <p className="text-gray-500">Adicione seus imóveis para acompanhar seu portfólio.</p>
            </div>
          ) : (
            properties.map((property) => {
              const currentValue = property.current_value || property.purchase_price;
              const appreciation = currentValue - property.purchase_price;
              const appreciationPercentage = ((appreciation / property.purchase_price) * 100);
              const monthlyIncome = calculateMonthlyIncome(property);
              const monthlyTax = calculateMonthlyTax(property);
              
              // Calcular o yield para exibição
              let displayYield = property.dividend_yield;
              if (property.is_rented && property.monthly_rent && !displayYield) {
                // Usar o valor atual se disponível, senão usar o preço de compra
                const valueToUse = property.current_value || property.purchase_price;
                if (valueToUse > 0) {
                  const annualRent = property.monthly_rent * 12;
                  displayYield = (annualRent / valueToUse) * 100;
                }
              }
              
              const propertyAttachments = getPropertyAttachments(property.id);
              
              return (
                <div key={property.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  {editingId === property.id ? (
                    // Modo de edição
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          value={editForm.type || ''}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        >
                          {propertyTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          placeholder="Endereço"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="number"
                          value={editForm.purchase_price || ''}
                          onChange={(e) => setEditForm({ ...editForm, purchase_price: Number(e.target.value) })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          placeholder="Preço de compra"
                          step="0.01"
                        />
                        <input
                          type="number"
                          value={editForm.current_value || ''}
                          onChange={(e) => setEditForm({ ...editForm, current_value: Number(e.target.value) || null })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          placeholder="Valor atual"
                          step="0.01"
                        />
                        <input
                          type="number"
                          value={editForm.expenses || ''}
                          onChange={(e) => setEditForm({ ...editForm, expenses: Number(e.target.value) })}
                          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          placeholder="Despesas mensais"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={editForm.is_rented || false}
                          onChange={(e) => setEditForm({ ...editForm, is_rented: e.target.checked })}
                          className="rounded text-orange-600"
                          id="is_rented_edit"
                        />
                        <label htmlFor="is_rented_edit" className="text-gray-700">Imóvel está alugado</label>
                      </div>
                      
                      {editForm.is_rented && (
                        <div className="space-y-4">
                          <input
                            type="number"
                            value={editForm.monthly_rent || ''}
                            onChange={(e) => setEditForm({ ...editForm, monthly_rent: Number(e.target.value) || null })}
                            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            placeholder="Aluguel mensal (R$)"
                            step="0.01"
                          />
                          
                          <input
                            type="number"
                            value={editForm.tax_rate || ''}
                            onChange={(e) => setEditForm({ ...editForm, tax_rate: Number(e.target.value) || null })}
                            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            placeholder="Alíquota de imposto (%)"
                            step="0.01"
                          />
                          
                          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                            <div className="flex items-center space-x-2">
                              <Landmark className="h-4 w-4 text-indigo-600" />
                              <p className="text-sm text-indigo-700 font-medium">
                                Imposto estimado: R$ {editForm.monthly_rent && editForm.tax_rate ? ((editForm.monthly_rent * editForm.tax_rate) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                              </p>
                            </div>
                            <p className="text-xs text-indigo-600 mt-1">
                              Esta taxa será aplicada sobre o valor do aluguel
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo de visualização
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(property.type)}`}>
                          <Home className="h-6 w-6 text-white" />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-800">{property.address}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full text-white ${getTypeColor(property.type)}`}>
                              {getTypeLabel(property.type)}
                            </span>
                            {property.is_rented && (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                Alugado
                              </span>
                            )}
                            {property.is_rented && property.monthly_rent && (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                Yield: {displayYield?.toFixed(2)}%
                              </span>
                            )}
                            {property.tax_rate && property.tax_rate > 0 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 flex items-center space-x-1">
                                <Landmark className="h-3 w-3" />
                                <span>IR {property.tax_rate}%</span>
                              </span>
                            )}
                            {propertyAttachments.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setShowAttachmentsModal(true);
                                }}
                                className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200 flex items-center space-x-1"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span>{propertyAttachments.length} anexos</span>
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              Compra: {new Date(property.purchase_date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">
                              Valorização: {appreciationPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-semibold text-lg text-gray-800">
                              R$ {currentValue.toLocaleString('pt-BR')}
                            </p>
                            <p className={`text-sm ${appreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {appreciation >= 0 ? '+' : ''}R$ {appreciation.toLocaleString('pt-BR')}
                            </p>
                            {monthlyIncome > 0 && (
                              <p className="text-sm text-purple-600">
                                Líquido: R$ {monthlyIncome.toLocaleString('pt-BR')}/mês
                                {monthlyTax > 0 && ` (IR: R$ ${monthlyTax.toLocaleString('pt-BR')})`}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProperty(property);
                                setShowAttachmentsModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            >
                              <Paperclip className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditProperty(property)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProperty(property.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-green-700">
                          Dividend Yield calculado: {displayYield?.toFixed(2)}% a.a.
                        </p>
                      </div>
                          </div>
                        Baseado em: (R$ {formData.monthly_rent.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} × 12) ÷ R$ {(Number(formData.current_value) || Number(formData.purchase_price)).toLocaleString('pt-BR')} × 100
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de anexos */}
      {showAttachmentsModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Anexos - {selectedProperty.address}</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {getPropertyAttachments(selectedProperty.id).map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{attachment.file_name}</span>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {getPropertyAttachments(selectedProperty.id).length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhum anexo encontrado</p>
                )}
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const file = formData.get('file') as File;
                if (file) {
                  handleAddAttachment(selectedProperty.id, file.name);
                  e.currentTarget.reset();
                }
              }} className="space-y-4">
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAttachmentsModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de adicionar imóvel */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Novo Imóvel</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Primeira etapa: Status de aluguel */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">1. O imóvel está alugado?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleRentalStatusSelection('rented')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      selectedRentalStatus === 'rented'
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center mb-2 mx-auto">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-800">Sim, está alugado</h4>
                    <p className="text-sm text-gray-500 mt-1">Gera renda mensal</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRentalStatusSelection('not-rented')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      selectedRentalStatus === 'not-rented'
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mb-2 mx-auto">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-800">Não está alugado</h4>
                    <p className="text-sm text-gray-500 mt-1">Uso próprio ou vago</p>
                  </button>
                </div>
              </div>

              {/* Segunda etapa: Formulário específico */}
              {selectedRentalStatus && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formDataObj = new FormData(e.currentTarget);
                  const isRented = selectedRentalStatus === 'rented';
                  
                  handleAddProperty({
                    type: formDataObj.get('type') as any,
                    address: formDataObj.get('address') as string,
                    purchase_price: Number(formDataObj.get('purchase_price')),
                    current_value: Number(formDataObj.get('current_value')) || null,
                    monthly_rent: isRented ? Number(formDataObj.get('monthly_rent')) || null : null,
                    expenses: Number(formDataObj.get('expenses')),
                    purchase_date: formDataObj.get('purchase_date') as string,
                    is_rented: isRented,
                    tax_rate: isRented ? Number(formDataObj.get('tax_rate')) || null : null,
                  });
                }} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">2. Informações do imóvel</h3>
                    
                    <div className="space-y-4">
                      <select
                        name="type"
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      >
                        <option value="">Tipo de Imóvel</option>
                        {propertyTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        name="address"
                        placeholder="Endereço completo"
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          name="purchase_price"
                          placeholder="Preço de compra (R$)"
                          step="0.01"
                          required
                          value={formData.purchase_price}
                          onChange={(e) => handleFormDataChange('purchase_price', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                        
                        <input
                          type="number"
                          name="current_value"
                          placeholder="Valor atual (R$) - opcional"
                          step="0.01"
                          value={formData.current_value}
                          onChange={(e) => handleFormDataChange('current_value', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>

                      {selectedRentalStatus === 'rented' && (
                        <div className="space-y-4 p-4 bg-green-50 rounded-xl border border-green-200">
                          <h4 className="font-medium text-green-800">Informações de Aluguel</h4>
                          <input
                            type="number"
                            name="monthly_rent"
                            placeholder="Aluguel mensal (R$)"
                            step="0.01"
                            required
                            value={formData.monthly_rent}
                            onChange={(e) => handleFormDataChange('monthly_rent', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                          
                          <input
                            type="number"
                            name="tax_rate"
                            placeholder="Alíquota de imposto (%)"
                            step="0.01"
                            value={formData.tax_rate}
                            onChange={(e) => handleFormDataChange('tax_rate', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                          
                          {formData.calculated_yield && (
                            <div className="bg-green-100 p-3 rounded-xl border border-green-300">
                              <p className="text-sm text-green-700">
                                📊 <strong>Dividend Yield calculado: {formData.calculated_yield}% a.a.</strong>
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Baseado em: (R$ {formData.monthly_rent} × 12) ÷ R$ {formData.current_value || formData.purchase_price} × 100
                              </p>
                            </div>
                          )}
                          
                          {formData.tax_rate && Number(formData.tax_rate) > 0 && (
                            <div className="bg-indigo-100 p-3 rounded-xl border border-indigo-300">
                              <div className="flex items-center space-x-2">
                                <Landmark className="h-4 w-4 text-indigo-600" />
                                <p className="text-sm text-indigo-700 font-medium">
                                  Taxa de imposto: {formData.tax_rate}%
                                </p>
                              </div>
                              <p className="text-xs text-indigo-600 mt-1">
                                Esta taxa será aplicada sobre o valor do aluguel
                              </p>
                              {formData.monthly_rent && (
                                <p className="text-xs text-indigo-600 mt-1">
                                  Imposto mensal estimado: R$ {((Number(formData.monthly_rent) * Number(formData.tax_rate)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm text-green-700">
                            💡 O Dividend Yield será calculado automaticamente: (Aluguel Anual ÷ Valor do Imóvel) × 100
                          </p>
                        </div>
                      )}
                      
                      <input
                        type="number"
                        name="expenses"
                        placeholder="Despesas mensais (R$)"
                        step="0.01"
                        defaultValue="0"
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de compra</label>
                        <input
                          type="date"
                          name="purchase_date"
                          required
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setSelectedRentalStatus('');
                        setFormData({ monthly_rent: '', current_value: '', purchase_price: '', calculated_yield: '', tax_rate: '' });
                      }}
                      className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}