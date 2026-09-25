import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const artwork = await prisma.artwork.findUnique({
      where: { id },
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

    if (!artwork) {
      return NextResponse.json(
        { error: "Artwork not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(artwork);
  } catch (error) {
    console.error("Error fetching artwork:", error);
    return NextResponse.json(
      { error: "Failed to fetch artwork" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = params;
    const existing = await prisma.artwork.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Artwork not found." },
        { status: 404 }
      );
    }

    // Must be the artwork's artist or an admin
    if (existing.artistId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. You can only edit your own artworks." },
        { status: 403 }
      );
    }

    // An artwork cannot be modified if it has already been sold
    if (existing.status === "SOLD") {
      return NextResponse.json(
        { error: "This artwork has already been sold and cannot be modified." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, medium, style, tags, price, imageUrl, status } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (!String(title).trim()) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      updateData.title = String(title).trim();
    }

    if (description !== undefined) {
      if (!String(description).trim()) {
        return NextResponse.json({ error: "Description cannot be empty." }, { status: 400 });
      }
      updateData.description = String(description).trim();
    }

    if (medium !== undefined) {
      updateData.medium = String(medium).trim() || "Mixed Media";
    }

    if (style !== undefined) {
      updateData.style = String(style).trim() || "Contemporary";
    }

    if (imageUrl !== undefined) {
      if (!String(imageUrl).trim()) {
        return NextResponse.json({ error: "Image URL cannot be empty." }, { status: 400 });
      }
      updateData.imageUrl = String(imageUrl).trim();
    }

    if (price !== undefined) {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return NextResponse.json(
          { error: "Price must be a positive number." },
          { status: 400 }
        );
      }
      updateData.price = numericPrice;
    }

    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? tags.map((t: string) => String(t).trim()).filter(Boolean)
        : typeof tags === "string"
        ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];
    }

    if (status !== undefined && (status === "AVAILABLE" || status === "HIDDEN")) {
      updateData.status = status;
    }

    const updated = await prisma.artwork.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating artwork:", error);
    return NextResponse.json(
      { error: "Failed to update artwork." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: { id: string } }
) {
  return PUT(req, props);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = params;
    const existing = await prisma.artwork.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: "COMPLETED" },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Artwork not found." },
        { status: 404 }
      );
    }

    // Must be the artwork's artist or an admin
    if (existing.artistId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own artworks." },
        { status: 403 }
      );
    }

    // An artwork can only be deleted if it is unsold
    if (existing.status === "SOLD" || existing.orders.length > 0) {
      return NextResponse.json(
        { error: "This artwork has already been sold and cannot be deleted." },
        { status: 400 }
      );
    }

    // Clean up dependent cart items, wishlist items, and pending orders in a transaction
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { artworkId: id } }),
      prisma.wishlistItem.deleteMany({ where: { artworkId: id } }),
      prisma.order.deleteMany({ where: { artworkId: id, status: { not: "COMPLETED" } } }),
      prisma.artwork.delete({ where: { id } }),
    ]);

    return NextResponse.json(
      { success: true, message: "Artwork deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting artwork:", error);
    return NextResponse.json(
      { error: "Failed to delete artwork." },
      { status: 500 }
    );
  }
}

