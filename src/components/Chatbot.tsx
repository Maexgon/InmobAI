/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Mic, Volume2, ShieldCheck, Sparkles, MapPin, BedDouble, Bath, Users, SquareCode, CalendarDays } from 'lucide-react';
import { Property, Message } from '../types';
import confetti from 'canvas-confetti';

interface ChatbotProps {
  properties: Property[];
  agentName: string;
  agentAvatar: string;
  agentInstruction: string;
  onBookProperty: (prop: Property, dates: { start: string; end: string }) => void;
  onAddInference: (inf: any) => void;
  customerProfile?: any;
  onUpdateCustomerProfile?: (updated: any) => void;
  hideHeader?: boolean;
}

export default function Chatbot({
  properties,
  agentName,
  agentAvatar,
  agentInstruction,
  onBookProperty,
  onAddInference,
  customerProfile,
  onUpdateCustomerProfile,
  hideHeader = false
}: ChatbotProps) {
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      conversationId: 'active-conv',
      sender: 'agent',
      text: `Olá! Sou Maysa, sua concierge inteligente InmobAI. Estou aqui para planejar sua estadia ideal nas deslumbrantes praias de Trancoso ou Arraial d'ajuda, na Bahia. 🌴\n\nPor favor, aceite os termos de tratamento de dados da LGPD abaixo para começarmos nossa conversa de forma segura!`,
      createdAt: new Date().toISOString()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeCognitiveStage, setActiveCognitiveStage] = useState<string | null>(null);
  
  // Audio playback state
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState<string | null>(null);

  // Modal states
  const [bookingModalProp, setBookingModalProp] = useState<Property | null>(null);
  const [bookingForm, setBookingForm] = useState({ name: '', dni: '', email: '', phone: '', checkIn: '', checkOut: '', specialRequests: '' });
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading, activeCognitiveStage]);

  // Handle LGPD Consent
  const acceptLgpd = () => {
    setLgpdAccepted(true);
    setMessages(prev => [
      ...prev,
      {
        id: 'lgpd-log',
        conversationId: 'active-conv',
        sender: 'agent',
        text: `✓ Consentimento LGPD registrado com sucesso em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}. Como posso ajudar você hoje? Procure por vilas ou peça recomendações!`,
        createdAt: new Date().toISOString()
      }
    ]);
  };

  // Convert text to speech using gemini-3.1-flash-tts-preview with robust WAV audio decoding
  const speakMessage = async (msgId: string, text: string) => {
    if (playingAudioMsgId === msgId) {
      setPlayingAudioMsgId(null);
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (err) {}
        currentSourceRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Stop previous audio playback
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (err) {}
      currentSourceRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setPlayingAudioMsgId(msgId);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error(`TTS API returned status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audio) {
        // Decode base64 to binary ArrayBuffer
        const binaryString = atob(data.audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
        }
        
        // Ensure AudioContext is resumed if browser auto-suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        currentSourceRef.current = source;
        source.start(0);

        source.onended = () => {
          if (currentSourceRef.current === source) {
            setPlayingAudioMsgId(null);
            currentSourceRef.current = null;
          }
        };
      } else {
        throw new Error('No audio returned from server');
      }
    } catch (e) {
      console.warn('TTS API failed, falling back to Web Speech API:', e);
      
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const cleanText = text.replace(/[*#_\[\]()]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          const hasSpanish = /[áéíóúñ¿¡]/.test(text) || text.toLowerCase().includes('hola');
          utterance.lang = hasSpanish ? 'es-ES' : 'pt-BR';
          utterance.onend = () => setPlayingAudioMsgId(null);
          utterance.onerror = () => setPlayingAudioMsgId(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setPlayingAudioMsgId(null);
        }
      } catch (err) {
        setPlayingAudioMsgId(null);
      }
    }
  };

  const [isVoiceInputMode, setIsVoiceInputMode] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Chat submission logic with memory persistence
  const handleSendMessage = async (textToSend: string, isFromVoice: boolean = false) => {
    if (!textToSend.trim() || isAiLoading) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      conversationId: 'active-conv',
      sender: 'client',
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsAiLoading(true);

    const stages = [
      'Analisando intenção e regras LGPD...',
      'Recuperando memória salva do cliente...',
      'Filtrando imóveis disponíveis em Bahia...',
      'Extraindo preferências e atualizando CRM...'
    ];

    let stageIdx = 0;
    setActiveCognitiveStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setActiveCognitiveStage(stages[stageIdx]);
      } else {
        clearInterval(stageInterval);
      }
    }, 1100);

    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome' && m.id !== 'lgpd-log')
        .map(m => ({
          role: m.sender === 'client' ? 'client' : 'agent',
          text: m.text
        }));
      chatHistory.push({ role: 'client', text: textToSend });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          systemInstruction: agentInstruction,
          properties: properties,
          customerProfile: customerProfile
        })
      });

      const data = await response.json();
      clearInterval(stageInterval);
      setActiveCognitiveStage(null);

      if (data.reply) {
        // Automatic Customer Profile Memory Persistence
        if (data.extractedCustomerInfo && onUpdateCustomerProfile) {
          onUpdateCustomerProfile(data.extractedCustomerInfo);
        }

        // Record cognitive inferences
        if (data.inferredAttributes) {
          const inf = data.inferredAttributes;
          Object.keys(inf).forEach(key => {
            if (key !== 'evidence' && inf[key]) {
              onAddInference({
                id: 'inf-' + Math.random().toString(36).substr(2, 9),
                customerId: 'cust-1',
                attribute: key,
                value: inf[key],
                confidence: 0.90,
                evidence: inf.evidence || 'Conversa com Maysa IA.',
                updatedAt: new Date().toISOString()
              });
            }
          });
        }

        const modelMsg: Message = {
          id: 'msg-ai-' + Date.now(),
          conversationId: 'active-conv',
          sender: 'agent',
          text: data.reply,
          suggestedProperties: data.suggestedPropertyIds || [],
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, modelMsg]);

        // Automatically play voice response if the user sent message via microphone!
        if (isFromVoice || isVoiceInputMode) {
          speakMessage(modelMsg.id, data.reply);
          setIsVoiceInputMode(false);
        }
      }
    } catch (e) {
      clearInterval(stageInterval);
      setActiveCognitiveStage(null);
      setMessages(prev => [
        ...prev,
        {
          id: 'msg-error-' + Date.now(),
          conversationId: 'active-conv',
          sender: 'agent',
          text: 'Maysa está temporariamente sem sinal em Trancoso. Por favor, tente novamente em instantes!',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsAiLoading(false);
      setIsRecording(false);
    }
  };

  const fullTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  // Real Web Speech Recognition (Microphone STT - Long Duration Support)
  const handleVoiceNoteClick = () => {
    if (!lgpdAccepted) return;

    if (isRecording) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (err) {}
      }
      setIsRecording(false);
      
      const finalTranscript = fullTranscriptRef.current.trim();
      if (finalTranscript) {
        handleSendMessage(finalTranscript, true);
        fullTranscriptRef.current = '';
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Seu navegador não possui suporte ao microfone em tempo real. Recomendamos usar Google Chrome ou Microsoft Edge.');
      return;
    }

    try {
      fullTranscriptRef.current = '';
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true; // Allow long, continuous speech
      recognition.interimResults = true; // Show real-time progress
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setIsVoiceInputMode(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        
        fullTranscriptRef.current = currentTranscript;
        setInputMessage(currentTranscript);

        // Reset silence timer on every new speech chunk (2.5 seconds of silence auto-submits)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
          }
          setIsRecording(false);
          const textToSend = fullTranscriptRef.current.trim();
          if (textToSend) {
            handleSendMessage(textToSend, true);
            fullTranscriptRef.current = '';
          }
        }, 2500);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  // Handle instant booking modal open
  const triggerHoldBooking = (prop: Property) => {
    setBookingModalProp(prop);
  };

  const submitBookingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalProp) return;
    setIsBookingSubmitting(true);
    
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyTitle: bookingModalProp.title,
          propertyId: bookingModalProp.id,
          clientName: bookingForm.name,
          clientDni: bookingForm.dni,
          clientEmail: bookingForm.email,
          clientPhone: bookingForm.phone,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          specialRequests: bookingForm.specialRequests
        })
      });

      if (response.ok) {
        onBookProperty(bookingModalProp, { start: bookingForm.checkIn, end: bookingForm.checkOut });
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', '#0EA5E9', '#111827'] });
        setMessages(prev => [
          ...prev,
          {
            id: 'msg-book-' + Date.now(),
            conversationId: 'active-conv',
            sender: 'agent',
            text: `✓ Formulário enviado com sucesso! Realizei a solicitação de reserva da **${bookingModalProp.title}** para você e os detalhes foram encaminhados por e-mail. Um concierge humano da InmobAI entrará em contato em breve!`,
            createdAt: new Date().toISOString()
          }
        ]);
        setBookingModalProp(null);
        setBookingForm({ name: '', dni: '', email: '', phone: '', checkIn: '', checkOut: '', specialRequests: '' });
      }
    } catch (err) {
      console.error('Error submitting booking', err);
    } finally {
      setIsBookingSubmitting(false);
    }
  };
  return (
    <div className="bg-white flex flex-col h-full w-full relative overflow-hidden">
      
      {/* 1. HEADER SECTION */}
      {!hideHeader && (
        <div className="p-4 bg-gradient-to-r from-[#111827] to-[#1F2937] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-[#111827] rounded-full animate-pulse"></span>
              <img 
                src={agentAvatar} 
                alt={agentName} 
                className="w-10 h-10 rounded-full border border-slate-700 object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5 font-display">
                {agentName} <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
              </h3>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">Concierge AI • Online</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
            <SquareCode className="w-3.5 h-3.5 text-[#10B981]" />
            <span>InmobAI Core</span>
          </div>
        </div>
      )}

      {/* 2. CHAT STREAM SECTION */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 max-w-[85%] ${isAgent ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {isAgent && (
                <div className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-[#10B981] flex-shrink-0 border border-slate-200">
                  <Bot className="w-4.5 h-4.5" />
                </div>
              )}
              
              <div className="space-y-2">
                <div 
                  className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isAgent 
                      ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200/50' 
                      : 'bg-[#111827] text-white rounded-tr-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Suggested Properties rendering directly in the stream */}
                {isAgent && msg.suggestedProperties && msg.suggestedProperties.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {properties
                      .filter(p => msg.suggestedProperties?.includes(p.id))
                      .map(prop => (
                        <div 
                          key={prop.id} 
                          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <img 
                            src={prop.image} 
                            alt={prop.title} 
                            className="w-full h-28 object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-3.5 space-y-2">
                            <h4 className="font-bold text-slate-900 text-xs leading-tight">{prop.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#10B981]" /> {prop.city}</span>
                              <span className="font-extrabold text-[#10B981]">R$ {prop.pricePerNight} / noite</span>
                            </div>
                            <button 
                              onClick={() => triggerHoldBooking(prop)}
                              className="w-full bg-[#111827] hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-extrabold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <CalendarDays className="w-3.5 h-3.5 text-[#10B981]" />
                              <span>Pré-Reservar (Hold)</span>
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                )}

                {/* Audio voice control for maysa speech bubble */}
                {isAgent && msg.id !== 'welcome' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => speakMessage(msg.id, msg.text)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 ${
                        playingAudioMsgId === msg.id 
                          ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{playingAudioMsgId === msg.id ? 'Parar Áudio' : 'Ouvir Resposta'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Cognitive AI thinking states */}
        {activeCognitiveStage && (
          <div className="flex items-center gap-3 mr-auto max-w-[80%] animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-[#0EA5E9]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 border border-slate-200/50 p-3.5 rounded-2xl rounded-tl-none">
              <span className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-wider block mb-1">Raciocínio IA Maysa:</span>
              <p className="text-[11px] text-slate-500 font-medium italic">{activeCognitiveStage}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. EXPLICIT LGPD CONSENT POPUP */}
      {!lgpdAccepted && (
        <div className="absolute inset-x-0 bottom-0 bg-slate-950/95 backdrop-blur-sm p-6 text-white border-t border-slate-800 space-y-4 animate-slide-up z-30">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-8 h-8 text-[#10B981] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm font-display">Lei Geral de Proteção de Dados (LGPD)</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                Para podermos auxiliar você com cotações e recomendações personalizadas, precisamos coletar informações básicas fornecidas durante nossa conversa (como datas, composição familiar e preferências de turismo). Seus dados serão mantidos seguros de forma privada.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              onClick={acceptLgpd}
              className="bg-[#10B981] text-[#111827] font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-[#059669] transition-colors shadow-lg shadow-[#10B981]/15"
            >
              Aceitar e Continuar
            </button>
          </div>
        </div>
      )}

      {/* 4. FOOTER & INPUT CONTROLS */}
      {lgpdAccepted && (
        <div className="p-4 bg-white border-t border-slate-200/80 flex items-center gap-3 relative z-10">
          {/* Real Mic button */}
          <button 
            onClick={handleVoiceNoteClick}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 border ${
              isRecording 
                ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title="Falar por Voz (Reconhecimento de Voz real)"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Voice active animation banner overlay */}
          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 px-3 text-red-500 text-xs font-semibold">
              <span className="flex gap-1">
                <span className="w-1.5 h-3.5 bg-red-500 rounded animate-bounce"></span>
                <span className="w-1.5 h-5 bg-red-500 rounded animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-2 bg-red-500 rounded animate-bounce [animation-delay:0.4s]"></span>
              </span>
              <span>Ouvindo sua voz... Fale agora com a Maysa!</span>
            </div>
          ) : (
            <input 
              type="text" 
              placeholder="Pergunte à Maysa (Ex: Quero uma casa em Trancoso...)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputMessage);
              }}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
            />
          )}

          <button 
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() && !isRecording}
            className="w-11 h-11 rounded-xl bg-[#111827] text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalProp && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-full overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Solicitação de Reserva</h3>
            <p className="text-xs text-slate-500 mb-4">Preencha os dados abaixo para iniciar a reserva da propriedade <strong>{bookingModalProp.title}</strong>.</p>
            
            <form onSubmit={submitBookingForm} className="space-y-4">
              <input type="text" required placeholder="Nome Completo" value={bookingForm.name} onChange={e => setBookingForm({...bookingForm, name: e.target.value})} className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
              <input type="text" required placeholder="DNI ou Passaporte" value={bookingForm.dni} onChange={e => setBookingForm({...bookingForm, dni: e.target.value})} className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
              <input type="email" required placeholder="Email" value={bookingForm.email} onChange={e => setBookingForm({...bookingForm, email: e.target.value})} className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
              <input type="tel" required placeholder="Telefone / WhatsApp" value={bookingForm.phone} onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
              <div className="flex gap-4">
                <input type="date" required placeholder="Check-In" value={bookingForm.checkIn} onChange={e => setBookingForm({...bookingForm, checkIn: e.target.value})} className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                <input type="date" required placeholder="Check-Out" value={bookingForm.checkOut} onChange={e => setBookingForm({...bookingForm, checkOut: e.target.value})} className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
              </div>
              <textarea placeholder="Pedidos Especiais (Ex: berço, chef privado...)" value={bookingForm.specialRequests} onChange={e => setBookingForm({...bookingForm, specialRequests: e.target.value})} className="w-full text-sm p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981] min-h-[80px]" />
              
              <div className="flex gap-3 pt-2 mt-auto">
                <button type="button" onClick={() => setBookingModalProp(null)} className="flex-1 py-3 text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isBookingSubmitting} className="flex-1 py-3 text-sm font-bold bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50">
                  {isBookingSubmitting ? 'Enviando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
