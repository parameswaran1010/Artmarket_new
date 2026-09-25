"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const roleDashboard: Record<string, string> = {
  artist: "/dashboard/artist",
  buyer:  "/dashboard/buyer",
  admin:  "/dashboard/admin",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // If middleware set a callbackUrl (user hit a protected route directly), honour it.
      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl && !callbackUrl.includes("/login")) {
        window.location.href = callbackUrl;
        return;
      }

      // Otherwise route to the role-specific dashboard.
      const session = await getSession();
      const role = session?.user?.role as string | undefined;
      window.location.href = (role && roleDashboard[role]) ?? "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md" padding="lg">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          Log in to ArtMarket
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Enter your email and password to continue.
        </p>

        {justRegistered && (
          <p className="text-sm text-success bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">
            Account created. You can now log in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="text-sm text-text-secondary mt-5 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
