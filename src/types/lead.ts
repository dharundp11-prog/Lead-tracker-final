/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CallStage = 'NOT_CALLED' | 'CALL_1' | 'CALL_2' | 'CALL_3' | 'CALL_4';

export type CallOutcome =
  | 'Connected & Discussed'
  | 'Left Voicemail'
  | 'No Answer / Ringing'
  | 'Gatekeeper Blocked'
  | 'Follow-up Scheduled'
  | 'Interested / Demo Booked'
  | 'Not Interested / Disqualified';

export type FreeWebsiteStatus =
  | 'Not Asked'
  | 'To Send Free Website'
  | 'Free Website Sent'
  | 'Website Reviewing'
  | 'Declined / Not Needed';

export interface CallEntry {
  date: string;
  note: string;
  outcome?: CallOutcome;
}

export interface Lead {
  id: string;
  rowIndex: number; // 2-based row index in Google Sheet
  companyName: string;
  directorName: string;
  phone: string;
  gmail: string;
  currentStage: CallStage;
  status: 'Open' | 'Interested' | 'Won' | 'Lost';
  hasNextFollowUp?: boolean;
  nextFollowUpDate?: string; // e.g. "Tomorrow (Friday, Oct 17)" or "Monday"
  nextFollowUpTime?: string; // e.g. "3:00 PM"
  nextFollowUpType?: 'Follow-up Call' | 'Meeting Scheduled' | 'Free Website Review' | 'None';
  freeWebsiteStatus?: FreeWebsiteStatus;
  call1Date: string;
  call1Note: string;
  call2Date: string;
  call2Note: string;
  call3Date: string;
  call3Note: string;
  call4Date: string;
  call4Note: string;
  lastUpdated: string;
}

export interface VoiceSegregationResult {
  companyName: string;
  directorName: string;
  callNumber: 1 | 2 | 3 | 4;
  callStage: CallStage;
  callLabel: string;
  callNote: string;
  companyNumber: string;
  email: string;
  callOutcome?: string;
  summary?: string;
  transcription?: string;
  hasNextFollowUp?: boolean;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  nextFollowUpType?: string;
  freeWebsiteStatus?: FreeWebsiteStatus;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}

export const STAGE_CONFIG: Record<
  CallStage,
  {
    label: string;
    shortLabel: string;
    stepNumber: number;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeBg: string;
    pillClass: string;
    hexColor: string;
    description: string;
  }
> = {
  NOT_CALLED: {
    label: 'Not Called Yet',
    shortLabel: 'Uncontacted',
    stepNumber: 0,
    bgClass: 'bg-slate-50 dark:bg-slate-900/50',
    textClass: 'text-slate-700 dark:text-slate-300',
    borderClass: 'border-slate-200 dark:border-slate-700',
    badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    pillClass: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    hexColor: '#64748b',
    description: 'Initial lead record, ready for 1st call outreach',
  },
  CALL_1: {
    label: '1st Call',
    shortLabel: 'Call 1',
    stepNumber: 1,
    bgClass: 'bg-blue-50/70 dark:bg-blue-950/20',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    pillClass: 'bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700',
    hexColor: '#2563eb',
    description: 'First discovery/outreach call completed with notes',
  },
  CALL_2: {
    label: '2nd Call',
    shortLabel: 'Call 2',
    stepNumber: 2,
    bgClass: 'bg-amber-50/70 dark:bg-amber-950/20',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    pillClass: 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700',
    hexColor: '#d97706',
    description: 'Second touchpoint call, checking back or pitch follow-up',
  },
  CALL_3: {
    label: '3rd Call',
    shortLabel: 'Call 3',
    stepNumber: 3,
    bgClass: 'bg-orange-50/70 dark:bg-orange-950/20',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-800',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
    pillClass: 'bg-orange-50 text-orange-700 border border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700',
    hexColor: '#ea580c',
    description: 'Third follow-up call, addressing objections or decision timeline',
  },
  CALL_4: {
    label: '4th Call',
    shortLabel: 'Call 4',
    stepNumber: 4,
    bgClass: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700',
    hexColor: '#059669',
    description: 'Fourth call, final decision touchpoint or relationship closing call',
  },
};
