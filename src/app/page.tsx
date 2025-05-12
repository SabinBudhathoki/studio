
import { getCustomersFromSheet } from '@/services/customerService';
import CustomerClientPage from '@/components/CustomerClientPage'; // New client component
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// This is now a Server Component
export default async function HomePage() {
  let customers = [];
  let errorLoadingCustomers = null;

  try {
    customers = await getCustomersFromSheet();
  } catch (error: any) {
    console.error("Error in HomePage fetching customers:", error);
    errorLoadingCustomers = error.message || "An unexpected error occurred.";
     // In case of error, customers will remain an empty array, 
     // and CustomerClientPage will display its "no customers" message
     // or we can display a more specific error message here.
  }

  if (errorLoadingCustomers) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Customers</AlertTitle>
          <AlertDescription>{errorLoadingCustomers}</AlertDescription>
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
