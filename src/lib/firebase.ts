/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  addDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Property, Customer, Opportunity, CompanyConfig, Booking, ConciergeTask, Conversation, Message, CustomerInference, Seller } from '../types';

// Initialize Firebase with custom databaseId 'inmobdb'
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || 'inmobdb');

// Mock Data Definitions
const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    title: 'Villa Trancoso Paradise',
    description: 'Espetacular casa de luxo localizada em frente à praia de Trancoso. Possui piscina privativa, deck de madeira noble, serviço de chef de cozinha e decoração tropical autêntica do sul da Bahia. Ideal para quem busca privacidade e o máximo conforto.',
    city: 'Trancoso',
    address: 'Estrada da Balsa, Km 12 - Praia dos Nativos, Trancoso, BA',
    pricePerNight: 4500,
    bedrooms: 4,
    bathrooms: 5,
    maxGuests: 8,
    latitude: -16.582,
    longitude: -39.085,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Piscina Privativa', 'Ar Condicionado', 'Chef de Cozinha', 'Vista para o Mar', 'Wi-Fi de Alta Velocidade', 'Segurança 24h', 'Adega de Vinhos'],
    nearbyAttractions: ['Praia dos Coqueiros', 'Quadrado Histórico', 'Praia dos Nativos', 'Terravista Golf Club'],
    ownerId: 'owner-joao'
  },
  {
    id: 'prop-2',
    title: 'Arraial Ocean Breeze Loft',
    description: 'Lindo loft moderno com piscina privativa, cercado por jardins tropicais e apenas 150 metros da areia da praia em Arraial d\'ajuda. Conta com varanda gourmet com rede, cozinha totalmente equipada e perfeito isolamento acústico.',
    city: 'Arraial d\'ajuda',
    address: 'Alameda das Palmeiras, 45 - Praia do Mucugê, Arraial d\'ajuda, BA',
    pricePerNight: 1800,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    latitude: -16.488,
    longitude: -39.065,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Piscina', 'Jardim Privativo', 'Churrasqueira', 'Ar Condicionado', 'Pet Friendly', 'Estacionamento Privativo'],
    nearbyAttractions: ['Rua do Mucugê', 'Praia do Mucugê', 'Eco Parque Arraial', 'Igreja de Nossa Senhora d\'Ajuda'],
    ownerId: 'owner-maria'
  },
  {
    id: 'prop-3',
    title: 'Quadrado Heritage House',
    description: 'Casa histórica restaurada de frente para o Quadrado em Trancoso. Design rústico-chique de alta qualidade, varanda nos fundos com jacuzzi com vista para a mata atlântica, mobiliário de artistas locais e total integração com o centro cultural e gastronômico.',
    city: 'Trancoso',
    address: 'Praça São João (Quadrado), s/n, Trancoso, BA',
    pricePerNight: 3200,
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 6,
    latitude: -16.591,
    longitude: -39.092,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Jacuzzi', 'Localização Premium', 'Mobiliário Design', 'Ar Condicionado', 'Serviço de Camareira', 'Café da Manhã Incluso'],
    nearbyAttractions: ['Quadrado de Trancoso', 'Igreja de São João Batista', 'Mirante do Quadrado', 'Praia dos Coqueiros'],
    ownerId: 'owner-carlos'
  },
  {
    id: 'prop-4',
    title: 'Taipe Cliffside Sanctuary',
    description: 'A mais exclusiva mansão sobre as falésias da praia de Taípe, na divisa entre Trancoso e Arraial. Uma obra de arte arquitetônica com piscina de borda infinita de 25 metros, heliponto privativo, vista de 180 graus para o mar azul e serviço completo de concierge.',
    city: 'Arraial d\'ajuda',
    address: 'Estrada Trancoso-Arraial, Km 6 - Praia de Taípe, BA',
    pricePerNight: 7500,
    bedrooms: 5,
    bathrooms: 6,
    maxGuests: 10,
    latitude: -16.531,
    longitude: -39.076,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Piscina Borda Infinita', 'Heliponto', 'Vista de 180 Graus', 'Academia Privativa', 'Sauna', 'Staff Completo', 'Adega Climatizada'],
    nearbyAttractions: ['Praia de Taípe', 'Falésias Vermelhas', 'Clube de Praia Taípe', 'Terravista Golf'],
    ownerId: 'owner-roberto'
  }
];

const DEFAULT_COMPANY: CompanyConfig = {
  name: 'InmobAI',
  logo: 'https://raw.githubusercontent.com/google/material-design-icons/master/png/action/home/white_24dp.png',
  primaryColor: '#111827',
  email: 'contato@inmobai.com.br',
  phone: '+55 (73) 99981-2026',
  address: 'Quadrado Histórico, 10 - Trancoso, Porto Seguro - BA',
  agentName: 'Maysa',
  agentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  agentInstruction: 'Você é Maysa, a Concierge Virtual Inteligente da imobiliária de alto padrão InmobAI, que opera em Trancoso e Arraial d\'ajuda, Bahia. Você fala português e espanhol com extrema simpatia baiana, educação e profissionalismo. DIRETRIZ CRÍTICA CRUCIAL: NÃO passe opções ou IDs de imóveis logo no início da conversa ou de forma apressada! Você DEVE agir como uma verdadeira concierge de hotel 5 estrelas: faça perguntas incrementais, gentis e naturais (uma ou duas por vez) para descobrir as reais necessidades do cliente antes de recomendar imóveis. Pergunte ativamente o que ele busca, se tem filhos/crianças, se quer ficar perto da praia (pé na areia), se virá de carro/auto, quantas pessoas são, as datas da estadia e o orçamento. Só recomende imóveis depois de entender o perfil do hóspede!'
};

const DEFAULT_SELLERS = [
  { id: 'seller-1', name: 'Gabriel Alencar', email: 'gabriel@inmobai.com', phone: '+55 73 99812-3401', activeLeadsCount: 3 },
  { id: 'seller-2', name: 'Juliana Costa', email: 'juliana@inmobai.com', phone: '+55 73 99812-3402', activeLeadsCount: 5 }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Mariano Gonzalez', email: 'marianoez.gonzalez@gmail.com', phone: '+54 9 11 5432-1098', lgpdConsent: true, lgpdTimestamp: '2026-08-07T11:00:00Z', createdAt: '2026-08-07T11:00:00Z' },
  { id: 'cust-2', name: 'Ana Beatriz Souza', email: 'anabeatriz@terra.com.br', phone: '+55 11 98877-6655', lgpdConsent: true, lgpdTimestamp: '2026-08-06T15:30:00Z', createdAt: '2026-08-06T15:30:00Z' }
];

const DEFAULT_OPPORTUNITIES: Opportunity[] = [
  { id: 'opp-1', customerId: 'cust-1', customerName: 'Mariano Gonzalez', propertyId: 'prop-1', propertyName: 'Villa Trancoso Paradise', estimatedValue: 31500, stage: 'Qualification', assignedSellerId: 'seller-1', updatedAt: '2026-08-07T11:15:00Z' },
  { id: 'opp-2', customerId: 'cust-2', customerName: 'Ana Beatriz Souza', propertyId: 'prop-3', propertyName: 'Quadrado Heritage House', estimatedValue: 22400, stage: 'Discovery', assignedSellerId: 'seller-2', updatedAt: '2026-08-06T16:00:00Z' }
];

const DEFAULT_INFERENCES: CustomerInference[] = [
  { id: 'inf-1', customerId: 'cust-1', attribute: 'communication_style', value: 'breve_e_direto', confidence: 0.82, evidence: 'Solicitou respostas curtas em três interações.', updatedAt: '2026-08-07T11:10:00Z' },
  { id: 'inf-2', customerId: 'cust-1', attribute: 'budget', value: 'alto_padrao', confidence: 0.95, evidence: 'Mostrou preferência direta por vilas acima de R$ 4.000/noite.', updatedAt: '2026-08-07T11:12:00Z' },
  { id: 'inf-3', customerId: 'cust-1', attribute: 'urgency', value: 'alta', confidence: 0.78, evidence: 'Indagou sobre datas concorridas de final de ano.', updatedAt: '2026-08-07T11:13:00Z' }
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    propertyId: 'prop-1',
    propertyName: 'Villa Trancoso Paradise',
    customerId: 'cust-1',
    customerName: 'Mariano Gonzalez',
    startDate: '2026-09-10',
    endDate: '2026-09-17',
    totalPrice: 31500,
    status: 'confirmed',
    staffAssigned: { cleaner: 'Dona Maria de Trancoso', chef: 'Chef Bahia de Jesus', concierge: 'Gabriel Alencar' },
    createdAt: '2026-08-07T11:30:00Z'
  }
];

const DEFAULT_TASKS: ConciergeTask[] = [
  { id: 'task-1', bookingId: 'book-1', propertyName: 'Villa Trancoso Paradise', customerName: 'Mariano Gonzalez', taskName: 'Bebidas de Boas-Vindas e Água de Coco', assignedTo: 'Gabriel Alencar', date: '2026-09-10', status: 'pending', notes: 'Servir frescas logo na entrada dos hóspedes.' },
  { id: 'task-2', bookingId: 'book-1', propertyName: 'Villa Trancoso Paradise', customerName: 'Mariano Gonzalez', taskName: 'Limpeza Profunda Pré-Checkin', assignedTo: 'Dona Maria de Trancoso', date: '2026-09-09', status: 'completed', notes: 'Garantir troca de enxoval de linho puro.' },
  { id: 'task-3', bookingId: 'book-1', propertyName: 'Villa Trancoso Paradise', customerName: 'Mariano Gonzalez', taskName: 'Abastecimento da Despensa (Lista Gourmet)', assignedTo: 'Chef Bahia de Jesus', date: '2026-09-10', status: 'pending', notes: 'Comprar frutos do mar frescos na peixaria local.' }
];

// Local Storage Fallback Layer (To ensure flawless demo even with firestore indexing or latency)
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(`inmobdb_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalStorageData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`inmobdb_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving localstorage', e);
  }
};

// Helper: Execute Firestore call with fast timeout fallback to local storage
const withTimeout = async <T>(promise: Promise<T>, fallback: T, ms = 1200): Promise<T> => {
  let timer: any;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const res = await Promise.race([promise, timeout]);
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return fallback;
  }
};

// Initialize Database Collections helper with fast non-blocking timeout
export const initializeDatabase = async () => {
  // Always ensure LocalStorage has complete mock data immediately
  if (!localStorage.getItem('inmobdb_properties')) {
    setLocalStorageData('properties', DEFAULT_PROPERTIES);
    setLocalStorageData('company', DEFAULT_COMPANY);
    setLocalStorageData('sellers', DEFAULT_SELLERS);
    setLocalStorageData('customers', DEFAULT_CUSTOMERS);
    setLocalStorageData('opportunities', DEFAULT_OPPORTUNITIES);
    setLocalStorageData('inferences', DEFAULT_INFERENCES);
    setLocalStorageData('bookings', DEFAULT_BOOKINGS);
    setLocalStorageData('tasks', DEFAULT_TASKS);
  }

  try {
    const companyDocRef = doc(db, 'companies', 'inmobai');
    await withTimeout(getDoc(companyDocRef), null, 1000);
  } catch (error) {
    console.warn('Firestore initialization skipped, using instant local cache.');
  }
};

// API Client Wrapper to sync Firestore and LocalStorage safely
export const inmobDb = {
  // Config
  getCompany: async (): Promise<CompanyConfig> => {
    const local = getLocalStorageData('company', DEFAULT_COMPANY);
    try {
      const snap = await withTimeout(getDoc(doc(db, 'companies', 'inmobai')), null, 1000);
      if (snap && snap.exists()) return snap.data() as CompanyConfig;
    } catch {}
    return local;
  },
  saveCompany: async (config: CompanyConfig): Promise<void> => {
    try {
      await setDoc(doc(db, 'companies', 'inmobai'), config);
    } catch {}
    setLocalStorageData('company', config);
  },

  // Properties
  getProperties: async (): Promise<Property[]> => {
    try {
      const snap = await getDocs(collection(db, 'properties'));
      const list = snap.docs.map(d => d.data() as Property);
      if (list.length > 0) return list;
    } catch {}
    return getLocalStorageData('properties', DEFAULT_PROPERTIES);
  },
  saveProperty: async (property: Property): Promise<void> => {
    try {
      await setDoc(doc(db, 'properties', property.id), property);
    } catch {}
    const props = getLocalStorageData('properties', DEFAULT_PROPERTIES);
    const index = props.findIndex(p => p.id === property.id);
    if (index >= 0) props[index] = property;
    else props.push(property);
    setLocalStorageData('properties', props);
  },
  deleteProperty: async (id: string): Promise<void> => {
    const props = getLocalStorageData('properties', DEFAULT_PROPERTIES);
    const filtered = props.filter(p => p.id !== id);
    setLocalStorageData('properties', filtered);
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const snap = await getDocs(collection(db, 'customers'));
      const list = snap.docs.map(d => d.data() as Customer);
      if (list.length > 0) return list;
    } catch {}
    return getLocalStorageData('customers', DEFAULT_CUSTOMERS);
  },
  addCustomer: async (customer: Customer): Promise<void> => {
    try {
      await setDoc(doc(db, 'customers', customer.id), customer);
    } catch {}
    const list = getLocalStorageData('customers', DEFAULT_CUSTOMERS);
    if (!list.some(c => c.id === customer.id)) {
      list.push(customer);
      setLocalStorageData('customers', list);
    }
  },

  // Opportunities
  getOpportunities: async (): Promise<Opportunity[]> => {
    try {
      const snap = await getDocs(collection(db, 'opportunities'));
      const list = snap.docs.map(d => d.data() as Opportunity);
      if (list.length > 0) return list;
    } catch {}
    return getLocalStorageData('opportunities', DEFAULT_OPPORTUNITIES);
  },
  saveOpportunity: async (opp: Opportunity): Promise<void> => {
    try {
      await setDoc(doc(db, 'opportunities', opp.id), opp);
    } catch {}
    const list = getLocalStorageData('opportunities', DEFAULT_OPPORTUNITIES);
    const index = list.findIndex(o => o.id === opp.id);
    if (index >= 0) list[index] = opp;
    else list.push(opp);
    setLocalStorageData('opportunities', list);
  },

  // Inferences
  getInferences: async (customerId?: string): Promise<CustomerInference[]> => {
    try {
      const snap = await getDocs(collection(db, 'customer_inferences'));
      const list = snap.docs.map(d => d.data() as CustomerInference);
      if (list.length > 0) {
        return customerId ? list.filter(i => i.customerId === customerId) : list;
      }
    } catch {}
    const local = getLocalStorageData('inferences', DEFAULT_INFERENCES);
    return customerId ? local.filter(i => i.customerId === customerId) : local;
  },
  addInference: async (inf: CustomerInference): Promise<void> => {
    try {
      await setDoc(doc(db, 'customer_inferences', inf.id), inf);
    } catch {}
    const list = getLocalStorageData('inferences', DEFAULT_INFERENCES);
    const idx = list.findIndex(i => i.customerId === inf.customerId && i.attribute === inf.attribute);
    if (idx >= 0) list[idx] = inf;
    else list.push(inf);
    setLocalStorageData('inferences', list);
  },

  // Bookings
  getBookings: async (): Promise<Booking[]> => {
    try {
      const snap = await getDocs(collection(db, 'bookings'));
      const list = snap.docs.map(d => d.data() as Booking);
      if (list.length > 0) return list;
    } catch {}
    return getLocalStorageData('bookings', DEFAULT_BOOKINGS);
  },
  addBooking: async (booking: Booking): Promise<void> => {
    try {
      await setDoc(doc(db, 'bookings', booking.id), booking);
    } catch {}
    const list = getLocalStorageData('bookings', DEFAULT_BOOKINGS);
    list.push(booking);
    setLocalStorageData('bookings', list);
  },
  updateBooking: async (booking: Booking): Promise<void> => {
    try {
      await setDoc(doc(db, 'bookings', booking.id), booking);
    } catch {}
    const list = getLocalStorageData('bookings', DEFAULT_BOOKINGS);
    const idx = list.findIndex(b => b.id === booking.id);
    if (idx >= 0) list[idx] = booking;
    setLocalStorageData('bookings', list);
  },

  // Concierge Tasks
  getTasks: async (): Promise<ConciergeTask[]> => {
    try {
      const snap = await getDocs(collection(db, 'tasks'));
      const list = snap.docs.map(d => d.data() as ConciergeTask);
      if (list.length > 0) return list;
    } catch {}
    return getLocalStorageData('tasks', DEFAULT_TASKS);
  },
  saveTask: async (task: ConciergeTask): Promise<void> => {
    try {
      await setDoc(doc(db, 'tasks', task.id), task);
    } catch {}
    const list = getLocalStorageData('tasks', DEFAULT_TASKS);
    const idx = list.findIndex(t => t.id === task.id);
    if (idx >= 0) list[idx] = task;
    else list.push(task);
    setLocalStorageData('tasks', list);
  },

  // Staff (Sellers, Cleaners, domestic staff)
  getSellers: async (): Promise<Seller[]> => {
    try {
      const snap = await getDocs(collection(db, 'staff'));
      const list = snap.docs.map(d => d.data() as Seller);
      if (list.length > 0) return list;
    } catch {}
    return getLocalStorageData('sellers', DEFAULT_SELLERS);
  },

  // Memory & Profile auto-updater
  updateCustomerMemory: async (customerId: string, extractedProfile: Partial<Customer>): Promise<Customer | null> => {
    try {
      const customers = await inmobDb.getCustomers();
      const targetIdx = customers.findIndex(c => c.id === customerId);
      if (targetIdx >= 0) {
        const updated = {
          ...customers[targetIdx],
          ...extractedProfile,
          // preserve ID and basic identity if not overwritten
          id: customerId
        };
        customers[targetIdx] = updated;
        try {
          await setDoc(doc(db, 'customers', customerId), updated, { merge: true });
        } catch {}
        setLocalStorageData('customers', customers);
        return updated;
      }
    } catch (e) {
      console.warn('Error updating customer memory:', e);
    }
    return null;
  },

  // Owner Payouts (Pix Transfers to Property Owners)
  getPayouts: async (ownerId?: string): Promise<OwnerPayout[]> => {
    const defaultPayouts: OwnerPayout[] = [
      {
        id: 'pay-1',
        ownerId: 'owner-joao',
        ownerName: 'João Carlos de Alencar',
        propertyName: 'Villa Trancoso Paradise',
        amount: 28350, // 90% of booking after 10% agency fee
        pixKey: 'joao.alencar@trancosomail.com',
        status: 'transferred',
        date: '2026-08-07T10:00:00Z',
        receiptUrl: 'pix-rec-98213791.pdf'
      },
      {
        id: 'pay-2',
        ownerId: 'owner-maria',
        ownerName: 'Maria Silva & Silva',
        propertyName: 'Arraial Ocean Breeze Loft',
        amount: 11340,
        pixKey: '73999881122',
        status: 'transferred',
        date: '2026-08-05T14:30:00Z',
        receiptUrl: 'pix-rec-98213790.pdf'
      }
    ];
    try {
      const snap = await getDocs(collection(db, 'payouts'));
      const list = snap.docs.map(d => d.data() as OwnerPayout);
      if (list.length > 0) {
        return ownerId ? list.filter(p => p.ownerId === ownerId) : list;
      }
    } catch {}
    const local = getLocalStorageData('payouts', defaultPayouts);
    return ownerId ? local.filter(p => p.ownerId === ownerId) : local;
  },
  savePayout: async (payout: OwnerPayout): Promise<void> => {
    try {
      await setDoc(doc(db, 'payouts', payout.id), payout);
    } catch {}
    const payouts = getLocalStorageData('payouts', []);
    payouts.push(payout);
    setLocalStorageData('payouts', payouts);
  },

  // Conversations
  getConversations: async (): Promise<Conversation[]> => {
    return getLocalStorageData('conversations_meta', [
      { id: 'conv-1', customerId: 'cust-1', customerName: 'Mariano Gonzalez', status: 'active', lastMessageAt: new Date().toISOString(), summary: 'Interesado en Villa Trancoso Paradise para septiembre. Presupuesto alto.' }
    ]);
  },
  addConversation: async (conv: Conversation): Promise<void> => {
    const list = getLocalStorageData('conversations_meta', [] as Conversation[]);
    const idx = list.findIndex(c => c.id === conv.id);
    if (idx >= 0) list[idx] = conv;
    else list.push(conv);
    setLocalStorageData('conversations_meta', list);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const allMessages = getLocalStorageData('messages_all', [] as Message[]);
    return allMessages.filter(m => m.conversationId === conversationId);
  },
  addMessage: async (msg: Message): Promise<void> => {
    const allMessages = getLocalStorageData('messages_all', [] as Message[]);
    allMessages.push(msg);
    setLocalStorageData('messages_all', allMessages);
  }
};
