import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

export const dynamic = "force-dynamic";

export default async function ArtworksPage() {
  const rawArtworks = await prisma.artwork.findMany({
    where: {
      status: "AVAILABLE",
    },
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const artworks = rawArtworks.map((item) => ({
    ...item,
    price: Number(item.price),
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-text-primary tracking-tight">
            Art<span className="text-accent">Market</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link
              href="/artworks"
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Browse Artworks
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
            Curated Artworks
          </h1>
          <p className="text-text-secondary">
            Original paintings, sculptures, and prints directly from independent creators.
          </p>
        </div>

        {artworks.length === 0 ? (
          <Card padding="lg" className="text-center py-16 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              No artworks published yet
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Be the first to list an original piece on the marketplace.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/register">
                <Button variant="primary" size="md">
                  Register as Artist
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="md">
                  Return Home
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Uniform Grid Layout matching Artist Dashboard */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/artworks/${artwork.id}`}
                className="group flex flex-col h-full"
              >
                <Card
                  padding="none"
                  className="overflow-hidden h-full flex flex-col justify-between hover:border-accent transition-colors"
                >
                  <div>
                    {/* Image Preview Container */}
                    <div className="relative aspect-[4/3] bg-border overflow-hidden">
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h2 className="font-semibold text-text-primary text-base group-hover:text-accent transition-colors line-clamp-1">
                          {artwork.title}
                        </h2>
                        <span className="font-bold text-accent whitespace-nowrap">
                          £{artwork.price.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary mb-3 line-clamp-1">
                        By {artwork.artist.name}
                      </p>

                      <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-border">
                        <span>{artwork.medium}</span>
                        <span>{artwork.style}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
