import Link from 'next/link';
import type { Customer } from '@/lib/types';
import { calculateBalance } from '@/lib/mockData';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, ArrowRight, Briefcase } from 'lucide-react'; // Using Briefcase as a generic icon for balance/details
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  const balance = calculateBalance(customer.transactions);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
      <CardHeader className="pb-3 pt-5 px-5"> {/* Adjusted padding */}
        <CardTitle className="text-xl font-semibold text-primary truncate">{customer.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-4 flex-grow"> {/* Adjusted padding */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Phone className="h-4 w-4 mr-2.5 shrink-0" />
          <span>{customer.phone}</span>
        </div>
        <div className="flex items-start text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{customer.address}</span>
        </div>
        <div className="pt-1"> {/* Added padding top for balance */}
          <span className="font-medium text-sm text-muted-foreground">Balance: </span> 
          <span className={cn(
            "font-semibold text-sm", // Changed font-medium to font-semibold for balance
            balance < 0 ? 'text-destructive' : balance > 0 ? 'text-green-600' : 'text-foreground'
          )}>
            ₹{Math.abs(balance).toFixed(2)}
            {balance < 0 ? ' (Due)' : balance > 0 ? ' (Advance)' : ''}
          </span>
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-5 pt-0"> {/* Adjusted padding */}
        <Button asChild variant="outline" className="w-full mt-auto border-primary/50 text-primary hover:bg-primary/10">
          <Link href={`/customers/${customer.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CustomerCard;
