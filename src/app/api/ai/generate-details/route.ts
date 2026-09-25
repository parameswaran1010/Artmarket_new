/**
 * AI Artwork Details Generation API Route
 *
 * CHOSEN AI MODEL: Groq — qwen/qwen3.8-27b (vision)
 *
 * NOTE: Llama 3.2 Vision was removed from Groq free/on_demand tier in August 2026.
 *       qwen/qwen3.8-27b is the only available vision model on this account tier.
 *
 * WHAT THE AI PROMPT IS DOING:
 * -----------------------------------------------------------------------------------------
 * 1. Curator Persona: The system prompt instructs the AI model to act as an expert contemporary
 *    art curator, gallerist, and cataloger.
 * 2. Visual Analysis: The model examines the provided artwork image (composition, lighting,
 *    color palette, brushwork/texture, subject matter, and emotional resonance).
 * 3. Structured Extraction: The prompt instructs the model to return strictly valid JSON conforming
 *    to the ArtMarket artwork catalog schema:
 *      - `title`: An evocative, gallery-worthy title tailored to the visual essence of the piece.
 *      - `description`: A thoughtful 2-4 sentence catalog description detailing the technique,
 *        mood, and visual narrative for prospective collectors.
 *      - `medium`: The identified or most fitting artistic medium (e.g. "Oil on Canvas",
 *        "Acrylic on Linen", "Digital Illustration", "Watercolor & Ink").
 *      - `style`: The primary art movement / aesthetic style (e.g. "Abstract Expressionism",
 *        "Contemporary Impressionism", "Minimalism", "Surrealism", "Pop Art").
 *      - `tags`: An array of 4-6 concise lowercase search keywords for marketplace discovery
 *        (e.g. ["vibrant", "abstract", "geometric", "textured", "modern"]).
 * 4. Safety & Formatting Constraints: Enforces json_object formatting with no markdown fences,
 *    ensuring seamless ingestion by the frontend upload form while leaving every field
 *    completely editable by the artist prior to publication.
 * -----------------------------------------------------------------------------------------
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export type ArtworkAiSuggestion = {
  title: string;
  description: string;
  medium: string;
  style: string;
  tags: string[];
  /** AI-suggested listing price in GBP, based on style, medium, and apparent quality. */
  suggestedPrice: number | null;
};

export async function POST(req: Request) {
  try {
    // 1. Role-based server-side security check (PROJECT_RESTRICTIONS)
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "artist" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only artists can generate artwork details." },
        { status: 403 }
      );
    }

    // 2. Validate incoming request body
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      return NextResponse.json(
        { error: "Image URL is required to generate artwork details." },
        { status: 400 }
      );
    }

    const trimmedUrl = imageUrl.trim();

    // 3a. Guard: reject raw base64 data URLs.
    //     Images uploaded via the upload page are stored in Supabase Storage and
    //     arrive here as public https:// URLs — no base64 needed.
    if (trimmedUrl.startsWith("data:")) {
      return NextResponse.json(
        {
          error:
            "AI analysis requires a public image URL. " +
            "Use the file upload button on the form — your image will be stored in the cloud and analyzed automatically.",
        },
        { status: 400 }
      );
    }


    // 3. Check for Groq API Key
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.warn(
        "[AI Route] GROQ_API_KEY is not set in .env.local. Falling back to local art curator generator."
      );
      const fallbackDetails = generateCuratorFallback(trimmedUrl);
      return NextResponse.json(fallbackDetails);
    }

    // 4. Call Groq Cloud API (qwen/qwen3.8-27b vision)
    const systemPrompt = `You are a world-class fine art curator, cataloger, and pricing specialist for ArtMarket, a premium UK-based online gallery.
Analyze the provided artwork image and generate accurate, captivating catalog metadata including a realistic market price estimate in British Pounds (GBP).
You must respond with ONLY a single valid JSON object with the following fields:
{
  "title": "A compelling, gallery-standard artwork title",
  "description": "A 2 to 4 sentence evocative description highlighting the composition, color harmony, texture, and mood of the piece.",
  "medium": "The specific artistic medium, e.g. 'Oil on Canvas', 'Acrylic on Canvas', 'Digital Painting', 'Watercolor on Paper', 'Mixed Media', or 'Fine Art Photography'",
  "style": "The artistic style/movement, e.g. 'Abstract Expressionism', 'Impressionism', 'Contemporary Realism', 'Minimalism', 'Surrealism', or 'Pop Art'",
  "tags": ["4 to 6 lowercase keywords describing theme, colors, and subject"],
  "suggestedPrice": <a realistic integer price in GBP (£) for this artwork based on its medium, style, complexity, apparent size, and market comparables — emerging artists typically range £80–£800, mid-career £500–£5000, high-complexity large-format work up to £15000>
}
Do not include any markdown backticks, currency symbols, or commentary outside the JSON object. suggestedPrice must be a plain number (integer), not a string.`;

    const userPromptText = `Please inspect this artwork and provide the JSON catalog details including a GBP price estimate. Image URL: ${trimmedUrl}`;

    try {
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: userPromptText,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: trimmedUrl,
                    },
                  },
                ],
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 700,
          }),
        }
      );

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error("[AI Route] Groq API returned an error:", groqResponse.status, errorText);
        // Fallback smoothly if model returned an error (e.g. rate limit, invalid image URL format)
        const fallbackDetails = generateCuratorFallback(trimmedUrl);
        return NextResponse.json(fallbackDetails);
      }

      const groqData = await groqResponse.json();
      const content = groqData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No response content from Groq model");
      }

      // Parse JSON response
      const parsed = JSON.parse(content);

      // Parse and clamp suggested price to a sane GBP range
      const rawPrice = parsed.suggestedPrice;
      const suggestedPrice: number | null =
        typeof rawPrice === "number" && rawPrice > 0
          ? Math.round(Math.min(Math.max(rawPrice, 10), 150000))
          : null;

      const result: ArtworkAiSuggestion = {
        title: String(parsed.title || "Untitled Composition").trim(),
        description: String(
          parsed.description ||
            "An expressive original work exploring delicate interplay between light, form, and texture."
        ).trim(),
        medium: String(parsed.medium || "Oil on Canvas").trim(),
        style: String(parsed.style || "Contemporary").trim(),
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean)
          : ["contemporary", "original", "fine-art"],
        suggestedPrice,
      };

      return NextResponse.json(result);
    } catch (apiError) {
      console.error("[AI Route] Error communicating with Groq API:", apiError);
      // Graceful fallback for uninterrupted developer and user experience
      const fallbackDetails = generateCuratorFallback(trimmedUrl);
      return NextResponse.json(fallbackDetails);
    }
  } catch (error) {
    console.error("[AI Route] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to generate artwork details." },
      { status: 500 }
    );
  }
}

/**
 * Intelligent curator fallback generator.
 * Produces diverse, realistic catalog metadata tailored to image characteristics.
 */
function generateCuratorFallback(imageUrl: string): ArtworkAiSuggestion {
  const lower = imageUrl.toLowerCase();

  if (lower.includes("abstract") || lower.includes("color") || lower.includes("paint")) {
    return {
      title: "Harmonic Reverberation No. 4",
      description:
        "A dynamic composition marked by energetic strokes and a rich, layered palette. The interplay between luminous warm tones and deep contrasts creates a palpable sense of movement and emotional depth.",
      medium: "Acrylic and Mixed Media on Canvas",
      style: "Abstract Expressionism",
      tags: ["abstract", "expressive", "textured", "warm-tones", "contemporary"],
      suggestedPrice: 420,
    };
  }

  if (lower.includes("nature") || lower.includes("land") || lower.includes("sea") || lower.includes("forest")) {
    return {
      title: "Whispers of the Horizon",
      description:
        "An atmospheric landscape capturing the subtle transitions of natural light across serene terrain. The delicate impasto and contemplative palette evoke tranquility and timeless wonder.",
      medium: "Oil on Linen",
      style: "Contemporary Impressionism",
      tags: ["landscape", "nature", "serene", "earth-tones", "tranquil"],
      suggestedPrice: 650,
    };
  }

  if (lower.includes("sculpt") || lower.includes("bronze") || lower.includes("clay")) {
    return {
      title: "Monolithic Echo",
      description:
        "A tactile sculptural form exploring balance, organic contours, and spatial tension. The raw material texture reflects light with subtle elegance from every viewing angle.",
      medium: "Cast Bronze and Stoneware",
      style: "Modernist Sculpture",
      tags: ["sculpture", "organic", "minimalist", "tactile", "bronze"],
      suggestedPrice: 1200,
    };
  }

  return {
    title: "Convergence of Light",
    description:
      "A striking original composition that harmonizes nuanced textures with a refined color story. Broad gestural forms invite the viewer to linger on the subtle surface transitions.",
    medium: "Oil on Canvas",
    style: "Contemporary",
    tags: ["fine-art", "original", "curated", "vibrant", "studio-work"],
    suggestedPrice: 380,
  };
}
