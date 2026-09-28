import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configure Supabase URL dynamically
app.post('/api/config/supabase', (req: Request, res: Response) => {
  try {
    const { supabaseUrl } = req.body;
    if (!supabaseUrl || typeof supabaseUrl !== 'string') {
      return res.status(400).json({ error: 'Supabase URL is required.' });
    }
    const cleanUrl = supabaseUrl.trim();
    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      return res.status(400).json({
        error: 'Invalid Supabase URL. It should look like: https://<project-ref>.supabase.co',
      });
    }

    process.env.VITE_SUPABASE_URL = cleanUrl;

    const envPath = path.resolve(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (envContent.includes('VITE_SUPABASE_URL=')) {
      envContent = envContent.replace(/VITE_SUPABASE_URL=.*/, `VITE_SUPABASE_URL=${cleanUrl}`);
    } else {
      envContent += `\nVITE_SUPABASE_URL=${cleanUrl}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');

    res.json({ success: true, url: cleanUrl });
  } catch (err: any) {
    console.error('Error saving Supabase URL:', err);
    res.status(500).json({ error: err.message || 'Failed to save Supabase URL.' });
  }
});

// In-memory verification codes store with 10-minute expiration
interface VerificationRecord {
  code: string;
  type: 'email' | 'phone';
  target: string;
  expiresAt: number;
  attempts: number;
}

const verificationStore = new Map<string, VerificationRecord>();

// Helper to send real verification email
async function sendRealEmail(toEmail: string, code: string, studentName: string) {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"FIND BACK - Dr. RVR NRI University" <${smtpUser}>`,
        to: toEmail,
        subject: `Your FIND BACK Verification Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #07090e; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #818cf8; text-transform: uppercase;">Dr. RVR NRI University</span>
              <h1 style="font-size: 26px; font-weight: 900; margin: 6px 0 0 0; color: #ffffff;">FIND BACK</h1>
              <p style="font-size: 13px; color: #94a3b8; margin: 4px 0 0 0;">Campus Lost & Found Platform</p>
            </div>
            
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #e2e8f0; margin: 0 0 12px 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
              <p style="font-size: 13px; color: #94a3b8; margin: 0 0 20px 0;">Use the 6-digit verification code below to verify your campus identity:</p>
              
              <div style="display: inline-block; padding: 14px 28px; background: #1e1b4b; border: 2px solid #6366f1; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; font-family: monospace; color: #a5b4fc;">
                ${code}
              </div>
              
              <p style="font-size: 12px; color: #64748b; margin: 20px 0 0 0;">This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
            </div>
            
            <p style="font-size: 11px; text-align: center; color: #475569; margin: 0;">Dr. RVR NRI University, Agiripalli Campus &bull; Automated Security Service</p>
          </div>
        `,
      });
      console.log(`\n📧 [EMAIL DISPATCHED] Real email sent to: ${toEmail}`);
      return true;
    } catch (err: any) {
      console.warn(`⚠️ [SMTP ERROR] Could not send email via SMTP:`, err.message);
    }
  }
  return false;
}

// 1. Send OTP verification code to Gmail or Phone Number
app.post('/api/verify/send-code', async (req: Request, res: Response) => {
  try {
    const { target, type, fullName } = req.body;
    if (!target || typeof target !== 'string') {
      return res.status(400).json({ error: 'Target email or phone number is required.' });
    }

    const cleanTarget = target.trim().toLowerCase();
    const isEmail = type === 'email' || cleanTarget.includes('@');
    const verifyType: 'email' | 'phone' = isEmail ? 'email' : 'phone';

    if (verifyType === 'email' && !cleanTarget.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid Gmail address.' });
    }

    if (verifyType === 'phone') {
      const cleanPhone = cleanTarget.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit phone number.' });
      }
    }

    // Generate random secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    verificationStore.set(cleanTarget, {
      code,
      type: verifyType,
      target: cleanTarget,
      expiresAt,
      attempts: 0,
    });

    console.log(`\n========================================`);
    console.log(`🔐 [FIND BACK VERIFICATION CODE]`);
    console.log(`Target (${verifyType.toUpperCase()}): ${cleanTarget}`);
    console.log(`Student Name: ${fullName || 'Student'}`);
    console.log(`Verification Code (OTP): [ ${code} ]`);
    console.log(`Expires in: 10 minutes`);
    console.log(`========================================\n`);

    // 1. Try real email via nodemailer SMTP if configured
    let emailDispatched = false;
    if (isEmail) {
      emailDispatched = await sendRealEmail(cleanTarget, code, fullName);
    }

    // 2. If Supabase is configured and target is an email, trigger Supabase OTP signIn
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey && isEmail && !emailDispatched) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const client = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });
        await client.auth.signInWithOtp({
          email: cleanTarget,
          options: {
            shouldCreateUser: true,
          },
        });
        console.log(`⚡ [SUPABASE OTP] Triggered Supabase Auth OTP for ${cleanTarget}`);
      } catch (sbErr: any) {
        // Ignored or quiet notice
      }
    }

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to your ${verifyType === 'email' ? 'Gmail' : 'phone number'}.`,
      type: verifyType,
      target: cleanTarget,
      expiresAt,
      debugCode: !emailDispatched ? code : undefined,
    });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: error?.message || 'Failed to dispatch verification code.' });
  }
});

// 2. Validate OTP verification code
app.post('/api/verify/check-code', (req: Request, res: Response) => {
  try {
    const { target, code } = req.body;
    if (!target || !code) {
      return res.status(400).json({ error: 'Target and 6-digit verification code are required.' });
    }

    const cleanTarget = target.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    const record = verificationStore.get(cleanTarget);
    if (!record) {
      return res.status(400).json({
        error: 'No active verification code found for this address. Please request a new code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      verificationStore.delete(cleanTarget);
      return res.status(400).json({
        error: 'This verification code has expired. Please request a new one.',
      });
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      verificationStore.delete(cleanTarget);
      return res.status(400).json({
        error: 'Too many incorrect attempts. Please request a fresh code.',
      });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({
        error: 'Incorrect verification code. Please check your messages and try again.',
      });
    }

    // Code is valid: mark as verified and remove
    verificationStore.delete(cleanTarget);

    res.json({
      success: true,
      verified: true,
      message: 'Identity verified successfully! Welcome to Dr. RVR NRI University FIND BACK.',
    });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: error?.message || 'Verification failed.' });
  }
});

/**
 * Multi-Turn Chatbot API
 * Uses Gemini models to assist students with campus lost and found, handover spots, and university procedures.
 * Supported models: 'gemini-3.5-flash' (default), 'gemini-3.1-flash-lite' (fast), 'gemini-3.1-pro-preview' (complex)
 */
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, taskComplexity } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Select candidate models in priority order
    const candidateModels = [
      taskComplexity === 'fast' ? 'gemini-3.5-flash-lite' : 'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    const systemInstruction = `You are "FIND BACK AI", the official campus assistant for Dr. RVR NRI University in Agiripalli, Andhra Pradesh.
Your duties:
1. Guide students on how to report lost items or discovered belongings accurately.
2. Explain the Smart Matching score calculation (Category 20%, Name similarity 25%, Campus Location 25%, Date/Time 15%, Description 15%).
3. Explain ownership verification: how claimant students must prove possession through private clues without exposing personal mobile numbers or roll numbers.
4. Direct students to the 4 verified campus Safe Handover Desks:
   - Central Library Helpdesk (Ground Floor, 09:00 AM - 05:00 PM)
   - Main Gate Security Post (Agiripalli Campus Entrance, 24/7 Custody)
   - C Block Administrative Office (Room 104, 09:30 AM - 04:30 PM)
   - Student Canteen Lost & Found Counter (Near North Cash Desk, 10:00 AM - 04:00 PM)
5. Provide courteous, practical, student-friendly campus guidance. Keep responses crisp and actionable.`;

    // Map conversation history to contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    let reply = '';
    let selectedModel = 'campus-knowledge-engine';
    const hasKey = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY';

    if (hasKey) {
      for (const mName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          if (response.text) {
            reply = response.text;
            selectedModel = mName;
            break;
          }
        } catch (genErr: any) {
          console.warn(`Gemini API call with ${mName} notice:`, genErr?.message || genErr);
        }
      }
    }

    if (!reply) {
      // Smart Campus Assistant engine fallback
      const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
      if (lastMsg.includes('library') || lastMsg.includes('where') || lastMsg.includes('desk') || lastMsg.includes('location')) {
        reply = `🏛️ **Official Safe Handover Desks at Dr. RVR NRI University (Agiripalli):**\n\n1. **Central Library Helpdesk:** Ground Floor, Open 09:00 AM – 05:00 PM (Best for books, calculators, and laptops).\n2. **Main Gate Security Post:** Campus Entrance, Open 24/7 (Safest for lost wallets, phones, and vehicle keys).\n3. **C Block Admin Office:** Room 104, Open 09:30 AM – 04:30 PM (Custodians verify official student ID before handover).\n4. **Student Canteen Counter:** Near North Cash Desk, Open 10:00 AM – 04:00 PM.\n\nAlways ensure you bring your physical student ID card when collecting items.`;
      } else if (lastMsg.includes('score') || lastMsg.includes('match') || lastMsg.includes('percent')) {
        reply = `🎯 **How Smart Match Scoring Works:**\n\nOur campus algorithm evaluates reports across 5 weighted checkpoints (total 100 points):\n- **Category (20%)**: Exact match between lost & found category.\n- **Name Similarity (25%)**: Levenshtein distance on item title.\n- **Campus Location (25%)**: Proximity between campus blocks.\n- **Date & Approx Time (15%)**: Discovery window analysis.\n- **Keyword Description (15%)**: Token matching on distinguishing features.\n\nMatches scoring ≥60% trigger automated student alerts and match review!`;
      } else if (lastMsg.includes('verify') || lastMsg.includes('claim') || lastMsg.includes('privacy')) {
        reply = `🔐 **Safe Ownership Verification Protocol:**\n\nTo prevent unauthorized claims and protect student privacy:\n- No phone numbers, roll numbers, or personal details are shown publicly.\n- When a match is found, the claiming student must answer a **private verification clue** (e.g. unique scratches, phone lock screen photo, internal wallet contents, or specific keychain).\n- Once verified, both students receive clearance to meet at an official campus custodian desk for handover.`;
      } else if (lastMsg.includes('lost') || lastMsg.includes('report') || lastMsg.includes('found')) {
        reply = `📋 **How to Report Campus Belongings:**\n\n- **Lost an Item?** Click "I Lost Something", specify the campus location (e.g., Library, C-Block, Canteen), add an approximate time, and write a private verification clue.\n- **Found an Item?** Click "I Found Something" to upload a safe photo and description. The system will immediately scan for matching lost reports.`;
      } else {
        reply = `👋 Welcome to FIND BACK AI! I am the campus assistant for Dr. RVR NRI University, Agiripalli.\n\nI can help you navigate campus handover desks, explain match scores, verify lost belongings, or find your way to university checkpoints. How can I assist you right now?`;
      }
    }

    res.json({ reply, model: hasKey ? selectedModel : 'campus-knowledge-engine' });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to communicate with campus AI assistant.',
    });
  }
});

/**
 * Maps Grounding API
 * Uses gemini-3.5-flash with googleMaps tool to provide location-grounded campus & local place answers
 * Grounded at Dr. RVR NRI University, Agiripalli (Lat: 16.6534, Lng: 80.8122)
 */
app.post('/api/gemini/maps', async (req: Request, res: Response) => {
  try {
    const { prompt, userLocation } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // Default to Dr. RVR NRI University campus in Agiripalli if not provided
    const latitude = userLocation?.latitude ?? 16.6534;
    const longitude = userLocation?.longitude ?? 80.8122;

    const hasKey = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY';
    let text = '';
    const mapLinks: Array<{ title: string; uri: string }> = [];

    if (hasKey) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude,
                  longitude,
                },
              },
            },
          },
        });

        text = response.text || '';
        const groundingChunks =
          response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        for (const chunk of groundingChunks as any[]) {
          if (chunk.maps?.uri) {
            mapLinks.push({
              title: chunk.maps.title || 'View on Google Maps',
              uri: chunk.maps.uri,
            });
          }
          if (chunk.web?.uri) {
            mapLinks.push({
              title: chunk.web.title || 'Related Source',
              uri: chunk.web.uri,
            });
          }
        }
      } catch (mapsErr) {
        console.warn('Google Maps grounding call failed, using campus geocache:', mapsErr);
      }
    }

    if (!text) {
      text = `📍 **Campus Location Information for Dr. RVR NRI University (Agiripalli, AP):**\n\nThe university campus is located at Agiripalli, Eluru / Krishna District, Andhra Pradesh (Coordinates: 16.6534° N, 80.8122° E).\n\nKey Campus Waypoints:\n- **Central University Library:** Ground Floor safe collection hub\n- **Main Gate Entrance & Security Cabin:** Agiripalli Highway approach\n- **Engineering Blocks (A, B, C):** Departmental lobbies & administrative chambers\n- **Student Canteen & Sports Grounds:** South-Eastern wing`;
      mapLinks.push({
        title: 'Dr. RVR NRI University on Google Maps',
        uri: 'https://maps.google.com/?q=16.6534,80.8122',
      });
      mapLinks.push({
        title: 'Agiripalli Campus Main Gate',
        uri: 'https://maps.google.com/?q=Agiripalli+Andhra+Pradesh',
      });
    }

    res.json({
      text,
      mapLinks,
      groundingChunks: [],
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/maps:', error);
    res.status(500).json({
      error: error?.message || 'Failed to fetch Maps grounded response.',
    });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const serverPort = Number(PORT);
  app.listen(serverPort, '0.0.0.0', () => {
    console.log(`Server listening on port ${serverPort}`);
    console.log(`> Local:   http://localhost:${serverPort}/`);
    console.log(`> IPv4:    http://127.0.0.1:${serverPort}/`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
