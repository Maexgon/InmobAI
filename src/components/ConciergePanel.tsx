/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Booking, ConciergeTask } from '../types';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  Plus, 
  Users, 
  Utensils, 
  Sparkles, 
  UserCheck, 
  Compass, 
  Mail,
  Send,
  CalendarCheck
} from 'lucide-react';

interface ConciergePanelProps {
  bookings: Booking[];
  tasks: ConciergeTask[];
  onSaveTask: (task: ConciergeTask) => void;
  onUpdateBooking: (booking: Booking) => void;
}

export default function ConciergePanel({
  bookings,
  tasks,
  onSaveTask,
  onUpdateBooking
}: ConciergePanelProps) {
  
  const [activeBooking, setActiveBooking] = useState<Booking | null>(bookings[0] || null);
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState('Dona Maria de Trancoso');
  const [taskNotes, setTaskNotes] = useState('');
  const [isSchedulingCalendar, setIsSchedulingCalendar] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState('');

  // Handle task status toggles
  const toggleTaskStatus = (task: ConciergeTask) => {
    const updated: ConciergeTask = {
      ...task,
      status: task.status === 'completed' ? 'pending' : 'completed'
    };
    onSaveTask(updated);
  };

  // Add a task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !activeBooking) return;
    const newTask: ConciergeTask = {
      id: 'task-' + Date.now(),
      bookingId: activeBooking.id,
      propertyName: activeBooking.propertyName,
      customerName: activeBooking.customerName,
      taskName,
      assignedTo,
      date: activeBooking.startDate, // Schedule for guest arrival
      status: 'pending',
      notes: taskNotes
    };
    onSaveTask(newTask);
    setTaskName('');
    setTaskNotes('');
  };

  // Real Google Calendar integration to schedule check-in event
  const scheduleGoogleCalendarEvent = async () => {
    if (!activeBooking) return;
    setIsSchedulingCalendar(true);
    setCalendarMessage('');
    try {
      const response = await fetch('/api/workspace/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Check-in InmobAI: ${activeBooking.customerName}`,
          description: `Check-in na casa ${activeBooking.propertyName}. Concierge encarregado: ${activeBooking.staffAssigned.concierge || 'Gabriel'}. Enxoval: Linho Premium. Chef: ${activeBooking.staffAssigned.chef || 'Chef Bahia de Jesus'}.`,
          startDateTime: `${activeBooking.startDate}T14:00:00`,
          endDateTime: `${activeBooking.startDate}T16:00:00`
        })
      });
      const data = await response.json();
      if (data.success) {
        setCalendarMessage(data.realApi 
          ? '✓ Evento real criado no Google Calendar do Corretor!' 
          : '✓ Evento simulado com sucesso na agenda do Concierge!');
      } else {
        setCalendarMessage('Falha ao agendar evento.');
      }
    } catch (e) {
      setCalendarMessage('Erro ao conectar com Google Calendar.');
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  // Real Gmail integration to send welcoming e-mail with pdf details
  const sendWelcomeEmail = async () => {
    if (!activeBooking) return;
    setIsSchedulingCalendar(true);
    setCalendarMessage('');
    try {
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #111827;">Olá, ${activeBooking.customerName}! 🌴</h2>
          <p>Seja muito bem-vindo ao paraíso baiano com a <strong>InmobAI</strong>!</p>
          <p>Tudo está sendo preparado nos mínimos detalhes para sua estadia na espetacular <strong>${activeBooking.propertyName}</strong>, do dia <strong>${activeBooking.startDate}</strong> ao dia <strong>${activeBooking.endDate}</strong>.</p>
          <h3 style="color: #10b981;">Serviço de Concierge Exclusivo:</h3>
          <ul>
            <li><strong>Concierge no local:</strong> Gabriel Alencar</li>
            <li><strong>Chef de Cozinha:</strong> Chef Bahia de Jesus</li>
            <li><strong>Governança:</strong> Dona Maria de Trancoso</li>
          </ul>
          <p>Se precisar de qualquer coisa (reserva de transfer, passeios de lancha ou chef privativo), nossa assistente Maysa está disponível 24h em nosso aplicativo!</p>
          <p>Abraços,<br><strong>Equipe de Hospitalidade InmobAI</strong></p>
        </div>
      `;

      const response = await fetch('/api/workspace/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'marianoez.gonzalez@gmail.com', // Active demo email
          subject: `Confirmação de Boas-Vindas InmobAI - ${activeBooking.propertyName}`,
          body: emailBody
        })
      });
      const data = await response.json();
      if (data.success) {
        setCalendarMessage(data.realApi 
          ? '✓ E-mail real de Boas-Vindas enviado via Gmail!' 
          : '✓ E-mail de Boas-Vindas simulado e registrado!');
      } else {
        setCalendarMessage('Falha ao enviar e-mail.');
      }
    } catch (e) {
      setCalendarMessage('Erro ao enviar e-mail via Gmail.');
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  const filteredTasks = tasks.filter(t => t.bookingId === activeBooking?.id);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Concierge Overview Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Hospitalidade & Serviço de Concierge</h2>
        <p className="text-sm text-slate-500">Coordene a chegada de hóspedes e comande o pessoal doméstico com total tranquilidade.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ACTIVE BOOKINGS SELECTOR */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Hospedagens Ativas</h3>
          <div className="space-y-3">
            {bookings.map(book => (
              <button
                key={book.id}
                onClick={() => {
                  setActiveBooking(book);
                  setCalendarMessage('');
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                  activeBooking?.id === book.id 
                    ? 'bg-[#111827] text-white border-slate-800 shadow-lg shadow-slate-900/15' 
                    : 'bg-white text-slate-800 border-slate-200/60 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm leading-snug">{book.propertyName}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                    book.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {book.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">Hóspede: <strong>{book.customerName}</strong></p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#10B981]" /> {book.startDate}</span>
                  <span>R$ {book.totalPrice.toLocaleString('pt-BR')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* HOSTING CONTROL AND INTEGRATION ACTIONS */}
        <div className="lg:col-span-2 space-y-6">
          {activeBooking ? (
            <div className="space-y-6">
              
              {/* Concierge Details & Integrations Section */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10B981]">Gestão Premium</span>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight mt-0.5">{activeBooking.propertyName}</h3>
                  </div>
                  
                  {/* Google Workspace Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={scheduleGoogleCalendarEvent}
                      disabled={isSchedulingCalendar}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <CalendarCheck className="w-4 h-4 text-[#0EA5E9]" />
                      <span>Agendar no Google Calendar</span>
                    </button>
                    <button 
                      onClick={sendWelcomeEmail}
                      disabled={isSchedulingCalendar}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Mail className="w-4 h-4 text-[#10B981]" />
                      <span>Enviar Email de Boas-Vindas</span>
                    </button>
                  </div>
                </div>

                {calendarMessage && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs p-3.5 rounded-xl font-medium animate-pulse">
                    {calendarMessage}
                  </div>
                )}

                {/* Domestic Staffassigned */}
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-3">Equipe Doméstica Escalada</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">C</div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Governança</span>
                        <span className="text-xs font-semibold text-slate-800">{activeBooking.staffAssigned.cleaner || 'Não Definido'}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">F</div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Chef Gourmet</span>
                        <span className="text-xs font-semibold text-slate-800">{activeBooking.staffAssigned.chef || 'Não Definido'}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">A</div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Concierge</span>
                        <span className="text-xs font-semibold text-slate-800">{activeBooking.staffAssigned.concierge || 'Não Definido'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TASKS CHECKLISTS */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="font-bold text-sm text-[#111827]">Checklist de Preparação do Imóvel</h4>
                  <p className="text-xs text-slate-500 mt-1">Monitore e marque tarefas essenciais para garantir o selo de qualidade InmobAI.</p>
                </div>

                <div className="space-y-2.5">
                  {filteredTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                        task.status === 'completed' 
                          ? 'bg-slate-50 border-slate-100 text-slate-400' 
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <button 
                        onClick={() => toggleTaskStatus(task)}
                        className="mt-0.5 text-slate-400 hover:text-[#10B981] transition-colors"
                      >
                        {task.status === 'completed' ? (
                          <CheckSquare className="w-5 h-5 text-[#10B981]" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <h5 className={`text-xs font-bold leading-snug ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.taskName}
                          </h5>
                          <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded">
                            {task.assignedTo}
                          </span>
                        </div>
                        {task.notes && (
                          <p className={`text-[10px] mt-1 leading-normal ${task.status === 'completed' ? 'text-slate-300' : 'text-slate-500'}`}>
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ADD NEW TASK FORM */}
                <form onSubmit={handleAddTask} className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    type="text"
                    placeholder="Adicionar nova tarefa..."
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
                    className="sm:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />
                  <select 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  >
                    <option value="Dona Maria de Trancoso">Dona Maria de Trancoso</option>
                    <option value="Chef Bahia de Jesus">Chef Bahia de Jesus</option>
                    <option value="Gabriel Alencar">Gabriel Alencar</option>
                  </select>
                  <button 
                    type="submit"
                    className="flex items-center justify-center gap-1 bg-[#111827] hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#10B981]" /> Adicionar
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Nenhuma hospedagem ativa cadastrada para gerenciamento de concierge.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
