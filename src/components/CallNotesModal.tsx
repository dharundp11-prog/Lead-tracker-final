/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Save,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { CallOutcome, CallStage, Lead, STAGE_CONFIG } from '../types/lead';

interface CallNotesModalProps {
  isOpen: boolean;
  lead: Lead | null;
  initialTab?: 1 | 2 | 3 | 4;
  onClose: () => void;
  onSaveLead: (updatedLead: Lead) => Promise<void>;
}

const COMMON_OUTCOMES: CallOutcome[] = [
  'Connected & Discussed',
  'Left Voicemail',
  'No Answer / Ringing',
  'Gatekeeper Blocked',
  'Follow-up Scheduled',
  'Interested / Demo Booked',
  'Not Interested / Disqualified',
];

export const CallNotesModal: React.FC<CallNotesModalProps> = ({
  isOpen,
  lead,
  initialTab = 1,
  onClose,
  onSaveLead,
}) => {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(initialTab);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for the 4 calls
  const [companyName, setCompanyName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [phone, setPhone] = useState('');
  const [gmail, setGmail] = useState('');
  const [currentStage, setCurrentStage] = useState<CallStage>('NOT_CALLED');
  const [status, setStatus] = useState<'Open' | 'Interested' | 'Won' | 'Lost'>('Open');

  const [call1Date, setCall1Date] = useState('');
  const [call1Note, setCall1Note] = useState('');

  const [call2Date, setCall2Date] = useState('');
  const [call2Note, setCall2Note] = useState('');

  const [call3Date, setCall3Date] = useState('');
  const [call3Note, setCall3Note] = useState('');

  const [call4Date, setCall4Date] = useState('');
  const [call4Note, setCall4Note] = useState('');

  // Follow-up and meeting states
  const [hasNextFollowUp, setHasNextFollowUp] = useState(false);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('');
  const [nextFollowUpType, setNextFollowUpType] = useState<'Follow-up Call' | 'Meeting Scheduled' | 'Free Website Review' | 'None'>('Follow-up Call');
  const [freeWebsiteStatus, setFreeWebsiteStatus] = useState<any>('Not Asked');

  useEffect(() => {
    if (lead) {
      setCompanyName(lead.companyName || '');
      setDirectorName(lead.directorName || '');
      setPhone(lead.phone || '');
      setGmail(lead.gmail || '');
      setCurrentStage(lead.currentStage || 'NOT_CALLED');
      setStatus(lead.status || 'Open');

      setFreeWebsiteStatus(lead.freeWebsiteStatus || 'Not Asked');
      setHasNextFollowUp(Boolean(lead.hasNextFollowUp || lead.nextFollowUpDate));
      setNextFollowUpDate(lead.nextFollowUpDate || '');
      setNextFollowUpTime(lead.nextFollowUpTime || '');
      setNextFollowUpType(lead.nextFollowUpType || (lead.nextFollowUpDate ? 'Follow-up Call' : 'None'));

      setCall1Date(lead.call1Date || '');
      setCall1Note(lead.call1Note || '');

      setCall2Date(lead.call2Date || '');
      setCall2Note(lead.call2Note || '');

      setCall3Date(lead.call3Date || '');
      setCall3Note(lead.call3Note || '');

      setCall4Date(lead.call4Date || '');
      setCall4Note(lead.call4Note || '');

      // Select active tab based on lead current stage if initialTab was default
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (lead.currentStage === 'CALL_4') {
        setActiveTab(4);
      } else if (lead.currentStage === 'CALL_3') {
        setActiveTab(3);
      } else if (lead.currentStage === 'CALL_2') {
        setActiveTab(2);
      } else {
        setActiveTab(1);
      }
    }
  }, [lead, initialTab, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSetToday = (tab: 1 | 2 | 3 | 4) => {
    const todayStr = new Date().toLocaleDateString();
    if (tab === 1) setCall1Date(todayStr);
    if (tab === 2) setCall2Date(todayStr);
    if (tab === 3) setCall3Date(todayStr);
    if (tab === 4) setCall4Date(todayStr);
  };

  const handleAppendOutcome = (tab: 1 | 2 | 3 | 4, outcome: CallOutcome) => {
    const outcomePrefix = `[${outcome}] `;
    if (tab === 1) {
      if (!call1Date) setCall1Date(new Date().toLocaleDateString());
      setCall1Note((prev) => (prev ? `${outcomePrefix}${prev}` : outcomePrefix));
      if (currentStage === 'NOT_CALLED') setCurrentStage('CALL_1');
    }
    if (tab === 2) {
      if (!call2Date) setCall2Date(new Date().toLocaleDateString());
      setCall2Note((prev) => (prev ? `${outcomePrefix}${prev}` : outcomePrefix));
      if (currentStage === 'CALL_1' || currentStage === 'NOT_CALLED') setCurrentStage('CALL_2');
    }
    if (tab === 3) {
      if (!call3Date) setCall3Date(new Date().toLocaleDateString());
      setCall3Note((prev) => (prev ? `${outcomePrefix}${prev}` : outcomePrefix));
      if (currentStage === 'CALL_2' || currentStage === 'CALL_1') setCurrentStage('CALL_3');
    }
    if (tab === 4) {
      if (!call4Date) setCall4Date(new Date().toLocaleDateString());
      setCall4Note((prev) => (prev ? `${outcomePrefix}${prev}` : outcomePrefix));
      setCurrentStage('CALL_4');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Auto advance stage if current tab note is filled and stage is behind
      let updatedStage = currentStage;
      if (activeTab === 4 && call4Note && updatedStage !== 'CALL_4') {
        updatedStage = 'CALL_4';
      } else if (activeTab === 3 && call3Note && (updatedStage === 'CALL_1' || updatedStage === 'CALL_2' || updatedStage === 'NOT_CALLED')) {
        updatedStage = 'CALL_3';
      } else if (activeTab === 2 && call2Note && (updatedStage === 'CALL_1' || updatedStage === 'NOT_CALLED')) {
        updatedStage = 'CALL_2';
      } else if (activeTab === 1 && call1Note && updatedStage === 'NOT_CALLED') {
        updatedStage = 'CALL_1';
      }

      const updatedLead: Lead = {
        ...lead,
        companyName,
        directorName,
        phone,
        gmail,
        currentStage: updatedStage,
        status,
        hasNextFollowUp,
        nextFollowUpDate: hasNextFollowUp ? nextFollowUpDate : '',
        nextFollowUpTime: hasNextFollowUp ? nextFollowUpTime : '',
        nextFollowUpType: hasNextFollowUp ? nextFollowUpType : 'None',
        freeWebsiteStatus,
        call1Date,
        call1Note,
        call2Date,
        call2Note,
        call3Date,
        call3Note,
        call4Date,
        call4Note,
        lastUpdated: new Date().toLocaleString(),
      };

      await onSaveLead(updatedLead);
      onClose();
    } catch (err) {
      console.error('Error saving lead notes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const tabConfigs = [
    {
      num: 1 as const,
      label: '1st Call',
      date: call1Date,
      note: call1Note,
      color: 'blue',
      activeClass: 'border-blue-600 text-blue-600 bg-blue-50/60 dark:bg-blue-950/40 dark:text-blue-400',
      badgeClass: 'bg-blue-600 text-white',
    },
    {
      num: 2 as const,
      label: '2nd Call',
      date: call2Date,
      note: call2Note,
      color: 'amber',
      activeClass: 'border-amber-600 text-amber-600 bg-amber-50/60 dark:bg-amber-950/40 dark:text-amber-400',
      badgeClass: 'bg-amber-600 text-white',
    },
    {
      num: 3 as const,
      label: '3rd Call',
      date: call3Date,
      note: call3Note,
      color: 'orange',
      activeClass: 'border-orange-600 text-orange-600 bg-orange-50/60 dark:bg-orange-950/40 dark:text-orange-400',
      badgeClass: 'bg-orange-600 text-white',
    },
    {
      num: 4 as const,
      label: '4th Call',
      date: call4Date,
      note: call4Note,
      color: 'emerald',
      activeClass: 'border-emerald-600 text-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 dark:text-emerald-400',
      badgeClass: 'bg-emerald-600 text-white',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{lead.id}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${STAGE_CONFIG[currentStage].pillClass}`}
              >
                Current Stage: {STAGE_CONFIG[currentStage].label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {companyName || 'Lead Details'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Quick Call & Contact Ribbon */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              placeholder="Director Name"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 flex gap-1">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-mono focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold hover:bg-emerald-200 shrink-0 flex items-center"
                  title="Call number"
                >
                  Dial
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex-1 flex gap-1">
              <input
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="Gmail Address"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {gmail && (
                <a
                  href={`mailto:${gmail}`}
                  className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded font-semibold hover:bg-blue-200 shrink-0 flex items-center"
                  title="Open mailto"
                >
                  Mail
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Call Selection Tabs (1st Call, 2nd Call, 3rd Call, 4th Call) */}
        <div className="px-6 pt-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Call Stage to View / Update Notes:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Stage:</span>
              <select
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value as CallStage)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-md px-2 py-1 font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="NOT_CALLED">Not Called Yet</option>
                <option value="CALL_1">1st Call</option>
                <option value="CALL_2">2nd Call</option>
                <option value="CALL_3">3rd Call</option>
                <option value="CALL_4">4th Call</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {tabConfigs.map((t) => {
              const isSelected = activeTab === t.num;
              const hasNotes = Boolean(t.note);

              return (
                <button
                  key={t.num}
                  type="button"
                  onClick={() => setActiveTab(t.num)}
                  className={`py-2.5 px-3 rounded-t-xl text-left border-t-2 border-x transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `${t.activeClass} border-slate-200 dark:border-slate-800 shadow-sm`
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm tracking-tight">{t.label}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        hasNotes
                          ? t.badgeClass
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {hasNotes ? '✓' : t.num}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80 mt-1 truncate">
                    {t.date ? t.date : hasNotes ? 'Note recorded' : 'No call yet'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Call Edit Section */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  activeTab === 1
                    ? 'bg-blue-500'
                    : activeTab === 2
                    ? 'bg-amber-500'
                    : activeTab === 3
                    ? 'bg-orange-500'
                    : 'bg-emerald-500'
                }`}
              />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {activeTab === 1 && '1st Call: Initial Outreach & Discovery'}
                {activeTab === 2 && '2nd Call: Follow-Up & Pitch'}
                {activeTab === 3 && '3rd Call: Deep Dive & Objections'}
                {activeTab === 4 && '4th Call: Decision & Final Touchpoint'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Call date (e.g. 10/16/2026)"
                value={
                  activeTab === 1
                    ? call1Date
                    : activeTab === 2
                    ? call2Date
                    : activeTab === 3
                    ? call3Date
                    : call4Date
                }
                onChange={(e) => {
                  if (activeTab === 1) setCall1Date(e.target.value);
                  if (activeTab === 2) setCall2Date(e.target.value);
                  if (activeTab === 3) setCall3Date(e.target.value);
                  if (activeTab === 4) setCall4Date(e.target.value);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none w-36"
              />
              <button
                type="button"
                onClick={() => handleSetToday(activeTab)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer"
              >
                Set Today
              </button>
            </div>
          </div>

          {/* Quick Outcome Preset Chips */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Quick Call Outcome:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_OUTCOMES.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => handleAppendOutcome(activeTab, outcome)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  + {outcome}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>What actually happened on this call?</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Synchronized directly to Google Sheets column
              </span>
            </div>

            <textarea
              rows={4}
              value={
                activeTab === 1
                  ? call1Note
                  : activeTab === 2
                  ? call2Note
                  : activeTab === 3
                  ? call3Note
                  : call4Note
              }
              onChange={(e) => {
                const val = e.target.value;
                if (activeTab === 1) {
                  setCall1Note(val);
                  if (val && !call1Date) setCall1Date(new Date().toLocaleDateString());
                }
                if (activeTab === 2) {
                  setCall2Note(val);
                  if (val && !call2Date) setCall2Date(new Date().toLocaleDateString());
                }
                if (activeTab === 3) {
                  setCall3Note(val);
                  if (val && !call3Date) setCall3Date(new Date().toLocaleDateString());
                }
                if (activeTab === 4) {
                  setCall4Note(val);
                  if (val && !call4Date) setCall4Date(new Date().toLocaleDateString());
                }
              }}
              placeholder={`Write specific details from Call ${activeTab}: discussion points, objections, next steps, director quotes, agreements...`}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed transition-all"
            />
          </div>

          {/* Free Website Status Tracker (Important for Call 1 & Outreach) */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <span>🌐</span>
                <span>Free Website Offer & Review Status (Call 1 & Pitch):</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                {freeWebsiteStatus === 'To Send Free Website' ? '⚠️ Must Send Free Website Demo' : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'To Send Free Website', label: '🚀 To Send Free Website' },
                  { id: 'Free Website Sent', label: '✅ Website Sent' },
                  { id: 'Website Reviewing', label: '⏳ Reviewing Website' },
                  { id: 'Declined / Not Needed', label: '✕ Not Needed' },
                  { id: 'Not Asked', label: '💬 Not Asked Yet' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFreeWebsiteStatus(opt.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                    freeWebsiteStatus === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Next Follow-up & Meeting Scheduler */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  Next Follow-up Call or Scheduled Meeting
                </span>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hasNextFollowUp}
                  onChange={(e) => {
                    setHasNextFollowUp(e.target.checked);
                    if (e.target.checked && !nextFollowUpDate) {
                      setNextFollowUpDate('Tomorrow');
                      setNextFollowUpTime('2:00 PM');
                    }
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Schedule Follow-up</span>
              </label>
            </div>

            {hasNextFollowUp && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Follow-up Type
                    </label>
                    <select
                      value={nextFollowUpType}
                      onChange={(e) => setNextFollowUpType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="Follow-up Call">Follow-up Call</option>
                      <option value="Meeting Scheduled">Meeting Scheduled</option>
                      <option value="Free Website Review">Free Website Review</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Day & Date
                    </label>
                    <input
                      type="text"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      placeholder="e.g. Tomorrow (Friday) or Oct 16"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      value={nextFollowUpTime}
                      onChange={(e) => setNextFollowUpTime(e.target.value)}
                      placeholder="e.g. 2:30 PM, Morning"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNextFollowUpDate('Tomorrow');
                      setNextFollowUpTime('11:00 AM');
                      setNextFollowUpType('Follow-up Call');
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[10px] font-medium hover:bg-amber-100 cursor-pointer"
                  >
                    + Tomorrow at 11 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNextFollowUpDate('Tomorrow');
                      setNextFollowUpTime('3:00 PM');
                      setNextFollowUpType('Follow-up Call');
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[10px] font-medium hover:bg-amber-100 cursor-pointer"
                  >
                    + Tomorrow at 3 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNextFollowUpDate('Friday');
                      setNextFollowUpTime('2:00 PM');
                      setNextFollowUpType('Meeting Scheduled');
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[10px] font-medium hover:bg-amber-100 cursor-pointer"
                  >
                    + Friday Meeting at 2 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNextFollowUpDate('In 2 Days');
                      setNextFollowUpTime('Afternoon');
                      setNextFollowUpType('Free Website Review');
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[10px] font-medium hover:bg-amber-100 cursor-pointer"
                  >
                    + Free Website Review (2 days)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Call History Summary Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Full Call Journey History
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div
                className={`p-2 rounded-lg border ${
                  call1Note
                    ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                  <span>Call 1</span>
                  <span className="text-[10px] text-slate-400 font-normal">{call1Date || 'No date'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  {call1Note || 'No notes logged.'}
                </p>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  call2Note
                    ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-between">
                  <span>Call 2</span>
                  <span className="text-[10px] text-slate-400 font-normal">{call2Date || 'No date'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  {call2Note || 'No notes logged.'}
                </p>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  call3Note
                    ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="font-semibold text-orange-700 dark:text-orange-300 flex items-center justify-between">
                  <span>Call 3</span>
                  <span className="text-[10px] text-slate-400 font-normal">{call3Date || 'No date'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  {call3Note || 'No notes logged.'}
                </p>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  call4Note
                    ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span>Call 4</span>
                  <span className="text-[10px] text-slate-400 font-normal">{call4Date || 'No date'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  {call4Note || 'No notes logged.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating Google Sheets...' : 'Save Notes to Google Sheet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
