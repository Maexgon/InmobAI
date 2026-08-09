/**
 * Mobile Android Application View for Maysa IA Concierge
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Home, CalendarCheck, User, Wifi, Battery, Signal, ArrowLeft, Monitor, Smartphone } from 'lucide-react';
import Chatbot from './Chatbot';
import PropertyList from './PropertyList';
import PropertyModal from './PropertyModal';
import CustomerProfileCard from './CustomerProfileCard';
import { Property } from '../types';

interface MobileAppProps {
  properties: Property[];
  agentName: string;
  agentAvatar: string;
  agentInstruction: string;
  onBookProperty: (prop: Property, dates: { start: string; end: string }) => void;
  onAddInference: (inf: any) => void;
  customerProfile?: any;
  onUpdateCustomerProfile?: (updated: any) => void;
  onSwitchToDesktop: () => void;
}

export default function MobileApp({
  properties,
  agentName,
  agentAvatar,
  agentInstruction,
  onBookProperty,
  onAddInference,
  customerProfile,
  onUpdateCustomerProfile,
  onSwitchToDesktop
}: MobileAppProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'properties' | 'reservations' | 'profile'>('chat');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col justify-between overflow-hidden font-sans text-slate-100 select-none">
      
      {/* Android Native Top Status Bar Emulation */}
      <div className="bg-slate-950 px-4 py-1 flex items-center justify-between text-xs font-semibold text-slate-400 z-50 border-b border-slate-900">
        <span>{currentTime || '12:00'}</span>
        <div className="flex items-center space-x-2">
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <Signal className="w-3.5 h-3.5 text-slate-300" />
          <Battery className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Android Native Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={agentAvatar} 
              alt={agentName} 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/50 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900"></span>
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              {agentName}
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded-full font-medium">
                Android App
              </span>
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium">Online • Concierge Trancoso</p>
          </div>
        </div>

        <button
          onClick={onSwitchToDesktop}
          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          title="Ver versión Escritorio"
        >
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Web Desktop</span>
        </button>
      </header>

      {/* Main Content Area (Tab Views) */}
      <main className="flex-1 overflow-y-auto relative bg-slate-950">
        {activeTab === 'chat' && (
          <div className="h-full">
            <Chatbot
              properties={properties}
              agentName={agentName}
              agentAvatar={agentAvatar}
              agentInstruction={agentInstruction}
              onBookProperty={onBookProperty}
              onAddInference={onAddInference}
              customerProfile={customerProfile}
              onUpdateCustomerProfile={onUpdateCustomerProfile}
            />
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="p-4 pb-20">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-100">Casas Exclusivas</h2>
              <p className="text-xs text-slate-400">Trancoso & Arraial d'ajuda</p>
            </div>
            <PropertyList 
              properties={properties} 
              onSelectProperty={(prop) => setSelectedProperty(prop)}
            />
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="p-4 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-200">Suas Reservas</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Conversando com a Maysa no Chat, suas solicitações de pré-reserva aparecerão listadas aqui com confirmação por e-mail.
            </p>
            <button
              onClick={() => setActiveTab('chat')}
              className="mt-5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-900/30"
            >
              Falar com Maysa no Chat
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 pb-20">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-100">Perfil & Preferências CRM</h2>
              <p className="text-xs text-slate-400">Dados aprendidos automaticamente por Maysa IA</p>
            </div>
            <CustomerProfileCard customer={customerProfile} />
          </div>
        )}
      </main>

      {/* Property Modal when selected from list */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onBook={(dates) => {
            onBookProperty(selectedProperty, dates);
            setSelectedProperty(null);
          }}
        />
      )}

      {/* Android Native Bottom Navigation Bar */}
      <nav className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2 flex items-center justify-around z-40 shadow-2xl">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center space-y-1 px-4 py-1.5 rounded-xl transition ${
            activeTab === 'chat' 
              ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Chat Maysa</span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex flex-col items-center space-y-1 px-4 py-1.5 rounded-xl transition ${
            activeTab === 'properties' 
              ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Explorar</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex flex-col items-center space-y-1 px-4 py-1.5 rounded-xl transition ${
            activeTab === 'reservations' 
              ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Reservas</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center space-y-1 px-4 py-1.5 rounded-xl transition ${
            activeTab === 'profile' 
              ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Perfil CRM</span>
        </button>
      </nav>

    </div>
  );
}
