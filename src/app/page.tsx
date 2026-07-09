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
          <div className="flex flex-col items-center justify-center gap-2">
            <AnimatedLogo />
            <div className="flex flex-col items-center">
              <h1 className="font-headline text-5xl md:text-7xl font-bold text-pink-500">
                ILBooks
              </h1>
              <p className="mt-1 text-lg md:text-xl text-red-800 font-headline tracking-wider">
                [ I Love Books ]
              </p>
            </div>
          </div>

          <p className="mt-12 text-2xl md:text-3xl font-headline text-foreground max-w-2xl">
            Welcome to the Bookworm Network, a place for readers to connect, compete, and discover.
          </p>

          <div className="mt-8 flex flex-row items-center gap-2">
            <Button asChild className="font-headline">
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button asChild className="font-headline bg-orange-500 text-white hover:bg-orange-600">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          {/* Social Sign In */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <Link href="/dashboard" className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-full border bg-card flex items-center justify-center group-hover:bg-muted transition-colors">
                {/* Google SVG */}
                <svg xmlns="http://w3.org" viewBox="0 0 48 48" className="h-7 w-7">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4c16.318,0,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.57l6.19,5.238C42.022,35.533,44,30.228,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Sign Up with Google</span>
            </Link>

            <Link href="/dashboard" className="flex flex-col items-center gap-2 group">
              <div className="h-14 w-14 rounded-full border bg-card flex items-center justify-center group-hover:bg-muted transition-colors">
                {/* Facebook SVG */}
                <svg xmlns="http://w3.org" viewBox="0 0 48 48" className="h-10 w-10">
                  <linearGradient id="Ld6sqrtcxMyckE16oeKdma" x1="9.993" x2="40.615" y1="9.993" y2="40.615" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2aa4f4"></stop>
                    <stop offset="1" stopColor="#007ad9"></stop>
                  </linearGradient>
                  <path fill="url(#Ld6sqrtcxMyckE16oeKdma)" d="M24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20S35.046,4,24,4z"></path>
                  <path fill="#fff" d="M26.707,29.301h5.176l0.813-5.559h-5.989v-3.542c0-1.624,0.452-2.731,2.781-2.731h3.282v-4.896c-0.566-0.076-2.516-0.246-4.783-0.246c-4.733,0-7.975,2.902-7.975,8.203v4.116h-5.368v5.559h5.368V44h6.323V29.301z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Sign Up with Facebook</span>
            </Link>
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

      {/* ─── আপডেট করা ফুটার সেকশন (ইমেইলের শর্ত অনুযায়ী রিয়াল ইনফো যুক্ত) ─── */}
      <footer className="py-10 bg-background border-t">
        <div className="container mx-auto px-4 max-w-4xl flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left text-sm text-muted-foreground">
          
          {/* ১. ব্যবসার লিগ্যাল কন্টাক্ট ইনফরমেশন */}
          <div className="space-y-1.5 font-sans">
            <h4 className="font-semibold text-foreground text-base mb-1 font-headline">Merchant Information</h4>
            <p><strong>Business Address:</strong> Kashinathpur, Bera, Pabna, Bangladesh</p>
            <p><strong>Contact Number:</strong> +880 1796869420</p>
            <p><strong>Email Address:</strong> utopiaschool.usc@gmail.com</p>
          </div>

          {/* ২. EPS গেটওয়ে ব্র্যান্ডিং ব্যানার লোগো (রেস্পনসিভ লেআউট) */}
          <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
            <div className="w-full max-w-[280px] md:max-w-[420px] bg-white p-2 rounded border">
              
              {/* ডেস্কটপ স্ক্রিনের জন্য লোগো ব্যানার */}
              <img 
                src="/eps-desktop-light.png.png" 
                alt="EPS Payment Gateway Authorized Partner" 
                className="hidden md:block h-auto w-full object-contain"
              />

              {/* মোবাইল স্ক্রিনের জন্য লোগো ব্যানার */}
              <img 
                src="/eps-mobile-light.png.png" 
                alt="EPS Payment Gateway Authorized Partner" 
                className="block md:hidden h-auto mx-auto w-full object-contain"
              />
              
            </div>
            <p className="text-xs mt-1">
              Made with ❤️ by ILBooks Team
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
