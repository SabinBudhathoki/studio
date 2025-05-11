'use client';
import { CustomerForm } from '@/components/CustomerForm';
import type { NewCustomer, Customer } from '@/lib/types';
import { mockCustomers } from '@/lib/mockData';

async function handleAddCustomer(data: NewCustomer): Promise<void> {
  console.log('New Customer Data:', data);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const newCustomerEntry: Customer = {
    ...data,
    id: `customer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate a unique ID
    transactions: [], // New customers start with zero balance and no transactions
  };

  mockCustomers.push(newCustomerEntry);
  console.log('Added new customer. Current customers:', mockCustomers.length);
  // The CustomerForm component will handle toast notifications and redirection upon successful promise resolution.
  // If an error needs to be shown, this function should throw an error.
}

export default function NewCustomerPage() {
  return (
    <div className="py-8">
      <CustomerForm onSubmit={handleAddCustomer} />
    </div>
  );
}
