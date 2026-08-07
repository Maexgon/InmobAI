/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Users, 
  Sparkles, 
  Compass, 
  MapPin, 
  UserSquare, 
  Settings2,
  CalendarDays,
  Bot,
  Layers,
  HeartHandshake,
  Smartphone,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: 'admin' | 'seller' | 'owner' | 'client';
  setUserRole: (role: 'admin' | 'seller' | 'owner' | 'client') => void;
  agentName: string;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  userRole, 
  setUserRole,
  agentName
}: SidebarProps) {
  
  const menuItems = [
    { id: 'client-portal', label: 'Catálogo de Imóveis', icon: Compass, roles: ['admin', 'seller', 'owner', 'client'] },
    { id: 'client-mobile', label: 'Vista Clientes (Móvil)', icon: Smartphone, roles: ['admin', 'client'] },
    { id: 'owner-mobile', label: 'Vista Dueños (Móvil)', icon: Building2, roles: ['admin', 'owner'] },
    { id: 'vendor-panel', label: 'Vista Vendedor (CRM)', icon: Users, roles: ['admin', 'seller'] },
    { id: 'admin-panel', label: 'Painel Administrador', icon: Settings2, roles: ['admin'] },
    { id: 'maysa-chat', label: 'Chat Maysa (Celular)', icon: Smartphone, roles: ['admin', 'seller', 'owner', 'client'] },
    { id: 'telegram-sim', label: 'Simulador Telegram', icon: MessageSquare, roles: ['admin', 'seller'] },
    { id: 'dashboard', label: 'Dashboard CRM', icon: Building2, roles: ['admin', 'seller'] },
    { id: 'conversations', label: 'Histórico & IA Inferences', icon: Bot, roles: ['admin', 'seller'] },
    { id: 'properties', label: 'Gerenciar Imóveis', icon: MapPin, roles: ['admin', 'seller', 'owner'] },
    { id: 'concierge', label: 'Serviço de Concierge', icon: HeartHandshake, roles: ['admin', 'seller', 'owner', 'client'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-[#111827] text-white flex flex-col justify-between border-r border-[#1F2937]">
      <div className="p-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
            <Building2 className="w-6 h-6 text-[#111827]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-1">
              Inmob<span className="text-[#10B981]">AI</span>
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Aluguel Inteligente</p>
          </div>
        </div>

        {/* User Role Quick Switcher */}
        <div className="mb-8 bg-[#1F2937] p-3 rounded-xl border border-slate-700/50">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Visualizar como:</label>
          <select 
            value={userRole}
            onChange={(e) => {
              const role = e.target.value as any;
              setUserRole(role);
              const supported = menuItems.find(item => item.id === currentTab)?.roles.includes(role);
              if (!supported) {
                if (role === 'admin') setCurrentTab('admin-panel');
                else if (role === 'seller') setCurrentTab('vendor-panel');
                else if (role === 'owner') setCurrentTab('owner-mobile');
                else setCurrentTab('client-mobile');
              }
            }}
            className="w-full bg-[#111827] text-white text-xs rounded-lg p-2 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
          >
            <option value="admin">Administrador (Completo)</option>
            <option value="seller">Vendedor / Operador</option>
            <option value="owner">Proprietário / Dueño (Móvil)</option>
            <option value="client">Cliente / Hóspede (Móvil)</option>
          </select>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#10B981] text-[#111827] shadow-lg shadow-[#10B981]/20 font-semibold' 
                    : 'text-slate-300 hover:bg-[#1F2937] hover:text-white'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-[#111827]' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Maysa Agent Status Widget */}
      <div className="p-4 m-4 bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-[#1E293B] rounded-full animate-pulse"></span>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1">
              Agente: <span className="text-[#0EA5E9]">{agentName}</span>
            </h4>
            <p className="text-[10px] text-slate-400">Pronta para atender (PT/ES)</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
