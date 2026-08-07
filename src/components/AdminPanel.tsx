/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Property, Customer, Opportunity, Seller, CompanyConfig } from '../types';
import { 
  Building2, 
  Settings2, 
  Users, 
  ShieldCheck, 
  Bot, 
  Save, 
  Plus, 
  Pencil, 
  Trash2, 
  Sparkles, 
  FileText, 
  Key, 
  Lock,
  CalendarDays,
  MapPin,
  BedDouble,
  Bath
} from 'lucide-react';

interface AdminPanelProps {
  properties: Property[];
  onSaveProperty: (p: Property) => void;
  onDeleteProperty: (id: string) => void;
  customers: Customer[];
  sellers: Seller[];
  companyConfig: CompanyConfig;
  onSaveCompanyConfig: (c: CompanyConfig) => void;
  inferences: any[];
}

export default function AdminPanel({
  properties,
  onSaveProperty,
  onDeleteProperty,
  customers,
  sellers,
  companyConfig,
  onSaveCompanyConfig,
  inferences
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'company' | 'lgpd' | 'staff' | 'skills'>('properties');

  // Property Form State
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCity, setFormCity] = useState<'Trancoso' | 'Arraial d\'ajuda'>('Trancoso');
  const [formPrice, setFormPrice] = useState(3000);
  const [formBeds, setFormBeds] = useState(3);
  const [formBaths, setFormBaths] = useState(3);
  const [formGuests, setFormGuests] = useState(6);
  const [formAddress, setFormAddress] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80');

  // Agent Config Form State
  const [agentName, setAgentName] = useState(companyConfig.agentName);
  const [agentAvatar, setAgentAvatar] = useState(companyConfig.agentAvatar);
  const [agentInstruction, setAgentInstruction] = useState(companyConfig.agentInstruction);
  const [botToken, setBotToken] = useState(companyConfig.telegramBotToken || '7492104812:AAH9bN_xL8e9K3_m10294721_inmobai');

  const handleSavePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp: Property = {
      id: editingProp ? editingProp.id : 'prop-' + Date.now(),
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
      amenities: editingProp ? editingProp.amenities : ['Piscina', 'Wi-Fi', 'Ar Condicionado', 'Chef'],
      nearbyAttractions: editingProp ? editingProp.nearbyAttractions : ['Praia', 'Centro'],
      ownerId: editingProp ? editingProp.ownerId : 'owner-joao'
    };
    onSaveProperty(newProp);
    setIsFormOpen(false);
    setEditingProp(null);
  };

  const startEditProperty = (prop: Property) => {
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
    setIsFormOpen(true);
  };

  const handleSaveCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompanyConfig({
      ...companyConfig,
      agentName,
      agentAvatar,
      agentInstruction,
      telegramBotToken: botToken
    });
    alert('Configurações administrativas salvas com sucesso!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#10B981]" /> Painel do Administrador
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerenciamento global de imóveis, proprietários, consentimentos LGPD e diretrizes da inteligência artificial.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-xl text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'properties' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Imóveis ({properties.length})
          </button>
          <button 
            onClick={() => setActiveTab('company')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'company' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Agente IA & Token
          </button>
          <button 
            onClick={() => setActiveTab('lgpd')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'lgpd' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Auditoria LGPD
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'staff' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Vendedores ({sellers.length})
          </button>
        </div>
      </div>

      {/* 1. PROPERTIES TAB */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Catálogo Administrado</h3>
            <button 
              onClick={() => {
                setEditingProp(null);
                setFormTitle('');
                setFormDesc('');
                setFormCity('Trancoso');
                setFormPrice(3000);
                setFormBeds(3);
                setFormBaths(3);
                setFormGuests(6);
                setFormAddress('');
                setFormImage('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80');
                setIsFormOpen(true);
              }}
              className="bg-[#10B981] hover:bg-[#059669] text-[#111827] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#10B981]/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Imóvel Mock
            </button>
          </div>

          {/* Form Modal / Section */}
          {isFormOpen && (
            <form onSubmit={handleSavePropertySubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900">{editingProp ? 'Editar Imóvel' : 'Cadastrar Imóvel em Trancoso / Arraial'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Título Comercial" 
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required 
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
                <select 
                  value={formCity} 
                  onChange={e => setFormCity(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none"
                >
                  <option value="Trancoso">Trancoso, BA</option>
                  <option value="Arraial d'ajuda">Arraial d'ajuda, BA</option>
                </select>
              </div>
              <textarea 
                placeholder="Descrição completa..." 
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                rows={2}
                required
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              />
              <div className="grid grid-cols-4 gap-3">
                <input type="number" placeholder="Preço (R$)" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs" />
                <input type="number" placeholder="Quartos" value={formBeds} onChange={e => setFormBeds(Number(e.target.value))} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs" />
                <input type="number" placeholder="Banheiros" value={formBaths} onChange={e => setFormBaths(Number(e.target.value))} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs" />
                <input type="number" placeholder="Hóspedes" value={formGuests} onChange={e => setFormGuests(Number(e.target.value))} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs" />
              </div>
              <input type="text" placeholder="URL da Imagem" value={formImage} onChange={e => setFormImage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-[#111827] bg-[#10B981] rounded-xl flex items-center gap-1"><Save className="w-4 h-4" /> Salvar</button>
              </div>
            </form>
          )}

          {/* Properties Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="p-4">Imóvel</th>
                  <th className="p-4">Cidade</th>
                  <th className="p-4">Diária</th>
                  <th className="p-4">Capacidade</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-3">
                      <img src={p.image} alt={p.title} className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <div>{p.title}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{p.address}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{p.city}</td>
                    <td className="p-4 font-bold text-[#10B981]">R$ {p.pricePerNight.toLocaleString('pt-BR')}</td>
                    <td className="p-4 text-slate-600">{p.bedrooms} Qts • {p.maxGuests} Hósp</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => startEditProperty(p)} className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDeleteProperty(p.id)} className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. AGENT CONFIG TAB */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompanySubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Bot className="w-6 h-6 text-[#0EA5E9]" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Directiva do Agente Virtual Maysa</h3>
              <p className="text-xs text-slate-500">Configure o tom, diretrizes de qualificação e credenciais do bot de atendimento.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Nome da Concierge</label>
              <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Token Telegram Bot Father</label>
              <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-mono" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500">Prompt do Sistema (Instrução Canônica)</label>
            <textarea value={agentInstruction} onChange={e => setAgentInstruction(e.target.value)} rows={6} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs leading-relaxed" />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-[#111827] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Salvar Diretrizes de IA
            </button>
          </div>
        </form>
      )}

      {/* 3. LGPD AUDIT TAB */}
      {activeTab === 'lgpd' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900">Registro de Consentimento LGPD (Lei Geral de Proteção de Dados)</h3>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">100% Conforme LGPD Brasil</span>
          </div>

          <div className="divide-y divide-slate-100">
            {customers.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{c.name}</h4>
                  <p className="text-slate-500">{c.email} • {c.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase">✓ Consentimento Ativo</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Registrado em: {c.lgpdTimestamp ? new Date(c.lgpdTimestamp).toLocaleString('pt-BR') : 'Hoje'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. STAFF / SELLERS TAB */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Equipe Comercial de Corretores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sellers.map(s => (
              <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{s.name}</h4>
                  <p className="text-[11px] text-slate-500">{s.email} | {s.phone}</p>
                </div>
                <span className="text-xs font-extrabold text-[#0EA5E9] bg-[#0EA5E9]/10 px-2.5 py-1 rounded-full">{s.activeLeadsCount} Leads Ativos</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
