/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CallStage, Lead } from '../types/lead';

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

  const filters: { stage: StageFilter; label: string; count: number }[] = [
    { stage: 'ALL', label: 'All Leads', count: counts.ALL },
    { stage: 'FOLLOW_UP', label: 'Follow-ups & Meetings', count: followUpCount },
    { stage: 'FREE_WEBSITE', label: 'Free Website Deals', count: freeWebsiteCount },
    { stage: 'NOT_CALLED', label: 'Not Called', count: counts.NOT_CALLED },
    { stage: 'CALL_1', label: 'Call 1', count: counts.CALL_1 },
    { stage: 'CALL_2', label: 'Call 2', count: counts.CALL_2 },
    { stage: 'CALL_3', label: 'Call 3', count: counts.CALL_3 },
    { stage: 'CALL_4', label: 'Call 4', count: counts.CALL_4 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1.5 uppercase tracking-wider text-[11px]">
        Pipeline:
      </span>
      {filters.map((item) => {
        const isSelected = selectedStage === item.stage;

        return (
          <button
            key={item.stage}
            type="button"
            onClick={() => onSelectStage(item.stage)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              isSelected
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                isSelected
                  ? 'bg-white/20 dark:bg-slate-800/20 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
