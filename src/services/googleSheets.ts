/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CallStage, Lead, SpreadsheetInfo } from '../types/lead';

export const SHEET_HEADERS = [
  'ID',
  'Company Name',
  'Director Name',
  'Phone Number',
  'Gmail',
  'Call Stage',
  'Status',
  'Next Follow-up (Day, Date & Time)',
  'Scheduled Meetings',
  'Follow-up Type',
  'Free Website Status',
  'Call Notes (Latest First)',
  'Call 1 Date',
  'Call 1 Note',
  'Call 2 Date',
  'Call 2 Note',
  'Call 3 Date',
  'Call 3 Note',
  'Call 4 Date',
  'Call 4 Note',
  'Last Updated',
];

const DEFAULT_SHEET_NAME = 'Leads';

// Helper to compile all call notes in descending chronological order
export function compileDescendingNotes(lead: Partial<Lead>): string {
  const parts: string[] = [];
  if (lead.call4Note?.trim()) {
    parts.push(`[Call 4${lead.call4Date ? ` - ${lead.call4Date}` : ''}]: ${lead.call4Note.trim()}`);
  }
  if (lead.call3Note?.trim()) {
    parts.push(`[Call 3${lead.call3Date ? ` - ${lead.call3Date}` : ''}]: ${lead.call3Note.trim()}`);
  }
  if (lead.call2Note?.trim()) {
    parts.push(`[Call 2${lead.call2Date ? ` - ${lead.call2Date}` : ''}]: ${lead.call2Note.trim()}`);
  }
  if (lead.call1Note?.trim()) {
    parts.push(`[Call 1${lead.call1Date ? ` - ${lead.call1Date}` : ''}]: ${lead.call1Note.trim()}`);
  }
  return parts.join('\n\n-------------------------\n\n');
}

// Helper to convert Lead to row values array
export function leadToRowValues(lead: Lead): (string | number)[] {
  const followUpStr = lead.nextFollowUpDate
    ? `${lead.nextFollowUpDate}${lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}`
    : '';

  const meetingStr =
    lead.scheduledMeeting && lead.scheduledMeeting !== 'None'
      ? lead.scheduledMeeting
      : lead.nextFollowUpType === 'Meeting Scheduled' && lead.nextFollowUpDate
      ? `${lead.nextFollowUpDate}${lead.nextFollowUpTime ? ` @ ${lead.nextFollowUpTime}` : ''}`
      : 'None';

  const notesDescending = compileDescendingNotes(lead);

  return [
    lead.id,
    lead.companyName,
    lead.directorName,
    lead.phone,
    lead.gmail,
    lead.currentStage,
    lead.status || 'Open',
    followUpStr,
    meetingStr,
    lead.nextFollowUpType || (lead.nextFollowUpDate ? 'Follow-up Call' : 'None'),
    lead.freeWebsiteStatus || 'Not Asked',
    notesDescending,
    lead.call1Date || '',
    lead.call1Note || '',
    lead.call2Date || '',
    lead.call2Note || '',
    lead.call3Date || '',
    lead.call3Note || '',
    lead.call4Date || '',
    lead.call4Note || '',
    lead.lastUpdated || new Date().toLocaleString(),
  ];
}

// Helper to parse a row into a Lead object (supports 16, 17, 18, 19, 20, 21 column layouts)
export function rowValuesToLead(row: string[], rowIndex: number): Lead {
  const stageRaw = (row[5] || 'NOT_CALLED').trim().toUpperCase().replace(/ /g, '_');
  let currentStage: CallStage = 'NOT_CALLED';
  if (stageRaw.includes('CALL_1') || stageRaw === '1ST_CALL' || stageRaw === '1') currentStage = 'CALL_1';
  else if (stageRaw.includes('CALL_2') || stageRaw === '2ND_CALL' || stageRaw === '2') currentStage = 'CALL_2';
  else if (stageRaw.includes('CALL_3') || stageRaw === '3RD_CALL' || stageRaw === '3') currentStage = 'CALL_3';
  else if (stageRaw.includes('CALL_4') || stageRaw === '4TH_CALL' || stageRaw === '4') currentStage = 'CALL_4';
  else currentStage = 'NOT_CALLED';

  const statusRaw = (row[6] || 'Open').trim();
  let status: 'Open' | 'Interested' | 'Won' | 'Lost' = 'Open';
  if (['Open', 'Interested', 'Won', 'Lost'].includes(statusRaw)) {
    status = statusRaw as any;
  }

  let nextFollowUpDate = '';
  let nextFollowUpTime = '';
  let nextFollowUpType: any = 'None';
  let hasNextFollowUp = false;
  let scheduledMeeting = 'None';
  let freeWebsiteStatus: any = 'Not Asked';
  let unifiedNotes = '';

  let c1Date = '';
  let c1Note = '';
  let c2Date = '';
  let c2Note = '';
  let c3Date = '';
  let c3Note = '';
  let c4Date = '';
  let c4Note = '';
  let lastUpdated = '';

  if (row.length >= 21) {
    // 21-column layout with Scheduled Meetings & unified notes
    const followUpRaw = (row[7] || '').trim();
    if (followUpRaw) {
      hasNextFollowUp = true;
      if (followUpRaw.includes('@')) {
        const parts = followUpRaw.split('@');
        nextFollowUpDate = parts[0].trim();
        nextFollowUpTime = parts[1].trim();
      } else {
        nextFollowUpDate = followUpRaw;
      }
    }
    scheduledMeeting = row[8] || 'None';
    nextFollowUpType = row[9] || (hasNextFollowUp ? 'Follow-up Call' : 'None');
    freeWebsiteStatus = row[10] || 'Not Asked';
    unifiedNotes = row[11] || '';
    c1Date = row[12] || '';
    c1Note = row[13] || '';
    c2Date = row[14] || '';
    c2Note = row[15] || '';
    c3Date = row[16] || '';
    c3Note = row[17] || '';
    c4Date = row[18] || '';
    c4Note = row[19] || '';
    lastUpdated = row[20] || '';
  } else if (row.length >= 19) {
    // 19-column layout
    const followUpRaw = (row[7] || '').trim();
    if (followUpRaw) {
      hasNextFollowUp = true;
      if (followUpRaw.includes('@')) {
        const parts = followUpRaw.split('@');
        nextFollowUpDate = parts[0].trim();
        nextFollowUpTime = parts[1].trim();
      } else {
        nextFollowUpDate = followUpRaw;
      }
    }
    nextFollowUpType = row[8] || (hasNextFollowUp ? 'Follow-up Call' : 'None');
    freeWebsiteStatus = row[9] || 'Not Asked';
    if (nextFollowUpType === 'Meeting Scheduled' && nextFollowUpDate) {
      scheduledMeeting = nextFollowUpTime ? `${nextFollowUpDate} @ ${nextFollowUpTime}` : nextFollowUpDate;
    }
    c1Date = row[10] || '';
    c1Note = row[11] || '';
    c2Date = row[12] || '';
    c2Note = row[13] || '';
    c3Date = row[14] || '';
    c3Note = row[15] || '';
    c4Date = row[16] || '';
    c4Note = row[17] || '';
    lastUpdated = row[18] || '';
  } else {
    // 16 or 17 column layout
    const followUpRaw = (row[7] || '').trim();
    if (followUpRaw && followUpRaw.includes('@')) {
      hasNextFollowUp = true;
      const parts = followUpRaw.split('@');
      nextFollowUpDate = parts[0].trim();
      nextFollowUpTime = parts[1].trim();
    }
    c1Date = row[7] || '';
    c1Note = row[8] || '';
    c2Date = row[9] || '';
    c2Note = row[10] || '';
    c3Date = row[11] || '';
    c3Note = row[12] || '';
    c4Date = row[13] || '';
    c4Note = row[14] || '';
    lastUpdated = row[15] || '';
  }

  return {
    id: row[0] || `LEAD-${rowIndex}`,
    rowIndex,
    companyName: row[1] || 'Untitled Company',
    directorName: row[2] || '',
    phone: row[3] || '',
    gmail: row[4] || '',
    currentStage,
    status,
    hasNextFollowUp,
    nextFollowUpDate,
    nextFollowUpTime,
    nextFollowUpType,
    scheduledMeeting,
    freeWebsiteStatus,
    unifiedNotes,
    call1Date: c1Date,
    call1Note: c1Note,
    call2Date: c2Date,
    call2Note: c2Note,
    call3Date: c3Date,
    call3Note: c3Note,
    call4Date: c4Date,
    call4Note: c4Note,
    lastUpdated,
  };
}

/**
 * Creates a brand new, beautifully styled Google Sheet with frozen headers and initial columns.
 */
export async function createLeadSpreadsheet(
  accessToken: string,
  title = 'Lead Management CRM'
): Promise<SpreadsheetInfo> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Lead Tracker - Sales CRM',
      },
      sheets: [
        {
          properties: {
            sheetId: 0,
            title: DEFAULT_SHEET_NAME,
            gridProperties: {
              frozenRowCount: 1,
              rowCount: 100,
              columnCount: 16,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${createRes.status} ${errorText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetUrl = sheetData.spreadsheetUrl;

  // Insert header values & initial starter rows
  const initialData = [
    SHEET_HEADERS,
    [
      'LD-101',
      'Apex Horizon Technologies',
      'Marcus Sterling',
      '+1 (555) 234-5678',
      'm.sterling@apexhorizon.io',
      'CALL_1',
      'Open',
      new Date().toLocaleDateString(),
      'First intro call: Discussed their enterprise sales bottlenecks. Receptive to our demo.',
      '',
      '',
      '',
      '',
      '',
      '',
      new Date().toLocaleString(),
    ],
    [
      'LD-102',
      'BluePeak Logistics & Supply',
      'Elena Vance',
      '+1 (555) 876-5432',
      'elena.vance@bluepeaklog.com',
      'CALL_2',
      'Interested',
      new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
      'Call 1: Intro pitch sent via email, spoke with executive assistant.',
      new Date().toLocaleDateString(),
      'Call 2: Connected directly with Elena! Walked through pricing tiers. Requested a proposal.',
      '',
      '',
      '',
      '',
      new Date().toLocaleString(),
    ],
    [
      'LD-103',
      'Veritas Health Partners',
      'Dr. Robert Chen',
      '+1 (555) 432-1098',
      'r.chen@veritashealth.org',
      'NOT_CALLED',
      'Open',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      new Date().toLocaleString(),
    ],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${DEFAULT_SHEET_NAME}!A1:P4?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: initialData,
      }),
    }
  );

  // Apply visual styling to the sheet:
  // - Header row: Slate background #0f172a, white bold text, center aligned
  // - Column widths for easy reading
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Header formatting
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 16,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.12, blue: 0.2 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'LEFT',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
          },
          // Auto resize column dimensions for common fields
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 1,
                endIndex: 5,
              },
              properties: {
                pixelSize: 180,
              },
              fields: 'pixelSize',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Could not apply advanced formatting to sheet, data is intact:', err);
  }

  return {
    id: spreadsheetId,
    name: title,
    url: sheetUrl,
  };
}

/**
 * Lists user's Google Sheets from Drive to pick an existing one if desired.
 */
export async function listUserSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,webViewLink)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
    }));
  } catch (error) {
    console.error('Error listing user spreadsheets:', error);
    return [];
  }
}

/**
 * Gets sheet metadata and first tab name.
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetName: string; sheetId: number }> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to load sheet details: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const firstSheet = data.sheets?.[0]?.properties;
  return {
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheetName: firstSheet?.title || DEFAULT_SHEET_NAME,
    sheetId: firstSheet?.sheetId ?? 0,
  };
}

/**
 * Fetches all leads from the active spreadsheet.
 */
export async function fetchLeadsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName = DEFAULT_SHEET_NAME
): Promise<{ leads: Lead[]; sheetId: number }> {
  // First make sure headers exist or inspect sheets
  const meta = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const targetSheet = meta.sheetName || sheetName;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetSheet
    )}!A1:R500`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch leads: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  if (rows.length === 0) {
    // Empty sheet, initialize headers
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        targetSheet
      )}!A1:R1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_HEADERS],
        }),
      }
    );
    return { leads: [], sheetId: meta.sheetId };
  }

  // Row 0 is header, rows 1..N are data leads
  const leads: Lead[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Check if row has at least company or director name or id
    if (row && row.some((cell) => cell && cell.toString().trim().length > 0)) {
      leads.push(rowValuesToLead(row, i + 1));
    }
  }

  return { leads, sheetId: meta.sheetId };
}

/**
 * Appends a new lead to the spreadsheet.
 */
export async function appendLeadToSheet(
  accessToken: string,
  spreadsheetId: string,
  lead: Lead,
  sheetName = DEFAULT_SHEET_NAME
): Promise<number> {
  const rowValues = leadToRowValues(lead);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!A:R:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to append lead to Google Sheet: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // Extract row index from updatedRange (e.g. "Leads!A5:R5")
  const updatedRange: string = data.updates?.updatedRange || '';
  const match = updatedRange.match(/!A(\d+):/i);
  return match ? parseInt(match[1], 10) : lead.rowIndex;
}

/**
 * Updates an existing lead in the spreadsheet.
 */
export async function updateLeadInSheet(
  accessToken: string,
  spreadsheetId: string,
  lead: Lead,
  sheetName = DEFAULT_SHEET_NAME
): Promise<void> {
  if (!lead.rowIndex || lead.rowIndex < 2) {
    throw new Error('Invalid row index for lead update');
  }

  const rowValues = leadToRowValues(lead);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!A${lead.rowIndex}:R${lead.rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update lead in Google Sheet: ${res.status} ${errorText}`);
  }
}

/**
 * Deletes a lead row from the Google Sheet.
 */
export async function deleteLeadFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number
): Promise<void> {
  if (rowIndex < 2) {
    throw new Error('Cannot delete header row');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete lead from Google Sheet: ${res.status} ${errorText}`);
  }
}
