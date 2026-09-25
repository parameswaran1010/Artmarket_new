import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/cart
 * Retrieves all items in the authenticated buyer's cart.
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

    const items = await prisma.cartItem.findMany({
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
    console.error("Error fetching cart items:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart items." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Adds an artwork to the authenticated buyer's cart.
 * Body: { artworkId: string }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to add items to your cart." },
        { status: 401 }
      );
    }

    if (session.user.role === "artist") {
      return NextResponse.json(
        { error: "Artist accounts cannot add items to cart. Please use a buyer account." },
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

    if (artwork.status === "SOLD") {
      return NextResponse.json(
        { error: "This artwork has already been sold." },
        { status: 400 }
      );
    }

    if (artwork.artistId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot purchase your own artwork." },
        { status: 400 }
      );
    }

    // Check if already in cart
    const existing = await prisma.cartItem.findUnique({
      where: {
        buyerId_artworkId: {
          buyerId: session.user.id,
          artworkId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Artwork is already in your cart.", item: existing },
        { status: 200 }
      );
    }

    const item = await prisma.cartItem.create({
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
        message: "Artwork added to cart.",
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
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add artwork to cart." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Removes an artwork from the authenticated buyer's cart.
 * Accepts artworkId via URL query parameter (?artworkId=...) or JSON body.
 * If query param ?clear=true is passed, clears the entire cart.
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
    const clearAll = url.searchParams.get("clear") === "true";
    let artworkId = url.searchParams.get("artworkId");

    if (!clearAll && !artworkId) {
      try {
        const body = await req.json();
        artworkId = body?.artworkId;
      } catch {
        // Body was empty or not JSON
      }
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({
        where: {
          buyerId: session.user.id,
        },
      });
      return NextResponse.json(
        { success: true, message: "Cart cleared." },
        { status: 200 }
      );
    }

    if (!artworkId) {
      return NextResponse.json(
        { error: "artworkId query parameter or body is required." },
        { status: 400 }
      );
    }

    await prisma.cartItem.deleteMany({
      where: {
        buyerId: session.user.id,
        artworkId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Artwork removed from cart." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove artwork from cart." },
      { status: 500 }
    );
  }
}
