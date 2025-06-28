
import { google, type sheets_v4 } from 'googleapis';
import type { JWT } from 'google-auth-library';

// Ensure dotenv is configured to load environment variables
import dotenv from 'dotenv';
dotenv.config();


const CREDENTIALS_JSON_STRING = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!SPREADSHEET_ID) {
  console.error('Missing GOOGLE_SHEET_ID environment variable.');
  // Avoid throwing here, let functions handle the missing ID
}
if (!CREDENTIALS_JSON_STRING) {
  console.error('Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable.');
   // Avoid throwing here, let functions handle the missing credentials
}

let credentialsJson: any;
if (CREDENTIALS_JSON_STRING) {
    try {
      credentialsJson = JSON.parse(CREDENTIALS_JSON_STRING);
      // Validate essential credential fields
      if (!credentialsJson || !credentialsJson.client_email || !credentialsJson.private_key) {
          console.error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS JSON is missing required fields (client_email, private_key). Setting credentialsJson to null.');
          credentialsJson = null; // Mark as invalid
      }
    } catch (error) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:', error);
       credentialsJson = null; // Mark as invalid
    }
} else {
    credentialsJson = null; // Mark as missing/invalid
}


// Make getSheetsClient async to await auth.getClient()
export const getSheetsClient = async (): Promise<sheets_v4.Sheets | null> => {
  // Check if essential variables are present before attempting auth
  if (!SPREADSHEET_ID || !credentialsJson) {
     console.error("Cannot create Google Sheets client: Missing SPREADSHEET_ID or invalid/missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS.");
     return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentialsJson.client_email,
        private_key: credentialsJson.private_key.replace(/\\n/g, '\n'), // Ensure newlines are correctly formatted
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Await the client promise
    const authClient = await auth.getClient() as JWT;

    // Pass the resolved auth client
    return google.sheets({ version: 'v4', auth: authClient });
  } catch (error) {
      console.error("Error creating Google Sheets client:", error);
      return null;
  }
};

export { SPREADSHEET_ID }; // Export separately

export const CUSTOMER_SHEET_NAME = process.env.GOOGLE_SHEET_CUSTOMER_SHEET_NAME || 'Customers';
export const CUSTOMER_RANGE = `${CUSTOMER_SHEET_NAME}!A:E`; // Range for Customers: ID, Name, Phone, Address, Type
export const CUSTOMER_HEADERS = ['ID', 'Name', 'Phone', 'Address', 'Type'];

export const TRANSACTION_SHEET_NAME = process.env.GOOGLE_SHEET_TRANSACTION_SHEET_NAME || 'Transactions';
export const TRANSACTION_RANGE = `${TRANSACTION_SHEET_NAME}!A:H`; // Range for Transactions: TxID, CustID, ItemName, Qty, Price, Date, Type, Amount
export const TRANSACTION_HEADERS = ['TransactionID', 'CustomerID', 'ItemName', 'Quantity', 'Price', 'Date', 'Type', 'Amount'];


export async function ensureSheetExists(sheetTitle: string, headers: string[]) {
  // Get the client asynchronously
  const sheets = await getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) {
      console.error(`Cannot ensure sheet "${sheetTitle}" exists: Google Sheets client not initialized or SPREADSHEET_ID missing.`);
      // Throw an error here because this function is critical for setup
      throw new Error(`Failed to initialize Google Sheets client for sheet "${sheetTitle}". Check configuration and permissions.`);
  }

  console.log(`Ensuring sheet "${sheetTitle}" with headers: ${headers.join(', ')} exists in spreadsheet ID: ${SPREADSHEET_ID}`);
  console.log(`Using Service Account: ${credentialsJson?.client_email}`); // Log the email being used

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
        // Make sure the sheet has at least one row before updating headers if it was empty
        try {
          await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${sheetTitle}!A1` });
        } catch (e: any) {
           if (e.code === 400 && e.message.includes('Unable to parse range')) {
             // Sheet might be completely empty, append a dummy row first (optional, update usually works)
             console.log(`Sheet "${sheetTitle}" might be empty. Attempting header update directly.`);
           } else {
             throw e; // Re-throw other errors
           }
        }

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
    // Log more detailed error information
    console.error(`Error ensuring sheet "${sheetTitle}" exists or adding headers:`);
    console.error(`  Message: ${error.message}`);
    if (error.code) {
      console.error(`  Google API Error Code: ${error.code}`);
    }
    if (error.errors) {
      console.error(`  Google API Errors: ${JSON.stringify(error.errors)}`);
    }
    if (error.response?.data?.error) {
         console.error("  Google API Response Error Details:", JSON.stringify(error.response.data.error));
    }

     if (error.code === 403) {
       console.error("  Hint: Permission denied. Ensure the service account email has 'Editor' access to the Google Sheet.");
       console.error(`  Service Account Email: ${credentialsJson?.client_email}`);
       console.error(`  Spreadsheet ID: ${SPREADSHEET_ID}`);
     } else if (error.code === 404) {
       console.error("  Hint: Spreadsheet not found. Verify the GOOGLE_SHEET_ID in .env.local.");
        console.error(`  Provided Spreadsheet ID: ${SPREADSHEET_ID}`);
     }
     // Re-throw a more specific error
     throw new Error(`Failed to ensure sheet "${sheetTitle}" structure. Reason: ${error.message || 'Unknown error'}`);
  }
}

// Debounced function to prevent rapid calls during hot-reloading
let initCheckTimeout: NodeJS.Timeout | null = null;
function debounce(func: () => Promise<void>, wait: number) {
    return () => {
        if (initCheckTimeout) {
            clearTimeout(initCheckTimeout);
        }
        initCheckTimeout = setTimeout(func, wait);
    };
}

const performInitialSheetCheck = async () => {
    // Check for essential variables before proceeding
    if (SPREADSHEET_ID && credentialsJson?.client_email && credentialsJson?.private_key) {
        console.log("Initializing Google Sheets structure check...");
        try {
            // No need to await getSheetsClient here, ensureSheetExists does it
            await ensureSheetExists(CUSTOMER_SHEET_NAME, CUSTOMER_HEADERS);
            await ensureSheetExists(TRANSACTION_SHEET_NAME, TRANSACTION_HEADERS);
            console.log("Google Sheets structure check complete.");
        } catch (initError: any) {
            console.error("Failed during initial Google Sheets structure setup:", initError.message);
            // Log the underlying error if available
            if (initError.cause) {
              console.error("Underlying cause:", initError.cause);
            }
            // Potentially re-throw or handle critical setup failure
            // For now, just logging the error. The app might still partially work.
        }
    } else {
      console.warn("Skipping Google Sheet structure check due to missing SPREADSHEET_ID or essential credentials.");
    }
};

// Ensure sheets and headers exist on module load if in a server environment
// Use debounce to avoid rapid calls during development hot-reloads
if (typeof window === 'undefined') { // Ensure this runs only server-side
    const debouncedCheck = debounce(performInitialSheetCheck, 1000); // Wait 1 second
    debouncedCheck();
}
