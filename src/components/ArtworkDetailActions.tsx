"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/ui/Button";

type Props = {
  artworkId: string;
  artworkTitle: string;
  artistId: string;
  status: "AVAILABLE" | "SOLD" | "HIDDEN";
  currentUserId?: string;
  currentUserRole?: string;
};

export default function ArtworkDetailActions({
  artworkId,
  artworkTitle,
  artistId,
  status,
  currentUserId,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const { data: clientSession } = useSession();

  // Determine effective user info from props or client session
  const activeUserId = currentUserId || clientSession?.user?.id;
  const activeRole = currentUserRole || clientSession?.user?.role;

  const isOwner = Boolean(activeUserId && activeUserId === artistId);
  const isAdmin = activeRole === "admin";
  const isArtist = activeRole === "artist";
  const isSold = status === "SOLD";

  // State for buyer cart/wishlist
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [wishlistMessage, setWishlistMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // State for delete action
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!activeUserId) {
      router.push(`/login?callbackUrl=/artworks/${artworkId}`);
      return;
    }

    setActionLoading(true);
    setCartMessage(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add to cart.");
      }

      setCartMessage("Added to cart");
      setTimeout(() => setCartMessage(null), 4000);
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : "Error adding to cart.");
      setTimeout(() => setCartMessage(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!activeUserId) {
      router.push(`/login?callbackUrl=/artworks/${artworkId}`);
      return;
    }

    setActionLoading(true);
    setWishlistMessage(null);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add to wishlist.");
      }

      setWishlistMessage("Saved to wishlist");
      setTimeout(() => setWishlistMessage(null), 4000);
    } catch (err) {
      setWishlistMessage(err instanceof Error ? err.message : "Error adding to wishlist.");
      setTimeout(() => setWishlistMessage(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/artworks/${artworkId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete artwork.");
      }

      // Redirect back to artist dashboard
      router.push("/dashboard/artist");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error deleting artwork.");
      setDeleteLoading(false);
    }
  };

  // 1. OWNER / ARTIST OF THIS ARTWORK (or ADMIN)
  if (isOwner || isAdmin) {
    return (
      <div className="pt-2 flex flex-col gap-3">
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              You are the artist of this piece
            </span>
            {isSold ? (
              <span className="text-xs font-semibold text-error bg-error/10 border border-error/20 px-2 py-0.5 rounded">
                Sold Out
              </span>
            ) : (
              <span className="text-xs font-semibold text-success bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                Unsold · Listed
              </span>
            )}
          </div>

          <p className="text-xs text-text-secondary">
            {isSold
              ? "This artwork has been sold to a collector. The details and status are locked and cannot be edited or deleted."
              : "As the creator, you can update catalog details, pricing, or delete this artwork while it remains unsold."}
          </p>

          {/* Action Provisions */}
          {!isSold ? (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link
                href={`/dashboard/artist/artworks/${artworkId}/edit`}
                className="flex-1"
              >
                <Button variant="primary" size="md" className="w-full">
                  Edit Details
                </Button>
              </Link>
              <Button
                variant="danger-outline"
                size="md"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Artwork
              </Button>
            </div>
          ) : (
            <div className="pt-1">
              <Button variant="ghost" size="md" disabled className="w-full text-xs">
                Editing and deletion locked for sold works
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal / Card */}
        {showDeleteConfirm && (
          <div className="rounded-lg border border-error/40 bg-error/5 p-4 flex flex-col gap-3 animate-in fade-in duration-150">
            <div>
              <h4 className="text-sm font-semibold text-text-primary">
                Delete "{artworkTitle}"?
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                This will permanently delete this artwork from your studio and the public catalog. This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-error font-medium bg-error/10 border border-error/20 px-3 py-1.5 rounded">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete Artwork"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. OTHER ARTIST USER (Artists cannot buy / add to cart or wishlist)
  if (isArtist) {
    return (
      <div className="pt-2">
        <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            Artist Account
          </span>
          <p className="text-xs text-text-secondary leading-relaxed">
            Artist accounts are designed for showcasing and selling artwork. Cart and wishlist features are reserved for buyer accounts.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border mt-1">
            <Link
              href="/dashboard/artist"
              className="text-xs text-accent hover:underline font-medium"
            >
              Go to your Artist Studio →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. BUYER OR GUEST
  return (
    <div className="flex flex-col gap-3 pt-2">
      {isSold ? (
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <p className="text-sm font-semibold text-text-secondary">
            This artwork has been sold
          </p>
          <p className="text-xs text-text-secondary mt-1">
            It is no longer available for purchase or wishlist.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={actionLoading}
              onClick={handleAddToCart}
            >
              {cartMessage || "Add to Cart"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={actionLoading}
              onClick={handleAddToWishlist}
            >
              {wishlistMessage || "Add to Wishlist"}
            </Button>
          </div>

          {cartMessage && (
            <div className="flex items-center justify-between text-xs text-success font-medium bg-green-50 border border-green-200 px-3 py-2 rounded">
              <span>{cartMessage}</span>
              <Link href="/cart" className="underline font-semibold hover:opacity-80">
                View Cart
              </Link>
            </div>
          )}
          {wishlistMessage && (
            <div className="flex items-center justify-between text-xs text-success font-medium bg-green-50 border border-green-200 px-3 py-2 rounded">
              <span>{wishlistMessage}</span>
              <Link href="/wishlist" className="underline font-semibold hover:opacity-80">
                View Wishlist
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
