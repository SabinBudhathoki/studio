'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import { paymentSchema } from '@/lib/schema';
import type { NewPayment } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, DollarSign, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface PaymentFormProps {
  customerId: string;
  onSubmit: (data: NewPayment) => Promise<void>;
}

export function PaymentForm({ customerId, onSubmit }: PaymentFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  async function handleSubmit(values: z.infer<typeof paymentSchema>) {
    try {
      await onSubmit(values);
      toast({
        title: 'Payment Recorded!',
        description: `Payment of ₹${values.amount} added.`,
      });
      form.reset({ ...values, amount: 0 }); // Keep date, reset amount
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record payment.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="shadow-xl"> {/* Changed shadow-lg to shadow-xl for consistency */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <DollarSign className="h-6 w-6" />
          Add Payment
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Payment</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Record Payment</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
