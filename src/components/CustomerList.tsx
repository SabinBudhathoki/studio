import type { Customer } from '@/lib/types';
import CustomerCard from './CustomerCard';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CustomerListProps {
  customers: Customer[];
}

const CustomerList: React.FC<CustomerListProps> = ({ customers }) => {
  if (customers.length === 0) {
    return (
       <Alert className="bg-accent/50 border-accent text-accent-foreground">
          <AlertTriangle className="h-5 w-5 text-accent-foreground" />
          <AlertTitle className="font-semibold">No Customers Found</AlertTitle>
          <AlertDescription>
            No customers match your search criteria, or you haven't added any customers yet.
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
};

export default CustomerList;
