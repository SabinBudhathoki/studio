
'use client';
import { CustomerForm } from '@/components/CustomerForm';
import type { NewCustomer } from '@/lib/types';
import { addCustomerToSheet } from '@/services/customerService'; // Import the service

// Server Action
async function handleAddCustomerAction(data: NewCustomer): Promise<{ success: boolean; message: string }> {
  'use server';
  try {
    const newCustomer = await addCustomerToSheet(data);
    console.log('Added new customer to Google Sheet:', newCustomer.name);
    return { success: true, message: `${newCustomer.name} has been successfully added.` };
  } catch (error: any) {
    console.error('Failed to add customer via server action:', error);
    return { success: false, message: error.message || 'Failed to register customer. Please try again.' };
  }
}

export default function NewCustomerPage() {
  return (
    <div className="py-8">
      {/* 
        The CustomerForm's onSubmit expects a Promise<void>.
        We adapt the server action's return type.
      */}
      <CustomerForm 
        onSubmit={async (data) => {
          const result = await handleAddCustomerAction(data);
          if (!result.success) {
            // The CustomerForm's internal toast will show the error.
            // To satisfy the Promise<void> and signal an error to the form's handler:
            throw new Error(result.message);
          }
          // On success, the CustomerForm handles toast and redirection.
        }} 
      />
    </div>
  );
}
