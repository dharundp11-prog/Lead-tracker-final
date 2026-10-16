/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Plus,
  ExternalLink,
  Check,
  Search,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { SpreadsheetInfo } from '../types/lead';
import {
  createLeadSpreadsheet,
  listUserSpreadsheets,
} from '../services/googleSheets';

interface SheetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: SpreadsheetInfo | null;
  accessToken: string;
  onSelectSheet: (sheet: SpreadsheetInfo) => void;
}

export const SheetPickerModal: React.FC<SheetPickerModalProps> = ({
  isOpen,
  onClose,
  activeSheet,
  accessToken,
  onSelectSheet,
}) => {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('Lead Tracker - Sales CRM');
  const [isCreating, setIsCreating] = useState(false);
  const [manualIdOrUrl, setManualIdOrUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && accessToken) {
      loadSheets();
    }
  }, [isOpen, accessToken]);

  const loadSheets = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const sheets = await listUserSpreadsheets(accessToken);
      setSpreadsheets(sheets);
    } catch (err: any) {
      setErrorMsg('Could not fetch existing sheets from Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setErrorMsg('');
    try {
      const newSheet = await createLeadSpreadsheet(accessToken, newTitle.trim());
      onSelectSheet(newSheet);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create spreadsheet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectManual = () => {
    if (!manualIdOrUrl.trim()) return;
    // Extract ID if URL
    let extractedId = manualIdOrUrl.trim();
    const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      extractedId = match[1];
    }

    const selected: SpreadsheetInfo = {
      id: extractedId,
      name: 'Connected Spreadsheet',
      url: `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
    };

    onSelectSheet(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Google Sheet Connection</h2>
              <p className="text-xs text-slate-500">Choose or create the spreadsheet for your leads</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Create New Sheet section */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Create A Brand New Lead Sheet
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Automatically creates a new Google Sheet pre-configured with frozen headers, formatted columns, and color-coded call stages.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Spreadsheet Title"
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? 'Creating Sheet...' : 'Create & Connect'}</span>
              </button>
            </div>
          </div>

          {/* Connect by URL or ID */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Or Connect an Existing Sheet by URL / ID:
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualIdOrUrl}
                onChange={(e) => setManualIdOrUrl(e.target.value)}
                placeholder="Paste Google Sheet URL or ID (e.g. 1BxiMVs0XRA5...)"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleConnectManual}
                disabled={!manualIdOrUrl.trim()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40"
              >
                Connect
              </button>
            </div>
          </div>

          {/* List of Sheets in Drive */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Recent Spreadsheets in Your Drive:
              </h3>
              <button
                type="button"
                onClick={loadSheets}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh list
              </button>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading sheets from Drive...</div>
            ) : spreadsheets.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                No existing spreadsheets found. Create one above!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {spreadsheets.map((s) => {
                  const isActive = activeSheet?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono truncate block mt-0.5">
                          ID: {s.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Open spreadsheet in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {isActive ? (
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSheet(s);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors cursor-pointer"
                          >
                            Use This
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
