import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/animated-logo";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );

export default function Home() {
  const appUrl = "https://ilbooks-app-prev.web.app";
  const shareText = "I just discovered ILBooks, a social network for book lovers! Join me to connect, compete, and discover new books.";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <AnimatedLogo />
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-pink-500 mt-6">
          ILBooks
        </h1>
        <p className="mt-2 text-xl text-red-800 font-headline tracking-wider">
          [ I Love Books ]
        </p>
        <p className="mt-12 text-2xl md:text-3xl font-headline text-foreground max-w-2xl">
          Welcome to the Bookworm Network, a place for readers to connect, compete, and discover.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <Button asChild size="lg" className="font-headline">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" className="font-headline bg-orange-500 text-white hover:bg-orange-600">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
        <div className="absolute bottom-4">
            <p className="text-sm text-muted-foreground">
                Made with ❤️ by ILBooks Team
            </p>
        </div>
      </div>
    </main>
  );
}
