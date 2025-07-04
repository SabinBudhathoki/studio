
'use server';
import type { Customer, NewCustomer, Transaction, NewTransaction, NewPayment } from '@/lib/types';
import {
  getSheetsClient, // Import the async function
  SPREADSHEET_ID,
  CUSTOMER_SHEET_NAME,
  CUSTOMER_RANGE,
  TRANSACTION_SHEET_NAME,
  TRANSACTION_RANGE
} from '@/lib/googleSheetClient';
import { revalidatePath } from 'next/cache';
import type { sheets_v4 } from 'googleapis';

// Removed top-level: const sheets = getSheetsClient();

function rowToCustomer(row: any[]): Customer | null {
  if (!row || row.length < 4) return null; // ID, Name, Phone, Address, [Type]
  const customerType = row[4];
  return {
    id: row[0],
    name: row[1],
    phone: row[2] || undefined, // Handle empty phone cell
    address: row[3],
    customerType: customerType === 'army' ? 'army' : 'normal', // Default to normal
    transactions: [], // Transactions will be fetched separately
  };
}


function rowToTransaction(row: any[]): Transaction | null {
  if (!row || row.length < 7) return null;
  // Columns: 0:TransactionID, 1:CustomerID, 2:ItemName, 3:Quantity, 4:Price, 5:Date, 6:Type, 7:Amount

  const id = row[0];
  const customerId = row[1];
  const type = row[6];
  const dateValue = row[5];

  if (!id || !customerId || !type || !dateValue) {
    return null; // A transaction must have these fields
  }
  
  let date: Date;

  // Google Sheets stores dates as serial numbers when using UNFORMATTED_VALUE.
  // The number represents days since 1899-12-30.
  if (typeof dateValue === 'number' && dateValue > 0) {
    // Convert Excel/Sheets serial date to JS Date.
    date = new Date((dateValue - 25569) * 86400 * 1000);
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    return null; // Invalid date format
  }

  // Final check to ensure we have a valid date object
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date parsed for transaction ${id}. Original value: ${dateValue}`);
    return null;
  }
  
  const isoDateString = date.toISOString();

  if (type === 'credit') {
    const itemName = row[2];
    const quantity = parseFloat(row[3]);
    const price = parseFloat(row[4]);

    if (!itemName || isNaN(quantity) || isNaN(price)) {
      console.warn(`Skipping invalid credit transaction row: ${JSON.stringify(row)}`);
      return null;
    }

    return {
      id: id,
      customerId: customerId,
      itemName: itemName,
      quantity: quantity,
      price: price,
      date: isoDateString,
      type: 'credit',
    };
  } else if (type === 'payment') {
    const amount = parseFloat(row[7]);
    if (isNaN(amount)) {
      console.warn(`Skipping invalid payment transaction row: ${JSON.stringify(row)}`);
      return null;
    }

    return {
      id: id,
      customerId: customerId,
      itemName: 'Payment Received',
      quantity: 1,
      price: 0,
      date: isoDateString,
      type: 'payment',
      amount: amount,
    };
  }

  return null; // Row is not a valid transaction type
}



// Helper function to log detailed errors
function logSheetError(operation: string, error: any, context = {}) {
    console.error(`Error during Google Sheet operation: ${operation}`);
    if (Object.keys(context).length > 0) {
      console.error(`  Context: ${JSON.stringify(context)}`);
    }
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
       console.error("  Hint: Permission denied. Ensure the service account email has 'Editor' access to the Google Sheet and the API is enabled.");
     } else if (error.code === 404) {
       console.error("  Hint: Spreadsheet or Sheet not found. Verify GOOGLE_SHEET_ID and sheet names.");
     } else if (error.code === 400 && error.message?.includes('Unable to parse range')) {
       console.error("  Hint: Invalid sheet name or range specified.");
     }
}


export async function getCustomersFromSheet(): Promise<Customer[]> {
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.error("getCustomersFromSheet: Google Sheets client is not available. This is likely due to missing/invalid GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, or malformed credentials JSON. Please check server logs from 'googleSheetClient.ts' for more specific details.");
    throw new Error('Google Sheets client could not be initialized. Verify configuration (Sheet ID, Service Account Credentials) and check server logs.');
  }
  try {
    console.log(`Fetching customers from range: ${CUSTOMER_RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_RANGE,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const rows = response.data.values;
     console.log(`Received ${rows ? rows.length : 0} rows for customers.`);
    if (rows && rows.length > 1) { // Check for > 1 to ensure there's data beyond header
      // Skip header row (index 0) and parse the rest
      const customers = rows.slice(1)
                          .map(row => rowToCustomer(row))
                          .filter(Boolean) as Customer[];
      console.log(`Successfully parsed ${customers.length} customers.`);
      return customers;
    }
    console.log('No customer data found (or only header row exists).');
    return [];
  } catch (error: any) {
    logSheetError('Fetching Customers', error, { range: CUSTOMER_RANGE });
    throw new Error(`Could not load customer data. ${error.message || 'Ensure Google Sheet is accessible and configured.'}`);
  }
}

export async function getAllTransactionsFromSheet(): Promise<Transaction[]> {
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.error("getAllTransactionsFromSheet: Google Sheets client is not available. This is likely due to missing/invalid GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, or malformed credentials JSON. Please check server logs from 'googleSheetClient.ts' for more specific details.");
    throw new Error('Google Sheets client could not be initialized. Verify configuration (Sheet ID, Service Account Credentials) and check server logs.');
  }
  try {
    console.log(`Fetching all transactions from range: ${TRANSACTION_RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_RANGE,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const rows = response.data.values;
    console.log(`Received ${rows ? rows.length : 0} total rows for transactions.`);
    if (rows && rows.length > 1) {
      const transactions = rows
        .slice(1)
        .map(row => rowToTransaction(row))
        .filter(Boolean) as Transaction[];
      console.log(`Successfully parsed ${transactions.length} total transactions.`);
      return transactions;
    }
    console.log('No transaction data found (or only header row exists).');
    return [];
  } catch (error: any) {
    logSheetError('Fetching All Transactions', error, { range: TRANSACTION_RANGE });
    throw new Error(`Failed to fetch all transactions. ${error.message || 'Check sheet access.'}`);
  }
}

export async function addCustomerToSheet(data: NewCustomer): Promise<Customer> {
  const sheets = await getSheetsClient();
  if (!sheets) {
     console.error("addCustomerToSheet: Google Sheets client is not available. This is likely due to missing/invalid GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, or malformed credentials JSON. Please check server logs from 'googleSheetClient.ts' for more specific details.");
     throw new Error('Google Sheets client could not be initialized. Verify configuration (Sheet ID, Service Account Credentials) and check server logs.');
  }

  const newId = `customer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newCustomer: Customer = { ...data, id: newId, transactions: [] };

  try {
    console.log(`Attempting to add customer ${newCustomer.id} to sheet ${CUSTOMER_SHEET_NAME}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_SHEET_NAME, 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newCustomer.id, newCustomer.name, newCustomer.phone || '', newCustomer.address, newCustomer.customerType]],
      },
    });
    console.log(`Successfully added customer ${newCustomer.id}. Revalidating paths...`);
    revalidatePath('/'); 
    revalidatePath('/new-customer'); 
    return newCustomer;
  } catch (error: any) {
    logSheetError('Adding Customer', error, { customerName: data.name, sheet: CUSTOMER_SHEET_NAME });
    throw new Error(`Failed to add customer. ${error.message || 'Check sheet permissions and configuration.'}`);
  }
}

export async function getCustomerByIdFromSheet(id: string): Promise<Customer | null> {
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.error("getCustomerByIdFromSheet: Google Sheets client is not available. This is likely due to missing/invalid GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, or malformed credentials JSON. Please check server logs from 'googleSheetClient.ts' for more specific details.");
    throw new Error('Google Sheets client could not be initialized. Verify configuration (Sheet ID, Service Account Credentials) and check server logs.');
  }
  try {
    console.log(`Fetching customer by ID ${id} from range: ${CUSTOMER_RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_RANGE,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const rows = response.data.values;
    if (rows) {
      console.log(`Searching ${rows.length -1} customer rows for ID ${id}`);
      const customerRow = rows.slice(1).find(row => row && row.length > 0 && row[0] === id); 
      if (customerRow) {
         console.log(`Found customer row for ID ${id}`);
        return rowToCustomer(customerRow);
      } else {
           console.log(`Customer row with ID ${id} not found.`);
      }
    } else {
        console.log(`No rows received when fetching customer ID ${id}.`);
    }
    return null;
  } catch (error: any) {
    logSheetError('Fetching Customer by ID', error, { customerId: id, range: CUSTOMER_RANGE });
    throw new Error(`Failed to fetch customer details for ID ${id}. ${error.message || 'Check sheet access.'}`);
  }
}

export async function getTransactionsForCustomerFromSheet(customerId: string): Promise<Transaction[]> {
  const sheets = await getSheetsClient();
  if (!sheets) {
      console.error("getTransactionsForCustomerFromSheet: Google Sheets client is not available. This is likely due to missing/invalid GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, or malformed credentials JSON. Please check server logs from 'googleSheetClient.ts' for more specific details.");
      throw new Error('Google Sheets client could not be initialized. Verify configuration (Sheet ID, Service Account Credentials) and check server logs.');
  }
  try {
    console.log(`Fetching transactions for customer ID ${customerId} from range: ${TRANSACTION_RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_RANGE,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const rows = response.data.values;
    console.log(`Received ${rows ? rows.length : 0} rows for transactions.`);
    if (rows && rows.length > 1) { 
      const transactions = rows
        .slice(1) 
        .filter(row => row && row.length > 1 && row[1] === customerId) 
        .map(row => rowToTransaction(row))
        .filter(Boolean) as Transaction[]; 
       console.log(`Found and parsed ${transactions.length} transactions for customer ID ${customerId}.`);
      return transactions;
    }
     console.log(`No transaction data found for customer ID ${customerId} (or only header row exists).`);
    return [];
  } catch (error: any) {
     logSheetError('Fetching Transactions', error, { customerId: customerId, range: TRANSACTION_RANGE });
     throw new Error(`Failed to fetch transactions for customer ${customerId}. ${error.message || 'Check sheet access.'}`);
  }
}

export async function addTransactionToSheetService(customerId: string, data: NewTransaction): Promise<Transaction> {
  const sheets = await getSheetsClient();
  if (!sheets) {
      console.error("addTransactionToSheetService: Google Sheets client is not available. This is likely due to missing/invalid GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, or malformed credentials JSON. Please check server logs from 'googleSheetClient.ts' for more specific details.");
      throw new Error('Google Sheets client could not be initialized. Verify configuration (Sheet ID, Service Account Credentials) and check server logs.');
  }

  const newTxId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newTx: Transaction = {
    ...data,
    id: newTxId,
    customerId: customerId,
    type: 'credit',
    quantity: Number(data.quantity),
    price: Number(data.price),
  };

  if (isNaN(newTx.quantity) || isNaN(newTx.price)) {
     console.error(`Invalid transaction data before sending: Qty=${data.quantity}, Price=${data.price}`);
     throw new Error('Invalid quantity or price provided for the transaction.');
  }


  try {
     console.log(`Attempting to add transaction ${newTx.id} for customer ${customerId} to sheet ${TRANSACTION_SHEET_NAME}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newTx.id, newTx.customerId, newTx.itemName, newTx.quantity, newTx.price, newTx.date, newTx.type, '']], 
      },
    });
    console.log(`Successfully added transaction ${newTx.id}. Revalidating path /customers/${customerId}...`);
    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/');
    return newTx;
  } catch (error: any) {
    logSheetError('Adding Transaction', error, { customerId: customerId, itemName: data.itemName, sheet: TRANSACTION_SHEET_NAME });
    throw new Error(`Failed to add transaction. ${error.message || 'Check sheet permissions.'}`);
  }
}

export async function addPaymentToSheetService(customerId: string, data: NewPayment): Promise<Transaction> {
  const sheets = await getSheetsClient();
   if (!sheets) {
      console.error("addPaymentToSheetService: Google Sheets client is not available. This is likely due to missing/invalid GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, or malformed credentials JSON. Please check server logs from 'googleSheetClient.ts' for more specific details.");
      throw new Error('Google Sheets client could not be initialized. Verify configuration (Sheet ID, Service Account Credentials) and check server logs.');
  }

  const newPaymentId = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newPaymentTx: Transaction = {
    id: newPaymentId,
    customerId: customerId,
    type: 'payment',
    amount: Number(data.amount), 
    date: data.date,
    itemName: 'Payment Received', 
    quantity: 1, 
    price: 0, 
  };

   if (isNaN(newPaymentTx.amount as number) || (newPaymentTx.amount as number) <= 0) {
        console.error(`Invalid payment amount before sending: Amount=${data.amount}`);
        throw new Error('Invalid payment amount provided.');
   }


  try {
    console.log(`Attempting to add payment ${newPaymentTx.id} for customer ${customerId} to sheet ${TRANSACTION_SHEET_NAME}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newPaymentTx.id, newPaymentTx.customerId, newPaymentTx.itemName, '', '', newPaymentTx.date, newPaymentTx.type, newPaymentTx.amount]], 
      },
    });
    console.log(`Successfully added payment ${newPaymentTx.id}. Revalidating path /customers/${customerId}...`);
    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/');
    return newPaymentTx;
  } catch (error: any) {
    logSheetError('Adding Payment', error, { customerId: customerId, amount: data.amount, sheet: TRANSACTION_SHEET_NAME });
    throw new Error(`Failed to add payment. ${error.message || 'Check sheet permissions.'}`);
  }
}


export async function deleteCustomerFromSheet(customerId: string): Promise<void> {
  const sheets = await getSheetsClient();
  if (!sheets) {
    throw new Error('Google Sheets client could not be initialized. Verify configuration.');
  }

  try {
    console.log(`Starting deletion process for customer ID: ${customerId}`);
    
    // 1. Get spreadsheet metadata to find sheet IDs
    const spreadsheetMeta = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });
    
    const customerSheetInfo = spreadsheetMeta.data.sheets?.find(s => s.properties?.title === CUSTOMER_SHEET_NAME);
    const transactionSheetInfo = spreadsheetMeta.data.sheets?.find(s => s.properties?.title === TRANSACTION_SHEET_NAME);

    if (!customerSheetInfo?.properties?.sheetId || !transactionSheetInfo?.properties?.sheetId) {
        throw new Error('Could not find required sheet IDs for Customers or Transactions.');
    }
    const customerSheetId = customerSheetInfo.properties.sheetId;
    const transactionSheetId = transactionSheetInfo.properties.sheetId;

    // 2. Get all data from both sheets
    const [customerData, transactionData] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: CUSTOMER_SHEET_NAME, valueRenderOption: 'UNFORMATTED_VALUE' }),
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: TRANSACTION_SHEET_NAME, valueRenderOption: 'UNFORMATTED_VALUE' })
    ]);

    const customerRows = customerData.data.values || [];
    const transactionRows = transactionData.data.values || [];

    const requests: sheets_v4.Schema$Request[] = [];

    // 3. Find customer row index to delete
    // The row index is 0-based. We skip header (index 0).
    const customerRowToDelete = customerRows.slice(1).findIndex(row => row[0] === customerId);
    if (customerRowToDelete !== -1) {
        // +1 to account for the sliced header row
        const actualIndex = customerRowToDelete + 1;
        requests.push({
            deleteDimension: {
                range: {
                    sheetId: customerSheetId,
                    dimension: 'ROWS',
                    startIndex: actualIndex,
                    endIndex: actualIndex + 1,
                },
            },
        });
        console.log(`Found customer at row ${actualIndex + 1}. Marked for deletion.`);
    }

    // 4. Find all transaction row indices to delete
    transactionRows.slice(1).forEach((row, index) => {
        if (row[1] === customerId) {
            // +1 to account for the sliced header row
            const actualIndex = index + 1;
            requests.push({
                deleteDimension: {
                    range: {
                        sheetId: transactionSheetId,
                        dimension: 'ROWS',
                        startIndex: actualIndex,
                        endIndex: actualIndex + 1,
                    },
                },
            });
             console.log(`Found transaction for customer at row ${actualIndex + 1}. Marked for deletion.`);
        }
    });

    if (requests.length > 0) {
        // 5. Sort requests in descending order of startIndex to avoid index shifting issues
        requests.sort((a, b) => {
            const indexA = a.deleteDimension?.range?.startIndex ?? 0;
            const indexB = b.deleteDimension?.range?.startIndex ?? 0;
            return indexB - indexA;
        });
        
        console.log(`Executing batch update with ${requests.length} deletion requests.`);
        // 6. Execute batch update
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests,
            },
        });
        console.log(`Successfully deleted customer ${customerId} and their transactions.`);
    } else {
        console.log(`No customer or transactions found for ID ${customerId}. Nothing to delete.`);
    }
  } catch (error: any) {
    logSheetError('Deleting Customer', error, { customerId });
    throw new Error(`Failed to delete customer ${customerId}. ${error.message || 'Check sheet permissions.'}`);
  }
}

    
