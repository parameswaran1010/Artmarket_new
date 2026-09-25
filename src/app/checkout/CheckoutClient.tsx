"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type CheckoutItem = {
  id: string;
  artworkId: string;
  artwork: {
    id: string;
    title: string;
    imageUrl: string;
    medium: string;
    price: number;
    artist: {
      name: string;
    };
  };
};

type OrderResult = {
  id: string;
  price: number;
  artwork: {
    id: string;
    title: string;
    imageUrl: string;
  };
};

type Props = {
  initialItems: CheckoutItem[];
  userName: string;
};

export default function CheckoutClient({ initialItems, userName }: Props) {
  // Address form fields
  const [fullName, setFullName] = useState(userName || "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United Kingdom");

  // Fake payment fields
  const [cardName, setCardName] = useState(userName || "");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");

  // Submission state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [completedOrders, setCompletedOrders] = useState<OrderResult[] | null>(null);

  const subtotal = initialItems.reduce((sum, item) => sum + item.artwork.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMessage("Please complete all shipping address fields.");
      return;
    }

    if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      setErrorMessage("Please complete all payment fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            fullName: fullName.trim(),
            street: street.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
          },
          paymentDetails: {
            cardName: cardName.trim(),
            cardNumber: cardNumber.trim(),
            expiry: expiry.trim(),
            cvv: cvv.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed. Please try again.");
      }

      setCompletedOrders(data.orders);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error processing checkout."
      );
      setLoading(false);
    }
  };

  // Order Confirmation View
  if (completedOrders) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6 py-6">
        <Card padding="lg" className="flex flex-col gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-success flex items-center justify-center text-2xl mx-auto font-bold">
            ✓
          </div>

          <div>
            <span className="text-xs font-semibold text-success uppercase tracking-wider">
              Order Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mt-1">
              Thank You for Your Order
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
              Your purchase has been recorded. Each independent artist will be notified to prepare and ship your artwork with insured packaging.
            </p>
          </div>

          {/* Purchased Items List */}
          <div className="border border-border rounded-lg divide-y divide-border text-left">
            {completedOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center gap-4">
                <img
                  src={order.artwork.imageUrl}
                  alt={order.artwork.title}
                  className="w-16 h-16 object-cover rounded bg-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-text-primary line-clamp-1">
                    {order.artwork.title}
                  </h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Order Ref: {order.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-accent">
                    £{order.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Details Recap */}
          <div className="bg-background border border-border rounded-lg p-4 text-xs text-text-secondary text-left flex flex-col gap-1">
            <span className="font-semibold text-text-primary uppercase tracking-wide text-[10px]">
              Shipping To
            </span>
            <p className="text-text-primary font-medium">{fullName}</p>
            <p>{street}, {city}, {postalCode}</p>
            <p>{country}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/dashboard/buyer/orders">
              <Button variant="primary" size="md">
                View Order History
              </Button>
            </Link>
            <Link href="/artworks">
              <Button variant="outline" size="md">
                Browse More Artworks
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="md">
                Return to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left: Address and Dummy Payment */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {errorMessage && (
          <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* Demo Simulation Notice */}
        <div className="p-4 rounded-lg border border-border bg-surface text-xs text-text-secondary leading-relaxed">
          <p className="font-semibold text-text-primary text-sm mb-1">
            Demo Checkout Simulation
          </p>
          This is an academic project simulation. No actual payment processing takes place. Please do not submit real credit card details; sample testing values are pre-filled below for your convenience.
        </div>

        {/* Shipping Address */}
        <Card padding="md" className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-text-primary">
            1. Shipping Address
          </h3>

          <Input
            id="fullName"
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            id="street"
            label="Street Address"
            placeholder="e.g. 10 Downing Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="city"
              label="City / Town"
              placeholder="e.g. London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              id="postalCode"
              label="Postal Code"
              placeholder="e.g. SW1A 2AA"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="country" className="text-sm font-medium text-text-primary block mb-1">
              Country
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="United Kingdom">United Kingdom</option>
              <option value="Ireland">Ireland</option>
              <option value="United States">United States</option>
              <option value="France">France</option>
              <option value="Germany">Germany</option>
              <option value="Canada">Canada</option>
            </select>
          </div>
        </Card>

        {/* Dummy Payment Form */}
        <Card padding="md" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">
              2. Payment Details
            </h3>
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Simulation Only
            </span>
          </div>

          <Input
            id="cardName"
            label="Name on Card"
            placeholder="e.g. Jane Doe"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            required
          />

          <Input
            id="cardNumber"
            label="Card Number"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="expiry"
              label="Expiry Date"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
            <Input
              id="cvv"
              label="CVV / CVC"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              required
            />
          </div>
        </Card>
      </div>

      {/* Right: Order Summary */}
      <div className="lg:col-span-1">
        <Card padding="md" className="flex flex-col gap-4 sticky top-24">
          <h3 className="text-base font-semibold text-text-primary">
            Order Review
          </h3>

          {/* Items List */}
          <div className="divide-y divide-border max-h-64 overflow-y-auto pr-1">
            {initialItems.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center gap-3">
                <img
                  src={item.artwork.imageUrl}
                  alt={item.artwork.title}
                  className="w-12 h-12 object-cover rounded bg-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary line-clamp-1">
                    {item.artwork.title}
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    {item.artwork.artist.name}
                  </p>
                </div>
                <span className="text-xs font-bold text-accent whitespace-nowrap">
                  £{item.artwork.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-border text-sm pt-2 border-t border-border">
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium text-text-primary">
                £{subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Insured Shipping</span>
              <span className="font-medium text-success">
                Included
              </span>
            </div>
            <div className="flex items-center justify-between py-3 text-base font-bold text-text-primary">
              <span>Total to Pay</span>
              <span className="text-accent">
                £{subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Processing Order..." : `Place Order (Total: £${subtotal.toFixed(2)})`}
          </Button>

          <Link
            href="/cart"
            className="text-xs text-center text-text-secondary hover:text-text-primary transition-colors"
          >
            Return to Cart
          </Link>
        </Card>
      </div>
    </form>
  );
}
