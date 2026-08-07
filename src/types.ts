/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Property {
  id: string;
  title: string;
  description: string;
  city: 'Trancoso' | 'Arraial d\'ajuda';
  address: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  latitude: number;
  longitude: number;
  image: string;
  amenities: string[];
  nearbyAttractions: string[];
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  isAvailable?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lgpdConsent: boolean;
  lgpdTimestamp?: string;
  createdAt: string;
  // Extracted memory fields
  travelDates?: { start: string; end: string };
  guestsCount?: number;
  hasChildren?: boolean;
  budgetPerNight?: number;
  preferredCity?: string;
  beachPreference?: 'pé_na_areia' | 'falésia' | 'centro' | 'qualquer';
  hasCar?: boolean;
}

export interface CustomerInference {
  id: string;
  customerId: string;
  attribute: string; // 'communication_style' | 'budget' | 'urgency' | 'preferences' | 'location_pref'
  value: string;
  confidence: number; // 0 to 1
  evidence: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  status: 'active' | 'archived' | 'escalated';
  lastMessageAt: string;
  summary?: string;
  channel?: 'web' | 'telegram' | 'whatsapp';
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'client' | 'agent' | 'seller';
  text: string;
  audioUrl?: string;
  isAudio?: boolean;
  createdAt: string;
  suggestedProperties?: string[]; // IDs of properties mentioned
}

export interface Opportunity {
  id: string;
  customerId: string;
  customerName: string;
  propertyId?: string;
  propertyName?: string;
  estimatedValue: number;
  stage: 'Discovery' | 'Qualification' | 'Proposal' | 'Reservation' | 'Closed';
  assignedSellerId: string;
  updatedAt: string;
  notes?: string;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  activeLeadsCount: number;
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  customerId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  pixCode?: string;
  pixQrUrl?: string;
  staffAssigned: {
    cleaner?: string;
    chef?: string;
    concierge?: string;
  };
  createdAt: string;
}

export interface OwnerPayout {
  id: string;
  ownerId: string;
  ownerName: string;
  propertyName: string;
  amount: number;
  pixKey: string;
  status: 'transferred' | 'processing';
  date: string;
  receiptUrl?: string;
}

export interface ConciergeTask {
  id: string;
  bookingId: string;
  propertyName: string;
  customerName: string;
  taskName: string;
  assignedTo: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}

export interface CompanyConfig {
  name: string;
  logo: string;
  primaryColor: string;
  email: string;
  phone: string;
  address: string;
  agentName: string;
  agentAvatar: string;
  agentInstruction: string;
  telegramBotToken?: string;
  pixKey?: string;
}

export interface ExtractedCustomerProfile {
  name?: string;
  email?: string;
  phone?: string;
  travelDates?: { start: string; end: string };
  guestsCount?: number;
  hasChildren?: boolean;
  budgetPerNight?: number;
  preferredCity?: 'Trancoso' | 'Arraial d\'ajuda' | 'Ambas';
  beachPreference?: 'pé_na_areia' | 'falésia' | 'centro' | 'qualquer';
  hasCar?: boolean;
  lgpdConsent?: boolean;
}

