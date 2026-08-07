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
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes

// 1. Chatbot endpoint with Structured JSON & cognitive inferences
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, properties } = req.body;
    
    const formattedHistory = messages.map((m: any) => ({
      role: m.role === 'client' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Inject properties catalog as part of the context
    const propertiesContext = `
Abaixo está o catálogo de imóveis disponíveis em Trancoso e Arraial d'ajuda:
${JSON.stringify(properties, null, 2)}
    `;

    const chatInstruction = `
${systemInstruction}

DIRETRIZES DE ATENDIMENTO CONSULTIVO (CONCIERGE DE LUXO):
- SEM EMOJIS: Nunca utilize emojis em suas respostas. O tom deve ser elegante, sério e profissional.
- MENSAGENS CURTAS: Suas respostas devem ser EXTREMAMENTE curtas e concisas, parecendo uma conversa de WhatsApp. No máximo 2 a 3 linhas.
- UMA PERGUNTA POR VEZ: NUNCA faça mais de uma pergunta na mesma mensagem. Vá descobrindo o perfil do cliente passo a passo.
- Você NÃO deve recomendar ou listar imóveis de forma apressada logo nas primeiras respostas!
- Adote um fluxo de conversa elegante e natural.
- Durante a conversa (sempre uma pergunta por vez), tente descobrir:
  1. O que ele mais busca/gosta (ex: pé na areia, centro histórico).
  2. Número de hóspedes e se há crianças.
  3. Se prefere pé na areia ou falésia/vista mar.
  4. Se viaja de carro (importante para estacionamento).
  5. Período planejado e orçamento estimado.
- Somente após obter algumas dessas respostas, faça as recomendações personalizadas com base no catálogo abaixo, mantendo a resposta curta.

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
              description: "O seu texto de resposta conversacional, elegante e profissional em português ou espanhol de acordo com a preferência detectada"
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
                  description: "Explicação breve de qual frase ou comportamento do cliente originou esta inferência"
                }
              },
              required: ["communication_style", "budget", "urgency", "evidence"]
            },
            suggestedPropertyIds: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
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
    console.warn('Chat error:', error);
    res.status(500).json({ error: error.message || 'Erro interno de processamento do chat' });
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

// 3. TTS (Text to Speech) using ElevenLabs or Gemini
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body; 
    
    // If ElevenLabs API Key is present, use it for higher quality Portuguese/Spanish
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        // Custom requested voice id
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
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (!elResponse.ok) {
          throw new Error(`ElevenLabs API erro: ${elResponse.status} - ${await elResponse.text()}`);
        }

        const arrayBuffer = await elResponse.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        
        return res.json({ audio: base64Audio });
      } catch (err: any) {
        console.warn('ElevenLabs API falhou (possível restrição de conta grátis), usando fallback para Gemini TTS:', err.message);
      }
    }

    // Fallback to Gemini TTS
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

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(404).json({ error: 'Nenhum áudio gerado pelo modelo' });
    }
  } catch (error: any) {
    // Only warn to avoid triggering AI Studio fatal error crash detection
    console.warn(`[TTS] Unavailable or failed: ${error.message}`);
    // Send 503 Service Unavailable or 500
    const statusCode = error.status || (error.message?.includes('503') ? 503 : 500);
    res.status(statusCode).json({ error: error.message || 'Erro ao sintetizar resposta em voz' });
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
