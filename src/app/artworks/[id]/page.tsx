import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import ArtworkDetailActions from "@/components/ArtworkDetailActions";
import UserNav from "@/components/UserNav";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    id: string;
  };
};

export default async function ArtworkDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  const artwork = await prisma.artwork.findUnique({
    where: {
      id: params.id,
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
  });

  if (!artwork) {
    notFound();
  }

  const price = Number(artwork.price);

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
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <Link
          href="/artworks"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-6"
        >
          ← Back to Artworks
        </Link>

        {/* Artwork Grid (Image + Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Card */}
          <div className="lg:col-span-7">
            <Card padding="none" className="overflow-hidden bg-surface">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-border overflow-hidden">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-full object-contain bg-[#111111]/5"
                />
              </div>
            </Card>

            {/* Tags under the image */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {artwork.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-surface border border-border text-text-secondary px-2.5 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                  Original Artwork
                </span>
                <span className="text-xs font-medium text-success bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                  {artwork.status === "AVAILABLE" ? "Available" : artwork.status}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-2">
                {artwork.title}
              </h1>

              <p className="text-base text-text-secondary">
                Created by{" "}
                <span className="text-text-primary font-medium">
                  {artwork.artist.name}
                </span>
              </p>
            </div>

            {/* Price Display */}
            <div className="py-4 border-y border-border flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-accent">
                £{price.toFixed(2)}
              </span>
              <span className="text-xs text-text-secondary">
                GBP, taxes included
              </span>
            </div>

            {/* Action Buttons */}
            <ArtworkDetailActions
              artworkId={artwork.id}
              artworkTitle={artwork.title}
              artistId={artwork.artistId}
              status={artwork.status}
              currentUserId={session?.user?.id}
              currentUserRole={session?.user?.role}
            />

            {/* Description Card */}
            <Card padding="md" className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                About this piece
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {artwork.description}
              </p>
            </Card>

            {/* Artwork Metadata Specifications */}
            <Card padding="md" className="divide-y divide-border text-sm">
              <div className="flex justify-between py-2 first:pt-0">
                <span className="text-text-secondary">Medium</span>
                <span className="font-medium text-text-primary">{artwork.medium}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary">Style</span>
                <span className="font-medium text-text-primary">{artwork.style}</span>
              </div>
              <div className="flex justify-between py-2 last:pb-0">
                <span className="text-text-secondary">Artist Contact</span>
                <span className="font-medium text-text-primary">{artwork.artist.email}</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
