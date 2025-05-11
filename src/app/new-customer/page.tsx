'use client';
import { CustomerForm } from '@/components/CustomerForm';
import type { NewCustomer } from '@/lib/types';
// In a real app, this would be a server action or API call
// For now, we'll just log it and simulate success.
async function handleAddCustomer(data: NewCustomer): Promise<void> {
  console.log('New Customer Data:', data);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Here you would typically update your global state or revalidate data
  // For mock purposes, the redirection and toast in CustomerForm handles UI feedback.
}

export default function NewCustomerPage() {
  return (
    <div className="py-8">
      <CustomerForm onSubmit={handleAddCustomer} />
    </div>
  );
}
