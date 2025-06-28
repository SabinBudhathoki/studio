
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import { customerSchema } from '@/lib/schema';
import type { NewCustomer } from '@/lib/types';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserPlus, Save, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';


interface CustomerFormProps {
  onSubmit: (data: NewCustomer) => Promise<void>;
}

export function CustomerForm({ onSubmit }: CustomerFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      customerType: 'normal',
    },
  });

  async function handleSubmit(values: z.infer<typeof customerSchema>) {
    try {
      await onSubmit(values);
      toast({
        title: t('customerRegistered'),
        description: t('customerRegisteredSuccess', { name: values.name }),
        variant: 'default',
      });
      form.reset();
      router.push('/');
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToRegisterCustomer'),
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary">
          <UserPlus className="h-7 w-7" />
          {t('registerNewCustomer')}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
             <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('customerType')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="normal" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('normalCustomer')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="army" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('nepalArmyCustomer')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fullName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('fullNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phoneNumberOptional')}</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder={t('phoneNumberPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('address')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('addressPlaceholder')} {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('saving')}</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('saveCustomer')}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
