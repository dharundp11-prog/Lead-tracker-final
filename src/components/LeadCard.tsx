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
  MessageSquare,
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

  // Build notes in descending order (Call 4 -> Call 3 -> Call 2 -> Call 1)
  const descendingNotes: { num: 1 | 2 | 3 | 4; date: string; note: string }[] = [];
  if (lead.call4Note?.trim()) {
    descendingNotes.push({ num: 4, date: lead.call4Date, note: lead.call4Note.trim() });
  }
  if (lead.call3Note?.trim()) {
    descendingNotes.push({ num: 3, date: lead.call3Date, note: lead.call3Note.trim() });
  }
  if (lead.call2Note?.trim()) {
    descendingNotes.push({ num: 2, date: lead.call2Date, note: lead.call2Note.trim() });
  }
  if (lead.call1Note?.trim()) {
    descendingNotes.push({ num: 1, date: lead.call1Date, note: lead.call1Note.trim() });
  }

  // Determine Scheduled Meeting text
  const meetingText =
    lead.scheduledMeeting && lead.scheduledMeeting !== 'None'
      ? lead.scheduledMeeting
      : lead.nextFollowUpType === 'Meeting Scheduled' && lead.nextFollowUpDate
      ? `${lead.nextFollowUpDate}${lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}`
      : null;

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

        {/* SCHEDULED MEETINGS & FOLLOW-UP STATUS */}
        <div className="my-2 space-y-1.5">
          {meetingText && (
            <div
              onClick={() => onEditCallNotes(lead)}
              className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/80 flex items-center justify-between text-xs cursor-pointer hover:bg-emerald-500/15 transition-colors"
              title="Click to view meeting schedule"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-[10px] uppercase tracking-wide block">
                    Scheduled Meeting:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">
                    {meetingText}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 shrink-0">
                Confirmed
              </span>
            </div>
          )}

          {lead.hasNextFollowUp || lead.nextFollowUpDate ? (
            <div
              onClick={() => onEditCallNotes(lead)}
              className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-800/70 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-500/15 transition-colors"
              title="Click to view follow-up schedule"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold truncate">
                  Follow-up: {lead.nextFollowUpDate}
                  {lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}
                </span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                {lead.nextFollowUpType || 'Call'}
              </span>
            </div>
          ) : null}

          {/* Free Website Status Chip */}
          <div
            onClick={() => onEditCallNotes(lead)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
              lead.freeWebsiteStatus === 'To Send Free Website'
                ? 'bg-indigo-100/80 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700'
                : lead.freeWebsiteStatus === 'Free Website Sent'
                ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                : lead.freeWebsiteStatus === 'Website Reviewing'
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
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
                  : lead.freeWebsiteStatus || 'Free Website: Not Asked'}
              </span>
            </div>
          </div>
        </div>

        {/* CALL NOTES IN DESCENDING ORDER */}
        <div className="mt-2 flex-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-blue-500" />
              <span>Call Notes (Descending):</span>
            </span>
            <button
              type="button"
              onClick={() => onEditCallNotes(lead)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Manage Notes
            </button>
          </div>

          {descendingNotes.length > 0 ? (
            <div
              onClick={() => onEditCallNotes(lead)}
              className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {descendingNotes.map((dn, idx) => (
                <div
                  key={dn.num}
                  className={`text-xs ${
                    idx > 0 ? 'pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      Call {dn.num} {idx === 0 ? '(Latest)' : ''}
                    </span>
                    <span>{dn.date || ''}</span>
                  </div>
                  <p className="line-clamp-2 text-slate-700 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
                    "{dn.note}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => onEditCallNotes(lead, 1)}
              className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 hover:border-slate-300 cursor-pointer"
            >
              No call notes logged. Click to add Call 1 note.
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
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
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
