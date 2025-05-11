'use client';

import { useEffect, useState } from 'react';
import { useParams }_from 'next/navigation';
import type { Customer, Transaction, NewTransaction, NewPayment } from '@/lib/types';
import { mockCustomers, calculateBalance } from '@/lib/mockData'; // Will manage this state locally
import { TransactionForm } from '@/components/TransactionForm';
import { PaymentForm } from '@/components/PaymentForm';
import TransactionListItem from '@/components/TransactionListItem';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, User, Phone, MapPin, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const foundCustomer = mockCustomers.find((c) => c.id === id);
        if (foundCustomer) {
          setCustomer(foundCustomer);
          setTransactions(foundCustomer.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id]);
  
  const balance = customer ? calculateBalance(transactions) : 0;

  const handleAddTransaction = async (data: NewTransaction) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}`,
      customerId: id,
      type: 'credit',
    };
    setTransactions(prev => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    // In a real app, update mockCustomers or call an API
     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  };

  const handleAddPayment = async (data: NewPayment) => {
    const newPayment: Transaction = {
      ...data,
      id: `payment-${Date.now()}`,
      customerId: id,
      type: 'payment',
      itemName: 'Payment', // Placeholder
      quantity: 0,        // Placeholder
      price: 0            // Placeholder
    };
    setTransactions(prev => [newPayment, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    // In a real app, update mockCustomers or call an API
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
            <Phone className="h-5 w-5 mr-3 text-gray-500" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-start text-muted-foreground">
            <MapPin className="h-5 w-5 mr-3 mt-1 text-gray-500 shrink-0" />
            <span>{customer.address}</span>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center font-semibold text-lg">
            <Wallet className="h-6 w-6 mr-3 text-gray-600" />
            <span>Current Balance: </span>
            <span className={cn("ml-2", balance >= 0 ? 'text-green-600' : 'text-red-600')}>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-checks"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>
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
              This customer has no transactions or payments recorded.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
