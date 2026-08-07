/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Property } from '../types';
import { MapPin, Sparkles, Navigation, Globe } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapsViewProps {
  properties: Property[];
  selectedProperty: Property | null;
  setSelectedProperty: (p: Property | null) => void;
  groundedAttractions?: Array<{
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    localTip?: string;
  }>;
}

export default function MapsView({ 
  properties, 
  selectedProperty, 
  setSelectedProperty,
  groundedAttractions = []
}: MapsViewProps) {
  
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [activeAttraction, setActiveAttraction] = useState<any | null>(null);

  // Center around Trancoso / Arraial d'ajuda region
  const defaultCenter = { lat: -16.535, lng: -39.080 };

  if (!hasValidKey) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 text-center flex flex-col justify-center items-center h-[500px]">
        <div className="w-16 h-16 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
          <Globe className="w-8 h-8 text-[#0EA5E9]" />
        </div>
        <h3 className="text-lg font-bold text-[#111827] mb-2">Google Maps Ativo</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          Para ver a localização exata das vilas em Trancoso & Arraial d'ajuda em um mapa interativo real, adicione sua chave de API do Google Maps.
        </p>
        
        <div className="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-600 border border-slate-200 w-full max-w-md space-y-3 mb-6">
          <p><strong>Como Configurar:</strong></p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Consiga uma chave no <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-[#0EA5E9] font-semibold underline">Google Cloud Console</a></li>
            <li>Abra as <strong>Configurações</strong> da AI Studio (ícone de engrenagem ⚙️ no canto superior direito)</li>
            <li>Adicione em <strong>Secrets</strong>: nome <code>GOOGLE_MAPS_PLATFORM_KEY</code> e cole sua chave.</li>
          </ol>
        </div>
        
        {/* Visual Mock Map representation */}
        <div className="text-xs text-slate-400 italic">
          *A aplicação simula geolocalização e exibe as coordenadas nas fichas técnicas por enquanto.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 flex flex-col h-[550px] relative">
      <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#10B981]" />
          <h3 className="font-bold text-sm text-[#111827]">Geolocalização Interativa (Bahia)</h3>
        </div>
        {groundedAttractions.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{groundedAttractions.length} Atrações por Grounding IA</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={selectedProperty ? { lat: selectedProperty.latitude, lng: selectedProperty.longitude } : defaultCenter}
            defaultZoom={selectedProperty ? 14 : 11}
            mapId="INMOBAI_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Properties Pins */}
            {properties.map((prop) => (
              <AdvancedMarker 
                key={prop.id}
                position={{ lat: prop.latitude, lng: prop.longitude }}
                onClick={() => {
                  setSelectedProperty(prop);
                  setActiveMarkerId(prop.id);
                  setActiveAttraction(null);
                }}
              >
                <Pin 
                  background={selectedProperty?.id === prop.id ? '#10B981' : '#111827'}
                  borderColor="#fff" 
                  glyphColor="#fff" 
                />
              </AdvancedMarker>
            ))}

            {/* Inferred Grounding Attractions Pins */}
            {groundedAttractions.map((att, idx) => (
              <AdvancedMarker
                key={`att-${idx}`}
                position={{ lat: att.latitude, lng: att.longitude }}
                onClick={() => {
                  setActiveAttraction(att);
                  setActiveMarkerId(null);
                }}
              >
                <Pin 
                  background="#0EA5E9" 
                  borderColor="#fff"
                  glyphColor="#fff"
                />
              </AdvancedMarker>
            ))}

            {/* Property Details Popup */}
            {selectedProperty && activeMarkerId === selectedProperty.id && (
              <InfoWindow 
                position={{ lat: selectedProperty.latitude, lng: selectedProperty.longitude }}
                onCloseClick={() => {
                  setActiveMarkerId(null);
                }}
              >
                <div className="p-1 max-w-[200px]">
                  <img 
                    src={selectedProperty.image} 
                    alt={selectedProperty.title} 
                    className="w-full h-24 object-cover rounded-lg mb-2" 
                    referrerPolicy="no-referrer"
                  />
                  <h4 className="font-bold text-xs text-slate-900 leading-tight mb-1">{selectedProperty.title}</h4>
                  <p className="text-[10px] text-slate-500 mb-1">{selectedProperty.city}</p>
                  <p className="text-xs font-bold text-[#10B981]">R$ {selectedProperty.pricePerNight} / noite</p>
                </div>
              </InfoWindow>
            )}

            {/* Attraction Details Popup */}
            {activeAttraction && (
              <InfoWindow
                position={{ lat: activeAttraction.latitude, lng: activeAttraction.longitude }}
                onCloseClick={() => setActiveAttraction(null)}
              >
                <div className="p-2 max-w-[220px]">
                  <div className="flex items-center gap-1.5 text-[#0EA5E9] mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Ponto Grounding IA</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-tight mb-1">{activeAttraction.name}</h4>
                  <p className="text-[10px] text-slate-600 leading-normal mb-1.5">{activeAttraction.description}</p>
                  {activeAttraction.localTip && (
                    <div className="bg-slate-50 p-1.5 rounded text-[10px] text-slate-700 border-l-2 border-[#0EA5E9]">
                      <strong>Dica Maysa:</strong> {activeAttraction.localTip}
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
