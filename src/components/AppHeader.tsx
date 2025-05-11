import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AppLogo from './AppLogo';

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-5xl">
        <AppLogo />
        <nav className="flex items-center gap-4">
          <Button asChild variant="default" size="sm">
            <Link href="/new-customer">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
