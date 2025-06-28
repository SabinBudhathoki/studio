
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Customer, Transaction, NewTransaction, NewPayment } from '@/lib/types';
import { calculateBalance } from '@/lib/mockData'; 
import { TransactionForm } from '@/components/TransactionForm';
import { PaymentForm } from '@/components/PaymentForm';
import { DeleteCustomerDialog } from '@/components/DeleteCustomerDialog';
import TransactionListItem from '@/components/TransactionListItem';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, User, Phone, MapPin, Wallet, ListChecks, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  handleAddTransactionAction, 
  handleAddPaymentAction,
  fetchCustomerDetailsAction,
  fetchCustomerTransactionsAction,
  handleDeleteCustomerAction
} from '@/actions/customerActions'; 
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/LanguageContext';


export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            setError(t('customerNotFound'));
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
  }, [id, t]);
  
  const balance = customer ? calculateBalance(transactions) : 0;

  const handleAddTransaction = async (data: NewTransaction) => {
    const result = await handleAddTransactionAction(id, data);
    if (result.success && result.newTransaction) {
      setTransactions(prev => [result.newTransaction!, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: t('success'), description: result.message });
    } else {
      toast({ title: t('error'), description: result.message, variant: 'destructive' });
      throw new Error(result.message); 
    }
  };

  const handleAddPayment = async (data: NewPayment) => {
    const result = await handleAddPaymentAction(id, data);
     if (result.success && result.newPayment) {
      setTransactions(prev => [result.newPayment!, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: t('success'), description: result.message });
    } else {
      toast({ title: t('error'), description: result.message, variant: 'destructive' });
      throw new Error(result.message); 
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    setIsDeleting(true);
    const result = await handleDeleteCustomerAction(id);
    if (result.success) {
        toast({ title: t('success'), description: t('customerDeletedSuccess', { customerName: customer.name }) });
        router.push('/');
    } else {
        toast({ title: t('error'), description: result.message, variant: 'destructive' });
        setIsDeleting(false); // only stop loading on error, on success we redirect
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
          <AlertTitle>{t('error')}</AlertTitle>
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
          <AlertTitle>{t('error')}</AlertTitle>
          <AlertDescription>{t('customerNotFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <BackButton />
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3 text-primary">
            <User className="h-8 w-8" /> {customer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex items-center text-muted-foreground text-sm">
            <Phone className="h-5 w-5 mr-3" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-start text-muted-foreground text-sm">
            <MapPin className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
            <span>{customer.address}</span>
          </div>
          <Separator className="my-6" />
          <div className="flex items-center text-xl">
            <Wallet className="h-7 w-7 mr-3 text-muted-foreground" />
            <span className="font-semibold">{t('currentBalance')}: </span>
            <span className={cn(
                "ml-2 font-bold",
                balance < 0 ? 'text-destructive' : balance > 0 ? 'text-green-600' : 'text-foreground' 
              )}
            >
              ₹{Math.abs(balance).toFixed(2)} 
              {balance < 0 ? <span className="text-xs font-medium ml-1">({t('due')})</span> : balance > 0 ? <span className="text-xs font-medium ml-1 text-green-600">({t('advance')})</span> : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <TransactionForm customerId={id} onSubmit={handleAddTransaction} />
        <PaymentForm customerId={id} onSubmit={handleAddPayment} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6 mt-10 flex items-center gap-2">
          <ListChecks className="h-7 w-7" />
          {t('transactionHistory')}
        </h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <TransactionListItem key={tx.id} transaction={tx} />
            ))}
          </div>
        ) : (
          <Alert className="bg-card border-border shadow-sm">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <AlertTitle className="font-semibold text-foreground">{t('noTransactionsTitle')}</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {t('noTransactionsDescription')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card className="mt-10 border-destructive bg-destructive/5">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-6 w-6" />
                {t('dangerZone')}
            </CardTitle>
            <CardDescription className="text-destructive/90 pt-2">
                {t('dangerZoneDescription')}
            </CardDescription>
        </CardHeader>
        <CardFooter>
            <DeleteCustomerDialog
                customerName={customer.name}
                onConfirm={handleDeleteCustomer}
                isDeleting={isDeleting}
            />
        </CardFooter>
      </Card>

    </div>
  );
}
