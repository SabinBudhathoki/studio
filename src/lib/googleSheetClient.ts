
import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';

const CREDENTIALS_JSON_STRING = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

if (!CREDENTIALS_JSON_STRING) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable. Google Sheets integration will not work.'
    );
  } else {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable.'
    );
  }
}

let credentialsJson;
try {
  if (CREDENTIALS_JSON_STRING) {
    credentialsJson = JSON.parse(CREDENTIALS_JSON_STRING);
  }
} catch (error) {
  console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:', error);
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_CREDENTIALS format.');
  }
}

export const getSheetsClient = (): typeof google.sheets | null => {
  if (!credentialsJson) {
    return null;
  }
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentialsJson.client_email,
      private_key: credentialsJson.private_key?.replace(/\\n/g, '\n'), // Ensure newlines are correctly formatted
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = auth.getClient() as Promise<JWT>;

  return google.sheets({ version: 'v4', auth: authClient as any}); // Need to cast authClient
};

export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

export const CUSTOMER_SHEET_NAME = process.env.GOOGLE_SHEET_CUSTOMER_SHEET_NAME || 'Customers';
export const CUSTOMER_RANGE = process.env.GOOGLE_SHEET_CUSTOMER_RANGE || `${CUSTOMER_SHEET_NAME}!A:D`;
export const CUSTOMER_HEADER_RANGE = process.env.GOOGLE_SHEET_CUSTOMER_HEADER_RANGE || `${CUSTOMER_SHEET_NAME}!A1:D1`;


export const TRANSACTION_SHEET_NAME = process.env.GOOGLE_SHEET_TRANSACTION_SHEET_NAME || 'Transactions';
export const TRANSACTION_RANGE = process.env.GOOGLE_SHEET_TRANSACTION_RANGE || `${TRANSACTION_SHEET_NAME}!A:H`;
export const TRANSACTION_HEADER_RANGE = process.env.GOOGLE_SHEET_TRANSACTION_HEADER_RANGE || `${TRANSACTION_SHEET_NAME}!A1:H1`;


export async function ensureSheetExists(sheetTitle: string, headers: string[]) {
  const sheets = getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) return;

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === sheetTitle);

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetTitle } } }],
        },
      });
      // Add headers to the new sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetTitle}!A1`, // Specify the range for headers
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      console.log(`Sheet "${sheetTitle}" created with headers.`);
    } else {
       // Check if headers exist and add them if they don't
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetTitle}!A1:${String.fromCharCode(64 + headers.length)}1`,
      });
      if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetTitle}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
        console.log(`Headers added to existing sheet "${sheetTitle}".`);
      }
    }
  } catch (error) {
    console.error(`Error ensuring sheet "${sheetTitle}" exists or adding headers:`, error);
    // If the error is due to spreadsheet not found, we can't do much here.
    // If it's other errors like permission, it will be caught by callers.
     if ((error as any).code === 403) {
       console.error("Permission denied. Ensure the service account has editor access to the Google Sheet.")
     } else if ((error as any).code === 404) {
       console.error("Spreadsheet not found. Check GOOGLE_SHEET_ID.")
     }
  }
}

// Ensure sheets and headers exist on module load if in a server environment
if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') { // Avoid running this client-side or excessively in prod
  (async () => {
    if (SPREADSHEET_ID && CREDENTIALS_JSON_STRING) {
        await ensureSheetExists(CUSTOMER_SHEET_NAME, ['ID', 'Name', 'Phone', 'Address']);
        await ensureSheetExists(TRANSACTION_SHEET_NAME, ['TransactionID', 'CustomerID', 'ItemName', 'Quantity', 'Price', 'Date', 'Type', 'Amount']);
    }
  })();
}
