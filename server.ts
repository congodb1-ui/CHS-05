import express from 'express';
import http from 'http';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System Instruction for Kool Homes Solitaire CHS Assistant
const SYSTEM_INSTRUCTION = `You are "Solitaire Society AI Assistant", the official resident and managing committee guide for Kool Homes Solitaire Co-operative Housing Society Ltd. (Towers A, B & C) in Baner/Pashan Link Road, Pune.

Key Society Knowledge:
- Society Identity: Kool Homes Solitaire CHS Ltd., Reg. No. PNA/HSG/TC/12492/2018.
- Configuration: Tower A (60 units), Tower B (60 units), and Tower C (60 units in handover preparation).
- Utilities & Timing:
  * Water supply timings: Morning 06:00 AM – 09:00 AM & Evening 06:00 PM – 09:00 PM.
  * In-house STP: Tertiary Moving Bed Biofilm Reactor (MBBR) plant recycling 48,000 L/day for dual toilet flush lines and garden drip irrigation. Flush lines remain pressurized 24/7.
  * 24/7 DG Power: Twin 350 kVA Cummins generators with automated 7-second changeover switch. Supplies lifts, water booster sumps, and 2 emergency points per flat.
- Amenities & Rules:
  * Swimming Pool: 06:00 AM – 10:00 AM & 04:00 PM – 09:00 PM. Closed every Monday for chlorination & deep scrub. Proper nylon/lycra swimwear is strictly compulsory. Max 2 outside guests per flat.
  * Gymnasium: 05:00 AM – 10:00 PM daily. Clean indoor-only sports shoes and personal workout towels mandatory.
  * Clubhouse Banquet & Lawn: 10:00 AM – 03:00 PM & 04:00 PM – 09:30 PM. Music cut-off strictly at 10:00 PM as per Pune Police noise bylaws. ₹5,000 refundable deposit.
- Tenancy & Shifting:
  * Shifting elevator reservation: Strictly permitted between 11:00 AM – 02:00 PM and 02:00 PM – 05:00 PM non-peak hours. Owner NOC and Police verification receipt mandatory.
- Daily Walkthrough & Attendance:
  * Facility Supervisor Parvez completes a 33-point daily checklist across Utilities, Cleaning, Lights/Security, and Renovation.
  * Parvez marks daily attendance for 23 staff (Security guards 1-9, Housekeeping staff, Electrician, Plumber). Verified by Office Admin Soleha Khan.
- Emergency Contacts:
  * Security Main Gate A: +91 20 2748 1101, Gate B: +91 20 2748 1102.
  * Otis 24/7 Elevator Emergency Helpline: 1800 233 6847.
  * Estate Office Manager: +91 98900 12890.

When answering:
1. Provide accurate, polite, and community-centered guidance.
2. If the user asks about Pune civic queries, municipal PMC water supply alerts, local weather/monsoon advisories, emergency numbers, or the Maharashtra Co-operative Societies Act 1960, use Google Search Grounding to provide accurate information and cite references.
3. Keep responses structured with bullet points where helpful.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      return res.json({
        reply: `Hello! I am your Solitaire Society AI Assistant. I can assist with society bye-laws, water supply timings (6-9 AM & 6-9 PM), swimming pool rules (nylon swimwear mandatory, Monday closed), shifting elevator slots (11 AM - 4 PM), or complaint status. (Note: GEMINI_API_KEY is active in this environment).`,
        groundingSources: [],
      });
    }

    // Format history for multi-turn conversation
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    // Append current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const reply = response.text || 'I have noted your society query. Please consult the Estate Office or Managing Committee for further details.';
    
    // Extract search grounding chunks
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || chunk.web.uri,
        uri: chunk.web.uri,
      }));

    res.json({
      reply,
      groundingSources: webSources,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: 'Failed to process AI request',
      details: error.message,
    });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      console.error('[Server] Unhandled server error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Solitaire CHS Portal server running at http://localhost:${PORT}`);
  });
}

startServer();
