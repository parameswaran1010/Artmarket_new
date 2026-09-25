"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type CartItemData = {
  id: string;
  artworkId: string;
  artwork: {
    id: string;
    title: string;
    imageUrl: string;
    medium: string;
    style: string;
    price: number;
    status: string;
    artist: {
      id: string;
      name: string;
    };
  };
};

type Props = {
  initialItems: CartItemData[];
};

export default function CartClient({ initialItems }: Props) {
  const [items, setItems] = useState<CartItemData[]>(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRemove = async (artworkId: string) => {
    setRemovingId(artworkId);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/cart?artworkId=${encodeURIComponent(artworkId)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove item.");
      }

      setItems((prev) => prev.filter((item) => item.artworkId !== artworkId));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error removing item from cart."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.artwork.price, 0);

  if (items.length === 0) {
    return (
      <Card padding="lg" className="text-center py-16 flex flex-col items-center justify-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Your cart is empty</h2>
          <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto">
            Browse our curated collection of original art pieces and find something you love.
          </p>
        </div>
        <Link href="/artworks">
          <Button variant="primary" size="md">
            Browse Artworks
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMessage && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm font-semibold text-text-primary uppercase tracking-wide">
              {items.length} {items.length === 1 ? "Artwork" : "Artworks"} in Cart
            </span>
            <Link
              href="/artworks"
              className="text-xs text-text-secondary hover:text-accent transition-colors"
            >
              Continue shopping
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <Card key={item.id} padding="md" className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Artwork Thumbnail */}
                <Link
                  href={`/artworks/${item.artwork.id}`}
                  className="w-full sm:w-28 h-28 bg-border rounded overflow-hidden flex-shrink-0 relative group"
                >
                  <img
                    src={item.artwork.imageUrl}
                    alt={item.artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/artworks/${item.artwork.id}`}
                    className="text-base font-semibold text-text-primary hover:text-accent transition-colors line-clamp-1"
                  >
                    {item.artwork.title}
                  </Link>

                  <p className="text-xs text-text-secondary mt-0.5">
                    By {item.artwork.artist.name}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-2">
                    <span>{item.artwork.medium}</span>
                    <span>·</span>
                    <span>{item.artwork.style}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <span className="text-xs font-medium text-text-secondary">
                      Quantity: 1 (Original)
                    </span>
                    <button
                      type="button"
                      disabled={removingId === item.artworkId}
                      onClick={() => handleRemove(item.artworkId)}
                      className="text-xs text-error hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {removingId === item.artworkId ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right sm:self-center pl-2">
                  <span className="text-lg font-bold text-accent whitespace-nowrap">
                    £{item.artwork.price.toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card padding="md" className="flex flex-col gap-4 sticky top-24">
            <h3 className="text-base font-semibold text-text-primary">
              Order Summary
            </h3>

            <div className="divide-y divide-border text-sm">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium text-text-primary">
                  £{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-text-secondary">Insured Shipping</span>
                <span className="font-medium text-success">
                  Included
                </span>
              </div>
              <div className="flex items-center justify-between py-3 text-base font-bold text-text-primary">
                <span>Total</span>
                <span className="text-accent">
                  £{subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Taxes included. Each piece is packaged with museum-grade protective materials and shipped with full insurance coverage.
            </p>

            <Link href="/checkout" className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                Proceed to Checkout
              </Button>
            </Link>

            <Link
              href="/artworks"
              className="text-xs text-center text-text-secondary hover:text-text-primary transition-colors"
            >
              Continue Browsing Artworks
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
