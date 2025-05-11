'use client';
import type React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search customers by name or phone..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-4 py-3 text-base rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-all"
      />
    </div>
  );
};

export default CustomerSearch;
