import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/wishlist
 * Retrieves all items in the authenticated buyer's wishlist.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const items = await prisma.wishlistItem.findMany({
      where: {
        buyerId: session.user.id,
      },
      include: {
        artwork: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const formattedItems = items.map((item) => ({
      id: item.id,
      artworkId: item.artworkId,
      artwork: {
        ...item.artwork,
        price: Number(item.artwork.price),
      },
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist items." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * Adds an artwork to the authenticated buyer's wishlist.
 * Body: { artworkId: string }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to save items to your wishlist." },
        { status: 401 }
      );
    }

    if (session.user.role === "artist") {
      return NextResponse.json(
        { error: "Artist accounts cannot save items to wishlist. Please use a buyer account." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { artworkId } = body;

    if (!artworkId || typeof artworkId !== "string") {
      return NextResponse.json(
        { error: "Valid artworkId is required." },
        { status: 400 }
      );
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      return NextResponse.json(
        { error: "Artwork not found." },
        { status: 404 }
      );
    }

    if (artwork.artistId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot add your own artwork to your wishlist." },
        { status: 400 }
      );
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        buyerId_artworkId: {
          buyerId: session.user.id,
          artworkId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Artwork is already in your wishlist.", item: existing },
        { status: 200 }
      );
    }

    const item = await prisma.wishlistItem.create({
      data: {
        buyerId: session.user.id,
        artworkId,
      },
      include: {
        artwork: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Artwork saved to wishlist.",
        item: {
          ...item,
          artwork: {
            ...item.artwork,
            price: Number(item.artwork.price),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Failed to add artwork to wishlist." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist
 * Removes an artwork from the authenticated buyer's wishlist.
 * Accepts artworkId via URL query parameter (?artworkId=...) or JSON body.
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    let artworkId = url.searchParams.get("artworkId");

    if (!artworkId) {
      try {
        const body = await req.json();
        artworkId = body?.artworkId;
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!artworkId) {
      return NextResponse.json(
        { error: "artworkId query parameter or body is required." },
        { status: 400 }
      );
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        buyerId: session.user.id,
        artworkId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Artwork removed from wishlist." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to remove artwork from wishlist." },
      { status: 500 }
    );
  }
}
