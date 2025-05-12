import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, User, Shield } from 'lucide-react'; // Using Shield for Army
import AppLogo from './AppLogo';

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-5xl">
        <AppLogo />
        <nav className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/new-customer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Normal Customer</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                {/* Both link to the same page for now, add differentiation later if needed */}
                 <Link href="/new-customer"> 
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Nepal Army Customer</span>
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
