/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CallStage, Lead, STAGE_CONFIG } from '../types/lead';
import { Clock } from 'lucide-react';

export type StageFilter = CallStage | 'ALL' | 'FOLLOW_UP' | 'FREE_WEBSITE';

interface ColorLegendProps {
  leads: Lead[];
  selectedStage: StageFilter;
  onSelectStage: (stage: StageFilter) => void;
}

export const ColorLegend: React.FC<ColorLegendProps> = ({
  leads,
  selectedStage,
  onSelectStage,
}) => {
  const followUpCount = leads.filter((l) => Boolean(l.hasNextFollowUp || l.nextFollowUpDate)).length;
  const freeWebsiteCount = leads.filter(
    (l) =>
      l.freeWebsiteStatus === 'To Send Free Website' ||
      l.freeWebsiteStatus === 'Website Reviewing' ||
      l.freeWebsiteStatus === 'Free Website Sent'
  ).length;

  const counts: Record<CallStage | 'ALL', number> = {
    ALL: leads.length,
    NOT_CALLED: leads.filter((l) => l.currentStage === 'NOT_CALLED').length,
    CALL_1: leads.filter((l) => l.currentStage === 'CALL_1').length,
    CALL_2: leads.filter((l) => l.currentStage === 'CALL_2').length,
    CALL_3: leads.filter((l) => l.currentStage === 'CALL_3').length,
    CALL_4: leads.filter((l) => l.currentStage === 'CALL_4').length,
  };

  const stages: { stage: StageFilter; label: string; colorClass: string; activeClass: string; count: number; isSpecial?: boolean }[] = [
    {
      stage: 'ALL',
      label: 'All Leads',
      colorClass: 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
      activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow',
      count: counts.ALL,
    },
    {
      stage: 'FOLLOW_UP',
      label: 'Follow-ups & Meetings',
      colorClass: 'border-amber-400 bg-amber-50/50 text-amber-900 dark:border-amber-700 dark:text-amber-200',
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow ring-2 ring-amber-400/40',
      count: followUpCount,
      isSpecial: true,
    },
    {
      stage: 'FREE_WEBSITE',
      label: 'Free Website Deals',
      colorClass: 'border-indigo-300 bg-indigo-50/50 text-indigo-900 dark:border-indigo-700 dark:text-indigo-200',
      activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow ring-2 ring-indigo-400/40',
      count: freeWebsiteCount,
      isSpecial: true,
    },
    {
      stage: 'NOT_CALLED',
      label: 'Not Called',
      colorClass: 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
      activeClass: 'bg-slate-600 text-white border-slate-600 shadow',
      count: counts.NOT_CALLED,
    },
    {
      stage: 'CALL_1',
      label: '1st Call',
      colorClass: 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      activeClass: 'bg-blue-600 text-white border-blue-600 shadow',
      count: counts.CALL_1,
    },
    {
      stage: 'CALL_2',
      label: '2nd Call',
      colorClass: 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow',
      count: counts.CALL_2,
    },
    {
      stage: 'CALL_3',
      label: '3rd Call',
      colorClass: 'border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300',
      activeClass: 'bg-orange-600 text-white border-orange-600 shadow',
      count: counts.CALL_3,
    },
    {
      stage: 'CALL_4',
      label: '4th Call',
      colorClass: 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow',
      count: counts.CALL_4,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
        Pipeline:
      </span>
      {stages.map((st) => {
        const isSelected = selectedStage === st.stage;

        return (
          <button
            key={st.stage}
            type="button"
            onClick={() => onSelectStage(st.stage)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
              isSelected
                ? st.activeClass
                : `bg-white dark:bg-slate-900 ${st.colorClass} hover:bg-slate-50 dark:hover:bg-slate-850`
            }`}
          >
            {st.isSpecial && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            <span>{st.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected
                  ? 'bg-black/20 dark:bg-black/30 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {st.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
