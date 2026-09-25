import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import UserNav from "@/components/UserNav";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  // Artists cannot buy or use checkout
  if (session.user.role === "artist") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
                Studio
              </Link>
            </nav>
          </div>
          <UserNav />
        </header>

        <main className="flex-1 max-w-xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center">
          <Card padding="lg" className="text-center flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-text-primary">
              Artist Account Notice
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              You are signed in with an artist account. Checkout and purchasing features are reserved for buyer accounts.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/artist">
                <Button variant="primary" size="md">
                  Go to Artist Studio
                </Button>
              </Link>
              <Link href="/artworks">
                <Button variant="outline" size="md">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Fetch cart items
  const rawItems = await prisma.cartItem.findMany({
    where: {
      buyerId: session.user.id,
    },
    include: {
      artwork: {
        include: {
          artist: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  // If cart is empty, redirect to cart page
  if (rawItems.length === 0) {
    redirect("/cart");
  }

  const items = rawItems.map((item) => ({
    id: item.id,
    artworkId: item.artworkId,
    artwork: {
      id: item.artwork.id,
      title: item.artwork.title,
      imageUrl: item.artwork.imageUrl,
      medium: item.artwork.medium,
      price: Number(item.artwork.price),
      artist: {
        name: item.artwork.artist.name,
      },
    },
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
              href="/cart"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to Cart
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Checkout
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Complete your shipping and payment details to acquire your selected artwork.
          </p>
        </div>

        <CheckoutClient
          initialItems={items}
          userName={session.user.name || ""}
        />
      </main>
    </div>
  );
}
