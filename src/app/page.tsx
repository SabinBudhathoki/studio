
import { getCustomersFromSheet } from '@/services/customerService';
import CustomerClientPage from '@/components/CustomerClientPage'; // New client component
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// This is now a Server Component
export default async function HomePage() {
  let customers = [];
  let errorLoadingCustomers: string | null = null;

  try {
    customers = await getCustomersFromSheet();
  } catch (error: any) {
    console.error("Error in HomePage fetching customers:", error);
    // Use the error message thrown by the service function
    errorLoadingCustomers = error.message || "An unexpected error occurred while loading customer data.";
     // In case of error, customers will remain an empty array,
     // and CustomerClientPage will display its "no customers" message,
     // but we'll show the main error here first.
  }

  if (errorLoadingCustomers) {
    return (
      <div className="space-y-8 py-8"> {/* Added padding */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Customers</AlertTitle>
          <AlertDescription>{errorLoadingCustomers}</AlertDescription>
           {/* Provide hints based on common errors */}
           {errorLoadingCustomers.includes('Permission denied') && (
             <p className="text-sm mt-2">Hint: Ensure the service account email has 'Editor' access to the Google Sheet.</p>
           )}
           {errorLoadingCustomers.includes('Not found') && (
             <p className="text-sm mt-2">Hint: Verify the GOOGLE_SHEET_ID in your .env.local file is correct and the sheet exists.</p>
           )}
            {errorLoadingCustomers.includes('configured') && (
             <p className="text-sm mt-2">Hint: Check your .env.local file for correct Google Sheet ID and Service Account Credentials.</p>
           )}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CustomerClientPage initialCustomers={customers} />
    </div>
  );
}
