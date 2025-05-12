
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


export async function getCustomersFromSheet(): Promise<Customer[]> {
  if (!sheets || !SPREADSHEET_ID) {
    console.error("Google Sheets client not initialized or SPREADSHEET_ID missing.");
    if (process.env.NODE_ENV === 'development') {
        // In dev, it's helpful to know if mock data would be returned, but we must signal an error
        // throw new Error("Sheets client error in dev, cannot fetch customers."); 
        // For now, let's return empty to avoid breaking UI completely, but log error
        console.error("Returning empty customer list due to Sheets client issue.");
        return [];
    }
    throw new Error('Could not connect to Google Sheets to fetch customers.');
  }
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_RANGE, // Read the whole sheet, skip header if any
    });
    const rows = response.data.values;
    if (rows && rows.length > 0) {
      // Skip header row (index 0) if it exists and parse the rest
      return rows.slice(1).map(row => rowToCustomer(row)).filter(Boolean) as Customer[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching customers from Google Sheet:', error);
    // Provide a more user-friendly error message or re-throw a custom error
    throw new Error('Could not load customer data. Please ensure the Google Sheet is accessible, correctly configured in your .env.local, and shared with the service account email.');
  }
}

export async function addCustomerToSheet(data: NewCustomer): Promise<Customer> {
  if (!sheets || !SPREADSHEET_ID) throw new Error('Google Sheets client not initialized.');
  
  const newId = `customer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newCustomer: Customer = { ...data, id: newId, transactions: [] };

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: CUSTOMER_SHEET_NAME, // Append to the sheet, not a specific range, to add a new row
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newCustomer.id, newCustomer.name, newCustomer.phone, newCustomer.address]],
      },
    });
    revalidatePath('/');
    revalidatePath('/new-customer');
    return newCustomer;
  } catch (error) {
    console.error('Error adding customer to Google Sheet:', error);
    throw new Error('Failed to add customer to Google Sheet.');
  }
}

export async function getCustomerByIdFromSheet(id: string): Promise<Customer | null> {
  if (!sheets || !SPREADSHEET_ID) throw new Error('Google Sheets client not initialized.');
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
  } catch (error) {
    console.error(`Error fetching customer ${id} from Google Sheet:`, error);
    throw new Error('Failed to fetch customer details from Google Sheet.');
  }
}

export async function getTransactionsForCustomerFromSheet(customerId: string): Promise<Transaction[]> {
  if (!sheets || !SPREADSHEET_ID) throw new Error('Google Sheets client not initialized.');
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: TRANSACTION_RANGE,
    });
    const rows = response.data.values;
    if (rows && rows.length > 0) {
      return rows
        .slice(1) // Skip header
        .filter(row => row[1] === customerId) // Filter by customerId (column B)
        .map(row => rowToTransaction(row))
        .filter(Boolean) as Transaction[];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching transactions for customer ${customerId} from Google Sheet:`, error);
    throw new Error('Failed to fetch transactions from Google Sheet.');
  }
}

export async function addTransactionToSheetService(customerId: string, data: NewTransaction): Promise<Transaction> {
  if (!sheets || !SPREADSHEET_ID) throw new Error('Google Sheets client not initialized.');
  
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
    return newTx;
  } catch (error) {
    console.error('Error adding transaction to Google Sheet:', error);
    throw new Error('Failed to add transaction to Google Sheet.');
  }
}

export async function addPaymentToSheetService(customerId: string, data: NewPayment): Promise<Transaction> {
  if (!sheets || !SPREADSHEET_ID) throw new Error('Google Sheets client not initialized.');

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
    return newPaymentTx;
  } catch (error) {
    console.error('Error adding payment to Google Sheet:', error);
    throw new Error('Failed to add payment to Google Sheet.');
  }
}
