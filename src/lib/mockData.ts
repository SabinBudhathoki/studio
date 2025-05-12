
import type { Transaction } from './types';

// mockCustomers array is removed as data will be fetched from Google Sheets.

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
    } else if (tx.type === 'payment' && tx.amount != null) { // check for amount not null or undefined
      // Customer makes a payment, their "advance" increases or "due" decreases.
      return balance + tx.amount;
    }
    return balance;
  }, 0);
};
