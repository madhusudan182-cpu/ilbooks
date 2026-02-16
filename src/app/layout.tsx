import type {Metadata} from 'next';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { FirebaseAppProvider } from '@/firebase/client-provider';

const siteUrl = 'https://ilbooks-app-prev.web.app';
const siteTitle = 'ILBooks - The Social Network for Book Lovers';
const siteDescription = 'Join ILBooks, a vibrant community for readers. Connect with fellow bookworms, compete in literary challenges, discover new books, and share your passion for reading.';
const socialImage = 'https://images.unsplash.com/photo-1579370318443-8da816457e3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxsaWJyYXJ5JTIwYm9va3N8ZW58MHx8fHwxNzcwMTM2NjkwfDA&ixlib=rb-4.1.0&q=80&w=1080';


export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'ILBooks',
    images: [
      {
        url: socialImage,
        width: 1080,
        height: 607,
        alt: 'A collection of books on a shelf.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
   twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [socialImage],
  },
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
