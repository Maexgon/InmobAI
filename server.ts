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
const PORT = 3000;

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

DIRETRIZES DE ATENDIMENTO CONSULTIVO E EXTRAÇÃO DE MEMÓRIA (CONCIERGE DE LUXO):
- ESTRUTURA HUMANA DE CONVERSA: Aja de forma empática e muito educada.
  1. Primeiro, inicie SEMPRE cumprimentando a pessoa. Se a memória já tiver o nome dela, cumprimente-a pelo nome.
  2. Pergunte como ela está.
  3. Depois, pergunte como você pode ajudá-la.
- TOM AGRADÁVEL E RESPEITOSO: Seja acolhedor e educado, mantendo a classe de um concierge.
- MENSAGENS CURTAS: Suas respostas devem ser EXTREMAMENTE curtas e diretas, no máximo 2 a 3 linhas por mensagem, como em um chat rápido.
- UMA PERGUNTA POR VEZ: NUNCA faça mais de uma pergunta na mesma mensagem.
- NÃO SEJA ROBÓTICO: Não vá direto oferecer opções de imóveis no primeiro contato sem antes cumprimentar e entender o que a pessoa precisa.
- NÃO PERGUNTE O QUE JÁ SABE: Se a memória do cliente já possui informações (ex: nome, quantidade de pessoas, se tem crianças), NÃO volte a perguntar!
- EXTRAÇÃO DE DADOS DO CLIENTE: Sempre que o cliente fornecer dados na mensagem (como nome, telefone, email, datas, hóspedes, orçamento, localização), EXTRAIA essas informações estruturadas no objeto extractedCustomerInfo para salvarmos na base de dados!
- RECOMENDAÇÃO DE IMÓVEIS (suggestedPropertyIds): Você DEVE retornar um array VAZIO [] em "suggestedPropertyIds" até o momento em que você decidir explicitamente oferecer uma opção da lista. Só preencha este array quando estiver literalmente sugerindo opções na sua mensagem atual.
- Somente após estabelecer a conexão humana e obter os dados essenciais, faça recomendações de imóveis do catálogo e preencha "suggestedPropertyIds".

${propertiesContext}

Você deve responder rigorosamente no formato JSON especificado.
`;

  try {

    console.log(`=== [TRACE 1/4] /api/chat recebido. Mensagens: ${messages.length} ===`);
    console.log('=== [TRACE 2/4] Enviando solicitação para Gemini Primário... ===');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedHistory.length > 0 ? formattedHistory : [{ role: 'user', parts: [{ text: 'Olá' }] }],
      config: {
        tools: [{ googleMaps: {} }],
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

    console.log('=== [TRACE SUCCESS] Resposta gerada com sucesso pelo Gemini Primário! ===');
    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn(`=== [TRACE FALLBACK TRIGGERED] Gemini falhou (Status ${error.status || 'Erro'}). Razão: ${error.message} ===`);
    
    // We try non-Google free models on OpenRouter to avoid upstream Google rate limits
    const candidateModels = [
      'nvidia/nemotron-nano-9b-v2:free',
      'openai/gpt-oss-20b:free',
      'poolside/laguna-s-2.1:free',
      'inclusionai/ling-3.0-tiny:free'
    ];

    let successResponse = null;

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "InmobAI",
      },
      timeout: 10000
    });

    const openRouterMessages = [
      { role: 'system', content: chatInstruction },
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
        });

        const content = orResponse.choices[0]?.message?.content;
        if (content) {
          console.log(`=== [TRACE 4/4 SUCCESS] Resposta obtida com sucesso via ${modelId}! ===`);
          successResponse = JSON.parse(content);
          break;
        }
      } catch (orModelError: any) {
        console.warn(`=== [TRACE MODEL FAIL] Modelo ${modelId} falhou. Erro: ${orModelError.message} ===`);
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
      const base64Audio = Buffer.from(response.audioContent).toString('base64');
      return res.json({ audio: base64Audio, format: 'audio/mpeg' });
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
