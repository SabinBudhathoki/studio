
'use server';

import type { NewCustomer } from '@/lib/types';
import { addCustomerToSheet } from '@/services/customerService'; // Import the service

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
