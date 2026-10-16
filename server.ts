/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';

dotenv.config();

// Helper rule-based fallback extractor in case of 503 / network API outages
function fallbackRuleBasedExtractor(text: string) {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Determine call number
  let callNumber: 1 | 2 | 3 | 4 = 1;
  if (lower.includes('fourth call') || lower.includes('4th call') || lower.includes('call number 4') || lower.includes('call number four') || lower.includes('call 4')) {
    callNumber = 4;
  } else if (lower.includes('third call') || lower.includes('3rd call') || lower.includes('call number 3') || lower.includes('call number three') || lower.includes('call 3')) {
    callNumber = 3;
  } else if (lower.includes('second call') || lower.includes('2nd call') || lower.includes('call number 2') || lower.includes('call number two') || lower.includes('call 2')) {
    callNumber = 2;
  } else {
    callNumber = 1;
  }

  const callStage = `CALL_${callNumber}`;
  const callLabel = `Call ${callNumber} (${callNumber === 1 ? '1st' : callNumber === 2 ? '2nd' : callNumber === 3 ? '3rd' : '4th'} Call)`;

  // 2. Extract company name
  let companyName = '';
  const companyPatterns = [
    /company\s+(?:name\s+)?(?:called|is|named)?\s+([A-Za-z0-9&'\s]+?)(?=\s+(?:they|we|he|she|i\s|director|spoke|and|,|\.|$))/i,
    /(?:call\s+was\s+with|called|with)\s+(?:the\s+)?(?:company\s+)?(?:called\s+)?([A-Za-z0-9&'\s]+?)(?=\s+(?:they|we|he|she|i\s|director|spoke|and|,|\.|$))/i,
    /(?:for|about)\s+([A-Za-z0-9&'\s]+?)(?=\s+(?:they|we|he|she|,|\.|$))/i,
  ];

  for (const pat of companyPatterns) {
    const match = clean.match(pat);
    if (match && match[1] && match[1].trim().length > 1) {
      companyName = match[1].replace(/^(the|a)\s+/i, '').trim();
      break;
    }
  }

  if (!companyName) {
    // Check if starts with something like "Arab Bakery" or "Apex Horizon"
    const cleanedLead = clean.replace(/^(the\s+)?(first|second|third|fourth|1st|2nd|3rd|4th)?\s*call\s*(was\s*)?(with\s*)?(the\s*)?(company\s*)?(name\s*)?(called\s*)?/i, '').trim();
    companyName = cleanedLead.split(/[,.]|\bthey\b|\bwe\b|\bspoke\b|\basked\b/i)[0].slice(0, 35).trim() || 'Untitled Lead';
  }

  // 3. Extract director / contact person
  let directorName = '';
  const dirMatch = clean.match(/(?:director|spoke\s+to|spoke\s+with|talked\s+to|contact|mr\.|ms\.|mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (dirMatch) {
    directorName = dirMatch[1].trim();
  }

  // 4. Extract phone number
  let companyNumber = '';
  const phoneMatch = clean.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    companyNumber = phoneMatch[0].trim();
  }

  // 5. Extract email
  let email = '';
  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    email = emailMatch[0].trim();
  }

  // 6. Extract call note / discussion
  let callNote = clean;
  const discussionMatch = clean.match(/(?:they\s+told|they\s+said|discussed|conversation\s+was|notes?:?)\s*(.*)/i);
  if (discussionMatch && discussionMatch[1]) {
    callNote = discussionMatch[1].trim();
  }

  // 7. Extract Free Website status
  let freeWebsiteStatus: 'Not Asked' | 'To Send Free Website' | 'Free Website Sent' | 'Website Reviewing' | 'Declined / Not Needed' = 'Not Asked';
  if (lower.includes('send a free website') || lower.includes('send free website') || lower.includes('have to send a free website') || lower.includes('need a free website')) {
    freeWebsiteStatus = 'To Send Free Website';
  } else if (lower.includes('sent free website') || lower.includes('website sent')) {
    freeWebsiteStatus = 'Free Website Sent';
  } else if (lower.includes('see and get back') || lower.includes('reviewing website')) {
    freeWebsiteStatus = 'Website Reviewing';
  } else if (lower.includes('not interested in website') || lower.includes('no website needed') || lower.includes('dont need website')) {
    freeWebsiteStatus = 'Declined / Not Needed';
  } else if (callNumber === 1) {
    freeWebsiteStatus = 'Not Asked';
  }

  // 8. Extract follow-up / meeting date, day, time, and type
  let hasNextFollowUp = false;
  let nextFollowUpDate = '';
  let nextFollowUpTime = '';
  let nextFollowUpType = 'None';

  const followUpIndicators = ['follow up', 'follow-up', 'meeting', 'call back', 'see and get back', 'send a free website', 'free website', 'schedule', 'tomorrow', 'next week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  if (followUpIndicators.some((ind) => lower.includes(ind))) {
    hasNextFollowUp = true;
    if (lower.includes('meeting') || lower.includes('demo')) {
      nextFollowUpType = 'Meeting Scheduled';
    } else if (lower.includes('free website') || lower.includes('website')) {
      nextFollowUpType = 'Free Website Review';
    } else {
      nextFollowUpType = 'Follow-up Call';
    }

    // Extract Day / Date
    if (lower.includes('tomorrow')) {
      nextFollowUpDate = 'Tomorrow';
    } else if (lower.includes('friday')) {
      nextFollowUpDate = 'Friday';
    } else if (lower.includes('monday')) {
      nextFollowUpDate = 'Monday';
    } else if (lower.includes('tuesday')) {
      nextFollowUpDate = 'Tuesday';
    } else if (lower.includes('wednesday')) {
      nextFollowUpDate = 'Wednesday';
    } else if (lower.includes('thursday')) {
      nextFollowUpDate = 'Thursday';
    } else if (lower.includes('see and get back') || lower.includes('send a free website')) {
      nextFollowUpDate = 'Awaiting review / Follow-up';
    }

    // Extract Time
    const timeMatch = clean.match(/(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}\s*(?:am|pm))/i);
    if (timeMatch) {
      nextFollowUpTime = timeMatch[1].toUpperCase();
    }
  }

  return {
    companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
    directorName,
    callNumber,
    callStage,
    callLabel,
    callNote: callNote.charAt(0).toUpperCase() + callNote.slice(1),
    companyNumber,
    email,
    hasNextFollowUp,
    nextFollowUpDate,
    nextFollowUpTime,
    nextFollowUpType,
    freeWebsiteStatus,
    callOutcome: hasNextFollowUp ? 'Follow-up Scheduled' : 'Connected & Discussed',
    summary: `${callLabel} with ${companyName}: ${callNote.slice(0, 80)}`,
    transcription: clean,
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Voice Segregation Endpoint using Gemini with multi-model fallback & retry
  app.post('/api/voice/segregate', async (req, res) => {
    const { text, audioBase64, mimeType } = req.body;

    if (!text && !audioBase64) {
      return res.status(400).json({ error: 'Either spoken transcript or audio data is required.' });
    }

    let contents: any;
    if (audioBase64) {
      contents = {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType || 'audio/webm',
            },
          },
          {
            text: 'Listen carefully to this sales voice note. Transcribe accurately what was said, and segregate details into the requested CRM schema.',
          },
        ],
      };
    } else {
      contents = `Segregate and extract the lead and call details from this salesperson's voice update:
"${text}"`;
    }

    const systemInstruction = `You are an expert sales operations AI. Your task is to accurately parse and segregate sales call voice notes into structured CRM entities with high precision.

Examples of natural speech segregation:
1) "the first call was with the company name called Arab Bakery they told I have to send a free website they will see and get back to me"
   -> companyName: "Arab Bakery"
   -> directorName: ""
   -> callNumber: 1
   -> callStage: "CALL_1"
   -> callLabel: "Call 1 (1st Call)"
   -> callNote: "They told I have to send a free website, they will see and get back to me."
   -> companyNumber: ""
   -> email: ""
   -> hasNextFollowUp: true
   -> nextFollowUpDate: "Awaiting website review / Follow-up"
   -> nextFollowUpTime: ""
   -> nextFollowUpType: "Free Website Review"
   -> freeWebsiteStatus: "To Send Free Website"
   -> callOutcome: "Follow-up Scheduled"
   -> summary: "Call 1 with Arab Bakery: requested free website demo and will follow up."

2) "Just finished call number two with Apex Horizon Technologies. Spoke with Director Marcus Sterling, number 555-234-5678, email marcus@apexhorizon.io. Reviewed pricing tiers, they asked us to send the enterprise agreement for legal review tomorrow."
   -> companyName: "Apex Horizon Technologies"
   -> directorName: "Marcus Sterling"
   -> callNumber: 2
   -> callStage: "CALL_2"
   -> callLabel: "Call 2 (2nd Call)"
   -> callNote: "Reviewed pricing tiers, they asked us to send the enterprise agreement for legal review tomorrow."
   -> companyNumber: "555-234-5678"
   -> email: "marcus@apexhorizon.io"
   -> hasNextFollowUp: true
   -> nextFollowUpDate: "Tomorrow"
   -> nextFollowUpTime: ""
   -> nextFollowUpType: "Follow-up Call"
   -> freeWebsiteStatus: "Not Asked"
   -> callOutcome: "Follow-up Scheduled"
   -> summary: "Call 2 with Apex Horizon: legal review follow-up scheduled tomorrow."

You must accurately segregate:
1. companyName: Company or business name (clean without phrases like "called" or "company name").
2. directorName: Name of the director, decision maker, or person contacted (empty string if not specified).
3. callNumber: The call number as an integer (1, 2, 3, or 4).
   - "first call", "call number one", "call 1", "1st call" -> 1
   - "second call", "call number two", "call 2", "2nd call" -> 2
   - "third call", "call number three", "call 3", "3rd call" -> 3
   - "fourth call", "call number four", "call 4", "4th call" -> 4
   - If unspecified, infer from context or default to 1.
4. callStage: "CALL_1", "CALL_2", "CALL_3", or "CALL_4" matching the callNumber.
5. callLabel: A clear string like "Call 1 (1st Call)", "Call 2 (2nd Call)", "Call 3 (3rd Call)", or "Call 4 (4th Call)".
6. callNote: Comprehensive, clear summary of what actually happened on the call: topics discussed, requests made (e.g. sending a free website), agreements, next steps.
7. companyNumber: Phone number mentioned (cleaned, or empty string).
8. email: Email or Gmail address mentioned (or empty string).
9. hasNextFollowUp: Boolean true if a follow-up, call back, scheduled meeting, or sending website/proposal is mentioned.
10. nextFollowUpDate: Date or day of follow-up (e.g. "Tomorrow (Friday)", "Next Monday", "Friday at 3 PM", "Awaiting website review", or empty).
11. nextFollowUpTime: Time of follow-up (e.g. "3:00 PM", "11:00 AM", or empty).
12. nextFollowUpType: "Follow-up Call" | "Meeting Scheduled" | "Free Website Review" | "None".
13. freeWebsiteStatus: "Not Asked" | "To Send Free Website" | "Free Website Sent" | "Website Reviewing" | "Declined / Not Needed".
14. callOutcome: e.g. "Follow-up Scheduled", "Connected & Discussed", "Interested / Demo Booked", "Left Voicemail", "No Answer / Ringing", "Not Interested / Disqualified".
15. summary: 1-sentence concise recap.
16. transcription: The exact spoken words transcript.`;

    const modelConfig = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          directorName: { type: Type.STRING },
          callNumber: { type: Type.INTEGER },
          callStage: { type: Type.STRING },
          callLabel: { type: Type.STRING },
          callNote: { type: Type.STRING },
          companyNumber: { type: Type.STRING },
          email: { type: Type.STRING },
          hasNextFollowUp: { type: Type.BOOLEAN },
          nextFollowUpDate: { type: Type.STRING },
          nextFollowUpTime: { type: Type.STRING },
          nextFollowUpType: { type: Type.STRING },
          freeWebsiteStatus: { type: Type.STRING },
          callOutcome: { type: Type.STRING },
          summary: { type: Type.STRING },
          transcription: { type: Type.STRING },
        },
        required: ['companyName', 'callNumber', 'callStage', 'callNote'],
      },
    };

    // Resilient multi-model retry strategy (handles 503 high-demand spikes smoothly)
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: modelConfig,
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed.companyName && parsed.callNote) {
            return res.json(parsed);
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} attempt failed:`, err.message || err);
        // Small delay before trying next model
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // If text was provided and all AI models were experiencing 503 high-demand,
    // gracefully fall back to local rule-based extractor so user is NEVER blocked!
    if (text) {
      console.info('Using intelligent local fallback parser due to AI service high demand');
      const fallbackResult = fallbackRuleBasedExtractor(text);
      return res.json(fallbackResult);
    }

    console.error('All AI models failed and no text available for fallback:', lastError);
    return res.status(200).json({
      companyName: 'New Lead',
      directorName: '',
      callNumber: 1,
      callStage: 'CALL_1',
      callLabel: 'Call 1',
      callNote: 'Voice note recorded (audio transcription temporarily delayed, please enter details or try again)',
      companyNumber: '',
      email: '',
      hasNextFollowUp: false,
      nextFollowUpDate: '',
      nextFollowUpTime: '',
      nextFollowUpType: 'None',
      freeWebsiteStatus: 'Not Asked',
      callOutcome: 'Connected & Discussed',
      summary: 'Voice note recorded',
      transcription: '',
    });
  });

  // Handle SPA routing & Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
