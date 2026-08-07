# Documento de Diseño del Sistema — InmobAI

## 1. Resumen Ejecutivo
**InmobAI** es una plataforma de Concierge de Luxo e Inteligencia Inmobiliaria diseñada para la gestión consultiva de propiedades de alto estándar en **Trancoso** y **Arraial d'Ajuda**. El sistema actúa como un asistente virtual elegante, guiando al cliente de manera progresiva y natural sin abrumarlo, registrando automáticamente inferencias cognitivas en tiempo real.

---

## 2. Especificaciones de Comportamiento Conversacional

### 2.1. Reglas de Atención (Concierge de Lujo)
- **Cero Emojis (`SEM EMOJIS`)**: Prohibición absoluta de emojis en todas las respuestas. El tono debe ser elegante, serio, sobrio y profesional.
- **Mensajes Ultra Cortos**: Respuestas extremadamente concisas (máximo 2 a 3 líneas), adaptadas al ritmo de una conversación natural de WhatsApp.
- **Una Pregunta por Vez**: NUNCA realizar más de una pregunta en el mismo mensaje. La calificación del cliente se realiza paso a paso.
- **Recomendación Progresiva**: No listar ni recomendar propiedades de forma apresurada en los primeros mensajes. Solo sugerir propiedades del catálogo cuando se haya obtenido la información clave necesaria o cuando el cliente lo exija explícitamente.

### 2.2. Flujo de Descubrimiento del Cliente
Durante la interacción conversacional, la IA indaga activamente (una pregunta a la vez) sobre los siguientes puntos:
1. **Preferencias/Estilo**: Qué busca o prioriza (ej. pé na areia, centro histórico del Quadrado, vista al mar, etc.).
2. **Composición del grupo**: Cantidad total de huéspedes y presencia de **hijos o niños**.
3. **Ubicación deseada**: Preferencia por estar pegado a la playa (*pé na areia*) o en acantilado/vista mar (*falésia*).
4. **Logística y Transporte**: Si viaja con **vehículo/auto propio** (clave para estacionamiento) o requiere transfer.
5. **Planificación**: Período estimado de estancia y presupuesto aproximado.

---

## 3. Arquitectura Técnica e IA

### 3.1. Modelo Lingüístico y Motor Cognitivo
- **Modelo LLM**: Google Gemini 3.6 Flash (`gemini-3.6-flash`).
- **Salida Estructurada (JSON Schema)**:
  - `reply`: Respuesta conversacional elegante (sin emojis, máx 2-3 líneas).
  - `inferredAttributes`:
    - `communication_style`: Estilo detectado (ej. *breve_e_direto*, *detallado*, *informal*, *formal*).
    - `budget`: Faixa de precio (ej. *alto_padrao*, *medio*, *economico*).
    - `urgency`: Nivel de urgencia (ej. *alta*, *media*, *baixa*).
    - `evidence`: Explicación concisa de la frase o conducta que justificó la inferencia.
  - `suggestedPropertyIds`: Array de IDs de propiedades recomendadas cuando corresponde.

### 3.2. Motor de Síntesis de Voz (Text-To-Speech)
- **Proveedor Principal**: ElevenLabs API.
- **Voice ID Configurado**: `GDzHdQOi6jjf8zaXhCYD` (Voz personalizada elegida para el proyecto).
- **Manejo de Fallback**: En caso de cuota agotada o restricción de plan gratuito de ElevenLabs (Error HTTP 402), el servidor conmuta automáticamente al motor secundario de TTS de Gemini para garantizar la continuidad operativa sin caídas.

---

## 4. Persistencia e Infraestructura

### 4.1. Base de Datos Cloud (Firebase Firestore)
- **Proyecto Firebase**: `inmobai-504819`
- **Firestore Database ID**: `inmobdb`
- **Dominio de Autenticación**: `inmobai-504819.firebaseapp.com`
- **Bucket de Almacenamiento**: `inmobai-504819.firebasestorage.app`

### 4.2. Control de Versiones y Repositorio
- **Repositorio GitHub**: [https://github.com/Maexgon/InmobAI.git](https://github.com/Maexgon/InmobAI.git)
- **Rama Principal**: `main`

---

## 5. Módulos de la Aplicación Frontend / Backend

1. **Simulador de Chat / Telegram**: Interfaz interactiva donde se prueban las respuestas en tiempo real con reproducción de audio.
2. **Panel Concierge**: Monitor que muestra el perfil inferido del cliente, historial de respuestas y evidencias cognitivas.
3. **Catálogo de Imóveis**: Colección estructurada de casas de lujo en Trancoso y Arraial d'Ajuda con sus fichas técnicas.
4. **CRM Integrado**: Módulo conectado a Firestore para dar seguimiento a los leads, estados de conversación e inferencias acumuladas.
5. **Visor de Mapas**: Mapa interactivo con las ubicaciones y puntos de interés de las propiedades.
