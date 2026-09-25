import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const artworks = await prisma.artwork.findMany({
      where: {
        status: "AVAILABLE",
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(artworks);
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return NextResponse.json(
      { error: "Failed to fetch artworks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "artist") {
      return NextResponse.json(
        { error: "Forbidden. Only artists can create artworks." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, medium, style, tags, price, imageUrl } = body;

    if (!title || !description || !price || !imageUrl) {
      return NextResponse.json(
        { error: "Title, description, price, and image URL are required." },
        { status: 400 }
      );
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number." },
        { status: 400 }
      );
    }

    const parsedTags = Array.isArray(tags)
      ? tags.map((t: string) => String(t).trim()).filter(Boolean)
      : typeof tags === "string"
      ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const artwork = await prisma.artwork.create({
      data: {
        artistId: session.user.id,
        title: title.trim(),
        description: description.trim(),
        medium: medium?.trim() || "Mixed Media",
        style: style?.trim() || "Contemporary",
        tags: parsedTags,
        price: numericPrice,
        imageUrl: imageUrl.trim(),
        status: "AVAILABLE",
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(artwork, { status: 201 });
  } catch (error) {
    console.error("Error creating artwork:", error);
    return NextResponse.json(
      { error: "Failed to create artwork" },
      { status: 500 }
    );
  }
}
