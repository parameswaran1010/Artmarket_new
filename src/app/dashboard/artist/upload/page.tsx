"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import UserNav from "@/components/UserNav";

// Curated high-resolution art samples for one-click testing
const SAMPLE_ARTWORKS = [
  {
    name: "Abstract Canvas",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Impressionist Nature",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Sculptural Form",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1000&auto=format&fit=crop",
  },
];

type UploadState = "idle" | "uploading" | "done" | "error";

export default function ArtworkUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state — every field is completely editable at all times
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [medium, setMedium] = useState("");
  const [style, setStyle] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [localPreview, setLocalPreview] = useState(""); // blob URL for local preview before upload

  // AI & form state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Role validation
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/artist/upload");
    } else if (status === "authenticated" && session?.user?.role !== "artist") {
      router.push("/");
    }
  }, [status, session, router]);

  // Handle local file selection → upload to Supabase → set imageUrl
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview (blob URL — never sent to API)
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    setImageUrl(""); // Clear old URL until upload completes
    setAiSuccessMessage("");
    setErrorMessage("");
    setUploadedFileName(file.name);
    setUploadState("uploading");
    setUploadProgress(0);

    // Simulate progress bar during upload
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/artwork", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await res.json();

      if (!res.ok) {
        setUploadState("error");
        setErrorMessage(data.error || "Failed to upload image.");
        setLocalPreview("");
        return;
      }

      setUploadProgress(100);
      setUploadState("done");
      setImageUrl(data.url); // ✅ Now a real public Supabase URL
    } catch {
      clearInterval(progressInterval);
      setUploadState("error");
      setErrorMessage("Network error during upload. Please try again.");
      setLocalPreview("");
    }
  }

  // Clear uploaded file and reset
  function handleClearUpload() {
    setLocalPreview("");
    setImageUrl("");
    setUploadState("idle");
    setUploadProgress(0);
    setUploadedFileName("");
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Trigger AI generation using the stored public URL
  async function handleGenerateDetails() {
    const urlToAnalyze = imageUrl.trim();
    if (!urlToAnalyze) {
      setErrorMessage("Please provide or upload an image first.");
      return;
    }

    setAiLoading(true);
    setErrorMessage("");
    setAiSuccessMessage("");

    try {
      const res = await fetch("/api/ai/generate-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: urlToAnalyze }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to generate details with AI.");
        return;
      }

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.medium) setMedium(data.medium);
      if (data.style) setStyle(data.style);
      if (data.tags) {
        setTags(Array.isArray(data.tags) ? data.tags.join(", ") : data.tags);
      }
      if (data.suggestedPrice && data.suggestedPrice > 0) {
        setPrice(String(data.suggestedPrice));
      }

      const priceNote =
        data.suggestedPrice
          ? ` AI suggested price: £${data.suggestedPrice.toLocaleString("en-GB")}.`
          : "";
      setAiSuccessMessage(
        `Artwork details generated by AI.${priceNote} Review and edit any field before publishing.`
      );
    } catch {
      setErrorMessage("Network error while generating AI details. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  // Submit artwork form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!imageUrl.trim()) {
      setErrorMessage("An artwork image is required. Upload a file or paste a URL.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Description is required.");
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage("Please enter a valid price greater than zero.");
      return;
    }

    setSubmitLoading(true);

    try {
      const res = await fetch("/api/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          title: title.trim(),
          description: description.trim(),
          medium: medium.trim() || "Mixed Media",
          style: style.trim() || "Contemporary",
          tags,
          price: numericPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to publish artwork.");
        setSubmitLoading(false);
        return;
      }

      router.push("/dashboard/artist");
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred while saving the artwork.");
      setSubmitLoading(false);
    }
  }

  // The URL to show in the preview — local blob while uploading, public URL once done
  const previewSrc = localPreview || imageUrl;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-text-secondary">Loading studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-text-primary tracking-tight">
            Art<span className="text-accent">Market</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link
              href="/artworks"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Browse Artworks
            </Link>
            <Link
              href="/dashboard/artist"
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Artist Studio
            </Link>
          </nav>
        </div>
        <UserNav />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Link
          href="/dashboard/artist"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-6"
        >
          ← Back to Studio Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
            Upload New Artwork
          </h1>
          <p className="text-sm text-text-secondary">
            Upload your image from your device or paste a web URL, then let AI suggest catalog details.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded border border-error/30 bg-red-50 text-error text-sm">
            {errorMessage}
          </div>
        )}

        {aiSuccessMessage && (
          <div className="mb-6 p-4 rounded border border-green-200 bg-green-50 text-success text-sm flex items-center justify-between">
            <span>{aiSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setAiSuccessMessage("")}
              className="text-xs text-text-secondary hover:text-text-primary underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left Column: Image Source & AI ── */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Card padding="md" className="flex flex-col gap-5">
                <h2 className="text-base font-semibold text-text-primary">
                  1. Artwork Image
                </h2>

                {/* ── Option A: Upload from device ── */}
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-2">
                    Upload from your device
                  </label>

                  {uploadState === "idle" && (
                    <label
                      htmlFor="fileUpload"
                      className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-accent transition-colors bg-background group"
                    >
                      <svg
                        className="w-8 h-8 text-text-secondary group-hover:text-accent transition-colors mb-2"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs text-text-secondary group-hover:text-accent transition-colors text-center">
                        Click to choose a file<br />
                        <span className="text-text-secondary/60">JPEG, PNG, WebP or GIF · Max 10 MB</span>
                      </span>
                      <input
                        ref={fileInputRef}
                        id="fileUpload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                    </label>
                  )}

                  {uploadState === "uploading" && (
                    <div className="w-full border border-border rounded-lg p-4 bg-background">
                      <div className="flex items-center gap-3 mb-3">
                        <svg className="w-4 h-4 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs text-text-secondary truncate max-w-[180px]">
                          Uploading {uploadedFileName}...
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5">
                        <div
                          className="bg-accent h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(uploadState === "done" || uploadState === "error") && (
                    <div className={`w-full border rounded-lg p-3 flex items-center justify-between gap-2 ${
                      uploadState === "done"
                        ? "border-green-200 bg-green-50"
                        : "border-error/30 bg-red-50"
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {uploadState === "done" ? (
                          <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className="text-xs truncate max-w-[180px] text-text-primary">
                          {uploadState === "done" ? `Uploaded: ${uploadedFileName}` : "Upload failed"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearUpload}
                        className="text-xs text-text-secondary hover:text-text-primary underline flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Divider ── */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-text-secondary">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* ── Option B: Paste a web URL ── */}
                <div>
                  <Input
                    id="imageUrl"
                    label="Paste a web URL"
                    placeholder="https://example.com/artwork.jpg"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      // If user types a URL manually, clear any local upload state
                      if (uploadState === "done" || uploadState === "error") {
                        setLocalPreview("");
                        setUploadState("idle");
                        setUploadedFileName("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }
                      setErrorMessage("");
                    }}
                  />

                  {/* Sample Images Quick Buttons */}
                  <div className="mt-2">
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">
                      Or try a sample:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SAMPLE_ARTWORKS.map((sample) => (
                        <button
                          key={sample.name}
                          type="button"
                          onClick={() => {
                            setImageUrl(sample.url);
                            setLocalPreview("");
                            setUploadState("idle");
                            setUploadedFileName("");
                            setErrorMessage("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-xs px-2.5 py-1 rounded border border-border bg-surface hover:border-accent text-text-primary transition-colors"
                        >
                          {sample.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Image Preview ── */}
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Preview
                  </label>
                  <div className="relative aspect-[4/3] rounded border border-border bg-background overflow-hidden flex items-center justify-center">
                    {previewSrc ? (
                      <>
                        <img
                          src={previewSrc}
                          alt="Artwork preview"
                          className="w-full h-full object-contain"
                          onError={() => {
                            setErrorMessage("Unable to load image preview. Please check the URL.");
                          }}
                        />
                        {uploadState === "uploading" && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <span className="text-xs text-text-secondary">Uploading…</span>
                          </div>
                        )}
                        {uploadState === "done" && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Saved to Cloud
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <svg className="w-10 h-10 text-border mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-xs text-text-secondary">
                          Upload a file or paste a URL to preview
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── AI Generation ── */}
                <div className="pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleGenerateDetails}
                    disabled={aiLoading || uploadState === "uploading" || !imageUrl.trim()}
                    className="w-full"
                  >
                    {aiLoading
                      ? "Analyzing with AI…"
                      : uploadState === "uploading"
                      ? "Waiting for upload…"
                      : "✨ Generate Details with AI"}
                  </Button>
                  <p className="text-xs text-text-secondary mt-2 text-center">
                    Uses Groq vision AI · Works with both uploaded files and web URLs
                  </p>
                </div>
              </Card>
            </div>

            {/* ── Right Column: Editable Details Form ── */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Card padding="md" className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">
                      2. Artwork Details
                    </h2>
                    <p className="text-xs text-text-secondary">
                      Review, edit, or customize any attribute before listing.
                    </p>
                  </div>
                  {aiSuccessMessage && (
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                      AI Populated
                    </span>
                  )}
                </div>

                <Input
                  id="title"
                  label="Artwork Title"
                  placeholder="e.g. Whispers of the Horizon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <Textarea
                  id="description"
                  label="Description / Artist Note"
                  placeholder="Describe your creative vision, techniques, and the story behind the piece..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="medium"
                    label="Medium"
                    placeholder="e.g. Oil on Canvas, Digital"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                  />

                  <Input
                    id="style"
                    label="Style"
                    placeholder="e.g. Contemporary Abstract, Realism"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </div>

                <Input
                  id="tags"
                  label="Tags (comma-separated)"
                  placeholder="e.g. abstract, textured, warm, landscape"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="price" className="text-xs font-medium text-text-secondary">
                      Price (£ GBP)
                    </label>
                    {price && aiSuccessMessage && (
                      <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        ✨ AI Estimate
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm select-none">
                      £
                    </span>
                    <Input
                      id="price"
                      label=""
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      inputClassName="pl-7"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    AI estimates a fair market range based on medium, style &amp; complexity.
                  </p>
                </div>

                {/* Form Actions */}
                <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                  <Link href="/dashboard/artist">
                    <Button variant="ghost" size="md" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={submitLoading || uploadState === "uploading"}
                  >
                    {submitLoading ? "Publishing Artwork..." : "Publish Artwork"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
