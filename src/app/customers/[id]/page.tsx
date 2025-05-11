
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Customer, Transaction, NewTransaction, NewPayment } from '@/lib/types';
import { mockCustomers, calculateBalance } from '@/lib/mockData';
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

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const foundCustomer = mockCustomers.find((c) => c.id === id);
        if (foundCustomer) {
          setCustomer(foundCustomer);
          // Sort transactions from the mock data for initial display
          setTransactions([...foundCustomer.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setIsLoading(false);
      }, 300); // Reduced delay
    }
  }, [id]);
  
  const balance = customer ? calculateBalance(transactions) : 0;

  const handleAddTransaction = async (data: NewTransaction) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerId: id,
      type: 'credit',
    };

    // Update local state for immediate UI feedback
    setTransactions(prev => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Update the transaction list in the mockCustomers array
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    if (customerIndex !== -1) {
      mockCustomers[customerIndex].transactions.push(newTx);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  };

  const handleAddPayment = async (data: NewPayment) => {
    const newPaymentTx: Transaction = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerId: id,
      type: 'payment',
      amount: data.amount,
      date: data.date,
      // Placeholder fields to satisfy Transaction interface for 'payment' type
      itemName: 'Payment Received', 
      quantity: 1, // Or 0, as long as price * quantity is not used for payments
      price: 0,    // Price is 0 for payments
    };

    // Update local state for immediate UI feedback
    setTransactions(prev => [newPaymentTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // Update the transaction list in the mockCustomers array
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    if (customerIndex !== -1) {
      mockCustomers[customerIndex].transactions.push(newPaymentTx);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-24" /> {/* Back button skeleton */}
        <Skeleton className="h-40 w-full rounded-lg" /> {/* Customer info card skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-lg" /> {/* Transaction form skeleton */}
          <Skeleton className="h-80 w-full rounded-lg" /> {/* Payment form skeleton */}
        </div>
        <Skeleton className="h-12 w-full rounded-lg mt-4" /> {/* Transaction list header skeleton */}
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
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
                "ml-2 font-medium", // Added font-medium for consistency
                balance > 0 ? 'text-accent-foreground' : balance < 0 ? 'text-destructive' : 'text-foreground'
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
