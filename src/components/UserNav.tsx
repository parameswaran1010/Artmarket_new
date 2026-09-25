"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-20 bg-border/40 animate-pulse rounded" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-text-primary leading-tight">
            {session.user.name}
          </p>
          <span className="text-xs text-accent font-semibold uppercase tracking-wider">
            {session.user.role}
          </span>
        </div>
        {session.user.role === "artist" ? (
          <Link href="/dashboard/artist">
            <Button variant="ghost" size="sm">
              Studio
            </Button>
          </Link>
        ) : session.user.role === "admin" ? (
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm">
              Admin
            </Button>
          </Link>
        ) : (
          <>
            <Link href="/dashboard/buyer">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/wishlist">
              <Button variant="ghost" size="sm">
                Wishlist
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="sm">
                Cart
              </Button>
            </Link>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login">
        <Button variant="outline" size="sm">
          Log in
        </Button>
      </Link>
      <Link href="/register">
        <Button variant="primary" size="sm">
          Sign up
        </Button>
      </Link>
    </div>
  );
}
