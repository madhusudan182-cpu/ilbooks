import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/animated-logo";
import { Users, Trophy, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center py-20 px-4">
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
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button asChild size="lg" className="font-headline bg-orange-500 text-white hover:bg-orange-600">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">What We Offer</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-headline mb-2">Connect with Readers</h3>
                <p className="text-muted-foreground">
                  Join a vibrant community. Follow fellow bookworms, share your thoughts on the latest reads, and build your social circle.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Trophy className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-headline mb-2">Compete and Win</h3>
                <p className="text-muted-foreground">
                  Test your knowledge in literary competitions. Progress through levels, earn badges, and win exciting prizes.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-headline mb-2">Discover New Books</h3>
                <p className="text-muted-foreground">
                  Explore our curated book shop, get personalized recommendations from our AI, and find your next favorite book.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-6 bg-background text-center">
        <p className="text-sm text-muted-foreground">
            Made with ❤️ by ILBooks Team
        </p>
      </footer>
    </div>
  );
}
