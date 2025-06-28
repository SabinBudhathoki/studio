import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  phone: z.string().regex(/^\+?[0-9\s-()]*$/, { message: "Invalid phone number format." }).max(15).optional().or(z.literal('')),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }).max(200),
  customerType: z.enum(['normal', 'army'], { required_error: "You must select a customer type." }),
});

export const transactionSchema = z.object({
  itemName: z.string().min(2, { message: "Item name must be at least 2 characters." }).max(100),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1." }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date." }),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, { message: "Payment amount must be positive." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date." }),
});
