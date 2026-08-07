/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Property, OwnerPayout } from '../types';
import { inmobDb } from '../lib/firebase';
import { 
  Building2, 
  DollarSign, 
  Sparkles, 
  CalendarDays, 
  Smartphone, 
  CheckCircle2, 
  Camera, 
  MapPin, 
  Plus, 
  Lock,
  ArrowUpRight
} from 'lucide-react';

interface OwnerMobileViewProps {
  properties: Property[];
}

export default function OwnerMobileView({ properties }: OwnerMobileViewProps) {
  const [payouts, setPayouts] = useState<OwnerPayout[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'earnings' | 'staging'>('portfolio');

  // Virtual Staging state
  const [stagingPrompt, setStagingPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter properties owned by owner-joao or all
  const ownerProperties = properties.filter(p => p.ownerId === 'owner-joao' || p.ownerId === 'owner-maria');

  useEffect(() => {
    const loadPayouts = async () => {
      const data = await inmobDb.getPayouts();
      setPayouts(data);
    };
    loadPayouts();
  }, []);

  const handleGenerateStaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stagingPrompt) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: stagingPrompt, aspectRatio: '16:9' })
      });
      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        alert('Erro ao gerar conceito de imagem.');
      }
    } catch (e) {
      alert('Erro de conexão ao gerar staging.');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalEarnings = payouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto py-2">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900 font-display flex items-center justify-center gap-1.5">
          <Smartphone className="w-5 h-5 text-[#10B981]" /> Portal do Proprietário / Dueño (Móvel)
        </h2>
        <p className="text-xs text-slate-500">Interface para proprietários acompanharem repasses Pix e gerenciarem fotos.</p>
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

        {/* Header */}
        <div className="bg-[#111827] text-white pt-6 pb-3 px-4 flex items-center justify-between z-20 border-b border-slate-800">
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Proprietário</span>
            <h3 className="font-bold text-xs">João Carlos de Alencar</h3>
          </div>

          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={`px-2 py-1 rounded-md transition-all ${activeTab === 'portfolio' ? 'bg-[#10B981] text-[#111827]' : 'text-slate-400'}`}
            >
              Casas
            </button>
            <button 
              onClick={() => setActiveTab('earnings')}
              className={`px-2 py-1 rounded-md transition-all ${activeTab === 'earnings' ? 'bg-[#10B981] text-[#111827]' : 'text-slate-400'}`}
            >
              Repasses Pix
            </button>
            <button 
              onClick={() => setActiveTab('staging')}
              className={`px-2 py-1 rounded-md transition-all ${activeTab === 'staging' ? 'bg-[#10B981] text-[#111827]' : 'text-slate-400'}`}
            >
              Staging IA
            </button>
          </div>
        </div>

        {/* Body Screen */}
        <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total de Imóveis Licenciados</span>
                <h3 className="text-xl font-extrabold text-slate-900">{ownerProperties.length} Propriedades em Operação</h3>
              </div>

              <div className="space-y-3">
                {ownerProperties.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm p-3 space-y-2">
                    <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded-xl" />
                    <div>
                      <span className="text-[10px] font-bold text-[#10B981]">{p.city}</span>
                      <h4 className="font-bold text-xs text-slate-900">{p.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{p.address}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px]">
                      <span className="font-bold text-slate-700">R$ {p.pricePerNight} / noite</span>
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">✓ Calendário Aberto</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EARNINGS & PIX REPAYMENTS */}
          {activeTab === 'earnings' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] text-white p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Recebido via Pix</span>
                <h3 className="text-2xl font-extrabold text-[#10B981]">R$ {totalEarnings.toLocaleString('pt-BR')}</h3>
                <p className="text-[10px] text-slate-300">Repasses diretos para a chave Pix do proprietário (90% do valor da reserva).</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400">Histórico de Comprovantes</h4>
                {payouts.map(p => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{p.propertyName}</h5>
                      <span className="text-[10px] text-slate-400">Chave Pix: {p.pixKey}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#10B981] block">R$ {p.amount.toLocaleString('pt-BR')}</span>
                      <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded uppercase">✓ Transferido</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STAGING IA GENERATOR */}
          {activeTab === 'staging' && (
            <form onSubmit={handleGenerateStaging} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-[#0EA5E9]">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-bold text-xs text-slate-900">Virtual Staging com Gemini</h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Gere fotos conceituais da sua casa em Trancoso / Arraial para testes de mídias e anúncio.
              </p>

              <textarea 
                placeholder="Descreva a foto (ex: Varanda gourmet com rede de descanso e vista para o mar azul de Trancoso...)"
                value={stagingPrompt}
                onChange={e => setStagingPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              />

              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4 text-[#10B981]" />
                <span>{isGenerating ? 'Gerando com Gemini...' : 'Gerar Conceito de Imagem'}</span>
              </button>

              {generatedImage && (
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] text-emerald-600 font-bold block">✓ Conceito Gerado:</span>
                  <img src={generatedImage} alt="Staging Preview" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                </div>
              )}
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
