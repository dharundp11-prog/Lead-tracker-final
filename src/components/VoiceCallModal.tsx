/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Phone,
  Mail,
  Save,
  RotateCcw,
  Volume2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Radio,
  Play,
  Square,
} from 'lucide-react';
import { CallStage, FreeWebsiteStatus, Lead, STAGE_CONFIG, VoiceSegregationResult } from '../types/lead';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onApplyVoiceUpdate: (result: VoiceSegregationResult, matchedLead: Lead | null) => Promise<void>;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  leads,
  onApplyVoiceUpdate,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [micStatusNotice, setMicStatusNotice] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Segregated results
  const [segregatedResult, setSegregatedResult] = useState<VoiceSegregationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable segregated fields
  const [editCompany, setEditCompany] = useState('');
  const [editDirector, setEditDirector] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCallNumber, setEditCallNumber] = useState<1 | 2 | 3 | 4>(1);
  const [editNote, setEditNote] = useState('');
  const [editFreeWebsiteStatus, setEditFreeWebsiteStatus] = useState<FreeWebsiteStatus>('Not Asked');

  // Follow-up edit states
  const [editHasFollowUp, setEditHasFollowUp] = useState(false);
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editFollowUpTime, setEditFollowUpTime] = useState('');
  const [editFollowUpType, setEditFollowUpType] = useState('Follow-up Call');

  // Refs for audio handling
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
      setTranscript('');
      setSegregatedResult(null);
      setErrorMsg(null);
      setMicStatusNotice(null);
      setAudioUrl(null);
      setAudioBase64(null);
      setRecordingSeconds(0);
      setAudioLevel(0);
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  // Convert Blob to Base64 helper
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Start recording using standard getUserMedia + MediaRecorder
  const startRecording = async () => {
    setErrorMsg(null);
    setMicStatusNotice(null);
    setAudioUrl(null);
    setAudioBase64(null);
    audioChunksRef.current = [];

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Audio capture is not supported by this browser. You can type or paste spoken notes below.');
      return;
    }

    try {
      // 1. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      // 2. Set up AudioContext for real-time visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (audioCtxErr) {
        console.warn('Audio level analyzer error (non-fatal):', audioCtxErr);
      }

      // 3. Set up MediaRecorder
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      setAudioMimeType(mimeType);

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          try {
            const b64 = await blobToBase64(audioBlob);
            setAudioBase64(b64);
          } catch (err) {
            console.error('Failed to encode audio to base64:', err);
          }
        }
      };

      recorder.start(500); // 500ms chunk interval
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 4. Also attempt Web Speech API concurrently if available for live visual text
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            if (fullText.trim()) {
              setTranscript(fullText.trim());
            }
          };

          recognition.onerror = (event: any) => {
            // Note: In sandboxed iframes, SpeechRecognition often throws 'not-allowed'.
            // Because our MediaRecorder is already recording real audio directly, we inform the user smoothly!
            console.info('SpeechRecognition note:', event.error);
            if (event.error === 'not-allowed') {
              setMicStatusNotice(
                'Live text streaming is limited in this preview frame, but your voice is being captured with high fidelity for Gemini AI.'
              );
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (speechErr) {
          console.warn('SpeechRecognition initialization note:', speechErr);
        }
      }
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg(
          'Microphone permission was denied by your browser. Please follow the steps below to allow microphone access.'
        );
        setShowHelp(true);
      } else {
        setErrorMsg(`Microphone error: ${err.message || 'Unable to access microphone'}`);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    stopRecordingCleanup();
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Test microphone permission test button
  const handleTestMic = async () => {
    setErrorMsg(null);
    setMicStatusNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatusNotice('Microphone permission is successfully granted and working!');
    } catch (err: any) {
      setErrorMsg(`Permission test failed: ${err.message}. Follow the guide below.`);
      setShowHelp(true);
    }
  };

  // Send audio or transcript to backend Gemini
  const handleSegregateDetails = async () => {
    if (!transcript.trim() && !audioBase64) {
      setErrorMsg('Please record or enter your call notes first.');
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const payload: any = {};
      if (audioBase64) {
        payload.audioBase64 = audioBase64;
        payload.mimeType = audioMimeType;
      }
      if (transcript.trim()) {
        payload.text = transcript.trim();
      }

      const res = await fetch('/api/voice/segregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to segregate details (Status ${res.status})`);
      }

      const result: VoiceSegregationResult = await res.json();
      setSegregatedResult(result);

      if (result.transcription && !transcript) {
        setTranscript(result.transcription);
      }

      // Populate editable fields
      setEditCompany(result.companyName || '');
      setEditDirector(result.directorName || '');
      setEditPhone(result.companyNumber || '');
      setEditEmail(result.email || '');
      setEditCallNumber(result.callNumber || 1);
      setEditNote(result.callNote || '');
      setEditFreeWebsiteStatus(result.freeWebsiteStatus || (result.callNumber === 1 ? 'To Send Free Website' : 'Not Asked'));
      setEditHasFollowUp(Boolean(result.hasNextFollowUp || result.nextFollowUpDate));
      setEditFollowUpDate(result.nextFollowUpDate || '');
      setEditFollowUpTime(result.nextFollowUpTime || '');
      setEditFollowUpType(result.nextFollowUpType || (result.nextFollowUpDate ? 'Follow-up Call' : 'None'));
    } catch (err: any) {
      console.error('Segregation error:', err);
      setErrorMsg(err.message || 'Failed to accurately segregate call details.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Find matching lead in existing leads list
  const matchedLead = React.useMemo(() => {
    if (!editCompany) return null;
    const cleanTarget = editCompany.toLowerCase().trim();
    return (
      leads.find((l) => {
        const leadCo = (l.companyName || '').toLowerCase().trim();
        return leadCo.includes(cleanTarget) || cleanTarget.includes(leadCo);
      }) || null
    );
  }, [editCompany, leads]);

  const handleSaveToSheet = async () => {
    if (!editCompany.trim()) {
      setErrorMsg('Company Name is required.');
      return;
    }
    if (!editNote.trim()) {
      setErrorMsg('Call note cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const finalStage: CallStage =
        editCallNumber === 1
          ? 'CALL_1'
          : editCallNumber === 2
          ? 'CALL_2'
          : editCallNumber === 3
          ? 'CALL_3'
          : 'CALL_4';

      const finalResult: VoiceSegregationResult = {
        companyName: editCompany.trim(),
        directorName: editDirector.trim(),
        companyNumber: editPhone.trim(),
        email: editEmail.trim(),
        callNumber: editCallNumber,
        callStage: finalStage,
        callLabel: `Call ${editCallNumber}`,
        callNote: editNote.trim(),
        freeWebsiteStatus: editFreeWebsiteStatus,
        hasNextFollowUp: editHasFollowUp,
        nextFollowUpDate: editHasFollowUp ? editFollowUpDate.trim() : '',
        nextFollowUpTime: editHasFollowUp ? editFollowUpTime.trim() : '',
        nextFollowUpType: editHasFollowUp ? editFollowUpType : 'None',
        callOutcome: segregatedResult?.callOutcome || (editHasFollowUp ? 'Follow-up Scheduled' : 'Connected & Discussed'),
      };

      await onApplyVoiceUpdate(finalResult, matchedLead);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update Google Sheet.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentStageKey: CallStage =
    editCallNumber === 1
      ? 'CALL_1'
      : editCallNumber === 2
      ? 'CALL_2'
      : editCallNumber === 3
      ? 'CALL_3'
      : 'CALL_4';

  const currentStageConfig = STAGE_CONFIG[currentStageKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Voice Call Logger & Segregation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Gemini Precision
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dictate your call details: company, call number, discussion notes, phone & email.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices & Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
                className="ml-2 font-semibold underline hover:text-rose-900 dark:hover:text-rose-100"
              >
                {showHelp ? 'Hide Fix Guide' : 'How to Fix Permission'}
              </button>
            </div>
          </div>
        )}

        {micStatusNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{micStatusNotice}</span>
          </div>
        )}

        {/* Browser Permission Help Box (Accordion) */}
        {showHelp && (
          <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-sm">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Why did it say "Speech recognition error not allowed"?
              </h4>
              <button
                onClick={() => setShowHelp(false)}
                className="text-[11px] text-amber-700 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Google AI Studio runs web apps inside an embedded iframe sandbox. Chrome and other browsers block Web Speech API inside sandboxed frames, even if microphone works in the main AI Studio interface.
            </p>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  🚀 Solution 1: Open in Standalone Tab (Recommended)
                </span>
                <span className="text-[11px] text-slate-500">
                  Opens this app in a full browser tab where microphone permission prompts normally with 1 click.
                </span>
              </div>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-colors"
              >
                <span>Open in Full Tab</span>
                <Play className="w-3 h-3 fill-white" />
              </a>
            </div>

            <div className="text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold block">💡 Solution 2: Browser URL Bar Settings:</span>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                <li>Click the <strong>tune / slider icon</strong> or <strong>lock (🔒)</strong> on the far left of your browser address bar.</li>
                <li>Set <strong>Microphone</strong> to <strong>"Allow"</strong>.</li>
                <li>Or simply click any of the <strong>4 quick preset buttons</strong> or paste your spoken text below — Gemini segregate works instantly without any mic hardware!</li>
              </ol>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestMic}
                className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Test Microphone Access
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Microphone Recording Control Area */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative overflow-hidden">
            <div className="flex flex-col items-center justify-center">
              {/* Mic Button with Dynamic Pulsing Wave */}
              <div className="relative">
                {isRecording && (
                  <div
                    className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping pointer-events-none"
                    style={{ transform: `scale(${1 + audioLevel / 100})` }}
                  />
                )}
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`w-18 h-18 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer relative z-10 ${
                    isRecording
                      ? 'bg-rose-600 text-white scale-105 shadow-rose-500/40'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:scale-105'
                  }`}
                  title={isRecording ? 'Click to stop recording' : 'Click to start speaking'}
                >
                  {isRecording ? <Square className="w-7 h-7 fill-white" /> : <Mic className="w-8 h-8" />}
                </button>
              </div>

              <div className="mt-3">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">
                  {isRecording ? `Recording... (${recordingSeconds}s)` : 'Click to Record Call Details'}
                </span>
                <span className="text-xs text-slate-500">
                  {isRecording
                    ? 'Speak clearly: state the company name, call number (1, 2, 3, or 4), phone, email, and what happened.'
                    : 'Records voice audio & segregates with Gemini CRM precision'}
                </span>
              </div>

              {/* Real-time Audio Level Meter when recording */}
              {isRecording && (
                <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.max(8, audioLevel)}%` }}
                  />
                </div>
              )}

              {/* Recorded Audio Playback if available */}
              {audioUrl && !isRecording && (
                <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Voice clip recorded ({recordingSeconds}s)</span>
                  <audio src={audioUrl} controls className="h-7 w-48 ml-2" />
                </div>
              )}
            </div>

            {/* Quick example prompts */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Quick Presets (Click any to test segregation instantly):
                </span>
                <span className="text-[10px] text-slate-400">1-Click Test</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTranscript(
                      'the first call was with the company name called Arab Bakery they told I have to send a free website they will see and get back to me'
                    );
                    setAudioBase64(null);
                    setAudioUrl(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-left text-[11px] cursor-pointer transition-colors"
                >
                  <span className="font-bold block text-blue-900 dark:text-blue-200">🍞 Arab Bakery (1st Call)</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400">Send free website, they will see & get back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTranscript(
                      'Just finished call number two with Apex Horizon Technologies. Spoke with Director Marcus Sterling, number 555-234-5678, email marcus@apexhorizon.io. Reviewed pricing tiers, they asked us to send the enterprise agreement for legal review tomorrow.'
                    );
                    setAudioBase64(null);
                    setAudioUrl(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-left text-[11px] cursor-pointer transition-colors"
                >
                  <span className="font-bold block text-amber-900 dark:text-amber-200">⚡ Apex Horizon (2nd Call)</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">Marcus Sterling: legal review tomorrow</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTranscript(
                      'Third call with CloudPeak Solutions with Director Elena Rostova, number 415-555-9012, email elena@cloudpeak.tech. Completed demo walk-through, meeting scheduled next Tuesday at 3:00 PM for decision review.'
                    );
                    setAudioBase64(null);
                    setAudioUrl(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-left text-[11px] cursor-pointer transition-colors"
                >
                  <span className="font-bold block text-orange-900 dark:text-orange-200">📅 CloudPeak (3rd Call)</span>
                  <span className="text-[10px] text-orange-700 dark:text-orange-400">Meeting scheduled Tuesday at 3:00 PM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTranscript(
                      'First call with Metro Logistics, spoke to director, asked if they need a free website, said to follow up tomorrow at 11 AM.'
                    );
                    setAudioBase64(null);
                    setAudioUrl(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-left text-[11px] cursor-pointer transition-colors"
                >
                  <span className="font-bold block text-emerald-900 dark:text-emerald-200">📞 Metro Logistics (1st Call)</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Free website offer, follow up tomorrow 11 AM</span>
                </button>
              </div>
            </div>
          </div>

          {/* Transcript / Spoken Text Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Call Voice Transcript / Dictation Text:</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowHelp((prev) => !prev)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  Permission Help
                </button>
                {transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setSegregatedResult(null);
                      setAudioUrl(null);
                      setAudioBase64(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will appear here, or you can write/paste details manually..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {audioBase64
                  ? 'Voice clip ready for Gemini'
                  : 'Ready to segregate into structured lead data'}
              </span>

              <button
                type="button"
                onClick={handleSegregateDetails}
                disabled={isProcessing || (!transcript.trim() && !audioBase64)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'Segregating with Gemini...' : 'Accurately Segregate Details'}</span>
              </button>
            </div>
          </div>

          {/* Segregated Structured Results Preview */}
          {segregatedResult && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                    Segregated CRM Fields
                  </h3>
                </div>

                {matchedLead ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Matches Existing Lead: {matchedLead.companyName}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    New Lead Will Be Created
                  </span>
                )}
              </div>

              {/* Color-coded Call Number / Stage Tag */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Call Identified:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {([1, 2, 3, 4] as const).map((num) => {
                    const stgKey = (`CALL_${num}` as CallStage);
                    const cfg = STAGE_CONFIG[stgKey];
                    const isSelected = editCallNumber === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEditCallNumber(num)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.badgeBg} border-transparent ring-2 ring-blue-500 shadow-sm`
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Call {num} ({cfg.shortLabel})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Segregated Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Director / Contact Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={editDirector}
                      onChange={(e) => setEditDirector(e.target.value)}
                      placeholder="e.g. Marcus Sterling"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Company Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Email / Gmail
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="contact@company.com"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Segregated Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  What Happened in Call {editCallNumber} (Note):
                </label>
                <textarea
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                />
              </div>

              {/* Free Website Status Tracker */}
              <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                    <span>🌐</span>
                    <span>Free Website Offer / Follow-up:</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {editFreeWebsiteStatus === 'To Send Free Website' ? 'Action Needed: Send Demo' : 'Status'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'To Send Free Website', label: 'To Send Free Website' },
                      { id: 'Free Website Sent', label: 'Website Sent' },
                      { id: 'Website Reviewing', label: 'Under Review' },
                      { id: 'Not Asked', label: 'Not Asked / Unsure' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditFreeWebsiteStatus(opt.id as any)}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium border text-center transition-all cursor-pointer ${
                        editFreeWebsiteStatus === opt.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Segregated Follow-up / Scheduled Meeting */}
              <div className="p-3 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Follow-up or Meeting Scheduled:</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={editHasFollowUp}
                      onChange={(e) => setEditHasFollowUp(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Schedule Follow-up</span>
                  </label>
                </div>

                {editHasFollowUp && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Type</label>
                      <select
                        value={editFollowUpType}
                        onChange={(e) => setEditFollowUpType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                      >
                        <option value="Follow-up Call">Follow-up Call</option>
                        <option value="Meeting Scheduled">Meeting Scheduled</option>
                        <option value="Free Website Review">Free Website Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Day & Date</label>
                      <input
                        type="text"
                        value={editFollowUpDate}
                        onChange={(e) => setEditFollowUpDate(e.target.value)}
                        placeholder="e.g. Tomorrow or Friday"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Time</label>
                      <input
                        type="text"
                        value={editFollowUpTime}
                        onChange={(e) => setEditFollowUpTime(e.target.value)}
                        placeholder="e.g. 3:00 PM"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action to Save to Google Sheets */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[11px] text-slate-500">
                  Will sync to <strong>Google Sheet</strong> under{' '}
                  <strong className={currentStageConfig.textClass}>{currentStageConfig.label}</strong>
                </span>

                <button
                  type="button"
                  onClick={handleSaveToSheet}
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Syncing to Sheet...' : 'Confirm & Save to Google Sheets'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
