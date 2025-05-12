
import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Using Geist Sans as primary
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/AppLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Geist Mono not explicitly used but kept for consistency if needed
const geistMono = Geist({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'] // Example weights
});


export const metadata: Metadata = {
  manifest: '/manifest.json', // Link the manifest file
  title: 'Udaaro - Credit Management Made Easy',
  description: 'Udaaro helps you manage customer credit transactions and payments effortlessly.',
  // Add theme color for browser UI theming (matches PWA theme_color)
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Add theme-color meta tag for better PWA integration */}
      <head>
         <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
