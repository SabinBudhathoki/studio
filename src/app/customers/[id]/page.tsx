
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Customer, Transaction, NewTransaction, NewPayment } from '@/lib/types';
import { calculateBalance } from '@/lib/mockData'; // calculateBalance can still be used client-side
import { TransactionForm } from '@/components/TransactionForm';
import { PaymentForm } from '@/components/PaymentForm';
import TransactionListItem from '@/components/TransactionListItem';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, User, Phone, MapPin, Wallet, ListChecks } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  getCustomerByIdFromSheet, 
  getTransactionsForCustomerFromSheet,
} from '@/services/customerService'; // Import only data fetching service functions
import { 
  handleAddTransactionAction, 
  handleAddPaymentAction 
} from '@/actions/customerActions'; // Import server actions
import { useToast } from '@/hooks/use-toast';


// Server Action to fetch customer details (can remain inline or be moved, kept for now)
async function fetchCustomerDetailsAction(id: string): Promise<Customer | null> {
  'use server';
  // Need to fetch transactions to populate the customer object if using this approach
  // Simpler to just fetch them separately in the useEffect
   return getCustomerByIdFromSheet(id); // Fetches basic details
}

// Server Action to fetch transactions (can remain inline or be moved, kept for now)
async function fetchCustomerTransactionsAction(id: string): Promise<Transaction[]> {
  'use server';
  return getTransactionsForCustomerFromSheet(id);
}


export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setError(null);
      const fetchData = async () => {
        try {
          // Fetch customer details and transactions separately
          const customerData = await fetchCustomerDetailsAction(id);
          const transactionsData = await fetchCustomerTransactionsAction(id);

          if (customerData) {
            setCustomer(customerData);
            setTransactions(transactionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          } else {
            setError('Customer not found.');
          }
        } catch (err: any) {
          console.error("Error fetching customer data:", err);
          setError(err.message || 'Failed to load customer details.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);
  
  const balance = customer ? calculateBalance(transactions) : 0;

  // Use the imported Server Action
  const handleAddTransaction = async (data: NewTransaction) => {
    const result = await handleAddTransactionAction(id, data); // Call imported action
    if (result.success && result.newTransaction) {
      setTransactions(prev => [result.newTransaction!, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      throw new Error(result.message); // To signal error to the form
    }
  };

  // Use the imported Server Action
  const handleAddPayment = async (data: NewPayment) => {
    const result = await handleAddPaymentAction(id, data); // Call imported action
     if (result.success && result.newPayment) {
      setTransactions(prev => [result.newPayment!, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      throw new Error(result.message); // To signal error to the form
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg mt-4" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <BackButton />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!customer) {
     return (
      <div>
        <BackButton />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Customer not found.</AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <BackButton />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <User className="h-7 w-7" /> {customer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-muted-foreground">
            <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-start text-muted-foreground">
            <MapPin className="h-5 w-5 mr-3 mt-1 text-muted-foreground shrink-0" />
            <span>{customer.address}</span>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center font-semibold text-lg">
            <Wallet className="h-6 w-6 mr-3 text-muted-foreground" />
            <span>Current Balance: </span>
            <span className={cn(
                "ml-2 font-medium", 
                balance < 0 ? 'text-destructive' : balance > 0 ? 'text-accent-foreground' : 'text-foreground' // Adjusted logic: negative is due
              )}
            >
              ₹{Math.abs(balance).toFixed(2)} {balance < 0 ? ' (Due)' : balance > 0 ? ' (Advance)' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <TransactionForm customerId={id} onSubmit={handleAddTransaction} />
        <PaymentForm customerId={id} onSubmit={handleAddPayment} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 mt-8 flex items-center gap-2">
          <ListChecks className="h-6 w-6" />
          Transaction History
        </h2>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionListItem key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <Alert className="bg-accent/50 border-accent text-accent-foreground">
            <AlertTriangle className="h-5 w-5 text-accent-foreground" />
            <AlertTitle className="font-semibold">No Transactions Yet</AlertTitle>
            <AlertDescription>
              This customer has no transactions or payments recorded. Add one using the forms above.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
