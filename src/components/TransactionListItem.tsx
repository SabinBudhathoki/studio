
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Receipt } from 'lucide-react'; // Added Receipt as a generic icon
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
        "mb-3 shadow-md hover:shadow-lg transition-shadow duration-200", 
        isCredit ? "bg-destructive/5 border-destructive/30" : "bg-green-500/10 border-green-500/30" // Using specific green for payments
      )}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0"> {/* Ensure text can truncate */}
            <div className="flex items-center gap-2 mb-1">
              {isCredit ? (
                <TrendingUp className="h-5 w-5 text-destructive shrink-0" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-600 shrink-0" /> 
              )}
              <h4 className={cn(
                "font-semibold text-md truncate", // Adjusted size to md, added truncate
                isCredit ? "text-destructive" : "text-green-700"
              )}>
                {isCredit ? transaction.itemName : 'Payment Received'}
              </h4>
            </div>
            {isCredit && (
              <p className="text-xs text-muted-foreground ml-7"> {/* Aligned with text above */}
                {transaction.quantity} x ₹{transaction.price.toFixed(2)}
              </p>
            )}
          </div>
          <div className="text-right ml-4 shrink-0"> {/* Added shrink-0 */}
            <p className={cn(
                "font-bold text-md", // Adjusted size to md
                isCredit ? 'text-destructive' : 'text-green-700'
              )}
            >
              {isCredit ? '-' : '+'} ₹{totalAmount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(transaction.date), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionListItem;
