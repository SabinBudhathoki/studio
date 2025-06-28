
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface DeleteCustomerDialogProps {
  customerName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteCustomerDialog({ customerName, onConfirm, isDeleting }: DeleteCustomerDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const isConfirmationMatching = confirmationInput === customerName;

  const handleConfirm = () => {
    if (isConfirmationMatching) {
      onConfirm();
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    // Reset input when dialog is closed
    if (!open) {
      setConfirmationInput('');
    }
    setIsOpen(open);
  }

  const descriptionText = t('deleteConfirmationWarning', { customerName });
  const typeToConfirmText = t('typeToConfirm', { customerName });

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t('deleteCustomer')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
          <AlertDialogDescription>
            {descriptionText}
            <br/><br/>
            {typeToConfirmText.replace(customerName, `"${customerName}"`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
            <Label htmlFor="customer-name-confirmation" className="sr-only">
                {customerName}
            </Label>
            <Input
                id="customer-name-confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={customerName}
                autoComplete="off"
                disabled={isDeleting}
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationMatching || isDeleting}
          >
            {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('deleting')}</>
            ) : (
                <>{t('confirmDelete')}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
