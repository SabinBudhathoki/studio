import type { Customer, Transaction } from './types';

// Note: today and yesterday are not strictly needed if all customers start with empty transactions.
// const today = new Date().toISOString().split('T')[0];
// const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Aarav Karki',
    phone: '9840000001',
    address: '123 Chabahil, Kathmandu, Bagmati Province',
    transactions: [], // Initial balance zero
  },
  {
    id: '2',
    name: 'Priya Shrestha',
    phone: '9850000002',
    address: '456 Pulchowk, Lalitpur, Bagmati Province',
    transactions: [], // Initial balance zero
  },
  {
    id: '3',
    name: 'Rohan Thapa Magar',
    phone: '9860000003',
    address: '789 Lakeside Marg, Pokhara, Gandaki Province',
    transactions: [], // Initial balance zero
  },
  {
    id: '4',
    name: 'Sunita Gurung',
    phone: '9810000004',
    address: '101 Boudha, Kathmandu, Bagmati Province',
    transactions: [], // Initial balance zero
  },
  {
    id: '5',
    name: 'Bikram Lama',
    phone: '9820000005',
    address: '222 Patan Durbar Square, Lalitpur, Bagmati Province',
    transactions: [], // Initial balance zero
  }
];

/**
 * Calculates the customer's balance.
 * Positive balance means the customer has paid in advance.
 * Negative balance means the customer owes money (due).
 * Zero balance means the account is settled.
 * @param transactions - Array of transactions.
 * @returns The calculated balance.
 */
export const calculateBalance = (transactions: Transaction[]): number => {
  return transactions.reduce((balance, tx) => {
    if (tx.type === 'credit') {
      // Customer takes items on credit, their "advance" decreases or "due" increases.
      return balance - (tx.quantity * tx.price);
    } else if (tx.type === 'payment' && tx.amount) {
      // Customer makes a payment, their "advance" increases or "due" decreases.
      return balance + tx.amount;
    }
    return balance;
  }, 0);
};
