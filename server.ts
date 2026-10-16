/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import path from 'path';
import { resolveDateAndTimeString, formatDayDate } from './src/utils/dateResolver.js';
import {
  extractLeadDetails,
  cleanEntityString,
  cleanPersonName,
} from './src/utils/intelligentExtractor.js';

dotenv.config();

export { extractLeadDetails };

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  const ai = new GoogleGenAI();

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // High-performance voice & text segregation endpoint
  app.post('/api/voice/segregate', async (req, res) => {
    const { text, audioBase64, mimeType, clientDate } = req.body;

    if (!text && !audioBase64) {
      return res.status(400).json({ error: 'Either spoken transcript or audio data is required.' });
    }

    const baseDate = clientDate ? new Date(clientDate) : new Date();
    const todayFormatted = formatDayDate(baseDate);

    // Compute instant rule-based baseline in < 1ms
    let fallbackResult: any = null;
    if (text) {
      fallbackResult = extractLeadDetails(text, baseDate);
    }

    // Fast AI Model refinement (gemini-3.1-flash-lite) with MINIMAL thinking
    try {
      let contents: any;
      if (text) {
        contents = `You are a precise, intelligent CRM extractor for voice call notes.
Today's Date: "${todayFormatted}".

Spoken input:
"${text}"

CRITICAL RULES:
1. companyName: Extract ONLY the pure company or business name (e.g. "Zirco Private Limited", "MM Agro Farms"). NEVER include full sentences or conversational filler words like "I had a call with", "I told", "the company".
2. directorName: When speaker mentions "owner", "business owner", "client", "director", "founder", or "contact" (e.g. "The owner name is Sujay", "owner is Manjulekha"), extract ONLY their name into directorName (e.g. "Sujay", "Manjulekha"). NEVER put the whole sentence into directorName.
3. callNumber: 1, 2, 3, or 4 (default 1).
4. callDate: If caller says "calling today", "called today", or "today", set to "${todayFormatted}".
5. nextFollowUpDate: If caller says "tomorrow", set to the day and date 1 day after "${todayFormatted}".
6. nextFollowUpTime: If time mentioned (e.g. "3 PM"), format as "3:00 PM". If none, leave empty string "".
7. scheduledMeeting: If a meeting or demo is scheduled, format as "Day, Date @ Time", otherwise set to "None".
8. freeWebsiteStatus: Exactly one of "Not Asked", "To Send Free Website", "Free Website Sent", "Website Reviewing", or "Declined / Not Needed".
9. callNote: The discussion topic/notes. If only introduction was made, summarize as "Initial discussion with [owner]".`;
      } else {
        contents = {
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType || 'audio/webm',
              },
            },
            {
              text: `Transcribe and extract CRM details.
Today's Date is "${todayFormatted}".
CRITICAL:
1. companyName: Extract ONLY the company name (e.g. "Zirco Private Limited"). NEVER put the whole sentence into company name.
2. directorName: When speaker mentions owner or client (e.g. "The owner name is Sujay"), put ONLY the person's name (e.g. "Sujay").
3. nextFollowUpDate: If caller says "tomorrow", set to the day and date 1 day after "${todayFormatted}".
4. callNote: Discussion notes.`,
            },
          ],
        };
      }

      const modelConfig = {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            directorName: { type: Type.STRING },
            callNumber: { type: Type.INTEGER },
            callStage: { type: Type.STRING },
            callLabel: { type: Type.STRING },
            callNote: { type: Type.STRING },
            callDate: { type: Type.STRING },
            companyNumber: { type: Type.STRING },
            email: { type: Type.STRING },
            hasNextFollowUp: { type: Type.BOOLEAN },
            nextFollowUpDate: { type: Type.STRING },
            nextFollowUpTime: { type: Type.STRING },
            nextFollowUpType: { type: Type.STRING },
            scheduledMeeting: { type: Type.STRING },
            freeWebsiteStatus: { type: Type.STRING },
            callOutcome: { type: Type.STRING },
            summary: { type: Type.STRING },
            transcription: { type: Type.STRING },
          },
          required: ['companyName', 'callNumber', 'callStage', 'callNote'],
        },
      };

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: modelConfig,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 3500)
      );

      const response: any = await Promise.race([aiPromise, timeoutPromise]);

      if (response?.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.companyName && parsed.callNote) {
          // Clean & Sanitize company and director names: NEVER allow full sentences
          const cleanedCo = cleanEntityString(parsed.companyName);
          const cleanedDir = cleanPersonName(parsed.directorName || '');

          parsed.companyName = cleanedCo || fallbackResult?.companyName || 'New Lead';
          parsed.directorName = cleanedDir || fallbackResult?.directorName || '';

          // If fallbackResult extracted high-confidence company/director from rule patterns, verify
          if (fallbackResult?.companyName && (!cleanedCo || cleanedCo.length > 35 || cleanedCo.includes(' '))) {
            parsed.companyName = fallbackResult.companyName;
          }
          if (fallbackResult?.directorName && !cleanedDir) {
            parsed.directorName = fallbackResult.directorName;
          }

          // If transcription came from audio, check with extractor
          if (parsed.transcription && (!cleanedCo || !cleanedDir)) {
            const reExtracted = extractLeadDetails(parsed.transcription, baseDate);
            if (!cleanedCo && reExtracted.companyName) parsed.companyName = reExtracted.companyName;
            if (!cleanedDir && reExtracted.directorName) parsed.directorName = reExtracted.directorName;
          }

          // If Gemini left relative strings like "tomorrow", enforce dateResolver
          if (
            parsed.nextFollowUpDate &&
            (parsed.nextFollowUpDate.toLowerCase().includes('tomorrow') ||
              parsed.nextFollowUpDate.toLowerCase().includes('today') ||
              !parsed.nextFollowUpDate.includes(','))
          ) {
            const resolved = resolveDateAndTimeString(parsed.nextFollowUpDate, baseDate);
            parsed.nextFollowUpDate = resolved.dayDate;
            if (resolved.time && !parsed.nextFollowUpTime) {
              parsed.nextFollowUpTime = resolved.time;
            }
          }

          if (fallbackResult?.nextFollowUpDate && (!parsed.nextFollowUpDate || parsed.nextFollowUpDate === 'None')) {
            parsed.nextFollowUpDate = fallbackResult.nextFollowUpDate;
            parsed.nextFollowUpTime = fallbackResult.nextFollowUpTime;
            parsed.hasNextFollowUp = fallbackResult.hasNextFollowUp;
          }

          if (
            parsed.nextFollowUpType === 'Meeting Scheduled' &&
            parsed.nextFollowUpDate &&
            (!parsed.scheduledMeeting || parsed.scheduledMeeting === 'None')
          ) {
            parsed.scheduledMeeting = parsed.nextFollowUpTime
              ? `${parsed.nextFollowUpDate} @ ${parsed.nextFollowUpTime}`
              : parsed.nextFollowUpDate;
          }

          return res.json(parsed);
        }
      }
    } catch (err: any) {
      console.warn('Fast Gemini attempt skipped/timed out, using intelligent extractor fallback:', err.message);
    }

    // Return instant intelligent rule-based result
    if (fallbackResult) {
      return res.json(fallbackResult);
    }

    if (text) {
      return res.json(extractLeadDetails(text, baseDate));
    }

    return res.status(200).json({
      companyName: 'New Lead',
      directorName: '',
      callNumber: 1,
      callStage: 'CALL_1',
      callLabel: 'Call 1',
      callNote: 'Voice note recorded',
      callDate: todayFormatted,
      companyNumber: '',
      email: '',
      hasNextFollowUp: false,
      nextFollowUpDate: '',
      nextFollowUpTime: '',
      nextFollowUpType: 'None',
      scheduledMeeting: 'None',
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
