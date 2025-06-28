export interface Transaction {
  id: string;
  customerId: string;
  itemName: string;
  quantity: number;
  price: number;
  date: string; // ISO string date
  type: 'credit' | 'payment';
  amount?: number; // For payments
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address: string;
  customerType: 'normal' | 'army';
  transactions: Transaction[];
}

export type NewCustomer = Omit<Customer, 'id' | 'transactions'>;
export type NewTransaction = Omit<Transaction, 'id' | 'customerId' | 'type'> & { type?: 'credit' };
export type NewPayment = Omit<Transaction, 'id' | 'customerId' | 'type' | 'itemName' | 'quantity' | 'price'> & { type?: 'payment', amount: number };
