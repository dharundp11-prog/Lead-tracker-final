/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock } from 'lucide-react';
import { CallStage, Lead, FreeWebsiteStatus } from '../types/lead';
import { formatDayDate } from '../utils/dateResolver';

interface CallNotesModalProps {
  isOpen: boolean;
  lead: Lead | null;
  initialTab?: 1 | 2 | 3 | 4;
  onClose: () => void;
  onSaveLead: (updatedLead: Lead) => Promise<void>;
}

export const CallNotesModal: React.FC<CallNotesModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSaveLead,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [phone, setPhone] = useState('');
  const [gmail, setGmail] = useState('');

  // Call 1-4 Dates & Notes
  const [call1Date, setCall1Date] = useState('');
  const [call1Note, setCall1Note] = useState('');
  const [call2Date, setCall2Date] = useState('');
  const [call2Note, setCall2Note] = useState('');
  const [call3Date, setCall3Date] = useState('');
  const [call3Note, setCall3Note] = useState('');
  const [call4Date, setCall4Date] = useState('');
  const [call4Note, setCall4Note] = useState('');

  // Scheduled Meeting & Follow-up
  const [scheduledMeetingText, setScheduledMeetingText] = useState('');
  const [hasScheduledMeeting, setHasScheduledMeeting] = useState(false);

  // Free Website Deal Stage
  const [freeWebsiteStatus, setFreeWebsiteStatus] = useState<FreeWebsiteStatus>('Not Asked');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;

    setCompanyName(lead.companyName || '');
    setDirectorName(lead.directorName || '');
    setPhone(lead.phone || '');
    setGmail(lead.gmail || '');

    setCall1Date(lead.call1Date || '');
    setCall1Note(lead.call1Note || '');
    setCall2Date(lead.call2Date || '');
    setCall2Note(lead.call2Note || '');
    setCall3Date(lead.call3Date || '');
    setCall3Note(lead.call3Note || '');
    setCall4Date(lead.call4Date || '');
    setCall4Note(lead.call4Note || '');

    setFreeWebsiteStatus(lead.freeWebsiteStatus || 'Not Asked');

    // Determine scheduled meeting & follow-up text
    const meetingVal =
      lead.scheduledMeeting && lead.scheduledMeeting !== 'None'
        ? lead.scheduledMeeting
        : lead.nextFollowUpType === 'Meeting Scheduled' && lead.nextFollowUpDate
        ? `${lead.nextFollowUpDate}${lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}`
        : '';

    if (meetingVal) {
      setScheduledMeetingText(meetingVal);
      setHasScheduledMeeting(true);
    } else if (lead.hasNextFollowUp && lead.nextFollowUpDate) {
      setScheduledMeetingText(
        `${lead.nextFollowUpDate}${lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}`
      );
      setHasScheduledMeeting(true);
    } else {
      setScheduledMeetingText('');
      setHasScheduledMeeting(false);
    }

    setErrorMsg(null);
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSave = async () => {
    if (!companyName.trim()) {
      setErrorMsg('Company Name cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    // Calculate highest stage based on logged notes
    let finalStage: CallStage = lead.currentStage;
    if (call4Note.trim()) finalStage = 'CALL_4';
    else if (call3Note.trim()) finalStage = 'CALL_3';
    else if (call2Note.trim()) finalStage = 'CALL_2';
    else if (call1Note.trim()) finalStage = 'CALL_1';

    // Auto-fill date if user typed a note but left date blank
    const today = formatDayDate(new Date());
    const finalC1Date = call1Note.trim() && !call1Date.trim() ? today : call1Date.trim();
    const finalC2Date = call2Note.trim() && !call2Date.trim() ? today : call2Date.trim();
    const finalC3Date = call3Note.trim() && !call3Date.trim() ? today : call3Date.trim();
    const finalC4Date = call4Note.trim() && !call4Date.trim() ? today : call4Date.trim();

    // Determine scheduled meeting
    let finalScheduledMeeting = 'None';
    let hasNext = false;
    let nextDate = '';
    let nextTime = '';
    let nextType = 'None';

    if (hasScheduledMeeting && scheduledMeetingText.trim()) {
      finalScheduledMeeting = scheduledMeetingText.trim();
      hasNext = true;
      if (scheduledMeetingText.includes('@')) {
        const parts = scheduledMeetingText.split('@');
        nextDate = parts[0].trim();
        nextTime = parts[1].trim();
      } else {
        nextDate = scheduledMeetingText.trim();
      }
      nextType = 'Meeting Scheduled';
    }

    const updatedLead: Lead = {
      ...lead,
      companyName: companyName.trim(),
      directorName: directorName.trim(),
      phone: phone.trim(),
      gmail: gmail.trim(),
      currentStage: finalStage,
      hasNextFollowUp: hasNext,
      nextFollowUpDate: nextDate,
      nextFollowUpTime: nextTime,
      nextFollowUpType: nextType as any,
      scheduledMeeting: finalScheduledMeeting,
      freeWebsiteStatus,
      call1Date: finalC1Date,
      call1Note: call1Note.trim(),
      call2Date: finalC2Date,
      call2Note: call2Note.trim(),
      call3Date: finalC3Date,
      call3Note: call3Note.trim(),
      call4Date: finalC4Date,
      call4Note: call4Note.trim(),
      lastUpdated: new Date().toLocaleString(),
    };

    try {
      await onSaveLead(updatedLead);
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'Failed to update lead');
    } finally {
      setIsSaving(false);
    }
  };

  // Calls in DESCENDING ORDER: Call 4, Call 3, Call 2, Call 1
  const callsDescending = [
    {
      num: 4,
      date: call4Date,
      setDate: setCall4Date,
      note: call4Note,
      setNote: setCall4Note,
    },
    {
      num: 3,
      date: call3Date,
      setDate: setCall3Date,
      note: call3Note,
      setNote: setCall3Note,
    },
    {
      num: 2,
      date: call2Date,
      setDate: setCall2Date,
      note: call2Note,
      setNote: setCall2Note,
    },
    {
      num: 1,
      date: call1Date,
      setDate: setCall1Date,
      note: call1Note,
      setNote: setCall1Note,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        {/* Header - Clean, plain text presentation */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {companyName || lead.companyName}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4 flex-wrap">
              <span>
                Director: <strong className="text-slate-800 dark:text-slate-200">{directorName || 'None'}</strong>
              </span>
              {phone && (
                <span>
                  Phone: <strong className="text-slate-800 dark:text-slate-200">{phone}</strong>
                </span>
              )}
              {gmail && (
                <span>
                  Email: <strong className="text-slate-800 dark:text-slate-200">{gmail}</strong>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Body: Descending Order (Call 4 -> Call 3 -> Call 2 -> Call 1) in plain text layout */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {callsDescending.map((c) => (
            <div
              key={c.num}
              className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-2 last:border-b-0"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Call {c.num}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Call Date:</span>
                  <input
                    type="text"
                    value={c.date}
                    onChange={(e) => c.setDate(e.target.value)}
                    placeholder="e.g. Friday, Oct 16, 2026"
                    className="border-b border-slate-300 dark:border-slate-700 px-2 py-0.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none focus:border-slate-900 dark:focus:border-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Note:
                </label>
                <textarea
                  rows={2}
                  value={c.note}
                  onChange={(e) => {
                    c.setNote(e.target.value);
                    if (e.target.value && !c.date) {
                      c.setDate(formatDayDate(new Date()));
                    }
                  }}
                  placeholder={`Write Call ${c.num} note here...`}
                  className="w-full text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 leading-relaxed placeholder:text-slate-400"
                />
              </div>
            </div>
          ))}

          {/* Scheduled Meeting & Follow-up - Plain Text Line */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Scheduled Meeting & Follow-up:
            </span>

            {!hasScheduledMeeting ? (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-1">
                <span>No meeting scheduled.</span>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    setScheduledMeetingText(`${formatDayDate(tmrw)} @ 3:00 PM`);
                    setHasScheduledMeeting(true);
                  }}
                  className="text-slate-900 dark:text-slate-100 font-semibold hover:underline cursor-pointer"
                >
                  + Schedule Meeting
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">Meeting:</span>
                <input
                  type="text"
                  value={scheduledMeetingText}
                  onChange={(e) => setScheduledMeetingText(e.target.value)}
                  placeholder="e.g. Saturday, Oct 17, 2026 @ 3:00 PM"
                  className="flex-1 border-b border-slate-300 dark:border-slate-700 px-1 py-0.5 text-xs text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none focus:border-slate-900 dark:focus:border-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    setHasScheduledMeeting(false);
                    setScheduledMeetingText('');
                  }}
                  className="text-slate-400 hover:text-rose-600 text-xs cursor-pointer ml-2"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Free Website Deal Stage - Plain Line with dropdown */}
          <div className="flex items-center justify-between text-xs pt-2">
            <span className="font-bold text-slate-900 dark:text-white">
              Free Website Deal Stage:
            </span>
            <select
              value={freeWebsiteStatus}
              onChange={(e) => setFreeWebsiteStatus(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium cursor-pointer"
            >
              <option value="Not Asked">Not Asked</option>
              <option value="To Send Free Website">To Send Free Website</option>
              <option value="Free Website Sent">Free Website Sent</option>
              <option value="Website Reviewing">Website Reviewing</option>
              <option value="Declined / Not Needed">Declined / Not Needed</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium text-xs rounded-md shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving to Google Sheets...' : 'Save to Google Sheets'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
