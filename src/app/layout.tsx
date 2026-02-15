import type {Metadata} from 'next';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { FirebaseAppProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'ILBooks - The Social Network for Book Lovers',
  description: 'Join ILBooks, a vibrant community for readers. Connect with fellow bookworms, compete in literary challenges, discover new books, and share your passion for reading.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:opsz@6..72&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <FirebaseAppProvider>
          {children}
          <Toaster />
        </FirebaseAppProvider>
      </body>
    </html>
  );
}
