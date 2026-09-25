/**
 * Artwork Image Upload API Route
 *
 * Accepts a multipart/form-data POST with a single "file" field.
 * Uploads the image to Supabase Storage ("artworks" bucket) under
 * a per-artist path, then returns the permanent public URL.
 *
 * The public URL is what gets stored in the Artwork.imageUrl field
 * and what gets passed to Groq for AI analysis (no base64 tokens).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin, ARTWORK_BUCKET } from "@/lib/supabase";

// Max file size: 10 MB
const MAX_BYTES = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  try {
    // 1. Auth check — only artists and admins can upload
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "artist" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only artists can upload artwork images." },
        { status: 403 }
      );
    }

    // 2. Parse multipart form
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Include a 'file' field in the form data." },
        { status: 400 }
      );
    }

    // 3. Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type '${file.type}' is not supported. Use JPEG, PNG, WebP, or GIF.`,
        },
        { status: 400 }
      );
    }

    // 4. Validate size
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    // 5. Build a unique storage path: artworks/<userId>/<timestamp>-<filename>
    const userId = session.user.id;
    const ext = file.name.split(".").pop() ?? "jpg";
    const safeName = file.name
      .replace(/[^a-z0-9.\-_]/gi, "_")
      .toLowerCase()
      .replace(/_{2,}/g, "_");
    const storagePath = `${userId}/${Date.now()}-${safeName}`;

    // 6. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ARTWORK_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Upload Route] Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image to storage. Please try again." },
        { status: 500 }
      );
    }

    // 7. Get the permanent public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(ARTWORK_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err) {
    console.error("[Upload Route] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload." },
      { status: 500 }
    );
  }
}
