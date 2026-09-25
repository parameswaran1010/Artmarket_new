"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "artist" | "buyer" | "admin";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
};

const rolePill: Record<string, string> = {
  admin:  "bg-accent/10 text-accent",
  artist: "bg-blue-50 text-blue-700",
  buyer:  "bg-gray-100 text-text-secondary",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error("Forbidden");
        return r.json();
      })
      .then(setUsers)
      .catch(() => setError("Failed to load users. Ensure you are logged in as admin."))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(user: UserRow) {
    const next = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setPendingId(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, status: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Something went wrong.");
        return;
      }
      const updated: UserRow = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, status: updated.status } : u)));
    } catch {
      alert("Network error.");
    } finally {
      setPendingId(null);
    }
  }

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
            <Link href="/dashboard/admin/users" className="text-sm font-medium text-accent">
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
        <div className="mb-4">
          <Link
            href="/dashboard/admin"
            className="text-xs font-semibold text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
          >
            &larr; Back to Overview
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">User Management</h1>
            <p className="text-sm text-text-secondary mt-1">Suspend or reactivate any account.</p>
          </div>
          {!loading && !error && (
            <span className="text-sm text-text-secondary">{users.length} accounts</span>
          )}
        </div>

        {loading && (
          <Card padding="md">
            <p className="text-sm text-text-secondary">Loading users...</p>
          </Card>
        )}

        {error && (
          <Card padding="md">
            <p className="text-sm text-error">{error}</p>
          </Card>
        )}

        {!loading && !error && users.length === 0 && (
          <Card padding="md">
            <p className="text-sm text-text-secondary">No users found.</p>
          </Card>
        )}

        {!loading && !error && users.length > 0 && (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{user.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${rolePill[user.role] ?? ""}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "admin" ? (
                          <span className="text-xs text-text-secondary italic">Protected</span>
                        ) : (
                          <Button
                            variant={user.status === "ACTIVE" ? "danger-outline" : "outline"}
                            size="sm"
                            disabled={pendingId === user.id}
                            onClick={() => toggleStatus(user)}
                          >
                            {pendingId === user.id
                              ? "Saving..."
                              : user.status === "ACTIVE"
                              ? "Suspend"
                              : "Activate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
