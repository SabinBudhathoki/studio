import { HandCoins } from 'lucide-react';
import Link from 'next/link';

const AppLogo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <HandCoins className="h-8 w-8" />
      <h1 className="text-2xl font-bold">Udaaro</h1>
    </Link>
  );
};

export default AppLogo;
