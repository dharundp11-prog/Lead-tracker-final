/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Phone,
  Mail,
  User,
  FileText,
  Trash2,
  ExternalLink,
  ChevronRight,
  PhoneForwarded,
  Clock,
} from 'lucide-react';
import { CallStage, Lead, STAGE_CONFIG } from '../types/lead';

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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Director Name</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Gmail</th>
              <th className="py-3 px-4">Current Stage</th>
              <th className="py-3 px-4">Next Follow-up (Day, Date & Time)</th>
              <th className="py-3 px-4">Free Website Status</th>
              <th className="py-3 px-4">Call 1 Note</th>
              <th className="py-3 px-4">Call 2 Note</th>
              <th className="py-3 px-4">Call 3 Note</th>
              <th className="py-3 px-4">Call 4 Note</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {leads.map((lead) => {
              const currentConfig = STAGE_CONFIG[lead.currentStage] || STAGE_CONFIG.NOT_CALLED;

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors group"
                >
                  {/* Company */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: currentConfig.hexColor }}
                      />
                      <span>{lead.companyName}</span>
                    </div>
                  </td>

                  {/* Director */}
                  <td className="py-3.5 px-4 font-medium whitespace-nowrap text-slate-800 dark:text-slate-200">
                    {lead.directorName || <span className="text-slate-400 italic">—</span>}
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="hover:underline text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Gmail */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                    {lead.gmail ? (
                      <a
                        href={`mailto:${lead.gmail}`}
                        className="hover:underline text-blue-600 dark:text-blue-400 flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        {lead.gmail}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Stage Pill */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${currentConfig.pillClass}`}
                    >
                      {currentConfig.label}
                    </span>
                  </td>

                  {/* Next Follow-up at a glance */}
                  <td
                    onClick={() => onEditCallNotes(lead)}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/30"
                  >
                    {lead.hasNextFollowUp || lead.nextFollowUpDate ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <div>
                          <span className="font-semibold text-amber-900 dark:text-amber-200 block text-[11px]">
                            {lead.nextFollowUpDate}
                            {lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {lead.nextFollowUpType || 'Follow-up Call'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">+ Set follow-up</span>
                    )}
                  </td>

                  {/* Free Website Status */}
                  <td
                    onClick={() => onEditCallNotes(lead)}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        lead.freeWebsiteStatus === 'To Send Free Website'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                          : lead.freeWebsiteStatus === 'Free Website Sent'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : lead.freeWebsiteStatus === 'Website Reviewing'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : lead.freeWebsiteStatus === 'Declined / Not Needed'
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 italic'
                      }`}
                    >
                      {lead.freeWebsiteStatus === 'To Send Free Website'
                        ? '🚀 Send Website'
                        : lead.freeWebsiteStatus || 'Not Asked'}
                    </span>
                  </td>

                  {/* Call 1 Note */}
                  <td
                    onClick={() => onEditCallNotes(lead, 1)}
                    className="py-3.5 px-4 max-w-[150px] truncate cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                    title={lead.call1Note || 'Click to add Call 1 note'}
                  >
                    {lead.call1Note ? (
                      <div className="text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-semibold">
                          {lead.call1Date || '1st Call'}:
                        </span>
                        <span className="truncate block">{lead.call1Note}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">+ Add</span>
                    )}
                  </td>

                  {/* Call 2 Note */}
                  <td
                    onClick={() => onEditCallNotes(lead, 2)}
                    className="py-3.5 px-4 max-w-[150px] truncate cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/30"
                    title={lead.call2Note || 'Click to add Call 2 note'}
                  >
                    {lead.call2Note ? (
                      <div className="text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">
                          {lead.call2Date || '2nd Call'}:
                        </span>
                        <span className="truncate block">{lead.call2Note}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">+ Add</span>
                    )}
                  </td>

                  {/* Call 3 Note */}
                  <td
                    onClick={() => onEditCallNotes(lead, 3)}
                    className="py-3.5 px-4 max-w-[150px] truncate cursor-pointer hover:bg-orange-50/50 dark:hover:bg-orange-950/30"
                    title={lead.call3Note || 'Click to add Call 3 note'}
                  >
                    {lead.call3Note ? (
                      <div className="text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-orange-600 dark:text-orange-400 block font-semibold">
                          {lead.call3Date || '3rd Call'}:
                        </span>
                        <span className="truncate block">{lead.call3Note}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">+ Add</span>
                    )}
                  </td>

                  {/* Call 4 Note */}
                  <td
                    onClick={() => onEditCallNotes(lead, 4)}
                    className="py-3.5 px-4 max-w-[150px] truncate cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
                    title={lead.call4Note || 'Click to add Call 4 note'}
                  >
                    {lead.call4Note ? (
                      <div className="text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                          {lead.call4Date || '4th Call'}:
                        </span>
                        <span className="truncate block">{lead.call4Note}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">+ Add</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditCallNotes(lead)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <PhoneForwarded className="w-3 h-3" />
                        <span>Notes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteLead(lead)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
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
