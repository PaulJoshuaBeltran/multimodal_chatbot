import stripe from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Stripe Test Product",
          },
          unit_amount: 1000, // $10.00
        },
        quantity: 1,
      },
    ],
    success_url:
      `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
    cancel_url:
      `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
  });

  return NextResponse.json({
    url: session.url,
  });
}