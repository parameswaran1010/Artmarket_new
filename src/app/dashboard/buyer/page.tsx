import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/dashboard/buyer");
  }

  if (session.user.role !== "buyer") {
    redirect(session.user.role === "artist" ? "/dashboard/artist" : "/");
  }

  // Fetch buyer's recent orders, total stats, and wishlist preview
  const [
    recentOrders,
    totalOrdersCount,
    totalSpentAggregate,
    wishlistItems,
    totalWishlistCount,
  ] = await Promise.all([
    prisma.order.findMany({
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
        createdAt: "desc",
      },
      take: 4,
    }),
    prisma.order.count({
      where: {
        buyerId: session.user.id,
      },
    }),
    prisma.order.aggregate({
      where: {
        buyerId: session.user.id,
        status: { not: "CANCELLED" },
      },
      _sum: {
        price: true,
      },
    }),
    prisma.wishlistItem.findMany({
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
      take: 4,
    }),
    prisma.wishlistItem.count({
      where: {
        buyerId: session.user.id,
      },
    }),
  ]);

  const totalSpent = Number(totalSpentAggregate._sum.price || 0);

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
              href="/dashboard/buyer"
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/buyer/orders"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Order History
            </Link>
            <Link
              href="/wishlist"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Wishlist
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">
              Collector Dashboard
            </h1>
            <p className="text-text-secondary text-sm">
              Welcome back, {session.user.name}. Track your artwork acquisitions, purchase history, and saved wishlist items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/buyer/orders">
              <Button variant="outline" size="md">
                Order History
              </Button>
            </Link>
            <Link href="/artworks">
              <Button variant="primary" size="md">
                Browse Artworks
              </Button>
            </Link>
          </div>
        </div>

        {/* Collector Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Artworks Collected
            </p>
            <p className="text-3xl font-bold text-text-primary">{totalOrdersCount}</p>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Total Collection Value
            </p>
            <p className="text-3xl font-bold text-accent">£{totalSpent.toFixed(2)}</p>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Saved in Wishlist
            </p>
            <p className="text-3xl font-bold text-text-secondary">{totalWishlistCount}</p>
          </Card>
        </div>

        {/* Section 1: Recent Orders */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                Recent Orders
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Your latest artwork purchases and deliveries
              </p>
            </div>
            {totalOrdersCount > 0 && (
              <Link
                href="/dashboard/buyer/orders"
                className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                View All Orders ({totalOrdersCount}) &rarr;
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              <h3 className="text-base font-semibold text-text-primary mb-2">
                No orders placed yet
              </h3>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                Explore our curated gallery of original paintings, drawings, and digital art created by independent artists.
              </p>
              <Link href="/artworks">
                <Button variant="primary" size="md">
                  Explore Artworks
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="border border-border bg-surface rounded-lg divide-y divide-border overflow-hidden">
              {recentOrders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const priceNum = Number(order.price);

                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-background/40 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={order.artwork.imageUrl}
                        alt={order.artwork.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded bg-border flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/artworks/${order.artwork.id}`}
                          className="font-semibold text-text-primary hover:text-accent transition-colors line-clamp-1 block text-base"
                        >
                          {order.artwork.title}
                        </Link>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Artist: {order.artwork.artist?.name || "Independent Artist"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                          <span>Ordered on {formattedDate}</span>
                          <span>&middot;</span>
                          <span className="font-mono text-[11px]">Ref: {order.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                      <div className="text-left sm:text-right">
                        <span className="text-base font-bold text-accent block">
                          £{priceNum.toFixed(2)}
                        </span>
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider mt-1 ${
                            order.status === "COMPLETED"
                              ? "bg-green-50 text-success border border-green-200"
                              : order.status === "CANCELLED"
                              ? "bg-red-50 text-error border border-red-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <Link href={`/artworks/${order.artwork.id}`}>
                        <Button variant="outline" size="sm">
                          View Artwork
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Wishlist Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                Wishlist Preview
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Artworks you have saved for later
              </p>
            </div>
            {totalWishlistCount > 0 && (
              <Link
                href="/wishlist"
                className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                View Full Wishlist ({totalWishlistCount}) &rarr;
              </Link>
            )}
          </div>

          {wishlistItems.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              <h3 className="text-base font-semibold text-text-primary mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                Save artworks you are interested in while browsing to keep track of their availability and details.
              </p>
              <Link href="/artworks">
                <Button variant="outline" size="md">
                  Discover Artworks
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {wishlistItems.map((item) => {
                const artwork = item.artwork;
                const priceNum = Number(artwork.price);

                return (
                  <Card key={item.id} padding="none" className="overflow-hidden flex flex-col h-full">
                    <Link
                      href={`/artworks/${artwork.id}`}
                      className="relative block aspect-[4/3] bg-border overflow-hidden group"
                    >
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider ${
                          artwork.status === "AVAILABLE"
                            ? "bg-surface/95 text-success border border-border"
                            : "bg-surface/95 text-text-secondary border border-border"
                        }`}
                      >
                        {artwork.status}
                      </span>
                    </Link>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/artworks/${artwork.id}`}
                          className="font-semibold text-text-primary hover:text-accent transition-colors line-clamp-1 text-sm block"
                        >
                          {artwork.title}
                        </Link>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                          {artwork.artist?.name || "Independent Artist"}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-bold text-accent">
                          £{priceNum.toFixed(2)}
                        </span>
                        <Link href={`/artworks/${artwork.id}`}>
                          <span className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                            Details &rarr;
                          </span>
                        </Link>
                      </div>
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
