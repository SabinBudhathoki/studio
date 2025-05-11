import type { Customer, Transaction } from './types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Aarav Sharma',
    phone: '9876543210',
    address: '123 Main St, Delhi',
    transactions: [
      { id: 't1', customerId: '1', itemName: 'Milk', quantity: 2, price: 30, date: yesterday, type: 'credit' },
      { id: 't2', customerId: '1', itemName: 'Bread', quantity: 1, price: 40, date: today, type: 'credit' },
    ],
  },
  {
    id: '2',
    name: 'Priya Singh',
    phone: '8765432109',
    address: '456 Park Ave, Mumbai',
    transactions: [
      { id: 't3', customerId: '2', itemName: 'Rice Bag (5kg)', quantity: 1, price: 250, date: yesterday, type: 'credit' },
      { id: 't4', customerId: '2', type: 'payment', amount: 100, date: today, itemName: 'Payment', quantity:0, price: 0 },
    ],
  },
  {
    id: '3',
    name: 'Rohan Verma',
    phone: '7654321098',
    address: '789 Market Rd, Bangalore',
    transactions: [
      { id: 't5', customerId: '3', itemName: 'Cooking Oil', quantity: 1, price: 180, date: today, type: 'credit' },
    ],
  },
];

export const calculateBalance = (transactions: Transaction[]): number => {
  return transactions.reduce((balance, tx) => {
    if (tx.type === 'credit') {
      return balance + (tx.quantity * tx.price);
    } else if (tx.type === 'payment' && tx.amount) {
      return balance - tx.amount;
    }
    return balance;
  }, 0);
};
