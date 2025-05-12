
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Customer, Transaction, NewTransaction, NewPayment } from '@/lib/types';
import { calculateBalance } from '@/lib/mockData'; 
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
  handleAddTransactionAction, 
  handleAddPaymentAction,
  fetchCustomerDetailsAction,
  fetchCustomerTransactionsAction
} from '@/actions/customerActions'; 
import { useToast } from '@/hooks/use-toast';


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

  const handleAddTransaction = async (data: NewTransaction) => {
    const result = await handleAddTransactionAction(id, data);
    if (result.success && result.newTransaction) {
      setTransactions(prev => [result.newTransaction!, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      throw new Error(result.message); 
    }
  };

  const handleAddPayment = async (data: NewPayment) => {
    const result = await handleAddPaymentAction(id, data);
     if (result.success && result.newPayment) {
      setTransactions(prev => [result.newPayment!, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      throw new Error(result.message); 
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-40 w-full rounded-lg shadow-md" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-lg shadow-md" />
          <Skeleton className="h-80 w-full rounded-lg shadow-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg mt-4 shadow-md" />
        <Skeleton className="h-20 w-full rounded-lg shadow-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <BackButton />
        <Alert variant="destructive" className="shadow-md">
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
        <Alert variant="destructive" className="shadow-md">
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
      
      <Card className="shadow-xl"> {/* Increased shadow for emphasis */}
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3 text-primary"> {/* Slightly larger title */}
            <User className="h-8 w-8" /> {customer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2"> {/* Added pt-2 for better spacing after title */}
          <div className="flex items-center text-muted-foreground text-sm">
            <Phone className="h-5 w-5 mr-3" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-start text-muted-foreground text-sm">
            <MapPin className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
            <span>{customer.address}</span>
          </div>
          <Separator className="my-6" /> {/* Increased margin for separator */}
          <div className="flex items-center text-xl"> {/* Larger text for balance */}
            <Wallet className="h-7 w-7 mr-3 text-muted-foreground" />
            <span className="font-semibold">Current Balance: </span>
            <span className={cn(
                "ml-2 font-bold", // Bolder balance
                balance < 0 ? 'text-destructive' : balance > 0 ? 'text-green-600' : 'text-foreground' 
              )}
            >
              ₹{Math.abs(balance).toFixed(2)} 
              {balance < 0 ? <span className="text-xs font-medium ml-1">(Due)</span> : balance > 0 ? <span className="text-xs font-medium ml-1 text-green-600">(Advance)</span> : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <TransactionForm customerId={id} onSubmit={handleAddTransaction} />
        <PaymentForm customerId={id} onSubmit={handleAddPayment} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6 mt-10 flex items-center gap-2"> {/* Adjusted margins */}
          <ListChecks className="h-7 w-7" />
          Transaction History
        </h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <TransactionListItem key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <Alert className="bg-card border-border shadow-sm"> {/* Adjusted alert style for better theme integration */}
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <AlertTitle className="font-semibold text-foreground">No Transactions Yet</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              This customer has no transactions or payments recorded. Add one using the forms above.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
