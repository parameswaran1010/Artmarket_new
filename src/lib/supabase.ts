import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key.
 * Only import this in API routes / server components — never in client code.
 * The service role key bypasses Row Level Security, so it should NEVER be
 * exposed to the browser.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Name of the Supabase Storage bucket that holds artwork images. */
export const ARTWORK_BUCKET = "artworks";
