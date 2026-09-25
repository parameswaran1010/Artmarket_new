"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

const MEDIUM_PRESETS = [
  "Oil on canvas",
  "Acrylic on canvas",
  "Watercolor on paper",
  "Digital Art / Illustration",
  "Mixed Media",
  "Photography (Fine Art)",
  "Gouache on paper",
  "Ink on paper",
  "Bronze Sculpture",
  "Ceramic",
  "Charcoal drawing",
];

const STYLE_PRESETS = [
  "Contemporary",
  "Abstract",
  "Realism",
  "Impressionism",
  "Surrealism",
  "Minimalist",
  "Pop Art",
  "Expressionism",
  "Modernist",
  "Figurative",
  "Conceptual",
];

type ArtworkData = {
  id: string;
  title: string;
  description: string;
  medium: string;
  style: string;
  tags: string[];
  price: number;
  imageUrl: string;
  status: "AVAILABLE" | "SOLD" | "HIDDEN";
};

type Props = {
  artwork: ArtworkData;
};

export default function EditArtworkForm({ artwork }: Props) {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState(artwork.title);
  const [description, setDescription] = useState(artwork.description);
  const [medium, setMedium] = useState(artwork.medium);
  const [customMedium, setCustomMedium] = useState("");
  const [style, setStyle] = useState(artwork.style);
  const [customStyle, setCustomStyle] = useState("");
  const [tagsInput, setTagsInput] = useState(artwork.tags.join(", "));
  const [price, setPrice] = useState(String(artwork.price));
  const [status, setStatus] = useState<"AVAILABLE" | "HIDDEN">(
    artwork.status === "HIDDEN" ? "HIDDEN" : "AVAILABLE"
  );
  const [imageUrl, setImageUrl] = useState(artwork.imageUrl);

  // Upload state for replacing image
  const [localPreview, setLocalPreview] = useState<string>("");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status feedback
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // AI re-analyze state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessNote, setAiSuccessNote] = useState("");

  const activeImageUrl = imageUrl;
  const previewSrc = localPreview || activeImageUrl;

  const effectiveMedium = medium === "Custom" ? customMedium.trim() : medium;
  const effectiveStyle = style === "Custom" ? customStyle.trim() : style;

  // Handle local file upload to Supabase Storage
  const handleFileUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErrorMessage("Please select a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds 10 MB limit.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setUploadedFileName(file.name);

    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);

    setUploadState("uploading");
    setUploadProgress(15);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return prev;
          }
          return prev + 15;
        });
      }, 150);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/artwork", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image to storage.");
      }

      setUploadProgress(100);
      setUploadState("done");
      setImageUrl(data.url);
      setSuccessMessage("New image uploaded to cloud storage successfully.");
    } catch (err) {
      setUploadState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Image upload failed. Please try again."
      );
    }
  };

  // AI detail re-generation
  const handleAiRegenerate = async () => {
    if (!activeImageUrl || uploadState === "uploading") return;

    setAiLoading(true);
    setErrorMessage("");
    setAiSuccessNote("");

    try {
      const res = await fetch("/api/ai/generate-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: activeImageUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI could not inspect the artwork.");
      }

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.medium) {
        if (MEDIUM_PRESETS.includes(data.medium)) {
          setMedium(data.medium);
        } else {
          setMedium("Custom");
          setCustomMedium(data.medium);
        }
      }
      if (data.style) {
        if (STYLE_PRESETS.includes(data.style)) {
          setStyle(data.style);
        } else {
          setStyle("Custom");
          setCustomStyle(data.style);
        }
      }
      if (Array.isArray(data.tags) && data.tags.length > 0) {
        setTagsInput(data.tags.join(", "));
      }
      if (data.suggestedPrice) {
        setPrice(String(data.suggestedPrice));
      }

      setAiSuccessNote(
        `AI suggestions applied! Suggested price: £${data.suggestedPrice ? data.suggestedPrice.toLocaleString("en-GB") : ""}.`
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Artwork title is required.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Artwork description is required.");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMessage("Please enter a valid price in GBP (£).");
      return;
    }

    setSaveLoading(true);

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/artworks/${artwork.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          medium: effectiveMedium || "Mixed Media",
          style: effectiveStyle || "Contemporary",
          tags: parsedTags,
          price: numPrice,
          imageUrl: activeImageUrl,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update artwork.");
      }

      setSuccessMessage("Artwork details updated successfully!");
      setTimeout(() => {
        router.push(`/artworks/${artwork.id}`);
        router.refresh();
      }, 800);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update artwork.");
      setSaveLoading(false);
    }
  };

  // Handle delete
  const handleDeleteArtwork = async () => {
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/artworks/${artwork.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete artwork.");
      }

      router.push("/dashboard/artist");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete artwork.");
      setDeleteLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-success text-sm font-medium">
          {successMessage}
        </div>
      )}

      {aiSuccessNote && (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
          ✨ {aiSuccessNote}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image Management & AI */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card padding="md" className="flex flex-col gap-4">
            <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
              Artwork Image
            </h3>

            {/* Current / New Preview */}
            <div className="relative aspect-[4/3] rounded border border-border bg-background overflow-hidden flex items-center justify-center">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={title || "Artwork preview"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-text-secondary">No image</span>
              )}

              {uploadState === "done" && (
                <div className="absolute top-2 right-2 bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  ✓ Saved to Cloud
                </div>
              )}
            </div>

            {/* Upload New Image Dropzone */}
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1.5">
                Replace with local file:
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                  transition-all duration-150 flex flex-col items-center justify-center gap-1.5
                  ${
                    isDragging
                      ? "border-accent bg-accent/5 scale-[1.01]"
                      : uploadState === "done"
                      ? "border-success/60 bg-green-50/20"
                      : "border-border hover:border-accent hover:bg-surface/50"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                <span className="text-xl">📁</span>
                <span className="text-xs font-semibold text-text-primary">
                  {uploadState === "uploading"
                    ? "Uploading image..."
                    : uploadState === "done"
                    ? `✓ ${uploadedFileName}`
                    : "Click to upload replacement image"}
                </span>
                <span className="text-[10px] text-text-secondary">
                  JPEG, PNG, WebP up to 10MB
                </span>

                {/* Progress bar */}
                {uploadState === "uploading" && (
                  <div className="w-full bg-border rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-accent h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* AI Re-estimate Button */}
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={aiLoading || uploadState === "uploading"}
              onClick={handleAiRegenerate}
              className="w-full text-xs"
            >
              {aiLoading ? "✨ Analyzing with AI..." : "✨ AI Re-estimate & Details"}
            </Button>
          </Card>

          {/* Visibility / Status */}
          <Card padding="md" className="flex flex-col gap-3">
            <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
              Listing Status
            </h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer">
                <input
                  type="radio"
                  name="listing-status"
                  value="AVAILABLE"
                  checked={status === "AVAILABLE"}
                  onChange={() => setStatus("AVAILABLE")}
                  className="text-accent focus:ring-accent"
                />
                <div>
                  <span className="font-medium block">Publicly Listed (Available)</span>
                  <span className="text-text-secondary text-[11px]">
                    Visible to buyers and available for purchase
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer">
                <input
                  type="radio"
                  name="listing-status"
                  value="HIDDEN"
                  checked={status === "HIDDEN"}
                  onChange={() => setStatus("HIDDEN")}
                  className="text-accent focus:ring-accent"
                />
                <div>
                  <span className="font-medium block">Hidden (Unlisted)</span>
                  <span className="text-text-secondary text-[11px]">
                    Only visible to you in your studio dashboard
                  </span>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Columns: Main Metadata Fields */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card padding="md" className="flex flex-col gap-4">
            <h3 className="font-semibold text-text-primary text-base">
              Artwork Details
            </h3>

            {/* Title */}
            <Input
              id="title"
              label="Title"
              placeholder="e.g. Whispers of the High Highlands"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Description */}
            <Textarea
              id="description"
              label="Description & Story"
              placeholder="Describe the inspiration, technique, and narrative behind this artwork..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />

            {/* Medium & Style Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  Medium
                </label>
                <select
                  value={MEDIUM_PRESETS.includes(medium) ? medium : "Custom"}
                  onChange={(e) => setMedium(e.target.value)}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {MEDIUM_PRESETS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="Custom">Custom...</option>
                </select>
                {medium === "Custom" && (
                  <Input
                    id="customMedium"
                    label=""
                    placeholder="Enter custom medium"
                    value={customMedium}
                    onChange={(e) => setCustomMedium(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  Style
                </label>
                <select
                  value={STYLE_PRESETS.includes(style) ? style : "Custom"}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {STYLE_PRESETS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Custom">Custom...</option>
                </select>
                {style === "Custom" && (
                  <Input
                    id="customStyle"
                    label=""
                    placeholder="Enter custom style"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            {/* Price (GBP £) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="price" className="text-sm font-medium text-text-primary">
                  Price (£ GBP) *
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm select-none">
                  £
                </span>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  inputClassName="pl-7"
                />
              </div>
              <p className="text-xs text-text-secondary mt-1">
                All prices are in British Pounds (£ GBP).
              </p>
            </div>

            {/* Tags */}
            <Input
              id="tags"
              label="Tags (comma-separated)"
              placeholder="landscape, mountains, oil, atmospheric, vibrant"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </Card>

          {/* Action Provisions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Delete button on the left */}
            <Button
              variant="danger-outline"
              size="md"
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={saveLoading}
            >
              🗑️ Delete Artwork
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link href={`/artworks/${artwork.id}`}>
                <Button variant="ghost" size="md" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={saveLoading || uploadState === "uploading"}
              >
                {saveLoading ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center text-lg flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Delete "{artwork.title}"?
                </h3>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Are you sure you want to permanently delete this artwork? This will remove the listing and image from the marketplace. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-xs text-error font-medium bg-error/10 border border-error/20 p-2.5 rounded">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Keep Artwork
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={handleDeleteArtwork}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
