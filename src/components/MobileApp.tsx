/**
 * Mobile Android Application View for Maysa IA Concierge
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Home, CalendarCheck, User, Wifi, Battery, Signal, ArrowLeft, Monitor, Smartphone, MapPin, BedDouble, Users } from 'lucide-react';
import Chatbot from './Chatbot';
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
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-0 md:p-6 font-sans text-slate-100 select-none overflow-hidden">
      
      {/* Smartphone Frame Container */}
      <div className="w-full h-full md:max-w-[410px] md:max-h-[850px] bg-slate-900 md:border-[12px] border-slate-800 md:rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Android Speaker Slot (Only visible on desktop view) */}
        <div className="hidden md:flex absolute top-0 inset-x-0 h-5 bg-slate-900 items-center justify-center z-50">
          <div className="w-16 h-3 bg-slate-800 rounded-full flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
            <span className="w-8 h-0.5 bg-slate-700 rounded-full"></span>
          </div>
        </div>

        {/* Android Native Top Status Bar */}
        <div className="bg-slate-900 px-4 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-400 z-50 border-b border-slate-800/60 pt-2 md:pt-4">
          <span>{currentTime || '12:00'}</span>
          <div className="flex items-center space-x-2">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Android Native Header Bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-40">
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
            <span className="text-[10px]">Desktop</span>
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
                hideHeader={true}
              />
            </div>
          )}

        {activeTab === 'properties' && (
          <div className="p-4 pb-20 space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-bold text-slate-100">Casas Exclusivas</h2>
              <p className="text-xs text-slate-400">Trancoso & Arraial d'ajuda</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {properties.map(prop => (
                <div 
                  key={prop.id} 
                  onClick={() => setSelectedProperty(prop)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="relative h-44">
                    <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30">
                      R$ {prop.pricePerNight} / noite
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center text-[11px] text-cyan-400 font-semibold gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{prop.city}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100">{prop.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{prop.description}</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {prop.bedrooms} Quarto(s)</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> Até {prop.maxGuests} Pessoas</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="p-4 pb-20 space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-bold text-slate-100">Perfil & Preferências CRM</h2>
              <p className="text-xs text-slate-400">Dados aprendidos automaticamente por Maysa IA</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/20 text-lg">
                  {customerProfile?.name ? customerProfile.name[0] : 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{customerProfile?.name || 'Cliente Convidado'}</h3>
                  <p className="text-xs text-slate-400">{customerProfile?.email || 'email@exemplo.com'}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Telefone:</span>
                  <span className="font-medium text-slate-200">{customerProfile?.phone || 'Não informado'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Cidade Preferida:</span>
                  <span className="font-medium text-slate-200">{customerProfile?.preferredCity || 'Trancoso'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Hóspedes:</span>
                  <span className="font-medium text-slate-200">{customerProfile?.guestsCount || 2} pessoas</span>
                </div>
              </div>
            </div>
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
    </div>
  );
}

interface PropertyModalProps {
  property: Property;
  onClose: () => void;
  onBook: (dates: { start: string; end: string }) => void;
}

function PropertyModal({ property, onClose, onBook }: PropertyModalProps) {
  const [startDate, setStartDate] = useState('2026-09-10');
  const [endDate, setEndDate] = useState('2026-09-17');

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm flex flex-col max-h-[90%]">
        <div className="relative h-44 flex-shrink-0">
          <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full p-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{property.city}</span>
            <h3 className="font-bold text-base text-slate-100">{property.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{property.description}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
            <h4 className="font-semibold text-slate-300">Detalhes do Imóvel</h4>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5 text-cyan-500" /> {property.bedrooms} Quartos</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cyan-500" /> Até {property.maxGuests} Pessoas</span>
            </div>
            {property.amenities && property.amenities.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 block font-medium mb-1">Comodidades:</span>
                <div className="flex flex-wrap gap-1">
                  {property.amenities.slice(0, 4).map((amenity, i) => (
                    <span key={i} className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[9px] border border-slate-800">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Check-in</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Check-out</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500" 
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800/80">
              <span className="text-xs text-slate-400">Total Estimado</span>
              <span className="text-sm font-extrabold text-emerald-400">R$ {property.pricePerNight} / noite</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/80 flex-shrink-0 bg-slate-900/50">
          <button
            onClick={() => onBook({ start: startDate, end: endDate })}
            className="w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
          >
            Reservar pelo Chat
          </button>
        </div>
      </div>
    </div>
  );
}
