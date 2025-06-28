
'use client';

import type { Customer } from '@/lib/types';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { calculateBalance } from '@/lib/mockData';
import { useTranslation } from '@/context/LanguageContext';

interface OverdueNotificationProps {
  customers: Customer[];
}

const OverdueNotification: React.FC<OverdueNotificationProps> = ({ customers }) => {
  const { t } = useTranslation();

  return (
    <Alert variant="destructive" className="mb-8 shadow-lg">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">Overdue Accounts Notification</AlertTitle>
      <AlertDescription className="mt-2">
        You have {customers.length} customer(s) with dues older than 30 days. Please follow up.
      </AlertDescription>
      <Accordion type="single" collapsible className="w-full mt-4">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-base hover:no-underline">View Overdue Customers</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {customers.map((customer) => (
                <div key={customer.id} className="flex justify-between items-center p-3 bg-destructive/10 rounded-md">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-destructive-foreground/80">
                      {t('due')}: ₹{Math.abs(calculateBalance(customer.transactions)).toFixed(2)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/20">
                    <Link href={`/customers/${customer.id}`}>
                      {t('viewDetails')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Alert>
  );
};

export default OverdueNotification;
