import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";
import ArtistArtworkCardActions from "@/components/ArtistArtworkCardActions";

export const dynamic = "force-dynamic";

export default async function ArtistDashboardPage() {
  // Server-side role and session check (PROJECT_RESTRICTIONS)
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/dashboard/artist");
  }

  if (session.user.role !== "artist") {
    redirect("/");
  }

  // Fetch only this artist's artworks
  const rawArtworks = await prisma.artwork.findMany({
    where: {
      artistId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const artworks = rawArtworks.map((item) => ({
    ...item,
    price: Number(item.price),
  }));

  const totalListings = artworks.length;
  const availableCount = artworks.filter((a) => a.status === "AVAILABLE").length;
  const soldCount = artworks.filter((a) => a.status === "SOLD").length;

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
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Browse Artworks
            </Link>
            <Link
              href="/dashboard/artist"
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Artist Studio
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">
              Artist Studio Dashboard
            </h1>
            <p className="text-text-secondary text-sm">
              Manage your portfolio, track listing statuses, and publish new original works.
            </p>
          </div>

          <Link href="/dashboard/artist/upload">
            <Button variant="primary" size="md">
              Upload New Artwork
            </Button>
          </Link>
        </div>

        {/* Studio Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Total Creations
            </p>
            <p className="text-3xl font-bold text-text-primary">{totalListings}</p>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Available in Gallery
            </p>
            <p className="text-3xl font-bold text-success">{availableCount}</p>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Collected & Sold
            </p>
            <p className="text-3xl font-bold text-text-secondary">{soldCount}</p>
          </Card>
        </div>

        {/* Listings Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Your Artwork Listings
            </h2>
            <span className="text-xs text-text-secondary">
              {totalListings} {totalListings === 1 ? "piece" : "pieces"} listed
            </span>
          </div>

          {artworks.length === 0 ? (
            <Card padding="lg" className="text-center py-16 max-w-xl mx-auto">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No artworks uploaded yet
              </h3>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                Your portfolio is currently empty. Upload your first artwork and use our AI assistant to instantly suggest catalog details.
              </p>
              <Link href="/dashboard/artist/upload">
                <Button variant="primary" size="md">
                  Upload Your First Artwork
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map((artwork) => {
                const statusStyles = {
                  AVAILABLE: "bg-green-50 text-success border-green-200",
                  SOLD: "bg-gray-100 text-text-secondary border-gray-300",
                  HIDDEN: "bg-amber-50 text-amber-700 border-amber-200",
                };

                return (
                  <Card
                    key={artwork.id}
                    padding="none"
                    className="overflow-hidden flex flex-col justify-between hover:border-accent transition-colors"
                  >
                    <div>
                      {/* Image Preview Container */}
                      <div className="relative aspect-[4/3] bg-border overflow-hidden">
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                              statusStyles[artwork.status] || "bg-surface text-text-primary border-border"
                            }`}
                          >
                            {artwork.status === "AVAILABLE" ? "Available" : artwork.status}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-text-primary text-base line-clamp-1">
                            {artwork.title}
                          </h3>
                          <span className="font-bold text-accent whitespace-nowrap">
                            £{artwork.price.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                          {artwork.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-border">
                          <span>{artwork.medium}</span>
                          <span>{artwork.style}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-4 pb-3 pt-1 border-t border-border">
                      <ArtistArtworkCardActions
                        artworkId={artwork.id}
                        artworkTitle={artwork.title}
                        isSold={artwork.status === "SOLD"}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
