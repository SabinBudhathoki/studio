import Link from 'next/link';
import type { Customer } from '@/lib/types';
import { calculateBalance } from '@/lib/mockData';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn utility

interface CustomerCardProps {
  customer: Customer;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  const balance = calculateBalance(customer.transactions);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{customer.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <div className="flex items-center text-muted-foreground">
          <Phone className="h-4 w-4 mr-2" />
          <span>{customer.phone}</span>
        </div>
        <div className="flex items-start text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 mt-1 shrink-0" />
          <span>{customer.address}</span>
        </div>
        <div>
          <span className="font-semibold">Balance: </span> 
          <span className={cn(
            "font-medium",
            balance > 0 ? 'text-accent-foreground' : balance < 0 ? 'text-destructive' : 'text-foreground'
          )}>
            ₹{Math.abs(balance).toFixed(2)}
            {balance < 0 ? ' (Due)' : balance > 0 ? ' (Advance)' : ''}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full mt-auto">
          <Link href={`/customers/${customer.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CustomerCard;
