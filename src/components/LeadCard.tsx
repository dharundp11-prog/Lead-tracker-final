/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Clock,
  Trash2,
  FileText,
  PhoneForwarded,
  Check,
} from 'lucide-react';
import { CallStage, Lead, STAGE_CONFIG } from '../types/lead';

interface LeadCardProps {
  lead: Lead;
  onEditCallNotes: (lead: Lead, targetCallNumber?: 1 | 2 | 3 | 4) => void;
  onDeleteLead: (lead: Lead) => void;
  onAdvanceStage: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onEditCallNotes,
  onDeleteLead,
  onAdvanceStage,
}) => {
  const currentConfig = STAGE_CONFIG[lead.currentStage] || STAGE_CONFIG.NOT_CALLED;
  const currentStep = currentConfig.stepNumber;

  // Determine latest note
  let latestNote = '';
  let latestNoteLabel = '';
  let latestDate = '';

  if (lead.call4Note) {
    latestNote = lead.call4Note;
    latestNoteLabel = 'Call 4';
    latestDate = lead.call4Date;
  } else if (lead.call3Note) {
    latestNote = lead.call3Note;
    latestNoteLabel = 'Call 3';
    latestDate = lead.call3Date;
  } else if (lead.call2Note) {
    latestNote = lead.call2Note;
    latestNoteLabel = 'Call 2';
    latestDate = lead.call2Date;
  } else if (lead.call1Note) {
    latestNote = lead.call1Note;
    latestNoteLabel = 'Call 1';
    latestDate = lead.call1Date;
  }

  const calls: { num: 1 | 2 | 3 | 4; date: string; note: string }[] = [
    { num: 1, date: lead.call1Date, note: lead.call1Note },
    { num: 2, date: lead.call2Date, note: lead.call2Note },
    { num: 3, date: lead.call3Date, note: lead.call3Note },
    { num: 4, date: lead.call4Date, note: lead.call4Note },
  ];

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between overflow-hidden ${
        lead.currentStage === 'CALL_1'
          ? 'border-blue-200/90 dark:border-blue-900/50'
          : lead.currentStage === 'CALL_2'
          ? 'border-amber-200/90 dark:border-amber-900/50'
          : lead.currentStage === 'CALL_3'
          ? 'border-orange-200/90 dark:border-orange-900/50'
          : lead.currentStage === 'CALL_4'
          ? 'border-emerald-200/90 dark:border-emerald-900/50'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Color Accent Top Bar */}
      <div
        className="h-1.5 w-full transition-colors"
        style={{ backgroundColor: currentConfig.hexColor }}
      />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Company & Stage Pill */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {lead.companyName || 'Untitled Company'}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {lead.directorName || 'No Director specified'}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide shrink-0 ${currentConfig.pillClass}`}
          >
            {currentConfig.label}
          </span>
        </div>

        {/* Contact Coordinates: Phone & Gmail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 py-2.5 px-3 rounded-lg bg-slate-50/80 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0">
            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="truncate hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 font-mono"
                title={`Call ${lead.phone}`}
              >
                {lead.phone}
              </a>
            ) : (
              <span className="text-slate-400 italic">No number</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0">
            <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            {lead.gmail ? (
              <a
                href={`mailto:${lead.gmail}?subject=Follow%20up%20with%20${encodeURIComponent(
                  lead.companyName
                )}`}
                className="truncate hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                title={`Email ${lead.gmail}`}
              >
                {lead.gmail}
              </a>
            ) : (
              <span className="text-slate-400 italic">No Gmail</span>
            )}
          </div>
        </div>

        {/* AT-A-GLANCE FOLLOW-UP & MEETING STATUS */}
        <div className="my-2 space-y-1.5">
          {lead.hasNextFollowUp || lead.nextFollowUpDate ? (
            <div
              onClick={() => onEditCallNotes(lead)}
              className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-500/15 transition-colors"
              title="Click to view or edit follow-up schedule"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-[10px] uppercase tracking-wide">
                      {lead.nextFollowUpType || 'Follow-up'}:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {lead.nextFollowUpDate}
                    </span>
                  </div>
                  {lead.nextFollowUpTime && (
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium block">
                      Time: {lead.nextFollowUpTime}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 shrink-0">
                Active
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEditCallNotes(lead)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-850/40 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>No follow-up set</span>
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">+ Schedule Follow-up</span>
            </button>
          )}

          {/* FREE WEBSITE STATUS CHIP */}
          <div
            onClick={() => onEditCallNotes(lead)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
              lead.freeWebsiteStatus === 'To Send Free Website'
                ? 'bg-indigo-100/80 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700'
                : lead.freeWebsiteStatus === 'Free Website Sent'
                ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                : lead.freeWebsiteStatus === 'Website Reviewing'
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                : lead.currentStage === 'CALL_1'
                ? 'bg-purple-50/70 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs">🌐</span>
              <span className="text-[11px] font-semibold truncate">
                {lead.freeWebsiteStatus === 'To Send Free Website'
                  ? 'Send Free Website (Agreed)'
                  : lead.freeWebsiteStatus === 'Free Website Sent'
                  ? 'Free Website Sent'
                  : lead.freeWebsiteStatus === 'Website Reviewing'
                  ? 'Awaiting Website Review'
                  : lead.freeWebsiteStatus === 'Declined / Not Needed'
                  ? 'Website Declined / Not Needed'
                  : lead.currentStage === 'CALL_1'
                  ? '1st Call: Ask if they need free website'
                  : 'Free Website: Not Asked'}
              </span>
            </div>
            <span className="text-[10px] font-bold opacity-75 shrink-0">
              {lead.freeWebsiteStatus === 'To Send Free Website' ? 'Action' : 'Edit'}
            </span>
          </div>
        </div>

        {/* 4-Call Progress Tracker */}
        <div className="my-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Call Progression Tracker</span>
            <span className="text-[10px] text-slate-400">Click step to view notes</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {calls.map((c) => {
              const isCompleted = Boolean(c.note || (c.num <= currentStep && currentStep > 0));
              const isCurrent = c.num === currentStep;
              const hasNote = Boolean(c.note);

              return (
                <button
                  key={c.num}
                  type="button"
                  onClick={() => onEditCallNotes(lead, c.num)}
                  title={`Call ${c.num}: ${hasNote ? c.note : 'Click to add note'}`}
                  className={`py-1.5 px-1 rounded-md text-center text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                    c.num === 1
                      ? isCompleted
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700'
                        : 'bg-slate-100/70 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                      : c.num === 2
                      ? isCompleted
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                        : 'bg-slate-100/70 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                      : c.num === 3
                      ? isCompleted
                        ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700'
                        : 'bg-slate-100/70 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-100/70 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                  } ${isCurrent ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-slate-900 font-bold' : ''}`}
                >
                  <span className="flex items-center gap-0.5">
                    Call {c.num}
                    {hasNote && <Check className="w-2.5 h-2.5 inline" />}
                  </span>
                  <span className="text-[9px] opacity-75 font-normal truncate max-w-full px-0.5">
                    {c.date ? c.date.split('/')[0] + '/' + c.date.split('/')[1] : hasNote ? 'Noted' : 'Pending'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Latest Note Box */}
        <div className="mt-1 flex-1">
          {latestNote ? (
            <div
              onClick={() => onEditCallNotes(lead)}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-500" />
                  Latest Note ({latestNoteLabel}):
                </span>
                {latestDate && <span className="text-[10px] text-slate-400 font-normal">{latestDate}</span>}
              </div>
              <p className="line-clamp-2 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                "{latestNote}"
              </p>
            </div>
          ) : (
            <div
              onClick={() => onEditCallNotes(lead, 1)}
              className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
            >
              <span>No call notes logged yet. Click to record Call 1.</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-850/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onDeleteLead(lead)}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          title="Delete Lead"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {lead.currentStage !== 'CALL_4' && (
            <button
              type="button"
              onClick={() => onAdvanceStage(lead)}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
              title="Advance to next call stage"
            >
              <span>Next Call</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEditCallNotes(lead)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <PhoneForwarded className="w-3.5 h-3.5" />
            <span>Manage Notes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
