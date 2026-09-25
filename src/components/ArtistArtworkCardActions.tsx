"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

type Props = {
  artworkId: string;
  artworkTitle: string;
  isSold: boolean;
};

export default function ArtistArtworkCardActions({
  artworkId,
  artworkTitle,
  isSold,
}: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/artworks/${artworkId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete artwork.");
      }

      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error deleting artwork.");
      setDeleting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1.5">
        {/* View Details */}
        <Link
          href={`/artworks/${artworkId}`}
          className="flex-1"
        >
          <Button variant="ghost" size="sm" className="w-full text-xs py-1 px-2">
            View
          </Button>
        </Link>

        {/* Edit Details */}
        {!isSold ? (
          <Link
            href={`/dashboard/artist/artworks/${artworkId}/edit`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full text-xs py-1 px-2">
              Edit
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="flex-1 text-xs py-1 px-2 opacity-50"
            title="Sold artworks cannot be edited"
          >
            Sold
          </Button>
        )}

        {/* Delete (if unsold) */}
        {!isSold ? (
          <Button
            variant="danger-outline"
            size="sm"
            className="text-xs py-1 px-2"
            onClick={() => setShowConfirm(true)}
            title="Delete unsold artwork"
          >
            Delete
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="text-xs py-1 px-2 opacity-40"
            title="Sold artworks cannot be deleted"
          >
            Locked
          </Button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Delete "{artworkTitle}"?
                </h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  This unsold artwork will be permanently deleted from your studio and the marketplace.
                </p>
              </div>

            {deleteError && (
              <p className="text-xs text-error font-medium bg-error/10 border border-error/20 p-2 rounded">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
