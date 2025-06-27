
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface BackButtonProps {
  text?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ text }) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Button variant="outline" onClick={() => router.back()} className="mb-6">
      <ArrowLeft className="mr-2 h-4 w-4" />
      {text || t('back')}
    </Button>
  );
};

export default BackButton;
