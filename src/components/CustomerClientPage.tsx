
'use client';

import type { Customer } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerList from '@/components/CustomerList';
import { Skeleton } from '@/components/ui/skeleton';
import OverdueNotification from './OverdueNotification';

interface CustomerClientPageProps {
  initialCustomers: Customer[];
  overdueCustomers: Customer[];
}

export default function CustomerClientPage({ initialCustomers, overdueCustomers }: CustomerClientPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {overdueCustomers.length > 0 && <OverdueNotification customers={overdueCustomers} />}
      <CustomerSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <CustomerList customers={filteredCustomers} />
    </>
  );
}
