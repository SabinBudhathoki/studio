
'use client'; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, User, Shield } from 'lucide-react';
import AppLogo from './AppLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/context/LanguageContext';

const AppHeader = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-5xl">
        <AppLogo />
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="lg">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addCustomer')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-xl">
              <DropdownMenuItem asChild>
                <Link href="/new-customer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('normalCustomer')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <Link href="/new-customer"> 
                  <Shield className="mr-2 h-4 w-4" />
                  <span>{t('nepalArmyCustomer')}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
