/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  logout,
} from './services/auth';
import {
  fetchLeadsFromSheet,
  appendLeadToSheet,
  updateLeadInSheet,
  deleteLeadFromSheet,
  createLeadSpreadsheet,
  listUserSpreadsheets,
  getSpreadsheetDetails,
} from './services/googleSheets';
import { CallStage, Lead, SpreadsheetInfo, STAGE_CONFIG, VoiceSegregationResult } from './types/lead';
import { SignInScreen } from './components/SignInScreen';
import { Navbar } from './components/Navbar';
import { ColorLegend, StageFilter } from './components/ColorLegend';
import { LeadCard } from './components/LeadCard';
import { LeadTable } from './components/LeadTable';
import { CallNotesModal } from './components/CallNotesModal';
import { NewLeadModal } from './components/NewLeadModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SheetPickerModal } from './components/SheetPickerModal';
import { VoiceCallModal } from './components/VoiceCallModal';
import {
  Plus,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Layers,
  Mic,
  Sparkles,
} from 'lucide-react';

const LAST_SHEET_KEY = 'lead_tracker_active_sheet';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // App data state
  const [activeSheet, setActiveSheet] = useState<SpreadsheetInfo | null>(null);
  const [sheetTabId, setSheetTabId] = useState<number>(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [appError, setAppError] = useState<string | null>(null);

  // Filter & View State
  const [selectedStage, setSelectedStage] = useState<CallStage | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isVoiceLogOpen, setIsVoiceLogOpen] = useState(false);
  const [isSheetPickerOpen, setIsSheetPickerOpen] = useState(false);
  const [activeEditingLead, setActiveEditingLead] = useState<Lead | null>(null);
  const [activeEditingTab, setActiveEditingTab] = useState<1 | 2 | 3 | 4>(1);

  // Destructive Confirmation Dialog (Mandatory per Workspace Skill)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. When authenticated and token ready, load or initialize spreadsheet
  useEffect(() => {
    if (accessToken && user) {
      initializeSheet(accessToken);
    }
  }, [accessToken, user]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setLeads([]);
    setActiveSheet(null);
  };

  const initializeSheet = async (token: string) => {
    setIsLoadingLeads(true);
    setAppError(null);

    try {
      // Check if user has a saved sheet id in local storage
      const savedSheetJson = localStorage.getItem(LAST_SHEET_KEY);
      let targetSheet: SpreadsheetInfo | null = null;

      if (savedSheetJson) {
        try {
          targetSheet = JSON.parse(savedSheetJson);
          // Verify accessibility
          if (targetSheet) {
            await getSpreadsheetDetails(token, targetSheet.id);
          }
        } catch {
          targetSheet = null;
        }
      }

      // If not saved, look for existing spreadsheets in user's Drive
      if (!targetSheet) {
        const driveSheets = await listUserSpreadsheets(token);
        const existingCRM = driveSheets.find(
          (s) =>
            s.name.toLowerCase().includes('lead') ||
            s.name.toLowerCase().includes('sales') ||
            s.name.toLowerCase().includes('crm')
        );

        if (existingCRM) {
          targetSheet = existingCRM;
        } else if (driveSheets.length > 0) {
          // If they have spreadsheets, check if any has leads or offer first
          // Or create a fresh dedicated Lead Sheet
          targetSheet = await createLeadSpreadsheet(token, 'Lead Tracker - Sales CRM');
        } else {
          // No sheets at all, create a fresh dedicated one
          targetSheet = await createLeadSpreadsheet(token, 'Lead Tracker - Sales CRM');
        }
      }

      if (targetSheet) {
        setActiveSheet(targetSheet);
        localStorage.setItem(LAST_SHEET_KEY, JSON.stringify(targetSheet));
        await loadLeadsFromActiveSheet(token, targetSheet.id);
      }
    } catch (err: any) {
      console.error('Error initializing sheet:', err);
      setAppError(err.message || 'Failed to load spreadsheet. You can select or create one.');
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const loadLeadsFromActiveSheet = async (token: string, sheetId: string) => {
    setIsLoadingLeads(true);
    try {
      const { leads: fetchedLeads, sheetId: tabId } = await fetchLeadsFromSheet(token, sheetId);
      setLeads(fetchedLeads);
      setSheetTabId(tabId);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setAppError(`Could not read leads from spreadsheet: ${err.message}`);
      setSyncStatus('error');
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Switch active spreadsheet
  const handleSelectSheet = async (sheet: SpreadsheetInfo) => {
    setActiveSheet(sheet);
    localStorage.setItem(LAST_SHEET_KEY, JSON.stringify(sheet));
    if (accessToken) {
      await loadLeadsFromActiveSheet(accessToken, sheet.id);
    }
  };

  // Add Lead
  const handleAddLead = async (newLeadData: Omit<Lead, 'rowIndex'>) => {
    if (!accessToken || !activeSheet) {
      throw new Error('Not connected to a Google Sheet');
    }

    setSyncStatus('saving');
    try {
      const calculatedRow = leads.length + 2;
      const completeLead: Lead = {
        ...newLeadData,
        rowIndex: calculatedRow,
      };

      const finalRowIndex = await appendLeadToSheet(accessToken, activeSheet.id, completeLead);
      completeLead.rowIndex = finalRowIndex;

      setLeads((prev) => [...prev, completeLead]);
      setSyncStatus('synced');
    } catch (err: any) {
      setSyncStatus('error');
      throw err;
    }
  };

  // Update Lead Call Notes / Data
  const handleSaveLeadNotes = async (updatedLead: Lead) => {
    if (!accessToken || !activeSheet) return;

    setSyncStatus('saving');
    try {
      await updateLeadInSheet(accessToken, activeSheet.id, updatedLead);
      setLeads((prev) =>
        prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
      );
      setSyncStatus('synced');
    } catch (err: any) {
      setSyncStatus('error');
      setAppError(`Failed to save notes to sheet: ${err.message}`);
      throw err;
    }
  };

  // Apply accurately segregated voice update to existing or new lead
  const handleApplyVoiceUpdate = async (result: VoiceSegregationResult, matched: Lead | null) => {
    if (!accessToken || !activeSheet) {
      throw new Error('Not connected to a Google Sheet');
    }

    const todayStr = new Date().toLocaleDateString();
    const timestamp = new Date().toLocaleString();
    const callNum = result.callNumber;

    if (matched) {
      // Update matched lead with segregated fields
      const updatedLead: Lead = {
        ...matched,
        companyName: result.companyName || matched.companyName,
        directorName: result.directorName || matched.directorName,
        phone: result.companyNumber || matched.phone,
        gmail: result.email || matched.gmail,
        currentStage: result.callStage,
        lastUpdated: timestamp,
        hasNextFollowUp: result.hasNextFollowUp ?? matched.hasNextFollowUp,
        nextFollowUpDate: result.hasNextFollowUp ? result.nextFollowUpDate : matched.nextFollowUpDate,
        nextFollowUpTime: result.hasNextFollowUp ? result.nextFollowUpTime : matched.nextFollowUpTime,
        nextFollowUpType: (result.hasNextFollowUp ? (result.nextFollowUpType as any) : matched.nextFollowUpType) || 'Follow-up Call',
        freeWebsiteStatus: result.freeWebsiteStatus || matched.freeWebsiteStatus || 'Not Asked',
        call1Note: callNum === 1 ? result.callNote : matched.call1Note,
        call1Date: callNum === 1 ? todayStr : matched.call1Date,
        call2Note: callNum === 2 ? result.callNote : matched.call2Note,
        call2Date: callNum === 2 ? todayStr : matched.call2Date,
        call3Note: callNum === 3 ? result.callNote : matched.call3Note,
        call3Date: callNum === 3 ? todayStr : matched.call3Date,
        call4Note: callNum === 4 ? result.callNote : matched.call4Note,
        call4Date: callNum === 4 ? todayStr : matched.call4Date,
      };

      await handleSaveLeadNotes(updatedLead);
    } else {
      // Create a brand new lead with the segregated info
      const generatedId = `LD-${Math.floor(100 + Math.random() * 900)}`;
      const newLead: Omit<Lead, 'rowIndex'> = {
        id: generatedId,
        companyName: result.companyName,
        directorName: result.directorName || '',
        phone: result.companyNumber || '',
        gmail: result.email || '',
        currentStage: result.callStage,
        status: 'Open',
        hasNextFollowUp: Boolean(result.hasNextFollowUp || result.nextFollowUpDate),
        nextFollowUpDate: result.nextFollowUpDate || '',
        nextFollowUpTime: result.nextFollowUpTime || '',
        nextFollowUpType: (result.nextFollowUpType as any) || (result.nextFollowUpDate ? 'Follow-up Call' : 'None'),
        freeWebsiteStatus: result.freeWebsiteStatus || (result.callStage === 'CALL_1' ? 'To Send Free Website' : 'Not Asked'),
        call1Date: callNum === 1 ? todayStr : '',
        call1Note: callNum === 1 ? result.callNote : '',
        call2Date: callNum === 2 ? todayStr : '',
        call2Note: callNum === 2 ? result.callNote : '',
        call3Date: callNum === 3 ? todayStr : '',
        call3Note: callNum === 3 ? result.callNote : '',
        call4Date: callNum === 4 ? todayStr : '',
        call4Note: callNum === 4 ? result.callNote : '',
        lastUpdated: timestamp,
      };

      await handleAddLead(newLead);
    }
  };

  // Advance Stage Quick Action (e.g. Call 1 -> Call 2)
  const handleAdvanceStage = async (lead: Lead) => {
    let nextStage: CallStage = 'CALL_1';
    let nextCallNumber: 1 | 2 | 3 | 4 = 1;

    if (lead.currentStage === 'NOT_CALLED') {
      nextStage = 'CALL_1';
      nextCallNumber = 1;
    } else if (lead.currentStage === 'CALL_1') {
      nextStage = 'CALL_2';
      nextCallNumber = 2;
    } else if (lead.currentStage === 'CALL_2') {
      nextStage = 'CALL_3';
      nextCallNumber = 3;
    } else if (lead.currentStage === 'CALL_3') {
      nextStage = 'CALL_4';
      nextCallNumber = 4;
    }

    // Open call notes modal directly on the advanced tab so user can immediately write what happened!
    setActiveEditingLead({
      ...lead,
      currentStage: nextStage,
    });
    setActiveEditingTab(nextCallNumber);
  };

  // Delete Lead with Explicit Confirmation Dialog (Mandatory per Workspace Skill)
  const handleDeleteLead = (lead: Lead) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Lead: ${lead.companyName}?`,
      message: `Are you sure you want to permanently remove "${lead.companyName}" (${lead.directorName || 'Lead'}) from your Google Sheet? This will delete row ${lead.rowIndex} in Google Sheets.`,
      onConfirm: async () => {
        if (!accessToken || !activeSheet) return;
        setIsConfirmLoading(true);
        try {
          await deleteLeadFromSheet(accessToken, activeSheet.id, sheetTabId, lead.rowIndex);
          // Reload leads to re-index rows cleanly
          await loadLeadsFromActiveSheet(accessToken, activeSheet.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(`Failed to delete lead: ${err.message}`);
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  const handleEditNotes = (lead: Lead, targetCallNumber?: 1 | 2 | 3 | 4) => {
    setActiveEditingLead(lead);
    if (targetCallNumber) {
      setActiveEditingTab(targetCallNumber);
    } else {
      const step = STAGE_CONFIG[lead.currentStage].stepNumber;
      setActiveEditingTab((step > 0 ? step : 1) as 1 | 2 | 3 | 4);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Stage filter
      if (selectedStage !== 'ALL' && lead.currentStage !== selectedStage) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCompany = lead.companyName?.toLowerCase().includes(q);
        const matchesDirector = lead.directorName?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.toLowerCase().includes(q);
        const matchesGmail = lead.gmail?.toLowerCase().includes(q);
        const matchesNotes =
          lead.call1Note?.toLowerCase().includes(q) ||
          lead.call2Note?.toLowerCase().includes(q) ||
          lead.call3Note?.toLowerCase().includes(q) ||
          lead.call4Note?.toLowerCase().includes(q);

        return matchesCompany || matchesDirector || matchesPhone || matchesGmail || matchesNotes;
      }
      return true;
    });
  }, [leads, selectedStage, searchQuery]);

  // If not authenticated or token missing, render official sign-in screen
  if (needsAuth || !accessToken) {
    return (
      <SignInScreen
        onSignIn={handleSignIn}
        isLoading={isLoggingIn}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeSheet={activeSheet}
        syncStatus={syncStatus}
        viewMode={viewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onOpenSheetPicker={() => setIsSheetPickerOpen(true)}
        onOpenNewLead={() => setIsNewLeadOpen(true)}
        onOpenVoiceLog={() => setIsVoiceLogOpen(true)}
        onRefreshSheet={() => activeSheet && loadLeadsFromActiveSheet(accessToken, activeSheet.id)}
        onLogout={handleLogout}
        isRefreshing={isLoadingLeads}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error banner if any */}
        {appError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
            <span>{appError}</span>
            <button
              onClick={() => setAppError(null)}
              className="text-rose-600 hover:underline font-semibold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Color-Coded Call Stage Legend & Quick Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <ColorLegend
            leads={leads}
            selectedStage={selectedStage}
            onSelectStage={setSelectedStage}
          />

          <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredLeads.length}</strong> of{' '}
            {leads.length} leads
          </div>
        </div>

        {/* Main Leads Display */}
        {isLoadingLeads ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Loading leads from Google Sheets...
            </p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 px-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Leads in Sheet Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Add your prospective companies, director names, phone numbers, and Gmail to start tracking your 4-call journey.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsVoiceLogOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-blue-200" />
                <span>Voice Log a Call</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNewLeadOpen(true)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Manual Add</span>
              </button>
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              No leads match your current filters.
            </p>
            <button
              onClick={() => {
                setSelectedStage('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Reset filters
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEditCallNotes={handleEditNotes}
                onDeleteLead={handleDeleteLead}
                onAdvanceStage={handleAdvanceStage}
              />
            ))}
          </div>
        ) : (
          <LeadTable
            leads={filteredLeads}
            onEditCallNotes={handleEditNotes}
            onDeleteLead={handleDeleteLead}
            onAdvanceStage={handleAdvanceStage}
          />
        )}
      </main>

      {/* Modals */}
      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onAddLead={handleAddLead}
      />

      <CallNotesModal
        isOpen={Boolean(activeEditingLead)}
        lead={activeEditingLead}
        initialTab={activeEditingTab}
        onClose={() => setActiveEditingLead(null)}
        onSaveLead={handleSaveLeadNotes}
      />

      <SheetPickerModal
        isOpen={isSheetPickerOpen}
        onClose={() => setIsSheetPickerOpen(false)}
        activeSheet={activeSheet}
        accessToken={accessToken}
        onSelectSheet={handleSelectSheet}
      />

      {/* Voice-Enabled Call Segregation Modal */}
      <VoiceCallModal
        isOpen={isVoiceLogOpen}
        onClose={() => setIsVoiceLogOpen(false)}
        leads={leads}
        onApplyVoiceUpdate={handleApplyVoiceUpdate}
      />

      {/* Mandatory User Confirmation Dialog for Destructive Operations */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete from Sheet"
        cancelLabel="Keep Lead"
        isDestructive={true}
        isLoading={isConfirmLoading}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
