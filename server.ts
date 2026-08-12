/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import textToSpeech from '@google-cloud/text-to-speech';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8100;

app.use(express.json());

// Initialize Google Cloud TTS Client (Uses GOOGLE_APPLICATION_CREDENTIALS from .env)
const ttsClient = new textToSpeech.TextToSpeechClient();

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

DIRETRIZES E REGRAS RÍGIDAS DE ATENDIMENTO (CONCIERGE DE LUXO MAYSA):

1. IDIOMA DE ATENDIMENTO (SUPORTE MULTILÍNGUE - PT, ES, EN):
   - Responda SEMPRE no mesmo idioma que o cliente utilizar na mensagem (Português, Espanhol ou Inglês).
   - Se o cliente escrever ou falar em Espanhol (ex: "Hola, busco una casa para alquilar en Trancoso"), responda 100% em Espanhol com tom refinado de Concierge.
   - Se o cliente escrever ou falar em Inglês (ex: "Hello, I'm looking for a beach villa in Trancoso"), responda 100% em Inglês.
   - Se falar em Português, responda em Português.

2. PROIBIÇÕES ABSOLUTAS:
   - NUNCA mencione termos técnicos do sistema, IDs internos como "(ID: prop-1)", nem parênteses de inferência. Fale de forma 100% natural, fluida e humana.
   - NUNCA ofereça serviços que não prestamos (como aluguel de carros, voos ou passagens).
   - NUNCA confirme reservas pelo chat nem finja que a reserva está feita! Para reservar, o cliente DEVE clicar no botão 'Pré-Reservar' na tela.

3. SEQUÊNCIA OBRIGATÓRIA E RÍGIDA DE ATENDIMENTO (FAÇA UMA PERGUNTA POR VEZ E SIGA ESTA ORDEM RÍGIDA NO IDIOMA DO CLIENTE):

   ETAPA 1: SAUDAÇÃO HUMANA E ATENDIMENTO INICIAL
   - Se o cliente já for conhecido (ex: ${customerProfile?.name ? customerProfile.name : 'sem nome prévio'}), cumprimente-o cordialmente pelo nome:
     "Boa tarde, Sr(a). ${customerProfile?.name || 'Cliente'}. Tudo bem, obrigado por perguntar. E o(a) senhor(a), tudo bem?" -> em seguida pergunte: "É um prazer vê-lo(a) novamente. Como posso ajudá-lo(a) hoje?".
   - Se NÃO for conhecido: Cumprimente cordialmente e pergunte o nome/sobrenome. (Apenas 1 pergunta por mensagem).

   ETAPA 2: TIPO DE VIAGEM
   - Pergunte o motivo/tipo de viagem: "Que ótimo! Que tipo de viagem você fará: em família, a negócios ou romântica?"

   ETAPA 3: ACOMPANHANTES E QUANTIDADE DE HÓSPEDES
   - Pergunte com quem viaja e número de pessoas: "Perfeito! Com quem você planeja viajar? Quantas pessoas e haverá crianças?"

   ETAPA 4: DATAS DA VIAGEM
   - Pergunte as datas planejadas: "Excelente! Quando você planeja sua viagem e quais seriam as datas desejadas?"

   ETAPA 5: PREFERÊNCIAS DE LOCALIZAÇÃO E ESTILO
   - Pergunte preferências de praia/estadia: "Você prefere uma vila pé na areia perto da praia ou mais próxima do centro da vila?"

   ETAPA 6: ORÇAMENTO DIÁRIO (ATENÇÃO: PERGUNTAR O ORÇAMENTO SOMENTE AQUI, POR ÚLTIMO!)
   - NUNCA PERGUNTE O ORÇAMENTO NAS ETAPAS ANTERIORES! NUNCA ASSUMA QUE É ALTO OU BAIXO!
   - Pergunta: "Para me ajudar a filtrar a casa ideal, qual seria a sua faixa de orçamento diário por noite aproximadamente, ou prefere que eu apresente opções variadas?"

   ETAPA 7: SUGESTÃO DE IMÓVEIS (suggestedPropertyIds)
   - Mantenha "suggestedPropertyIds" VAZIO [] durante TODAS as etapas anteriores (Etapas 1 a 6).
   - Só apresente casas em suggestedPropertyIds QUANDO AS ETAPAS 1 A 6 ESTIVEREM COMPLETAS. Fale apenas o nome comercial da casa (ex: "Villa Trancoso Paradise").
   - SE NÃO HOUVER DISPONIBILIDADE: Responda: "Que pena. No momento não tenho outra opção disponível, mas quer que anotemos seus dados e entremos em contato novamente caso surja alguma vaga para essas datas?"

3. FORMATO:
   - Respostas EXTREMAMENTE CURTAS (máximo 2 a 3 linhas).
   - Apenas 1 pergunta por mensagem.

${propertiesContext}

Você deve responder rigorosamente no formato JSON especificado.
`;

  try {

    console.log(`=== [TRACE 1/4] /api/chat recebido. Mensagens: ${messages.length} ===`);
    console.log('=== [TRACE 2/4] Enviando solicitação para Gemini Primário... ===');

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
                tripType: { type: Type.STRING },
                travelCompanions: { type: Type.STRING },
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

    console.log('=== [TRACE SUCCESS] Resposta gerada com sucesso pelo Gemini Primário! ===');
    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn(`=== [TRACE FALLBACK TRIGGERED] Gemini falhou (Status ${error.status || 'Erro'}). Razão: ${error.message} ===`);
    
    let successResponse = null;

    // Fallback 1: Try gemini-3.1-flash-lite using the same Gemini SDK
    try {
      console.log('=== [TRACE FALLBACK] Tentando modelo Gemini Alternativo (gemini-1.5-flash)... ===');
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: formattedHistory.length > 0 ? formattedHistory : [{ role: 'user', parts: [{ text: 'Olá' }] }],
        config: {
          systemInstruction: chatInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Texto de resposta conversacional, elegante e profissional em português o espanhol"
              },
              extractedCustomerInfo: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  guestsCount: { type: Type.NUMBER },
                  tripType: { type: Type.STRING },
                  travelCompanions: { type: Type.STRING },
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

      const resultText = fallbackResponse.text || '{}';
      successResponse = JSON.parse(resultText);
      console.log('=== [TRACE FALLBACK SUCCESS] Resposta gerada com sucesso pelo Gemini Alternativo! ===');
    } catch (fallbackGeminiError: any) {
      console.warn(`=== [TRACE FALLBACK FAIL] Gemini Alternativo também falhou: ${fallbackGeminiError.message} ===`);
    }

    // Fallback 2: Try OpenRouter if API key is set
    if (!successResponse && process.env.OPENROUTER_API_KEY) {
      const candidateModels = [
        'nvidia/nemotron-nano-9b-v2:free',
        'openai/gpt-oss-20b:free',
        'poolside/laguna-s-2.1:free',
        'inclusionai/ling-3.0-tiny:free'
      ];

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "InmobAI",
        },
        timeout: 10000
      });

      const conciseProperties = (properties || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        pricePerNight: p.pricePerNight
      }));

    const fallbackInstruction = `Você é Maysa, Concierge de luxo em Trancoso e Arraial d'ajuda.
REGRAS RÍGIDAS DE SEQUÊNCIA E MULTILÍNGUE:
1. IDIOMA: Responda SEMPRE no mesmo idioma do cliente (Espanhol, Inglês ou Português).
2. NUNCA mencione IDs como (ID: prop-1) nem termos técnicos.
3. NUNCA ofereça aluguel de carros ou voos.
4. NUNCA confirme reservas no chat; oriente a clicar no botão 'Pré-Reservar'.
5. SEQUÊNCIA OBRIGATÓRIA DE PERGUNTAS (FAÇA APENAS 1 PERGUNTA POR MENSAGEM NO IDIOMA DO CLIENTE):
   - Passo 1: Saudação ("Boa tarde, Sr. ${customerProfile?.name || ''}... É um prazer vê-lo novamente. Como posso ajudá-lo hoje?").
   - Passo 2: Tipo de viagem (família, negócios ou romântica).
   - Passo 3: Acompanhantes e quantidade de hóspedes/crianças.
   - Passo 4: Datas da viagem.
   - Passo 5: Preferência de localização (pé na areia ou centro).
   - Passo 6: Orçamento diário por noite (SOMENTE PERGUNTAR AQUI POR ÚLTIMO!).
   - Passo 7: Sugerir imóveis (suggestedPropertyIds) APENAS APÓS completar todos os passos de 1 a 6.
5. Se não houver vaga: "Que pena. No momento não tenho outra opção disponível, mas quer que anotemos seus dados e entremos em contato novamente caso surja alguma vaga para essas datas?"
6. Respostas curtas (máximo 2 a 3 linhas).

Retorne JSON:
{
  "reply": "Sua mensagem aqui",
  "extractedCustomerInfo": {},
  "inferredAttributes": { "communication_style": "breve", "budget": "alto_padrao", "urgency": "media", "evidence": "Conversa concierge" },
  "suggestedPropertyIds": []
}
Catálogo: ${JSON.stringify(conciseProperties)}`;

      const openRouterMessages = [
        { role: 'system', content: fallbackInstruction },
        ...messages.map((m: any) => ({
          role: m.role === 'client' ? 'user' : 'assistant',
          content: m.text
        }))
      ];

      for (const modelId of candidateModels) {
        try {
          console.log(`=== [TRACE 3/4] Tentando modelo Fallback OpenRouter: ${modelId}... ===`);
          const orResponse = await openai.chat.completions.create({
            model: modelId,
            messages: openRouterMessages as any,
            response_format: { type: 'json_object' }
          }, { timeout: 3500 });

          let content = orResponse.choices[0]?.message?.content;
          if (content) {
            content = content.trim();
            if (content.startsWith('```')) {
              content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }
            
            const parsed = JSON.parse(content);
            if (parsed && (parsed.reply || parsed.message || parsed.text)) {
              console.log(`=== [TRACE 4/4 SUCCESS] Resposta obtida com sucesso via ${modelId}! ===`);
              successResponse = {
                reply: parsed.reply || parsed.message || parsed.text || 'Olá, como posso ajudar você hoje?',
                extractedCustomerInfo: parsed.extractedCustomerInfo || {},
                inferredAttributes: parsed.inferredAttributes || {
                  communication_style: "breve",
                  budget: "alto_padrao",
                  urgency: "media",
                  evidence: "Conversa com assistente"
                },
                suggestedPropertyIds: Array.isArray(parsed.suggestedPropertyIds) ? parsed.suggestedPropertyIds : []
              };
              break;
            }
          }
        } catch (orModelError: any) {
          console.warn(`=== [TRACE MODEL FAIL] Modelo ${modelId} falhou. Erro: ${orModelError.message} ===`);
        }
      }
    }

    if (successResponse) {
      return res.json(successResponse);
    }

    console.error('=== [TRACE ALL FAIL] Todos os modelos Gemini e OpenRouter falharam. ===');
    
    let fallbackMessage = 'Desculpe, estou enfrentando instabilidades na conexão com a central. Por favor, aguarde um momento e tente novamente.';
    
    if (error.status === 429) {
       fallbackMessage = 'Desculpe, nosso sistema está recebendo muitas requisições no momento. Por favor, aguarde um minuto e tente novamente.';
    } else if (error.status === 400 || error.status === 401) {
       fallbackMessage = 'Desculpe, ocorreu um erro de autenticação interna (Chave de API).';
    }

    res.json({
      reply: fallbackMessage,
      extractedCustomerInfo: {},
      inferredAttributes: {
        communication_style: "indefinido",
        budget: "indefinido",
        urgency: "indefinido",
        evidence: "Erro de sistema/cota"
      },
      suggestedPropertyIds: []
    });
  }
});

// 2. Google Maps Grounding endpoint for real-world attraction searches
app.post('/api/grounding', async (req, res) => {
  try {
    const { query, city } = req.body;
    
    let response;
    try {
      response = await ai.models.generateContent({
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
    } catch (e) {
      console.warn('Grounding 3.6-flash failed, trying 3.1-flash-lite:', e);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
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
    }

    const result = JSON.parse(response.text || '[]');
    res.json(result);
  } catch (error: any) {
    console.warn('Grounding error:', error);
    res.status(500).json({ error: error.message || 'Erro ao realizar busca de geolocalização' });
  }
});

// 3. TTS (Text to Speech) using Google Cloud Text-to-Speech API (Neural2-B pt-BR)
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body; 
    
    const request: any = {
      input: { text },
      voice: { languageCode: 'pt-BR', name: 'pt-BR-Chirp3-HD-Aoede' }, // Voz femenina hiperrealista joven
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    if (response.audioContent) {
      res.set('Content-Type', 'audio/mpeg');
      return res.send(Buffer.from(response.audioContent));
    } else {
      console.warn('Google Cloud TTS API falhou: sem conteudo de audio');
      return res.status(404).json({ error: 'Nenhum provedor de TTS premium disponível no momento' });
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

// Endpoint para envio do formulário de reserva via Nodemailer
app.post('/api/book', async (req, res) => {
  try {
    const { propertyTitle, propertyId, clientName, clientDni, clientEmail, clientPhone, checkIn, checkOut, specialRequests } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465 (SSL), false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Se as credenciais não estiverem configuradas, simular o envio para testes no frontend
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[Nodemailer] SMTP Credentials missing, simulating booking email send.');
      return res.json({ success: true, simulated: true, message: 'Reserva registrada (email simulado devido à falta de credenciais).' });
    }

    const mailOptions = {
      from: `"InmobAI Concierge" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER, // Notificar al admin
      subject: `NOVA RESERVA - ${propertyTitle} - ${clientName}`,
      html: `
        <h2>Nova Solicitação de Reserva</h2>
        <p><strong>Propriedade:</strong> ${propertyTitle} (${propertyId})</p>
        <p><strong>Check-In:</strong> ${checkIn}</p>
        <p><strong>Check-Out:</strong> ${checkOut}</p>
        <hr/>
        <h3>Dados do Hóspede</h3>
        <p><strong>Nome:</strong> ${clientName}</p>
        <p><strong>DNI/Passaporte:</strong> ${clientDni}</p>
        <p><strong>Email:</strong> ${clientEmail}</p>
        <p><strong>Telefone:</strong> ${clientPhone}</p>
        <p><strong>Pedidos Especiais:</strong> ${specialRequests || 'Nenhum'}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Reserva enviada com sucesso!' });
  } catch (error: any) {
    console.error('[Nodemailer] Erro ao enviar email de reserva:', error);
    res.status(500).json({ error: error.message || 'Falha ao enviar reserva' });
  }
});

import fs from 'fs';

// Vite Middleware for development / Static Serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
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
