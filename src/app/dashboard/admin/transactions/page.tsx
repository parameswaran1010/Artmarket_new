"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

type OrderRow = {
  id: string;
  price: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  buyer: { name: string; email: string };
  artwork: { title: string };
};

const STATUS_OPTIONS = ["ALL", "PENDING", "COMPLETED", "CANCELLED"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const statusPill: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminTransactionsPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    fetch("/api/admin/transactions")
      .then((r) => {
        if (!r.ok) throw new Error("Forbidden");
        return r.json();
      })
      .then(setOrders)
      .catch(() => setError("Failed to load transactions. Ensure you are logged in as admin."))
      .finally(() => setLoading(false));
  }, []);

  const visible = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const totalRevenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + Number(o.price), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-text-primary tracking-tight">
            Art<span className="text-accent">Market</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Overview
            </Link>
            <Link href="/dashboard/admin/users" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Users
            </Link>
            <Link href="/dashboard/admin/transactions" className="text-sm font-medium text-accent">
              Transactions
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-4">
          <Link
            href="/dashboard/admin"
            className="text-xs font-semibold text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
          >
            &larr; Back to Overview
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Transactions</h1>
            <p className="text-sm text-text-secondary mt-1">
              {!loading && !error && (
                <>
                  {orders.length} total &mdash; revenue from completed orders:{" "}
                  <span className="font-semibold text-success">${totalRevenue.toFixed(2)}</span>
                </>
              )}
            </p>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-text-secondary whitespace-nowrap">
              Filter by status:
            </label>
            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              className="rounded border border-border px-3 py-1.5 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-150"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All statuses" : s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <Card padding="md">
            <p className="text-sm text-text-secondary">Loading transactions...</p>
          </Card>
        )}

        {error && (
          <Card padding="md">
            <p className="text-sm text-error">{error}</p>
          </Card>
        )}

        {!loading && !error && visible.length === 0 && (
          <Card padding="md">
            <p className="text-sm text-text-secondary">
              {filter === "ALL" ? "No orders on the platform yet." : `No ${filter.toLowerCase()} orders.`}
            </p>
          </Card>
        )}

        {!loading && !error && visible.length > 0 && (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Buyer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Artwork</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{order.buyer.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{order.buyer.email}</td>
                      <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate">{order.artwork.title}</td>
                      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                        ${Number(order.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusPill[order.status] ?? ""}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary row */}
            <div className="border-t border-border px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-text-secondary">
                Showing {visible.length} of {orders.length} orders
              </span>
              {filter !== "ALL" && (
                <Button variant="ghost" size="sm" onClick={() => setFilter("ALL")}>
                  Clear filter
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
