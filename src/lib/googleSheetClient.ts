
import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';

const CREDENTIALS_JSON_STRING = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SPREADSHEET_ID) {
  throw new Error('Missing GOOGLE_SHEET_ID environment variable.');
}
if (!CREDENTIALS_JSON_STRING) {
  throw new Error(
    'Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable.'
  );
}

let credentialsJson;
try {
  credentialsJson = JSON.parse(CREDENTIALS_JSON_STRING);
} catch (error) {
  console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:', error);
  throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_CREDENTIALS format.');
}

// Validate essential credential fields
if (!credentialsJson || !credentialsJson.client_email || !credentialsJson.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS JSON is missing required fields (client_email, private_key).');
}


export const getSheetsClient = (): typeof google.sheets | null => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentialsJson.client_email,
        private_key: credentialsJson.private_key.replace(/\\n/g, '\n'), // Ensure newlines are correctly formatted
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = auth.getClient() as Promise<JWT>;

    // Cast to 'any' might be necessary depending on library versions and strictness
    // but ideally find the correct type or structure if possible.
    return google.sheets({ version: 'v4', auth: authClient as any });
  } catch (error) {
      console.error("Error creating Google Sheets client:", error);
      return null;
  }
};

export { SPREADSHEET_ID }; // Export separately

export const CUSTOMER_SHEET_NAME = process.env.GOOGLE_SHEET_CUSTOMER_SHEET_NAME || 'Customers';
export const CUSTOMER_RANGE = `${CUSTOMER_SHEET_NAME}!A:D`; // Range for Customers: ID, Name, Phone, Address
export const CUSTOMER_HEADERS = ['ID', 'Name', 'Phone', 'Address'];

export const TRANSACTION_SHEET_NAME = process.env.GOOGLE_SHEET_TRANSACTION_SHEET_NAME || 'Transactions';
export const TRANSACTION_RANGE = `${TRANSACTION_SHEET_NAME}!A:H`; // Range for Transactions: TxID, CustID, ItemName, Qty, Price, Date, Type, Amount
export const TRANSACTION_HEADERS = ['TransactionID', 'CustomerID', 'ItemName', 'Quantity', 'Price', 'Date', 'Type', 'Amount'];


export async function ensureSheetExists(sheetTitle: string, headers: string[]) {
  const sheets = getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) {
      console.error("Cannot ensure sheet exists: Google Sheets client not initialized or SPREADSHEET_ID missing.");
      return; // Exit if client/ID isn't available
  }

  console.log(`Ensuring sheet "${sheetTitle}" with headers: ${headers.join(', ')} exists in spreadsheet ID: ${SPREADSHEET_ID}`);

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === sheetTitle);

    const headerRange = `${sheetTitle}!A1:${String.fromCharCode(64 + headers.length)}1`; // e.g., A1:D1 or A1:H1

    if (!sheetExists) {
      console.log(`Sheet "${sheetTitle}" not found. Creating...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetTitle } } }],
        },
      });
      console.log(`Sheet "${sheetTitle}" created. Adding headers...`);
      // Add headers to the new sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: headerRange, // Specify the range for headers
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      console.log(`Headers added to new sheet "${sheetTitle}".`);
    } else {
      console.log(`Sheet "${sheetTitle}" found. Checking headers...`);
       // Check if headers exist and add them if they don't
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: headerRange,
      });

      const currentHeaders = headerResponse.data.values?.[0];
      const headersMatch = currentHeaders && currentHeaders.length === headers.length && currentHeaders.every((h, i) => h === headers[i]);

      if (!headersMatch) {
        console.log(`Headers in sheet "${sheetTitle}" are missing or incorrect. Updating headers...`);
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: headerRange, // Update the specific header range
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
        console.log(`Headers updated for sheet "${sheetTitle}".`);
      } else {
           console.log(`Headers in sheet "${sheetTitle}" are correct.`);
      }
    }
  } catch (error: any) {
    console.error(`Error ensuring sheet "${sheetTitle}" exists or adding headers:`, error.message);
     if (error.code === 403) {
       console.error("Permission denied. Ensure the service account email has 'Editor' access to the Google Sheet ID specified in .env.local. Service Account Email:", credentialsJson?.client_email);
     } else if (error.code === 404) {
       console.error("Spreadsheet not found. Check GOOGLE_SHEET_ID in .env.local:", SPREADSHEET_ID);
     } else if (error.response?.data?.error?.message) {
         console.error("Google API Error:", error.response.data.error.message);
     } else {
       console.error("An unexpected error occurred:", error);
     }
     // Re-throw the error so calling functions know something went wrong
     throw new Error(`Failed to ensure sheet "${sheetTitle}" structure.`);
  }
}

// Ensure sheets and headers exist on module load if in a server environment
// This runs when the server starts or the module is first imported in a server context.
if (typeof window === 'undefined') { // Ensure this runs only server-side
  (async () => {
    // Check for essential variables before proceeding
    if (SPREADSHEET_ID && credentialsJson?.client_email && credentialsJson?.private_key) {
        console.log("Initializing Google Sheets structure check...");
        try {
            await ensureSheetExists(CUSTOMER_SHEET_NAME, CUSTOMER_HEADERS);
            await ensureSheetExists(TRANSACTION_SHEET_NAME, TRANSACTION_HEADERS);
            console.log("Google Sheets structure check complete.");
        } catch (initError) {
            console.error("Failed during initial Google Sheets structure setup:", initError);
            // Depending on the desired behavior, you might want to prevent the app from starting fully here.
            // For now, we just log the error.
        }
    } else {
      console.warn("Skipping Google Sheet structure check due to missing SPREADSHEET_ID or essential credentials.");
    }
  })();
}
