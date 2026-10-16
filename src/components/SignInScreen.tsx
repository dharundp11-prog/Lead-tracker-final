/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhoneCall, Table, CheckCircle2, ShieldCheck, ArrowRight, FileSpreadsheet } from 'lucide-react';

interface SignInScreenProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onSignIn, isLoading, error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Lead Tracker CRM</h1>
            <p className="text-xs text-emerald-400 font-medium">Powered by Google Sheets</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
          Simple 4-Call Lead Management
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Manage your prospects with company name, director name, direct phone, and Gmail. Track whether you are on Call 1, 2, 3, or 4 and save detailed notes for every single conversation.
        </p>

        {/* Feature Highlights */}
        <div className="space-y-3 mb-8 bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-start gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              1
            </div>
            <span><strong>Color-Coded Call Stages:</strong> Instant visual indicators for 1st, 2nd, 3rd, and 4th calls.</span>
          </div>

          <div className="flex items-start gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              2
            </div>
            <span><strong>Dedicated Call Notes:</strong> Record what actually happened on each specific touchpoint.</span>
          </div>

          <div className="flex items-start gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              3
            </div>
            <span><strong>Direct Google Sheets Sync:</strong> All records are saved in your personal Google Spreadsheet.</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Official Google Sign-In Button */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg px-4 flex items-center justify-center gap-3 transition-colors shadow-md border border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="animate-spin h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Connecting with Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="font-medium text-slate-800">Sign in with Google</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-500 mt-4 text-center">
            Your lead data is stored in your personal Google Sheets account with full privacy.
          </p>
        </div>
      </div>
    </div>
  );
};
