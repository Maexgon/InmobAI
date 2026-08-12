/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CrmPanel from './components/CrmPanel';
import ConciergePanel from './components/ConciergePanel';
import MapsView from './components/MapsView';
import Chatbot from './components/Chatbot';
import TelegramSimulator from './components/TelegramSimulator';
import AdminPanel from './components/AdminPanel';
import VendorPanel from './components/VendorPanel';
import ClientMobileView from './components/ClientMobileView';
import OwnerMobileView from './components/OwnerMobileView';
import MobileApp from './components/MobileApp';
import { inmobDb, initializeDatabase } from './lib/firebase';
import { Property, Customer, Opportunity, Seller, Booking, ConciergeTask, CompanyConfig } from './types';
import { 
  Compass, 
  MapPin, 
  BedDouble, 
  Bath, 
  Users, 
  Sparkles, 
  Lock, 
  LogIn, 
  ShieldCheck, 
  Calendar,
  Waves,
  UtensilsCrossed,
  Palmtree,
  BookOpenCheck
} from 'lucide-react';

export default function App() {
  // Check if URL is /mobile
  const isMobilePath = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/mobile');

  // Global App States
  const [currentTab, setCurrentTab] = useState(isMobilePath ? 'android-app' : 'client-portal');
  const [userRole, setUserRole] = useState<'admin' | 'seller' | 'owner' | 'client'>('client');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Firestore & local states
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<ConciergeTask[]>([]);
  const [inferences, setInferences] = useState<any[]>([]);

  // Selection states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Maps Grounded Attractions search results
  const [groundedAttractions, setGroundedAttractions] = useState<any[]>([]);
  const [isGroundingSearch, setIsGroundingSearch] = useState(false);
  const [groundingQuery, setGroundingQuery] = useState('');
  const [groundingCity, setGroundingCity] = useState<'Trancoso' | 'Arraial d\'ajuda'>('Trancoso');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await initializeDatabase();
      const comp = await inmobDb.getCompany();
      const props = await inmobDb.getProperties();
      const custs = await inmobDb.getCustomers();
      const opps = await inmobDb.getOpportunities();
      const sels = await inmobDb.getSellers();
      const books = await inmobDb.getBookings();
      const tks = await inmobDb.getTasks();
      const infs = await inmobDb.getInferences();

      setCompanyConfig(comp);
      setProperties(props);
      setCustomers(custs);
      setOpportunities(opps);
      setSellers(sels);
      setBookings(books);
      setTasks(tks);
      setInferences(infs);

      if (props.length > 0) {
        setSelectedProperty(props[0]);
      }
    };
    loadData();
  }, []);

  // Sync auth state with role
  useEffect(() => {
    if (userRole === 'client') {
      setIsAuthenticated(true); // Public client portal needs no login
    } else {
      setIsAuthenticated(false); // Admin, Seller, Owner require authentication
    }
  }, [userRole]);

  // Handle Google OAuth sign-in simulation
  const handleGoogleSignIn = () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsAuthLoading(false);
    }, 1000);
  };

  // Property creation/edit hooks
  const handleSaveProperty = async (prop: Property) => {
    await inmobDb.saveProperty(prop);
    const updated = await inmobDb.getProperties();
    setProperties(updated);
  };

  const handleDeleteProperty = async (id: string) => {
    await inmobDb.deleteProperty(id);
    const updated = await inmobDb.getProperties();
    setProperties(updated);
  };

  // Company Config update hook
  const handleSaveCompanyConfig = async (newConfig: CompanyConfig) => {
    await inmobDb.saveCompany(newConfig);
    setCompanyConfig(newConfig);
  };

  // Client registration hook
  const handleAddCustomer = async (cust: Customer) => {
    await inmobDb.addCustomer(cust);
    const updated = await inmobDb.getCustomers();
    setCustomers(updated);
  };

  const handleSaveOpportunity = async (opp: Opportunity) => {
    await inmobDb.saveOpportunity(opp);
    const updated = await inmobDb.getOpportunities();
    setOpportunities(updated);
  };

  // Pre-booking (Hold) trigger from Maysa Chatbot
  const handleBookProperty = async (prop: Property, dates: { start: string; end: string }) => {
    const newBooking: Booking = {
      id: 'book-' + Date.now(),
      propertyId: prop.id,
      propertyName: prop.title,
      customerId: 'cust-1',
      customerName: 'Mariano Gonzalez',
      startDate: dates.start,
      endDate: dates.end,
      totalPrice: prop.pricePerNight * 7, // 1 week stay simulation
      status: 'confirmed',
      staffAssigned: {
        cleaner: 'Dona Maria de Trancoso',
        chef: 'Chef Bahia de Jesus',
        concierge: 'Gabriel Alencar'
      },
      createdAt: new Date().toISOString()
    };

    // Save booking
    await inmobDb.addBooking(newBooking);
    const updatedBookings = await inmobDb.getBookings();
    setBookings(updatedBookings);

    // Seed automatic concierge tasks
    const welcomeTask: ConciergeTask = {
      id: 'task-a-' + Date.now(),
      bookingId: newBooking.id,
      propertyName: prop.title,
      customerName: 'Mariano Gonzalez',
      taskName: 'Kit de Boas-Vindas Gourmet (Frutas, Cachaça Artesanal, Chocolate de Ilhéus)',
      assignedTo: 'Gabriel Alencar',
      date: dates.start,
      status: 'pending',
      notes: 'Organizar no balcão gourmet da cozinha antes do check-in.'
    };
    const cleaningTask: ConciergeTask = {
      id: 'task-b-' + Date.now(),
      bookingId: newBooking.id,
      propertyName: prop.title,
      customerName: 'Mariano Gonzalez',
      taskName: 'Arrumação Completa & Polimento de Vidros',
      assignedTo: 'Dona Maria de Trancoso',
      date: dates.start,
      status: 'pending',
      notes: 'Enxoval lavado de linho puro e velas de capim-limão acesas.'
    };

    await inmobDb.saveTask(welcomeTask);
    await inmobDb.saveTask(cleaningTask);
    const updatedTasks = await inmobDb.getTasks();
    setTasks(updatedTasks);

    // Create commercial opportunity automatically
    const newOpp: Opportunity = {
      id: 'opp-' + Date.now(),
      customerId: 'cust-1',
      customerName: 'Mariano Gonzalez',
      propertyId: prop.id,
      propertyName: prop.title,
      estimatedValue: prop.pricePerNight * 7,
      stage: 'Reservation',
      assignedSellerId: 'seller-1',
      updatedAt: new Date().toISOString()
    };
    await inmobDb.saveOpportunity(newOpp);
    const updatedOpps = await inmobDb.getOpportunities();
    setOpportunities(updatedOpps);
  };

  // Add custom inference from Maysa's cognitive agent
  const handleAddInference = async (inf: any) => {
    await inmobDb.addInference(inf);
    const updated = await inmobDb.getInferences();
    setInferences(updated);
  };

  // Auto-persist extracted customer profile memory
  const handleUpdateCustomerProfile = async (extracted: any) => {
    if (!extracted) return;
    const updatedCust = await inmobDb.updateCustomerMemory('cust-1', extracted);
    if (updatedCust) {
      const updatedList = await inmobDb.getCustomers();
      setCustomers(updatedList);
    }
  };

  // Handle Maps Grounding Attraction Search
  const handleGroundingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groundingQuery) return;
    setIsGroundingSearch(true);
    try {
      const response = await fetch('/api/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: groundingQuery, city: groundingCity })
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setGroundedAttractions(data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsGroundingSearch(false);
    }
  };

  if (!companyConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Iniciando InmobAI no Sul da Bahia...</p>
        </div>
      </div>
    );
  }

  if (currentTab === 'android-app' || isMobilePath) {
    return (
      <MobileApp
        properties={properties}
        agentName={companyConfig.agentName}
        agentAvatar={companyConfig.agentAvatar}
        agentInstruction={companyConfig.agentInstruction}
        onBookProperty={handleBookProperty}
        onAddInference={handleAddInference}
        customerProfile={customers[0]}
        onUpdateCustomerProfile={handleUpdateCustomerProfile}
        onSwitchToDesktop={() => {
          if (typeof window !== 'undefined' && window.location.pathname.includes('/mobile')) {
            window.location.href = '/';
          } else {
            setCurrentTab('client-portal');
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION CONTROL */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userRole={userRole} 
        setUserRole={setUserRole}
        agentName={companyConfig.agentName}
      />

      {/* MAIN WORKSPACE AND WORK FLOW (Left / Center) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER BRAND & COMPANY PROFILE */}
        <header className="h-16 border-b border-slate-200/60 bg-white flex items-center justify-between px-8 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Região de Operação: Bahia (Trancoso & Arraial)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span>📞 {companyConfig.phone}</span>
            <span>✉️ {companyConfig.email}</span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="font-bold text-slate-900">Moeda: Real (R$)</span>
          </div>
        </header>

        {/* WORKSPACE AREA CONTAINER */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0 space-y-8">
          
          {/* SECURE OAUTH GATEWAY OVERLAY FOR ADMINISTRATIVE ROLES */}
          {!isAuthenticated ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md text-center max-w-md mx-auto my-12 space-y-6">
              <div className="w-14 h-14 rounded-full bg-[#111827] flex items-center justify-center mx-auto text-[#10B981]">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900 font-display">Acesso Administrativo Seguro</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para gerenciar os imóveis mocks, visualizar as inferências da Maysa IA ou comandar o serviço de Concierge, faça login utilizando sua conta autorizada.
                </p>
              </div>

              {/* simulated Firebase Google OAuth Login button */}
              <button 
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all duration-200"
              >
                {isAuthLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#10B981]" />
                    <span>Entrar via Firebase OAuth (Google)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Autenticação criptografada por Firebase Auth</span>
              </div>
            </div>
          ) : (
            // REGULAR ROLE PANELS
            <div className="space-y-8">

              {/* ADMIN PANEL */}
              {currentTab === 'admin-panel' && (
                <AdminPanel 
                  properties={properties}
                  onSaveProperty={handleSaveProperty}
                  onDeleteProperty={handleDeleteProperty}
                  customers={customers}
                  sellers={sellers}
                  companyConfig={companyConfig}
                  onSaveCompanyConfig={handleSaveCompanyConfig}
                  inferences={inferences}
                />
              )}

              {/* VENDOR PANEL */}
              {currentTab === 'vendor-panel' && (
                <VendorPanel 
                  opportunities={opportunities}
                  onSaveOpportunity={handleSaveOpportunity}
                  customers={customers}
                  properties={properties}
                  sellers={sellers}
                  inferences={inferences}
                />
              )}

              {/* CLIENT MOBILE VIEW */}
              {currentTab === 'client-mobile' && (
                <ClientMobileView 
                  properties={properties}
                  agentName={companyConfig.agentName}
                  agentAvatar={companyConfig.agentAvatar}
                  agentInstruction={companyConfig.agentInstruction}
                  onBookProperty={handleBookProperty}
                  onAddInference={handleAddInference}
                  customerProfile={customers[0]}
                />
              )}

              {/* OWNER MOBILE VIEW */}
              {currentTab === 'owner-mobile' && (
                <OwnerMobileView 
                  properties={properties}
                />
              )}
              
              {/* CLIENT-PORTAL DISCOVERY MODE WITH MAP GROUNDING */}
              {currentTab === 'client-portal' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Encontre sua Vila de Sonhos na Bahia</h2>
                    <p className="text-sm text-slate-500">Casas luxuosas e paradisíacas com serviço completo de mordomia e chef de cozinha.</p>
                  </div>

                  {/* MAP GROUNDING SEARCH ATTRIBUTION */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-1.5 text-[#0EA5E9]">
                      <Sparkles className="w-5 h-5" />
                      <h4 className="font-bold text-sm text-[#111827]">Explorador de Atrações por Grounding IA (Google Maps)</h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      Descubra restaurantes requintados, praias paradisíacas ou pontos turísticos reais perto de onde você quer se hospedar. Nossa IA fará buscas no Google Maps em tempo real e desenhará os pins no mapa abaixo!
                    </p>
                    <form onSubmit={handleGroundingSearch} className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        placeholder="Ex: Melhores Beach Clubs com música ao vivo, restaurantes de culinária baiana de autor..."
                        value={groundingQuery}
                        onChange={(e) => setGroundingQuery(e.target.value)}
                        required
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                      />
                      <div className="flex gap-2">
                        <select 
                          value={groundingCity}
                          onChange={(e) => setGroundingCity(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        >
                          <option value="Trancoso">Trancoso</option>
                          <option value="Arraial d'ajuda">Arraial d'ajuda</option>
                        </select>
                        <button 
                          type="submit"
                          disabled={isGroundingSearch}
                          className="bg-[#0EA5E9] hover:bg-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                        >
                          {isGroundingSearch ? 'Buscando...' : 'Pesquisar'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* ACTIVE PROPERTIES ROW SELECTOR */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Catalog List */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nosso Catálogo</h3>
                      <div className="space-y-4">
                        {properties.map(prop => (
                          <div 
                            key={prop.id}
                            onClick={() => setSelectedProperty(prop)}
                            className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 ${
                              selectedProperty?.id === prop.id 
                                ? 'bg-white border-[#10B981] shadow-md ring-1 ring-[#10B981]' 
                                : 'bg-white border-slate-200/60 hover:shadow-sm'
                            }`}
                          >
                            <img 
                              src={prop.image} 
                              alt={prop.title} 
                              className="w-28 h-24 object-cover rounded-xl flex-shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{prop.city}</span>
                                <h4 className="font-bold text-slate-900 text-xs mt-0.5 line-clamp-1">{prop.title}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{prop.description}</p>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                                <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {prop.bedrooms} Qts</span>
                                <span className="font-extrabold text-[#10B981]">R$ {prop.pricePerNight} / noite</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Geolocation Map view */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Mapa da Bahia</h3>
                      <MapsView 
                        properties={properties} 
                        selectedProperty={selectedProperty}
                        setSelectedProperty={setSelectedProperty}
                        groundedAttractions={groundedAttractions}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* INTEGRATED COMMERCIAL CRM PLATFORM */}
              {(currentTab === 'dashboard' || currentTab === 'properties' || currentTab === 'agent-config' || currentTab === 'conversations') && (
                <CrmPanel 
                  tab={currentTab}
                  properties={properties}
                  onSaveProperty={handleSaveProperty}
                  onDeleteProperty={handleDeleteProperty}
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  opportunities={opportunities}
                  onSaveOpportunity={handleSaveOpportunity}
                  sellers={sellers}
                  companyConfig={companyConfig}
                  onSaveCompanyConfig={handleSaveCompanyConfig}
                  inferences={inferences}
                />
              )}

              {/* CONCIERGE HOSPITALITY WORK DESK */}
              {currentTab === 'concierge' && (
                <ConciergePanel 
                  bookings={bookings}
                  tasks={tasks}
                  onSaveTask={async (task) => {
                    await inmobDb.saveTask(task);
                    const updated = await inmobDb.getTasks();
                    setTasks(updated);
                  }}
                  onUpdateBooking={async (book) => {
                    await inmobDb.updateBooking(book);
                    const updated = await inmobDb.getBookings();
                    setBookings(updated);
                  }}
                />
              )}

              {/* MAYSA CHATBOT IN CELLPHONE MOCKUP */}
              {currentTab === 'maysa-chat' && (
                <div className="flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto py-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Converse com {companyConfig.agentName}</h2>
                    <p className="text-sm text-slate-500">Interface de smartphone simulando a experiência real do hóspede conversando com a IA.</p>
                  </div>
                  
                  {/* Smartphone chassis */}
                  <div className="relative mx-auto border-slate-900 bg-slate-900 border-[14px] rounded-[3rem] h-[800px] w-[370px] shadow-2xl flex flex-col justify-between">
                    {/* Speaker & camera slot */}
                    <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl flex items-center justify-center z-20">
                      <div className="w-16 h-3.5 bg-slate-800 rounded-full flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        <span className="w-8 h-1 bg-slate-700 rounded-full"></span>
                      </div>
                    </div>
                    
                    {/* Screen inner container */}
                    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white flex flex-col relative">
                      <Chatbot 
                        properties={properties}
                        agentName={companyConfig.agentName}
                        agentAvatar={companyConfig.agentAvatar}
                        agentInstruction={companyConfig.agentInstruction}
                        onBookProperty={handleBookProperty}
                        onAddInference={handleAddInference}
                        customerProfile={customers[0]}
                        onUpdateCustomerProfile={handleUpdateCustomerProfile}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TELEGRAM CHANNEL SIMULATOR */}
              {currentTab === 'telegram-sim' && (
                <div className="max-w-4xl mx-auto">
                  <TelegramSimulator />
                </div>
              )}

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
