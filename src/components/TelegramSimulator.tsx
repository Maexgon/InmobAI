/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, Bot, MessageSquare, Shield, Smartphone, AlertCircle, Info, CheckCircle } from 'lucide-react';

export default function TelegramSimulator() {
  const [botToken, setBotToken] = useState('7492104812:AAH9bN_xL8e9K3_m10294721_inmobai');
  const [webhookUrl, setWebhookUrl] = useState('https://inmobai.com.br/api/telegram-webhook');
  const [telegramMessages, setTelegramMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'bot', text: 'Olá! Sou o assistente oficial de reservas da InmobAI no Telegram. Como posso te ajudar a planejar sua estadia no Quadrado de Trancoso ou nas praias de Arraial d\'ajuda hoje? 🌴🌊', time: '12:00' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isBotResponding, setIsBotResponding] = useState(false);

  const sendSimulatedTelegramMessage = () => {
    if (!userInput.trim() || isBotResponding) return;

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: userInput, time };

    setTelegramMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsBotResponding(true);

    // Simulate bot response after short delay
    setTimeout(() => {
      const botResponses = [
        'Excelente! Tenho opções maravilhosas. A espetacular *Villa Trancoso Paradise* (com piscina privativa, chef de cozinha e vista mar) está disponível! Gostaria de receber os valores?',
        'Claro! Temos casas lindas próximas à famosa Rua de Mucugê e à Praia de Mucugê em Arraial d\'ajuda. Qual a data da sua viagem e quantos hóspedes virão com você?',
        'Perfeito! O consentimento LGPD foi registrado. Deixe-me buscar as melhores vilas com as coordenadas exatas no catálogo. Você prefere uma casa com heliponto ou pé na areia?'
      ];
      const randomReply = botResponses[Math.floor(Math.random() * botResponses.length)];
      setTelegramMessages(prev => [...prev, { sender: 'bot', text: randomReply, time }]);
      setIsBotResponding(false);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Simulador do Canal Telegram Bot</h2>
        <p className="text-sm text-slate-500">Teste as interações automáticas do agente de atendimento inteligente antes de publicar em produção.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* BOT CONFIGURATION DETAIL (Left) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#10B981]" /> Configurações de Token API
            </h3>
            <p className="text-slate-500 leading-relaxed">
              Para ativar o robô real no seu Telegram, crie um bot através do <strong>@BotFather</strong>, copie o Token gerado e configure abaixo.
            </p>
            
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-500 uppercase block">Telegram Bot Token</label>
              <input 
                type="text" 
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-500 uppercase block">Webhook Webhook Endpoint</label>
              <input 
                type="text" 
                readOnly
                value={webhookUrl}
                className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-lg text-[11px] font-mono text-slate-400 select-all"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[#10B981] font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Conexão do Servidor Ativa</span>
            </div>
          </div>

          <div className="bg-[#111827] text-slate-300 p-4 rounded-xl border border-slate-800 text-xs leading-relaxed space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4.5 h-4.5 text-[#0EA5E9]" /> Guia de Produção
            </h4>
            <p>
              As mensagens enviadas no Telegram interagem com a mesma base de dados Firestore <strong>inmobdb</strong> compartilhada. Maysa infere gostos do cliente do Telegram e alimenta o CRM instantaneamente!
            </p>
          </div>
        </div>

        {/* INTERACTIVE TELEGRAM PHONE SIMULATOR (Right) */}
        <div className="lg:col-span-3 flex justify-center">
          <div className="w-[340px] h-[550px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative overflow-hidden flex flex-col justify-between">
            {/* Speaker & camera slot */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl flex items-center justify-center z-20">
              <div className="w-20 h-3 bg-slate-800 rounded-full"></div>
            </div>

            {/* Telegram Header */}
            <div className="bg-[#243447] text-white pt-6 pb-2.5 px-4 flex items-center gap-2 border-b border-[#1b2836] relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center font-bold text-slate-900 text-xs">
                I
              </div>
              <div>
                <h4 className="font-bold text-xs leading-tight">InmobAI Bot</h4>
                <span className="text-[9px] text-[#0EA5E9] font-medium">bot oficial de reservas</span>
              </div>
            </div>

            {/* Simulated Chat stream background style of Telegram */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#182533] text-white flex flex-col">
              <div className="self-center bg-[#243447]/60 text-[#8cc4ff] rounded-lg px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider mb-2">
                Hoje
              </div>
              
              {telegramMessages.map((msg, idx) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed flex flex-col relative ${
                      isBot 
                        ? 'bg-[#182533] text-white self-start border border-[#2b394a]' 
                        : 'bg-[#2b5278] text-white self-end'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[8px] text-slate-400 self-end mt-1">{msg.time}</span>
                  </div>
                );
              })}

              {isBotResponding && (
                <div className="self-start bg-[#243447] text-slate-300 rounded-xl px-3 py-1.5 text-[10px] animate-pulse">
                  Maysa digitando...
                </div>
              )}
            </div>

            {/* Footer Input */}
            <div className="bg-[#1b2836] p-2 border-t border-[#243447] flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Mensagem..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendSimulatedTelegramMessage();
                }}
                className="flex-1 bg-[#182533] border border-[#2b394a] rounded-full px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button 
                onClick={sendSimulatedTelegramMessage}
                disabled={!userInput.trim() || isBotResponding}
                className="w-8 h-8 rounded-full bg-[#2b5278] hover:bg-[#346390] text-white flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
