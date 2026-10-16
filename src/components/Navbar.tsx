/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Plus,
  Search,
  LayoutGrid,
  ListFilter,
  LogOut,
  RefreshCw,
  FolderOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Mic,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SpreadsheetInfo } from '../types/lead';

interface NavbarProps {
  user: User | null;
  activeSheet: SpreadsheetInfo | null;
  syncStatus: 'synced' | 'saving' | 'error';
  viewMode: 'cards' | 'table';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onOpenSheetPicker: () => void;
  onOpenNewLead: () => void;
  onOpenVoiceLog: () => void;
  onRefreshSheet: () => void;
  onLogout: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeSheet,
  syncStatus,
  viewMode,
  searchQuery,
  onSearchChange,
  onViewModeChange,
  onOpenSheetPicker,
  onOpenNewLead,
  onOpenVoiceLog,
  onRefreshSheet,
  onLogout,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top line: Logo, Sheet Info, User Profile */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo & App title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-bold shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  Lead Tracker CRM
                </h1>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Google Sheets
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1st to 4th call workflow & notes
              </p>
            </div>
          </div>

          {/* Active Google Sheet Badge & Controls */}
          <div className="hidden md:flex items-center gap-2">
            {activeSheet ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={activeSheet.name}>
                  {activeSheet.name}
                </span>

                <a
                  href={activeSheet.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 font-medium pl-1 border-l border-slate-200 dark:border-slate-700"
                  title="Open live spreadsheet in Google Sheets"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={onOpenSheetPicker}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] pl-1 font-medium cursor-pointer"
                  title="Switch or create new sheet"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenSheetPicker}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Select or Create Sheet</span>
              </button>
            )}

            {/* Sync State Badge */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2 py-1">
              {syncStatus === 'saving' ? (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </div>
              ) : syncStatus === 'synced' ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>Synced</span>
                </div>
              ) : (
                <span className="text-rose-500">Sync issue</span>
              )}
            </div>
          </div>

          {/* Action buttons & User profile */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRefreshSheet}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh leads from Google Sheet"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onOpenVoiceLog}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Voice-enabled Call Log with AI segregation"
            >
              <Mic className="w-3.5 h-3.5 text-blue-200" />
              <span>Voice Log</span>
            </button>

            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open app in standalone tab (best for native microphone permissions)"
            >
              <span>Full Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onOpenNewLead}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>

            {/* User Profile avatar & logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold">
                    {(user.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Second line on mobile: Active sheet indicator */}
        <div className="md:hidden mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          {activeSheet ? (
            <div className="flex items-center gap-2 truncate">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{activeSheet.name}</span>
              <a
                href={activeSheet.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-0.5 shrink-0"
              >
                <span>Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <button onClick={onOpenSheetPicker} className="text-emerald-600 font-semibold">
              Connect Google Sheet
            </button>
          )}

          <button
            onClick={onOpenSheetPicker}
            className="text-[11px] text-slate-500 hover:underline shrink-0"
          >
            Change Sheet
          </button>
        </div>

        {/* Controls bar: Search & View toggle */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search companies, directors, phones, or notes..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
