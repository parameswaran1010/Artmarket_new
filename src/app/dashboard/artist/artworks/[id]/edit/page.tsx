import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import UserNav from "@/components/UserNav";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EditArtworkForm from "./EditArtworkForm";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    id: string;
  };
};

export default async function EditArtworkPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=/dashboard/artist/artworks/${params.id}/edit`);
  }

  const artwork = await prisma.artwork.findUnique({
    where: {
      id: params.id,
    },
    include: {
      artist: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!artwork) {
    notFound();
  }

  // Authorization check: artist must be the creator, or an admin
  if (artwork.artistId !== session.user.id && session.user.role !== "admin") {
    redirect("/dashboard/artist");
  }

  const isSold = artwork.status === "SOLD";

  const serializedArtwork = {
    id: artwork.id,
    title: artwork.title,
    description: artwork.description,
    medium: artwork.medium,
    style: artwork.style,
    tags: artwork.tags,
    price: Number(artwork.price),
    imageUrl: artwork.imageUrl,
    status: artwork.status,
  };

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
              Browse
            </Link>
            <Link
              href="/dashboard/artist"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Studio Dashboard
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
              <Link href="/dashboard/artist" className="hover:underline">
                Artist Studio
              </Link>
              <span>/</span>
              <Link href={`/artworks/${artwork.id}`} className="hover:underline line-clamp-1 max-w-[200px]">
                {artwork.title}
              </Link>
              <span>/</span>
              <span className="text-text-primary font-medium">Edit Details</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Edit Artwork Details
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/artworks/${artwork.id}`}>
              <Button variant="outline" size="sm">
                👁️ View Public Page
              </Button>
            </Link>
            <Link href="/dashboard/artist">
              <Button variant="ghost" size="sm">
                ← Studio
              </Button>
            </Link>
          </div>
        </div>

        {/* If Sold: Read-only warning */}
        {isSold ? (
          <Card padding="lg" className="flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl">
              🔒
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                This Artwork Has Been Sold
              </h2>
              <p className="text-sm text-text-secondary mt-2 max-w-md">
                "{artwork.title}" has been purchased by a collector. Sold artworks cannot be edited or deleted to preserve the collector's purchase record.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Link href={`/artworks/${artwork.id}`}>
                <Button variant="outline" size="md">
                  View Artwork Details
                </Button>
              </Link>
              <Link href="/dashboard/artist">
                <Button variant="primary" size="md">
                  Back to Studio
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <EditArtworkForm artwork={serializedArtwork} />
        )}
      </main>
    </div>
  );
}
