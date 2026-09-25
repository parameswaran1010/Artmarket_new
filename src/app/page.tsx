import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import UserNav from "@/components/UserNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-text-primary tracking-tight">
            Art<span className="text-accent">Market</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link
              href="/artworks"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Browse Artworks
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4 tracking-tight">
          Discover and collect original artwork
        </h1>
        <p className="text-lg text-text-secondary mb-8 max-w-xl">
          Connect directly with artists around the world. Buy unique pieces or sell your own art on ArtMarket.
        </p>

        <div className="flex gap-4">
          <Link href="/artworks">
            <Button variant="primary" size="lg">
              Browse Artworks
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              Join as Artist
            </Button>
          </Link>
        </div>

        {/* Quick Route Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 w-full text-left">
          <Link href="/register" className="group">
            <Card padding="md" className="h-full hover:border-accent transition-colors">
              <h3 className="font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                For Artists →
              </h3>
              <p className="text-sm text-text-secondary">
                Create an artist account, list your original artworks, and sell directly to collectors.
              </p>
            </Card>
          </Link>

          <Link href="/register" className="group">
            <Card padding="md" className="h-full hover:border-accent transition-colors">
              <h3 className="font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                For Buyers →
              </h3>
              <p className="text-sm text-text-secondary">
                Join as a buyer to discover unique pieces, support creators, and build your art collection.
              </p>
            </Card>
          </Link>
        </div>
      </section>
    </main>
  );
}
