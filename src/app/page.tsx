'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import { mockCustomers } from '@/lib/mockData';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerList from '@/components/CustomerList';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCustomers(mockCustomers);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CustomerSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <CustomerList customers={filteredCustomers} />
    </div>
  );
}
