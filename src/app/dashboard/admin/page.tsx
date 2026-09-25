import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const [userCount, orderCount, artworkCount, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.artwork.count(),
    prisma.order.aggregate({
      _sum: { price: true },
      where: { status: "COMPLETED" },
    }),
  ]);

  const suspendedCount = await prisma.user.count({ where: { status: "SUSPENDED" } });

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      artwork: { select: { title: true } },
    },
  });

  const totalRevenue = Number(revenue._sum.price ?? 0).toFixed(2);

  const statusColor: Record<string, string> = {
    PENDING:   "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-text-primary tracking-tight">
            Art<span className="text-accent">Market</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-sm font-medium text-accent">
              Overview
            </Link>
            <Link href="/dashboard/admin/users" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Users
            </Link>
            <Link href="/dashboard/admin/transactions" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Transactions
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary">Admin Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Platform-wide summary and quick links.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-3xl font-bold text-text-primary">{userCount}</p>
            {suspendedCount > 0 && (
              <p className="text-xs text-error mt-1">{suspendedCount} suspended</p>
            )}
          </Card>
          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Artworks</p>
            <p className="text-3xl font-bold text-text-primary">{artworkCount}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Orders</p>
            <p className="text-3xl font-bold text-text-primary">{orderCount}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Revenue</p>
            <p className="text-3xl font-bold text-accent">${totalRevenue}</p>
            <p className="text-xs text-text-secondary mt-1">completed only</p>
          </Card>
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Card padding="md" className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">User Management</h2>
              <p className="text-sm text-text-secondary mt-0.5">View all accounts, suspend or reactivate users.</p>
            </div>
            <Link href="/dashboard/admin/users">
              <Button variant="outline" size="sm">Go to Users</Button>
            </Link>
          </Card>
          <Card padding="md" className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Transactions</h2>
              <p className="text-sm text-text-secondary mt-0.5">Browse all platform orders filtered by status.</p>
            </div>
            <Link href="/dashboard/admin/transactions">
              <Button variant="outline" size="sm">Go to Transactions</Button>
            </Link>
          </Card>
        </div>

        {/* Recent orders */}
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-3">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-text-secondary">No orders yet.</p>
            </Card>
          ) : (
            <Card padding="none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Buyer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Artwork</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                      <td className="px-4 py-3 text-text-primary">{order.buyer.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{order.artwork.title}</td>
                      <td className="px-4 py-3 text-text-primary font-medium">${Number(order.price).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColor[order.status] ?? ""}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
