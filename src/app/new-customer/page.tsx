
'use client';
import { CustomerForm } from '@/components/CustomerForm';
import { handleAddCustomerAction } from '@/actions/customerActions'; // Import the Server Action

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
