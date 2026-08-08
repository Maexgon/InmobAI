/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom User-Agent
const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || 'AIzaSy_DEMO_KEY';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper: Wrap raw PCM audio into valid RIFF WAV container for browser compatibility
function pcmToWav(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  // RIFF Chunk Descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // "fmt " Subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * numChannels * bitsPerSample) / 8, 28); // ByteRate
  header.writeUInt16LE((numChannels * bitsPerSample) / 8, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);

  // "data" Subchunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// API Routes

// 1. Chatbot endpoint with Structured JSON, Cognitive inferences & Automatic Customer Profile Memory Extraction
app.post('/api/chat', async (req, res) => {
  const { messages = [], systemInstruction, properties, customerProfile } = req.body || {};
  try {
    const formattedHistory = messages.map((m: any) => ({
      role: m.role === 'client' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Inject properties catalog & existing customer memory into AI context
    const propertiesContext = `
Abaixo está o catálogo de imóveis disponíveis em Trancoso e Arraial d'ajuda:
${JSON.stringify(properties, null, 2)}

MEMÓRIA ATUAL DO CLIENTE CONHECIDO (SE HOUVER):
${customerProfile ? JSON.stringify(customerProfile, null, 2) : 'Nenhum dado prévio registrado.'}
    `;

    const chatInstruction = `
${systemInstruction}

DIRETRIZES DE ATENDIMENTO CONSULTIVO E EXTRAÇÃO DE MEMÓRIA (CONCIERGE DE LUXO):
- SEM EMOJIS: Nunca utilize emojis em suas respostas. O tom deve ser elegante, sério e profissional.
- MENSAGENS CURTAS: Suas respostas devem ser EXTREMAMENTE curtas e concisas, parecendo uma conversa de WhatsApp (no máximo 2 a 3 linhas).
- UMA PERGUNTA POR VEZ: NUNCA faça mais de uma pergunta na mesma mensagem.
- NÃO PERGUNTE O QUE JÁ SABE: Se a memória do cliente já possui informações (ex: nome, quantidade de pessoas, se tem crianças, pé na areia), NÃO volte a perguntar essas informações!
- EXTRAÇÃO DE DADOS DO CLIENTE: Sempre que o cliente fornecer dados na mensagem (como nome, telefone, email, datas de viagem, número de hóspedes, se tem crianças, orçamento por noite, preferência de localização pé na areia/centro/falésia, se viaja de carro), EXTRAIA essas informações estruturadas no objeto extractedCustomerInfo para salvarmos na base de dados automaticamente!
- Somente após obter os dados essenciais do perfil, faça recomendações personalizadas com base no catálogo fornecido.

${propertiesContext}

Você deve responder rigorosamente no formato JSON especificado.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedHistory.length > 0 ? formattedHistory : [{ role: 'user', parts: [{ text: 'Olá' }] }],
      config: {
        systemInstruction: chatInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Texto de resposta conversacional, elegante e profissional em português ou espanhol"
            },
            extractedCustomerInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                guestsCount: { type: Type.NUMBER },
                hasChildren: { type: Type.BOOLEAN },
                budgetPerNight: { type: Type.NUMBER },
                preferredCity: { type: Type.STRING },
                beachPreference: { type: Type.STRING },
                hasCar: { type: Type.BOOLEAN },
                lgpdConsent: { type: Type.BOOLEAN }
              },
              description: "Dados concretos informados pelo cliente nesta mensagem ou no histórico para atualização no CRM"
            },
            inferredAttributes: {
              type: Type.OBJECT,
              properties: {
                communication_style: {
                  type: Type.STRING,
                  description: "estilo detectado (Ex: breve_e_direto, detalhado, informal, formal)"
                },
                budget: {
                  type: Type.STRING,
                  description: "faixa de preço detectada (Ex: alto_padrao, medio, economico)"
                },
                urgency: {
                  type: Type.STRING,
                  description: "nível de urgência (Ex: alta, media, baixa)"
                },
                evidence: {
                  type: Type.STRING,
                  description: "Explicação breve de qual frase ou comportamento originou esta inferência"
                }
              },
              required: ["communication_style", "budget", "urgency", "evidence"]
            },
            suggestedPropertyIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de IDs dos imóveis sugeridos"
            }
          },
          required: ["reply", "inferredAttributes", "suggestedPropertyIds"]
        }
      }
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('CRITICAL CHAT ERROR:', error);
    console.warn('Chat error (using smart fallback demo response):', error.message);
    
    // Smart offline/demo fallback when no valid API key is present
    const lastUserMsg = messages[messages.length - 1]?.text || '';
    const isBeach = lastUserMsg.toLowerCase().includes('praia') || lastUserMsg.toLowerCase().includes('areia');
    const isArraial = lastUserMsg.toLowerCase().includes('arraial');

    const suggestedId = isArraial ? 'prop-2' : (isBeach ? 'prop-1' : 'prop-3');
    
    res.json({
      reply: `Olá! Compreendi perfeitamente. Em ${isArraial ? "Arraial d'ajuda" : "Trancoso"}, oferecemos casas maravilhosas com mordomia completa. Qual a data exata da sua viagem e quantos hóspedes virão com você?`,
      extractedCustomerInfo: {
        preferredCity: isArraial ? "Arraial d'ajuda" : "Trancoso",
        beachPreference: isBeach ? "pé_na_areia" : "centro"
      },
      inferredAttributes: {
        communication_style: "breve_e_direto",
        budget: "alto_padrao",
        urgency: "media",
        evidence: "Cliente interessado em locação na Bahia."
      },
      suggestedPropertyIds: [suggestedId]
    });
  }
});

// 2. Google Maps Grounding endpoint for real-world attraction searches
app.post('/api/grounding', async (req, res) => {
  try {
    const { query, city } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Procure atrações turísticas, praias, clubes de praia, mercados orgânicos ou restaurantes reais em ${city}, Bahia, Brasil sobre o tema: "${query}". Diga o nome da atração, uma descrição breve de 1 parágrafo, as coordenadas geográficas (latitude e longitude) aproximadas para renderizarmos no mapa, e uma dica local.`,
      config: {
        tools: [{ googleMaps: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              localTip: { type: Type.STRING }
            },
            required: ['name', 'description', 'latitude', 'longitude']
          }
        }
      }
    });

    const result = JSON.parse(response.text || '[]');
    res.json(result);
  } catch (error: any) {
    console.warn('Grounding error:', error);
    res.status(500).json({ error: error.message || 'Erro ao realizar busca de geolocalização' });
  }
});

// 3. TTS (Text to Speech) using ElevenLabs or Gemini with RIFF WAV container wrapper
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body; 
    
    // If ElevenLabs API Key is present, use it for higher quality Portuguese/Spanish
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const voiceId = 'GDzHdQOi6jjf8zaXhCYD';
        const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        });

        if (elResponse.ok) {
          const arrayBuffer = await elResponse.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          return res.json({ audio: base64Audio, format: 'audio/mpeg' });
        }
      } catch (err: any) {
        console.warn('ElevenLabs API falhou, usando Gemini TTS:', err.message);
      }
    }

    // Fallback to Gemini TTS with WAV header creation
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData && inlineData.data) {
      const rawPcmBuffer = Buffer.from(inlineData.data, 'base64');
      // Wrap raw 24kHz 16-bit mono PCM into standard RIFF WAV buffer
      const wavBuffer = pcmToWav(rawPcmBuffer, 24000, 1, 16);
      const base64Wav = wavBuffer.toString('base64');
      res.json({ audio: base64Wav, format: 'audio/wav' });
    } else {
      res.status(404).json({ error: 'Nenhum áudio gerado pelo modelo' });
    }
  } catch (error: any) {
    console.warn(`[TTS] Exception: ${error.message}`);
    res.status(500).json({ error: error.message || 'Erro ao sintetizar resposta em voz' });
  }
});

// 4. Telegram Webhook Endpoint
app.post('/api/telegram-webhook', async (req, res) => {
  try {
    const { update } = req.body;
    console.log('[Telegram Webhook] Recebida mensagem Telegram:', JSON.stringify(update));
    res.json({ ok: true, status: 'processed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. AI Image Generation / Virtual Staging using gemini-3.1-flash-image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [
          {
            text: `High-end luxury real estate photography of: ${prompt}. Cinematic lighting, ultra high definition, beautiful architecture style of Trancoso Bahia rustic-chic luxury.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '16:9',
          imageSize: '1K'
        }
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (imageUrl) {
      res.json({ imageUrl });
    } else {
      res.status(400).json({ error: 'Falha ao processar imagem' });
    }
  } catch (error: any) {
    console.warn('Image Gen error:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar imagem staging virtual' });
  }
});

// 5. Google Workspace Integrations (Calendar, Gmail)
app.post('/api/workspace/calendar', async (req, res) => {
  const token = req.headers.authorization || process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  const { title, description, startDateTime, endDateTime } = req.body;

  console.log(`[Google Calendar API] Criando evento: ${title}`);

  if (token) {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: title,
          description: description,
          start: { dateTime: startDateTime },
          end: { dateTime: endDateTime }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, eventId: data.id, realApi: true });
      }
    } catch (e) {
      console.error('Failed to create real Calendar event', e);
    }
  }

  // Simulated fallback
  res.json({
    success: true,
    eventId: 'simulated-event-' + Math.random().toString(36).substr(2, 9),
    realApi: false,
    message: 'Evento simulado com sucesso (modo de demonstração)'
  });
});

app.post('/api/workspace/gmail', async (req, res) => {
  const token = req.headers.authorization || process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  const { to, subject, body } = req.body;

  console.log(`[Gmail API] Enviando email para: ${to}`);

  if (token) {
    try {
      // Craft simple RFC 2822 raw email
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const emailParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body
      ];
      const email = emailParts.join('\r\n');
      const base64SafeEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64SafeEmail })
      });

      if (response.ok) {
        return res.json({ success: true, realApi: true });
      }
    } catch (e) {
      console.error('Failed to send real email via Gmail', e);
    }
  }

  // Simulated fallback
  res.json({
    success: true,
    realApi: false,
    message: 'E-mail simulado enviado com sucesso (modo de demonstração)'
  });
});

// Vite Middleware for development / Static Serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
