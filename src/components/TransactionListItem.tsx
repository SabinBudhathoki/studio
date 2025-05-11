import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionListItemProps {
  transaction: Transaction;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({ transaction }) => {
  const isCredit = transaction.type === 'credit';
  const totalAmount = isCredit ? transaction.price * transaction.quantity : transaction.amount ?? 0;

  return (
    <Card className={cn("mb-3 shadow-sm", isCredit ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isCredit ? <TrendingUp className="h-5 w-5 text-red-500" /> : <TrendingDown className="h-5 w-5 text-green-600" />}
              <h4 className="font-semibold text-lg">
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
            <p className={cn("font-bold text-lg", isCredit ? 'text-red-600' : 'text-green-700')}>
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
