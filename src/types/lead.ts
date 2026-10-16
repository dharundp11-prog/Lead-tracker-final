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
  nextFollowUpDate?: string; // e.g. "Saturday, Oct 17, 2026"
  nextFollowUpTime?: string; // e.g. "3:00 PM"
  nextFollowUpType?: 'Follow-up Call' | 'Meeting Scheduled' | 'Free Website Review' | 'None';
  scheduledMeeting?: string; // e.g. "Saturday, Oct 17, 2026 @ 3:00 PM" or "None"
  freeWebsiteStatus?: FreeWebsiteStatus;
  unifiedNotes?: string;
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
  callDate?: string;
  companyNumber: string;
  email: string;
  callOutcome?: string;
  summary?: string;
  transcription?: string;
  hasNextFollowUp?: boolean;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  nextFollowUpType?: string;
  scheduledMeeting?: string;
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
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-800',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    pillClass: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    hexColor: '#64748b',
    description: 'Initial lead record, ready for 1st call outreach',
  },
  CALL_1: {
    label: '1st Call',
    shortLabel: 'Call 1',
    stepNumber: 1,
    bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-850',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    pillClass: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    hexColor: '#2563eb',
    description: 'First discovery/outreach call completed with notes',
  },
  CALL_2: {
    label: '2nd Call',
    shortLabel: 'Call 2',
    stepNumber: 2,
    bgClass: 'bg-slate-100/70 dark:bg-slate-850/60',
    textClass: 'text-slate-800 dark:text-slate-200',
    borderClass: 'border-slate-300 dark:border-slate-700',
    badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    pillClass: 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    hexColor: '#475569',
    description: 'Second touchpoint call, checking back or pitch follow-up',
  },
  CALL_3: {
    label: '3rd Call',
    shortLabel: 'Call 3',
    stepNumber: 3,
    bgClass: 'bg-amber-50/50 dark:bg-amber-950/20',
    textClass: 'text-amber-800 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-850',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    pillClass: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    hexColor: '#b45309',
    description: 'Third follow-up call, addressing objections or decision timeline',
  },
  CALL_4: {
    label: '4th Call',
    shortLabel: 'Call 4',
    stepNumber: 4,
    bgClass: 'bg-slate-900 dark:bg-slate-800',
    textClass: 'text-white dark:text-slate-100',
    borderClass: 'border-slate-900 dark:border-slate-700',
    badgeBg: 'bg-slate-800 text-white dark:bg-slate-700 dark:text-white',
    pillClass: 'bg-slate-900 text-white border border-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-semibold',
    hexColor: '#0f172a',
    description: 'Fourth call, final decision touchpoint or relationship closing call',
  },
};
