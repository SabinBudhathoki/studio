
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionListItemProps {
  transaction: Transaction;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({ transaction }) => {
  const isCredit = transaction.type === 'credit';
  const totalAmount = isCredit ? transaction.price * transaction.quantity : transaction.amount ?? 0;

  return (
    <Card 
      className={cn(
        "mb-3 shadow-sm", 
        isCredit ? "bg-destructive/5 border-destructive/20" : "bg-accent/20 border-accent/50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isCredit ? (
                <TrendingUp className="h-5 w-5 text-destructive" />
              ) : (
                <TrendingDown className="h-5 w-5 text-accent-foreground" /> 
              )}
              <h4 className={cn(
                "font-semibold text-lg",
                isCredit ? "text-destructive" : "text-accent-foreground"
              )}>
                {isCredit ? transaction.itemName : 'Payment Received'}
              </h4>
            </div>
            {isCredit && (
              <p className="text-sm text-muted-foreground">
                {transaction.quantity} x ₹{transaction.price.toFixed(2)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className={cn(
                "font-bold text-lg", 
                isCredit ? 'text-destructive' : 'text-accent-foreground'
              )}
            >
              {isCredit ? '-' : '+'} ₹{totalAmount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(transaction.date), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionListItem;
