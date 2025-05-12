
'use server';

import type { NewCustomer, NewTransaction, NewPayment, Transaction, Customer } from '@/lib/types';
import { 
  addCustomerToSheet, 
  addTransactionToSheetService, 
  addPaymentToSheetService,
  getCustomerByIdFromSheet,
  getTransactionsForCustomerFromSheet 
} from '@/services/customerService'; // Import the service functions

export async function handleAddCustomerAction(data: NewCustomer): Promise<{ success: boolean; message: string }> {
  try {
    const newCustomer = await addCustomerToSheet(data);
    console.log('Added new customer to Google Sheet:', newCustomer.name);
    return { success: true, message: `${newCustomer.name} has been successfully added.` };
  } catch (error: any) {
    console.error('Failed to add customer via server action:', error);
    // Return the specific error message from the service if available
    return { success: false, message: error.message || 'Failed to register customer. Please try again.' };
  }
}

// Server Action for adding a transaction
export async function handleAddTransactionAction(customerId: string, data: NewTransaction): Promise<{ success: boolean; message: string; newTransaction?: Transaction }> {
  try {
    const newTx = await addTransactionToSheetService(customerId, data);
    return { success: true, message: `Credit for ${data.itemName} added.`, newTransaction: newTx };
  } catch (error: any) {
    console.error('Failed to add transaction via server action:', error);
    return { success: false, message: error.message || 'Failed to record transaction.' };
  }
}

// Server Action for adding a payment
export async function handleAddPaymentAction(customerId: string, data: NewPayment): Promise<{ success: boolean; message: string; newPayment?: Transaction }> {
  try {
    const newPay = await addPaymentToSheetService(customerId, data);
    return { success: true, message: `Payment of ₹${data.amount} added.`, newPayment: newPay };
  } catch (error: any) {
     console.error('Failed to add payment via server action:', error);
    return { success: false, message: error.message || 'Failed to record payment.' };
  }
}

// Server Action to fetch customer details
export async function fetchCustomerDetailsAction(id: string): Promise<Customer | null> {
  // 'use server' directive is at the top of the file
  try {
    return await getCustomerByIdFromSheet(id);
  } catch (error: any) {
    console.error(`Error in fetchCustomerDetailsAction for id ${id}:`, error);
    // Optionally, you can re-throw or return a specific error structure
    // For now, letting the error propagate or return null as per service
    throw error; 
  }
}

// Server Action to fetch transactions
export async function fetchCustomerTransactionsAction(id: string): Promise<Transaction[]> {
  // 'use server' directive is at the top of the file
  try {
    return await getTransactionsForCustomerFromSheet(id);
  } catch (error: any) {
    console.error(`Error in fetchCustomerTransactionsAction for id ${id}:`, error);
    // Optionally, re-throw or return empty array / specific error
    throw error;
  }
}
