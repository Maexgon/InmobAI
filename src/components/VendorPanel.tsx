/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Opportunity, Customer, Property, Seller } from '../types';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Mail, 
  FileText, 
  CheckCircle, 
  Plus, 
  Search, 
  Bot, 
  Send,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';

interface VendorPanelProps {
  opportunities: Opportunity[];
  onSaveOpportunity: (opp: Opportunity) => void;
  customers: Customer[];
  properties: Property[];
  sellers: Seller[];
  inferences: any[];
}

export default function VendorPanel({
  opportunities,
  onSaveOpportunity,
  customers,
  properties,
  sellers,
  inferences
}: VendorPanelProps) {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(opportunities[0] || null);

  // Email Proposal Form state
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Calendar Scheduler state
  const [isSchedulingCalendar, setIsSchedulingCalendar] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-08-10T15:00');

  // Lead memory lookups
  const currentCustomer = customers.find(c => c.id === selectedOpp?.customerId) || customers[0];

  // Send proposal email via Gmail API
  const handleSendGmailProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/workspace/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: currentCustomer.email,
          subject: emailSubject || `Proposta de Aluguel Temporada - ${selectedOpp?.propertyName || 'InmobAI Bahia'}`,
          body: emailBody || `<p>Olá ${currentCustomer.name},</p><p>Segue a proposta formal de locação para a sua estadia em Trancoso / Arraial d'Ajuda.</p>`
        })
      });
      const data = await response.json();
      alert(`✓ E-mail de cotação enviado com sucesso via Gmail (${data.realApi ? 'API Real' : 'Modo Demonstrativo'})!`);
      // Advance stage to Proposal
      if (selectedOpp) {
        onSaveOpportunity({ ...selectedOpp, stage: 'Proposal' });
      }
    } catch (err: any) {
      alert('Erro ao enviar e-mail de proposta.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Schedule Follow-up in Google Calendar
  const handleScheduleGoogleCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSchedulingCalendar(true);
    try {
      const startDateTime = new Date(eventDate).toISOString();
      const endDateTime = new Date(new Date(eventDate).getTime() + 30 * 60000).toISOString();

      const response = await fetch('/api/workspace/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle || `Seguimento Comercial: ${currentCustomer?.name || 'Cliente InmobAI'}`,
          description: `Acompanhamento de proposta de locação para ${selectedOpp?.propertyName || 'Trancoso'}`,
          startDateTime,
          endDateTime
        })
      });
      const data = await response.json();
      alert(`✓ Reunião de acompanhamento agendada no Google Calendar com sucesso! (${data.realApi ? 'API Real' : 'Modo Demonstrativo'})`);
    } catch (err: any) {
      alert('Erro ao agendar compromisso.');
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#10B981]" /> Painel de Vendas & Corretores
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão comercial de oportunidades, envio de propostas por Gmail e agendamento de seguimentos no Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            {opportunities.length} Negócios no Pipeline
          </span>
        </div>
      </div>

      {/* Main Layout: Pipeline on Left, Details & Workspace on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pipeline Column (Left 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Oportunidades em Qualificação</h3>
          <div className="space-y-3">
            {opportunities.map(opp => {
              const isSelected = selectedOpp?.id === opp.id;
              return (
                <div 
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected ? 'bg-white border-[#10B981] shadow-md ring-1 ring-[#10B981]' : 'bg-white border-slate-200/60 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{opp.customerName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{opp.propertyName || 'Qualificando interesse...'}</p>
                    </div>
                    <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                      opp.stage === 'Closed' ? 'bg-emerald-100 text-emerald-800' :
                      opp.stage === 'Reservation' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' :
                      opp.stage === 'Proposal' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {opp.stage}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3 text-xs">
                    <span className="font-extrabold text-[#10B981]">R$ {opp.estimatedValue.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">Atualizado recentemente</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Workspace Column (Right 7 cols) */}
        {selectedOpp && (
          <div className="lg:col-span-7 space-y-6">
            
            {/* Customer Profile & Memory Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#111827] text-[#10B981] flex items-center justify-center font-bold text-sm">
                    {currentCustomer?.name.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{currentCustomer?.name}</h3>
                    <p className="text-xs text-slate-500">{currentCustomer?.email} | {currentCustomer?.phone}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ✓ Consentimento LGPD Ativo
                </span>
              </div>

              {/* Memory extracted by Maysa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#0EA5E9] font-bold">
                  <Bot className="w-4 h-4" />
                  <span>Memória Estruturada Extraída pelo Agente</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div><strong>Hóspedes:</strong> {currentCustomer?.guestsCount || 'Não informado'}</div>
                  <div><strong>Crianças:</strong> {currentCustomer?.hasChildren ? 'Sim' : 'Não / Não informado'}</div>
                  <div><strong>Preferência Local:</strong> {currentCustomer?.beachPreference || 'Qualquer'}</div>
                  <div><strong>Viaja de Carro:</strong> {currentCustomer?.hasCar ? 'Sim' : 'Não'}</div>
                </div>
              </div>
            </div>

            {/* Google Workspace Integrations Workspace */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              
              {/* 1. Gmail Proposal Dispatcher */}
              <form onSubmit={handleSendGmailProposal} className="space-y-3 border-b border-slate-100 pb-6">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" /> Enviar Cotacao Oficial via Gmail API
                </h4>
                <input 
                  type="text" 
                  placeholder="Assunto do e-mail..."
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs"
                />
                <textarea 
                  placeholder="Mensagem da proposta com fotos e valores..."
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs"
                />
                <button 
                  type="submit"
                  disabled={isSendingEmail}
                  className="bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#10B981]" /> {isSendingEmail ? 'Enviando e-mail...' : 'Enviar Proposta via Gmail'}
                </button>
              </form>

              {/* 2. Google Calendar Scheduler */}
              <form onSubmit={handleScheduleGoogleCalendar} className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0EA5E9]" /> Agendar Seguimento no Google Calendar
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="Título do evento (ex: Ligação de confirmação)"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs"
                  />
                  <input 
                    type="datetime-local" 
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSchedulingCalendar}
                  className="bg-[#0EA5E9] hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" /> {isSchedulingCalendar ? 'Agendando...' : 'Agendar no Google Calendar'}
                </button>
              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
