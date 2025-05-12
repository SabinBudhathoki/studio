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
    <div className="relative mb-8"> {/* Increased bottom margin */}
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" /> {/* Made icon non-interactive */}
      <Input
        type="text"
        placeholder="Search customers by name or phone..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-12 pr-4 py-3 text-base rounded-lg shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all w-full" /* Increased padding-left, added w-full */
      />
    </div>
  );
};

export default CustomerSearch;
