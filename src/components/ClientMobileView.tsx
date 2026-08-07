/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Chatbot from './Chatbot';
import { Property, Customer } from '../types';
import { 
  Compass, 
  MapPin, 
  BedDouble, 
  Bath, 
  Users, 
  ShieldCheck, 
  CalendarDays, 
  Smartphone, 
  Sparkles, 
  QrCode, 
  Copy, 
  CheckCircle2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClientMobileViewProps {
  properties: Property[];
  agentName: string;
  agentAvatar: string;
  agentInstruction: string;
  onBookProperty: (prop: Property, dates: { start: string; end: string }) => void;
  onAddInference: (inf: any) => void;
  customerProfile?: Customer;
}

export default function ClientMobileView({
  properties,
  agentName,
  agentAvatar,
  agentInstruction,
  onBookProperty,
  onAddInference,
  customerProfile
}: ClientMobileViewProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'chat'>('catalog');
  const [selectedProp, setSelectedProp] = useState<Property | null>(properties[0] || null);

  // Pix Payment Modal State
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixProperty, setPixProperty] = useState<Property | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const handleTriggerPixPayment = (prop: Property) => {
    setPixProperty(prop);
    setShowPixModal(true);
  };

  const handleConfirmPixPayment = () => {
    if (!pixProperty) return;
    onBookProperty(pixProperty, { start: '2026-09-10', end: '2026-09-17' });
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
    setShowPixModal(false);
    setActiveTab('chat');
  };

  const copyPixCode = () => {
    const code = '00020126580014br.gov.bcb.pix0136inmobai-trancoso-pix-checkout-504819520400005303986540731500.005802BR5920InmobAI Bahia Locacao6008Trancoso62070503***6304E8A2';
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto py-2">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900 font-display flex items-center justify-center gap-1.5">
          <Smartphone className="w-5 h-5 text-[#10B981]" /> Portal do Hóspede (Vista Móvel)
        </h2>
        <p className="text-xs text-slate-500">Interface para smartphone adaptada para clientes finais.</p>
      </div>

      {/* Smartphone Chassis */}
      <div className="relative mx-auto border-slate-900 bg-slate-900 border-[12px] rounded-[2.5rem] h-[760px] w-[360px] shadow-2xl flex flex-col justify-between overflow-hidden">
        
        {/* Speaker & camera slot */}
        <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 rounded-b-xl flex items-center justify-center z-30">
          <div className="w-16 h-3 bg-slate-800 rounded-full flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
            <span className="w-6 h-1 bg-slate-700 rounded-full"></span>
          </div>
        </div>

        {/* Mobile App Header */}
        <div className="bg-[#111827] text-white pt-6 pb-3 px-4 flex items-center justify-between z-20 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#10B981] flex items-center justify-center font-extrabold text-[#111827] text-xs">
              I
            </div>
            <span className="font-bold text-xs tracking-tight">InmobAI Bahia</span>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'catalog' ? 'bg-[#10B981] text-[#111827]' : 'text-slate-400'}`}
            >
              Imóveis
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'chat' ? 'bg-[#10B981] text-[#111827]' : 'text-slate-400'}`}
            >
              Maysa IA
            </button>
          </div>
        </div>

        {/* Screen Container */}
        <div className="flex-1 bg-slate-50 overflow-y-auto relative">
          
          {/* TAB 1: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bahia • Trancoso & Arraial</span>
                <h3 className="font-bold text-sm text-slate-900">Vilas Paradisíacas</h3>
              </div>

              <div className="space-y-4">
                {properties.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm space-y-2 p-3">
                    <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded-xl" />
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#10B981]">{p.city}</span>
                        <span className="text-xs font-extrabold text-[#10B981]">R$ {p.pricePerNight} / noite</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">{p.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{p.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      <span>{p.bedrooms} Qts • {p.maxGuests} Hósp</span>
                      <button 
                        onClick={() => handleTriggerPixPayment(p)}
                        className="bg-[#111827] hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px]"
                      >
                        <QrCode className="w-3 h-3 text-[#10B981]" /> Reservar Pix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CHATBOT */}
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
              />
            </div>
          )}

        </div>

        {/* PIX PAYMENT MODAL SIMULATION */}
        {showPixModal && pixProperty && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 w-full space-y-4 shadow-2xl relative text-center">
              <button 
                onClick={() => setShowPixModal(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900">Pagamento Pix Simulado</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{pixProperty.title}</p>
                <span className="text-lg font-extrabold text-[#10B981] block mt-1">R$ {(pixProperty.pricePerNight * 7).toLocaleString('pt-BR')}</span>
              </div>

              {/* QR Code graphic representation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center space-y-2">
                <div className="w-32 h-32 bg-slate-900 rounded-lg p-2 flex items-center justify-center text-white font-mono text-[9px] text-center leading-tight">
                  [ QR CODE DINÂMICO PIX MOCK ]
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Chave Pix: inmobai-trancoso-504819</span>
              </div>

              {/* Copia e Cola button */}
              <button 
                onClick={copyPixCode}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedPix ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPix ? 'Código Pix Copiado!' : 'Copiar Código Copia e Cola'}</span>
              </button>

              <button 
                onClick={handleConfirmPixPayment}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-[#111827] font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-[#10B981]/20 transition-all"
              >
                Simular Confirmação de Transferência
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
