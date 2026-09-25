import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/dashboard/buyer/orders");
  }

  if (session.user.role !== "buyer") {
    redirect(session.user.role === "artist" ? "/dashboard/artist" : "/");
  }

  // Fetch all orders for this buyer
  const orders = await prisma.order.findMany({
    where: {
      buyerId: session.user.id,
    },
    include: {
      artwork: {
        include: {
          artist: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
  const totalInvested = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.price), 0);

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
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/buyer/orders"
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
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
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Link
            href="/dashboard/buyer"
            className="text-xs font-semibold text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">
              Purchase History
            </h1>
            <p className="text-text-secondary text-sm">
              All your acquired artworks, past transactions, and fulfillment statuses.
            </p>
          </div>

          <Link href="/artworks">
            <Button variant="primary" size="md">
              Browse More Artworks
            </Button>
          </Link>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Total Purchases
            </p>
            <p className="text-3xl font-bold text-text-primary">{totalOrders}</p>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Completed Orders
            </p>
            <p className="text-3xl font-bold text-success">{completedOrders}</p>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Total Spent
            </p>
            <p className="text-3xl font-bold text-accent">£{totalInvested.toFixed(2)}</p>
          </Card>
        </div>

        {/* Order History Listing */}
        <div>
          {orders.length === 0 ? (
            <Card padding="lg" className="text-center py-16 max-w-xl mx-auto">
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                No orders found
              </h2>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto leading-relaxed">
                You haven&apos;t placed any orders yet. Discover unique original art from independent artists across various styles and mediums.
              </p>
              <Link href="/artworks">
                <Button variant="primary" size="md">
                  Explore Artwork Catalog
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const priceNum = Number(order.price);

                return (
                  <Card key={order.id} padding="none" className="overflow-hidden">
                    {/* Order Header / Summary Bar */}
                    <div className="bg-background px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-text-secondary block text-[10px] uppercase tracking-wider">
                            Order Placed
                          </span>
                          <span className="font-medium text-text-primary">
                            {formattedDate} at {formattedTime}
                          </span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-border" />
                        <div>
                          <span className="text-text-secondary block text-[10px] uppercase tracking-wider">
                            Order Reference
                          </span>
                          <span className="font-mono font-medium text-text-primary">
                            #{order.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider ${
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
                    </div>

                    {/* Order Details Body */}
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                        <Link
                          href={`/artworks/${order.artwork.id}`}
                          className="relative block w-20 h-20 sm:w-24 sm:h-24 bg-border rounded overflow-hidden flex-shrink-0 group"
                        >
                          <img
                            src={order.artwork.imageUrl}
                            alt={order.artwork.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </Link>

                        <div className="min-w-0">
                          <Link
                            href={`/artworks/${order.artwork.id}`}
                            className="font-semibold text-text-primary hover:text-accent transition-colors text-base sm:text-lg line-clamp-1 block"
                          >
                            {order.artwork.title}
                          </Link>
                          <p className="text-xs text-text-secondary mt-1">
                            Artist:{" "}
                            <span className="text-text-primary font-medium">
                              {order.artwork.artist?.name || "Independent Artist"}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {order.artwork.medium && (
                              <span className="text-[11px] bg-background border border-border px-2 py-0.5 rounded text-text-secondary">
                                {order.artwork.medium}
                              </span>
                            )}
                            {order.artwork.style && (
                              <span className="text-[11px] bg-background border border-border px-2 py-0.5 rounded text-text-secondary">
                                {order.artwork.style}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-border">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-text-secondary block uppercase tracking-wider">
                            Purchase Price
                          </span>
                          <span className="text-xl font-bold text-accent">
                            £{priceNum.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/artworks/${order.artwork.id}`}>
                            <Button variant="outline" size="sm">
                              View Artwork
                            </Button>
                          </Link>
                        </div>
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
