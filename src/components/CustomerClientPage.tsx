
'use client';

import type { Customer } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerList from '@/components/CustomerList';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerClientPageProps {
  initialCustomers: Customer[];
}

export default function CustomerClientPage({ initialCustomers }: CustomerClientPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Initial load handled by server component

  // If initialCustomers changes (e.g. due to parent re-fetch, though less common for full page navigation), update state
  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  if (isLoading) { // This might be used if client-side re-fetching is added later
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
      <CustomerSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <CustomerList customers={filteredCustomers} />
    </>
  );
}
