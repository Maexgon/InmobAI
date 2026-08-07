/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Property, Customer, Opportunity, Seller, CompanyConfig } from '../types';
import { 
  Plus, 
  MapPin, 
  BedDouble, 
  Bath, 
  Users, 
  Sparkles, 
  Pencil, 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  User, 
  Bot, 
  Save, 
  RotateCcw,
  Upload,
  UserPlus
} from 'lucide-react';

interface CrmPanelProps {
  tab: string;
  properties: Property[];
  onSaveProperty: (p: Property) => void;
  onDeleteProperty: (id: string) => void;
  customers: Customer[];
  onAddCustomer: (c: Customer) => void;
  opportunities: Opportunity[];
  onSaveOpportunity: (o: Opportunity) => void;
  sellers: Seller[];
  companyConfig: CompanyConfig;
  onSaveCompanyConfig: (c: CompanyConfig) => void;
  inferences: any[];
}

export default function CrmPanel({
  tab,
  properties,
  onSaveProperty,
  onDeleteProperty,
  customers,
  onAddCustomer,
  opportunities,
  onSaveOpportunity,
  sellers,
  companyConfig,
  onSaveCompanyConfig,
  inferences
}: CrmPanelProps) {
  
  // Staging generator states
  const [stagingPrompt, setStagingPrompt] = useState('');
  const [stagingAspect, setStagingAspect] = useState('16:9');
  const [generatedStagingUrl, setGeneratedStagingUrl] = useState('');
  const [isGeneratingStaging, setIsGeneratingStaging] = useState(false);
  
  // Property Add/Edit form state
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [isAddingProp, setIsAddingProp] = useState(false);

  // New Property Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCity, setFormCity] = useState<'Trancoso' | 'Arraial d\'ajuda'>('Trancoso');
  const [formPrice, setFormPrice] = useState(2000);
  const [formBeds, setFormBeds] = useState(3);
  const [formBaths, setFormBaths] = useState(3);
  const [formGuests, setFormGuests] = useState(6);
  const [formAddress, setFormAddress] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80');

  // Agent customization forms
  const [agentName, setAgentName] = useState(companyConfig.agentName);
  const [agentAvatar, setAgentAvatar] = useState(companyConfig.agentAvatar);
  const [agentPrompt, setAgentPrompt] = useState(companyConfig.agentInstruction);
  const [isSavingAgent, setIsSavingAgent] = useState(false);

  // Add Client Form States
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Handle virtual staging generator
  const generateVirtualStaging = async () => {
    if (!stagingPrompt) return;
    setIsGeneratingStaging(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: stagingPrompt, aspectRatio: stagingAspect })
      });
      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedStagingUrl(data.imageUrl);
        // If editing a property, optionally assign this image
        if (editingProp) {
          setFormImage(data.imageUrl);
        }
      } else {
        alert('Falha ao gerar imagem.');
      }
    } catch (e) {
      console.warn(e);
      alert('Erro de conexão ao gerar imagem.');
    } finally {
      setIsGeneratingStaging(false);
    }
  };

  // Save property submit
  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = editingProp ? editingProp.id : 'prop-' + Date.now();
    const propData: Property = {
      id: newId,
      title: formTitle,
      description: formDesc,
      city: formCity,
      pricePerNight: Number(formPrice),
      bedrooms: Number(formBeds),
      bathrooms: Number(formBaths),
      maxGuests: Number(formGuests),
      address: formAddress,
      image: formImage,
      latitude: editingProp ? editingProp.latitude : -16.582,
      longitude: editingProp ? editingProp.longitude : -39.085,
      amenities: editingProp ? editingProp.amenities : ['Piscina', 'Wi-Fi', 'Ar Condicionado'],
      nearbyAttractions: editingProp ? editingProp.nearbyAttractions : ['Centro'],
      ownerId: 'owner-joao'
    };
    onSaveProperty(propData);
    setIsAddingProp(false);
    setEditingProp(null);
  };

  // Open Edit form
  const startEditing = (prop: Property) => {
    setEditingProp(prop);
    setFormTitle(prop.title);
    setFormDesc(prop.description);
    setFormCity(prop.city);
    setFormPrice(prop.pricePerNight);
    setFormBeds(prop.bedrooms);
    setFormBaths(prop.bathrooms);
    setFormGuests(prop.maxGuests);
    setFormAddress(prop.address);
    setFormImage(prop.image);
    setIsAddingProp(true);
  };

  // Save Custom Agent Configuration
  const handleSaveAgent = async () => {
    setIsSavingAgent(true);
    try {
      const newConfig = {
        ...companyConfig,
        agentName,
        agentAvatar,
        agentInstruction: agentPrompt
      };
      await onSaveCompanyConfig(newConfig);
      alert('Configuração do agente de IA salva com sucesso!');
    } catch (e) {
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSavingAgent(false);
    }
  };

  // Submit client
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return;
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      lgpdConsent: true,
      lgpdTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    onAddCustomer(newCust);
    setIsAddingClient(false);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
  };

  // Metric aggregates
  const totalRevenue = opportunities
    .filter(o => o.stage === 'Reservation' || o.stage === 'Closed')
    .reduce((sum, o) => sum + o.estimatedValue, 0);

  const pipelineValue = opportunities
    .reduce((sum, o) => sum + o.estimatedValue, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. DASHBOARD OVERVIEW */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Visão Geral do Negócio</h2>
              <p className="text-sm text-slate-500">Métricas comerciais integradas em tempo real com as ações da Maysa IA.</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Concluído</span>
                <h3 className="text-2xl font-extrabold text-[#111827] mt-1">R$ {totalRevenue.toLocaleString('pt-BR')}</h3>
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4% este mês
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline de Oportunidades</span>
                <h3 className="text-2xl font-extrabold text-[#111827] mt-1">R$ {pipelineValue.toLocaleString('pt-BR')}</h3>
                <span className="text-xs text-[#0EA5E9] font-medium mt-1 block">Vilas pré-reservadas e em cotação</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9]">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leads Ativos</span>
                <h3 className="text-2xl font-extrabold text-[#111827] mt-1">{customers.length} Clientes</h3>
                <span className="text-xs text-slate-500 mt-1 block">Todos com consentimento LGPD ativo</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Leads & Pipeline board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Opportunities Funnel */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className="font-bold text-sm text-[#111827]">Funil Comercial (CRM Light)</h4>
                <span className="text-xs font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-200/60">
                  {opportunities.length} Oportunidades
                </span>
              </div>
              <div className="p-6 divide-y divide-slate-100">
                {opportunities.map(opp => (
                  <div key={opp.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <h5 className="font-semibold text-sm text-[#111827]">{opp.customerName}</h5>
                      <p className="text-xs text-slate-500">{opp.propertyName || 'Qualificando interesse...'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700">R$ {opp.estimatedValue.toLocaleString('pt-BR')}</span>
                      <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-1 rounded-full ${
                        opp.stage === 'Closed' ? 'bg-emerald-100 text-emerald-800' :
                        opp.stage === 'Reservation' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' :
                        opp.stage === 'Proposal' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {opp.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inferred attributes by IA */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Bot className="w-4.5 h-4.5 text-[#0EA5E9]" />
                  <h4 className="font-bold text-sm text-[#111827]">Cognitive Profiler (Preferências Inferidas por IA)</h4>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {inferences.slice(0, 4).map((inf, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#0EA5E9] uppercase tracking-wider">
                        {inf.attribute.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Confiança</span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#0EA5E9] h-full" 
                            style={{ width: `${inf.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{Math.round(inf.confidence * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 capitalize mb-1">
                      {inf.value.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-500 italic">
                      &ldquo;{inf.evidence}&rdquo;
                    </p>
                  </div>
                ))}
                {inferences.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Inicie o chat com Maysa para ver as inferências de preferência em tempo real!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROPERTIES MANAGER WITH VIRTUAL STAGING */}
      {tab === 'properties' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Casas para Locação por Temporada</h2>
              <p className="text-sm text-slate-500">Crie, edite e promova propriedades sofisticadas em Trancoso e Arraial d\'ajuda.</p>
            </div>
            {!isAddingProp && (
              <button 
                onClick={() => {
                  setEditingProp(null);
                  setFormTitle('');
                  setFormDesc('');
                  setFormCity('Trancoso');
                  setFormPrice(2000);
                  setFormBeds(3);
                  setFormBaths(3);
                  setFormGuests(6);
                  setFormAddress('');
                  setFormImage('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80');
                  setIsAddingProp(true);
                }}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-[#111827] font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-[#10B981]/20 transition-all duration-200"
              >
                <Plus className="w-4 h-4" /> Novo Imóvel
              </button>
            )}
          </div>

          {/* Property Form */}
          {isAddingProp && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                {editingProp ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
              </h3>
              <form onSubmit={handlePropertySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Título Comercial</label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required 
                      placeholder="Ex: Villa Vista Mar Privativa"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cidade (Localização)</label>
                    <select 
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    >
                      <option value="Trancoso">Trancoso, BA</option>
                      <option value="Arraial d'ajuda">Arraial d'ajuda, BA</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Descrição Comercial</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    required
                    placeholder="Descrição da casa..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preço / Noite (R$)</label>
                    <input 
                      type="number" 
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quartos</label>
                    <input 
                      type="number" 
                      value={formBeds}
                      onChange={(e) => setFormBeds(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Banheiros</label>
                    <input 
                      type="number" 
                      value={formBaths}
                      onChange={(e) => setFormBaths(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Capacidade Máxima</label>
                    <input 
                      type="number" 
                      value={formGuests}
                      onChange={(e) => setFormGuests(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Endereço Completo</label>
                  <input 
                    type="text" 
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    required
                    placeholder="Ex: Rua de Mucugê, 120"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />
                </div>

                {/* Staging & Image Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">URL da Imagem</label>
                    <input 
                      type="text" 
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                    <img 
                      src={formImage} 
                      alt="Preview" 
                      className="w-full h-36 object-cover rounded-xl mt-2 border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* AI STAGING TOOL */}
                  <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-1.5 text-[#10B981]">
                      <Sparkles className="w-5 h-5 text-[#0EA5E9]" />
                      <h4 className="font-bold text-sm">Virtual Staging por IA (Imagem Decorativa)</h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      Crie conceitos visuais de decoração em alta resolução para este imóvel utilizando o modelo <strong>gemini-3.1-flash-image</strong>.
                    </p>
                    <textarea 
                      placeholder="Descreva a foto dos sonhos: 'Sala de jantar estilo rústico chic de Trancoso, com mesas de madeira nobre maciça e grandes luminárias de palha natural e palmeiras de fundo...'"
                      value={stagingPrompt}
                      onChange={(e) => setStagingPrompt(e.target.value)}
                      rows={2}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <select 
                        value={stagingAspect}
                        onChange={(e) => setStagingAspect(e.target.value)}
                        className="bg-[#111827] border border-slate-700 rounded-lg p-1.5 text-[10px] focus:outline-none"
                      >
                        <option value="16:9">Proporção 16:9 (Landscape)</option>
                        <option value="1:1">Proporção 1:1 (Quadrada)</option>
                        <option value="4:3">Proporção 4:3 (Padrão)</option>
                      </select>
                      <button 
                        type="button"
                        onClick={generateVirtualStaging}
                        disabled={isGeneratingStaging}
                        className="flex items-center gap-1 bg-[#0EA5E9] text-white font-semibold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-sky-500 disabled:opacity-50 transition-all duration-200"
                      >
                        {isGeneratingStaging ? 'Gerando Imagem...' : 'Gerar Imagem'}
                      </button>
                    </div>
                    {generatedStagingUrl && (
                      <div className="pt-2">
                        <span className="text-[10px] text-emerald-400 block mb-1">✓ Imagem Gerada! Clique abaixo para adotar:</span>
                        <button 
                          type="button"
                          onClick={() => setFormImage(generatedStagingUrl)}
                          className="text-xs font-semibold underline text-[#10B981] hover:text-[#059669]"
                        >
                          Usar esta imagem no Imóvel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddingProp(false);
                      setEditingProp(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 text-xs font-semibold text-[#111827] bg-[#10B981] hover:bg-[#059669] rounded-xl flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Salvar Imóvel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((prop) => (
              <div key={prop.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                  src={prop.image} 
                  alt={prop.title} 
                  className="w-full h-48 object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#10B981]" /> {prop.city}
                    </span>
                    <span className="text-sm font-extrabold text-[#10B981]">R$ {prop.pricePerNight} / noite</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{prop.title}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{prop.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-slate-400" /> {prop.bedrooms} Qts</span>
                    <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-slate-400" /> {prop.bathrooms} Ban</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-400" /> {prop.maxGuests} Hósp</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button 
                      onClick={() => startEditing(prop)}
                      className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AGENT CONFIGURATION PANEL */}
      {tab === 'agent-config' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Personalizar Agente de IA</h2>
            <p className="text-sm text-slate-500">Mude a identidade, as instruções e os comportamentos da assistente da imobiliária.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome do Agente</label>
                <input 
                  type="text" 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">URL do Avatar</label>
                <input 
                  type="text" 
                  value={agentAvatar}
                  onChange={(e) => setAgentAvatar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Instruções do Sistema (Prompt Principal)</label>
              <textarea 
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#10B981] leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={handleSaveAgent}
                disabled={isSavingAgent}
                className="bg-[#10B981] hover:bg-[#059669] text-[#111827] font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-[#10B981]/20 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {isSavingAgent ? 'Salvando...' : 'Salvar Identidade IA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONVERSATIONS AUDIT & LOGS */}
      {tab === 'conversations' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-base text-slate-900 font-display">Histórico de Chateação & Auditoria IA</h3>
            <p className="text-xs text-slate-500 mt-1">Monitore as conversas dos clientes com a Maysa e veja os resumos comerciais gerados.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Último Cliente Atendido</span>
                <span className="text-[#10B981] font-semibold">Conversa Ativa</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Mariano Gonzalez</h4>
                  <p className="text-xs text-slate-500">marianoez.gonzalez@gmail.com | +54 9 11 5432-1098</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Status Comercial</span>
                  <span className="text-xs font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Qualificação</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong>Resumo da Maysa:</strong> &ldquo;O hóspede Mariano Gonzalez (Argentina) busca locação premium em Trancoso para 4 pessoas perto da praia em setembro. Prefere comunicação direta, possui orçamento elevado e demonstrou forte interesse na Villa Trancoso Paradise. Consentimento LGPD obtido em 07/08/2026.&rdquo;
              </div>
            </div>

            {/* Simulated Telegram status info */}
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#0EA5E9] uppercase tracking-wider">Simulador de Integração Telegram Bot</h4>
                <p className="text-xs text-slate-600">
                  O chatbot de locação está configurado no backend com suporte a transcrição/síntese por voz e resposta instantânea. Use o simulador na barra lateral direita para ver o bot respondendo como se estivesse no app!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
