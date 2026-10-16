/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Phone,
  Mail,
  Trash2,
  Calendar,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Lead, STAGE_CONFIG } from '../types/lead';

interface LeadTableProps {
  leads: Lead[];
  onEditCallNotes: (lead: Lead, targetCallNumber?: 1 | 2 | 3 | 4) => void;
  onDeleteLead: (lead: Lead) => void;
  onAdvanceStage: (lead: Lead) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onEditCallNotes,
  onDeleteLead,
  onAdvanceStage,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 min-w-[170px]">Company</th>
              <th className="py-3 px-4 min-w-[130px]">Director Name</th>
              <th className="py-3 px-4 min-w-[120px]">Phone</th>
              <th className="py-3 px-4 min-w-[150px]">Gmail</th>
              <th className="py-3 px-4 min-w-[110px]">Current Stage</th>
              <th className="py-3 px-4 min-w-[160px]">Next Follow-up</th>
              <th className="py-3 px-4 min-w-[160px]">Scheduled Meetings</th>
              <th className="py-3 px-4 min-w-[130px]">Free Website</th>
              <th className="py-3 px-4 min-w-[280px] max-w-[340px]">Call Notes (Click to View)</th>
              <th className="py-3 px-4 text-right min-w-[130px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {leads.map((lead) => {
              const currentConfig = STAGE_CONFIG[lead.currentStage] || STAGE_CONFIG.NOT_CALLED;

              // Extract notes count & latest note in descending priority (Call 4 -> Call 3 -> Call 2 -> Call 1)
              let latestCallNum: 1 | 2 | 3 | 4 | null = null;
              let latestNote = '';
              let latestDate = '';
              let notesCount = 0;

              if (lead.call4Note?.trim()) {
                notesCount++;
                if (!latestCallNum) {
                  latestCallNum = 4;
                  latestNote = lead.call4Note;
                  latestDate = lead.call4Date;
                }
              }
              if (lead.call3Note?.trim()) {
                notesCount++;
                if (!latestCallNum) {
                  latestCallNum = 3;
                  latestNote = lead.call3Note;
                  latestDate = lead.call3Date;
                }
              }
              if (lead.call2Note?.trim()) {
                notesCount++;
                if (!latestCallNum) {
                  latestCallNum = 2;
                  latestNote = lead.call2Note;
                  latestDate = lead.call2Date;
                }
              }
              if (lead.call1Note?.trim()) {
                notesCount++;
                if (!latestCallNum) {
                  latestCallNum = 1;
                  latestNote = lead.call1Note;
                  latestDate = lead.call1Date;
                }
              }

              // Determine Scheduled Meeting text
              const meetingText =
                lead.scheduledMeeting && lead.scheduledMeeting !== 'None'
                  ? lead.scheduledMeeting
                  : lead.nextFollowUpType === 'Meeting Scheduled' && lead.nextFollowUpDate
                  ? `${lead.nextFollowUpDate}${lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}`
                  : null;

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors group"
                >
                  {/* Company */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: currentConfig.hexColor }}
                      />
                      <span className="font-semibold text-slate-900 dark:text-white">{lead.companyName}</span>
                    </div>
                  </td>

                  {/* Director */}
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {lead.directorName ? (
                      <span>{lead.directorName}</span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="hover:underline text-slate-700 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Gmail */}
                  <td className="py-3.5 px-4 text-xs">
                    {lead.gmail ? (
                      <a
                        href={`mailto:${lead.gmail}`}
                        className="hover:underline text-slate-700 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1.5"
                      >
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{lead.gmail}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Current Stage */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold ${currentConfig.pillClass}`}
                    >
                      {currentConfig.label}
                    </span>
                  </td>

                  {/* Next Follow-up */}
                  <td
                    onClick={() => onEditCallNotes(lead)}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                  >
                    {lead.hasNextFollowUp || lead.nextFollowUpDate ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100 text-xs">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {lead.nextFollowUpDate}
                            {lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block pl-4.5 mt-0.5">
                          {lead.nextFollowUpType || 'Follow-up Call'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">+ Set follow-up</span>
                    )}
                  </td>

                  {/* Scheduled Meetings */}
                  <td
                    onClick={() => onEditCallNotes(lead)}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                  >
                    {meetingText ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{meetingText}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No meeting scheduled</span>
                    )}
                  </td>

                  {/* Free Website */}
                  <td
                    onClick={() => onEditCallNotes(lead)}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                  >
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {lead.freeWebsiteStatus || 'Not Asked'}
                    </span>
                  </td>

                  {/* Call Notes Column - Spacious & Never Cramped */}
                  <td
                    onClick={() => onEditCallNotes(lead)}
                    className="py-3 px-4 min-w-[280px] max-w-[340px] cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                    title="Click to view and edit call notes"
                  >
                    {latestNote && latestNote !== 'None' ? (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                              Call {latestCallNum}
                            </span>
                            {notesCount > 1 && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                +{notesCount - 1} earlier
                              </span>
                            )}
                          </div>
                          {latestDate && (
                            <span className="text-[10px] text-slate-400 font-medium truncate">
                              {latestDate}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-normal">
                          {latestNote}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] flex items-center gap-1.5 py-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>+ Add call note</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {lead.currentStage !== 'CALL_4' && (
                        <button
                          type="button"
                          onClick={() => onAdvanceStage(lead)}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Advance to next call"
                        >
                          Next Call
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditCallNotes(lead)}
                        className="px-3 py-1 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition-colors cursor-pointer"
                      >
                        Notes
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteLead(lead)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
