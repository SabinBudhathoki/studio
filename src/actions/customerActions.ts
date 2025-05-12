
'use server';

import type { NewCustomer, NewTransaction, NewPayment, Transaction } from '@/lib/types';
import { 
  addCustomerToSheet, 
  addTransactionToSheetService, 
  addPaymentToSheetService 
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

// Server Action for adding a transaction (moved here)
export async function handleAddTransactionAction(customerId: string, data: NewTransaction): Promise<{ success: boolean; message: string; newTransaction?: Transaction }> {
  try {
    const newTx = await addTransactionToSheetService(customerId, data);
    return { success: true, message: `Credit for ${data.itemName} added.`, newTransaction: newTx };
  } catch (error: any) {
    console.error('Failed to add transaction via server action:', error);
    return { success: false, message: error.message || 'Failed to record transaction.' };
  }
}

// Server Action for adding a payment (moved here)
export async function handleAddPaymentAction(customerId: string, data: NewPayment): Promise<{ success: boolean; message: string; newPayment?: Transaction }> {
  try {
    const newPay = await addPaymentToSheetService(customerId, data);
    return { success: true, message: `Payment of ₹${data.amount} added.`, newPayment: newPay };
  } catch (error: any) {
     console.error('Failed to add payment via server action:', error);
    return { success: false, message: error.message || 'Failed to record payment.' };
  }
}
