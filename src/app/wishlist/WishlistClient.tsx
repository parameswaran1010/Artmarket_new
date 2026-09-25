"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type WishlistItemData = {
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
  initialItems: WishlistItemData[];
};

export default function WishlistClient({ initialItems }: Props) {
  const [items, setItems] = useState<WishlistItemData[]>(initialItems);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRemove = async (artworkId: string) => {
    setActionLoadingId(artworkId);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/wishlist?artworkId=${encodeURIComponent(artworkId)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove item.");
      }

      setItems((prev) => prev.filter((item) => item.artworkId !== artworkId));
      setFeedbackMessage("Artwork removed from your wishlist.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error removing item from wishlist."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMoveToCart = async (artworkId: string) => {
    setActionLoadingId(artworkId);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      // 1. Add to cart
      const cartRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId }),
      });

      const cartData = await cartRes.json();

      if (!cartRes.ok) {
        throw new Error(cartData.error || "Failed to add artwork to cart.");
      }

      // 2. Remove from wishlist
      await fetch(`/api/wishlist?artworkId=${encodeURIComponent(artworkId)}`, {
        method: "DELETE",
      });

      setItems((prev) => prev.filter((item) => item.artworkId !== artworkId));
      setFeedbackMessage("Artwork moved to your cart.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error moving artwork to cart."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <Card padding="lg" className="text-center py-16 flex flex-col items-center justify-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Your wishlist is empty</h2>
          <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto">
            Save pieces you love while browsing to keep track of them for later.
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
      {/* Feedback Messages */}
      {feedbackMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-success text-sm font-medium flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <Link href="/cart" className="text-xs underline font-semibold text-success hover:opacity-80">
            View Cart
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          {items.length} Saved {items.length === 1 ? "Artwork" : "Artworks"}
        </span>
        <Link
          href="/cart"
          className="text-xs text-accent hover:underline font-medium"
        >
          Go to Cart →
        </Link>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const isSold = item.artwork.status === "SOLD";

          return (
            <Card
              key={item.id}
              padding="none"
              className="overflow-hidden flex flex-col justify-between hover:border-accent transition-colors"
            >
              <div>
                {/* Artwork Image */}
                <div className="relative aspect-[4/3] bg-border overflow-hidden group">
                  <img
                    src={item.artwork.imageUrl}
                    alt={item.artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                        isSold
                          ? "bg-surface text-error border-error/30"
                          : "bg-surface text-success border-green-200"
                      }`}
                    >
                      {isSold ? "Sold" : "Available"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link
                      href={`/artworks/${item.artwork.id}`}
                      className="font-semibold text-text-primary hover:text-accent transition-colors text-base line-clamp-1"
                    >
                      {item.artwork.title}
                    </Link>
                    <span className="font-bold text-accent whitespace-nowrap">
                      £{item.artwork.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary mb-3">
                    By {item.artwork.artist.name}
                  </p>

                  <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-border">
                    <span>{item.artwork.medium}</span>
                    <span>{item.artwork.style}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex items-center gap-2">
                {!isSold ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={actionLoadingId === item.artworkId}
                    onClick={() => handleMoveToCart(item.artworkId)}
                  >
                    {actionLoadingId === item.artworkId ? "Moving..." : "Move to Cart"}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="flex-1 text-xs opacity-50"
                  >
                    Sold Out
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoadingId === item.artworkId}
                  onClick={() => handleRemove(item.artworkId)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
