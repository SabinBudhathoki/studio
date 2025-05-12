
'use server';
import type { Customer, NewCustomer, Transaction, NewTransaction, NewPayment } from '@/lib/types';
import {
  getSheetsClient,
  SPREADSHEET_ID,
  CUSTOMER_SHEET_NAME,
  CUSTOMER_RANGE,
  TRANSACTION_SHEET_NAME,
  TRANSACTION_RANGE
} from '@/lib/googleSheetClient';
import { revalidatePath } from 'next/cache';

const sheets = getSheetsClient();

function rowToCustomer(row: any[]): Customer | null {
  if (!row || row.length < 4) return null; // ID, Name, Phone, Address
  return {
    id: row[0],
    name: row[1],
    phone: row[2],
    address: row[3],
    transactions: [], // Transactions will be fetched separately
  };
}

function rowToTransaction(row: any[]): Transaction | null {
  if (!row || row.length < 8) return null;
  // TransactionID, CustomerID, ItemName, Quantity, Price, Date, Type, Amount
  return {
    id: row[0],
    customerId: row[1],
    itemName: row[2] || (row[6] === 'payment' ? 'Payment Received' : ''), // ItemName or 'Payment Received'
    quantity: row[6] === 'credit' ? parseInt(row[3], 10) : 1, // Quantity for credit
    price: row[6] === 'credit' ? parseFloat(row[4]) : 0, // Price for credit
    date: row[5],
    type: row[6] as 'credit' | 'payment',
    amount: row[6] === 'payment' ? parseFloat(row[7]) : undefined, // Amount for payment
  };
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
  if (!sheets || !SPREADSHEET_ID) {
    console.error("getCustomersFromSheet: Google Sheets client not initialized or SPREADSHEET_ID missing.");
    throw new Error('Google Sheets connection is not configured.');
  }
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_RANGE,
    });
    const rows = response.data.values;
    if (rows && rows.length > 0) {
      // Skip header row (index 0) if it exists and parse the rest
      return rows.slice(1).map(row => rowToCustomer(row)).filter(Boolean) as Customer[];
    }
    return [];
  } catch (error: any) {
    logSheetError('Fetching Customers', error, { range: CUSTOMER_RANGE });
    throw new Error(`Could not load customer data. ${error.message || 'Ensure Google Sheet is accessible and configured.'}`);
  }
}

export async function addCustomerToSheet(data: NewCustomer): Promise<Customer> {
  if (!sheets || !SPREADSHEET_ID) {
     console.error("addCustomerToSheet: Google Sheets client not initialized or SPREADSHEET_ID missing.");
     throw new Error('Google Sheets connection is not configured.');
  }

  const newId = `customer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newCustomer: Customer = { ...data, id: newId, transactions: [] };

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_SHEET_NAME, // Append to the sheet, not a specific range
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newCustomer.id, newCustomer.name, newCustomer.phone, newCustomer.address]],
      },
    });
    revalidatePath('/');
    revalidatePath('/new-customer');
    console.log(`Successfully added customer ${newCustomer.id} to sheet ${CUSTOMER_SHEET_NAME}`);
    return newCustomer;
  } catch (error: any) {
    logSheetError('Adding Customer', error, { customerName: data.name, sheet: CUSTOMER_SHEET_NAME });
    throw new Error(`Failed to add customer. ${error.message || 'Check sheet permissions and configuration.'}`);
  }
}

export async function getCustomerByIdFromSheet(id: string): Promise<Customer | null> {
  if (!sheets || !SPREADSHEET_ID) {
    console.error("getCustomerByIdFromSheet: Google Sheets client not initialized or SPREADSHEET_ID missing.");
    throw new Error('Google Sheets connection is not configured.');
  }
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_RANGE,
    });
    const rows = response.data.values;
    if (rows) {
      const customerRow = rows.slice(1).find(row => row[0] === id); // row[0] is ID, skip header
      if (customerRow) {
        return rowToCustomer(customerRow);
      }
    }
    return null;
  } catch (error: any) {
    logSheetError('Fetching Customer by ID', error, { customerId: id, range: CUSTOMER_RANGE });
    throw new Error(`Failed to fetch customer details. ${error.message || 'Check sheet access.'}`);
  }
}

export async function getTransactionsForCustomerFromSheet(customerId: string): Promise<Transaction[]> {
  if (!sheets || !SPREADSHEET_ID) {
      console.error("getTransactionsForCustomerFromSheet: Google Sheets client not initialized or SPREADSHEET_ID missing.");
      throw new Error('Google Sheets connection is not configured.');
  }
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_RANGE,
    });
    const rows = response.data.values;
    if (rows && rows.length > 0) {
      return rows
        .slice(1) // Skip header
        .filter(row => row && row.length > 1 && row[1] === customerId) // Filter by customerId (column B), ensure row is valid
        .map(row => rowToTransaction(row))
        .filter(Boolean) as Transaction[];
    }
    return [];
  } catch (error: any) {
     logSheetError('Fetching Transactions', error, { customerId: customerId, range: TRANSACTION_RANGE });
     throw new Error(`Failed to fetch transactions. ${error.message || 'Check sheet access.'}`);
  }
}

export async function addTransactionToSheetService(customerId: string, data: NewTransaction): Promise<Transaction> {
  if (!sheets || !SPREADSHEET_ID) {
      console.error("addTransactionToSheetService: Google Sheets client not initialized or SPREADSHEET_ID missing.");
      throw new Error('Google Sheets connection is not configured.');
  }

  const newTxId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newTx: Transaction = {
    ...data,
    id: newTxId,
    customerId: customerId,
    type: 'credit',
  };

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newTx.id, newTx.customerId, newTx.itemName, newTx.quantity, newTx.price, newTx.date, newTx.type, '']], // Amount is empty for credit
      },
    });
    revalidatePath(`/customers/${customerId}`);
    console.log(`Successfully added transaction ${newTx.id} for customer ${customerId} to sheet ${TRANSACTION_SHEET_NAME}`);
    return newTx;
  } catch (error: any) {
    logSheetError('Adding Transaction', error, { customerId: customerId, itemName: data.itemName, sheet: TRANSACTION_SHEET_NAME });
    throw new Error(`Failed to add transaction. ${error.message || 'Check sheet permissions.'}`);
  }
}

export async function addPaymentToSheetService(customerId: string, data: NewPayment): Promise<Transaction> {
   if (!sheets || !SPREADSHEET_ID) {
      console.error("addPaymentToSheetService: Google Sheets client not initialized or SPREADSHEET_ID missing.");
      throw new Error('Google Sheets connection is not configured.');
  }

  const newPaymentId = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newPaymentTx: Transaction = {
    id: newPaymentId,
    customerId: customerId,
    type: 'payment',
    amount: data.amount,
    date: data.date,
    itemName: 'Payment Received',
    quantity: 1,
    price: 0,
  };

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newPaymentTx.id, newPaymentTx.customerId, newPaymentTx.itemName, '', '', newPaymentTx.date, newPaymentTx.type, newPaymentTx.amount]], // Qty/Price empty for payment
      },
    });
    revalidatePath(`/customers/${customerId}`);
     console.log(`Successfully added payment ${newPaymentTx.id} for customer ${customerId} to sheet ${TRANSACTION_SHEET_NAME}`);
    return newPaymentTx;
  } catch (error: any) {
    logSheetError('Adding Payment', error, { customerId: customerId, amount: data.amount, sheet: TRANSACTION_SHEET_NAME });
    throw new Error(`Failed to add payment. ${error.message || 'Check sheet permissions.'}`);
  }
}
