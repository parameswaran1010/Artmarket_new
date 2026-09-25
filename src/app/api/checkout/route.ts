import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout
 * Processes a dummy checkout for the authenticated buyer's cart items.
 * Creates Order records for each item, marks artworks as SOLD, and clears the cart.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to complete your checkout." },
        { status: 401 }
      );
    }

    if (session.user.role === "artist") {
      return NextResponse.json(
        { error: "Artist accounts cannot purchase artworks. Please use a buyer account." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { shippingAddress, paymentDetails } = body;

    // Validate shipping fields
    if (
      !shippingAddress ||
      !shippingAddress.fullName?.trim() ||
      !shippingAddress.street?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.postalCode?.trim()
    ) {
      return NextResponse.json(
        { error: "Please provide a complete shipping address (Full Name, Street, City, and Postal Code)." },
        { status: 400 }
      );
    }

    // Validate dummy payment fields
    if (
      !paymentDetails ||
      !paymentDetails.cardNumber?.trim() ||
      !paymentDetails.expiry?.trim() ||
      !paymentDetails.cvv?.trim()
    ) {
      return NextResponse.json(
        { error: "Please provide payment card details (Card Number, Expiry, and CVV)." },
        { status: 400 }
      );
    }

    // Fetch the buyer's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        buyerId: session.user.id,
      },
      include: {
        artwork: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty. Please add artworks before checking out." },
        { status: 400 }
      );
    }

    // Ensure all items are still available
    const unavailableItems = cartItems.filter(
      (item) => item.artwork.status !== "AVAILABLE"
    );
    if (unavailableItems.length > 0) {
      const titles = unavailableItems.map((i) => `"${i.artwork.title}"`).join(", ");
      return NextResponse.json(
        {
          error: `The following artwork(s) have already been sold or are unavailable: ${titles}. Please remove them from your cart.`,
        },
        { status: 400 }
      );
    }

    const artworkIds = cartItems.map((item) => item.artworkId);
    let totalAmount = 0;

    // Process orders, update artwork status, and clear cart in a transaction
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];

      for (const item of cartItems) {
        const itemPrice = Number(item.artwork.price);
        totalAmount += itemPrice;

        // 1. Create order record
        const order = await tx.order.create({
          data: {
            buyerId: session.user.id,
            artworkId: item.artworkId,
            price: item.artwork.price,
            status: "COMPLETED",
          },
          include: {
            artwork: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                medium: true,
              },
            },
          },
        });

        // 2. Mark artwork as SOLD
        await tx.artwork.update({
          where: { id: item.artworkId },
          data: { status: "SOLD" },
        });

        orders.push({
          ...order,
          price: itemPrice,
        });
      }

      // 3. Clear the buyer's cart
      await tx.cartItem.deleteMany({
        where: {
          buyerId: session.user.id,
        },
      });

      // 4. Remove purchased items from the buyer's wishlist if present
      await tx.wishlistItem.deleteMany({
        where: {
          buyerId: session.user.id,
          artworkId: { in: artworkIds },
        },
      });

      return orders;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully. Thank you for your purchase!",
        orders: createdOrders,
        totalAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { error: "Failed to process checkout. Please try again." },
      { status: 500 }
    );
  }
}
