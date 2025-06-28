
import type { Customer, Transaction } from '@/lib/types'; // Import Customer type
import { getCustomersFromSheet, getAllTransactionsFromSheet } from '@/services/customerService';
import CustomerClientPage from '@/components/CustomerClientPage'; // New client component
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { calculateBalance } from '@/lib/mockData';
import { differenceInDays } from 'date-fns';

// This is now a Server Component
export default async function HomePage() {
  let customers: Customer[] = [];
  let overdueCustomers: Customer[] = [];
  let errorLoadingCustomers: string | null = null;

  try {
    // Fetch all customers and all transactions in parallel
    [customers, errorLoadingCustomers] = await getCustomersFromSheet()
      .then(c => [c, null] as [Customer[], null])
      .catch(e => [[], e.message] as [Customer[], string]);

    if (errorLoadingCustomers) {
      throw new Error(errorLoadingCustomers);
    }

    const allTransactions = await getAllTransactionsFromSheet();
    
    // Create a map for efficient transaction lookup
    const transactionsByCustomer = allTransactions.reduce((acc, tx) => {
      if (!acc.has(tx.customerId)) {
        acc.set(tx.customerId, []);
      }
      acc.get(tx.customerId)!.push(tx);
      return acc;
    }, new Map<string, Transaction[]>());

    // Process customers to check for overdue accounts
    customers.forEach(customer => {
      const customerTransactions = transactionsByCustomer.get(customer.id) || [];
      customer.transactions = customerTransactions; // Attach transactions to customer object for use in cards
      
      const balance = calculateBalance(customerTransactions);

      // Check if customer has an outstanding balance
      if (balance < 0) {
        const creditTransactions = customerTransactions
          .filter(tx => tx.type === 'credit')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // If they have credit transactions, check the oldest one
        if (creditTransactions.length > 0) {
          const oldestCreditDate = new Date(creditTransactions[0].date);
          if (differenceInDays(new Date(), oldestCreditDate) > 30) {
            overdueCustomers.push(customer);
          }
        }
      }
    });

  } catch (error: any) {
    console.error("Error in HomePage fetching data:", error);
    errorLoadingCustomers = error.message || "An unexpected error occurred while loading data.";
  }

  if (errorLoadingCustomers) {
    return (
      <div className="space-y-8 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{errorLoadingCustomers}</AlertDescription>
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
      <CustomerClientPage 
        initialCustomers={customers} 
        overdueCustomers={overdueCustomers} 
      />
    </div>
  );
}
