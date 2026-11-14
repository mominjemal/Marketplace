import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { cancelOrder } from "@/lib/orders";

export async function POST(req: NextRequest) {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // The signature check needs the exact raw text of the request.
    const body = await req.text();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId && session.payment_status === "paid") {
            await prisma.order.updateMany({
                where: { id: orderId, status: "PENDING" },
                data: { status: "PAID" },
            });
        }
    }

    if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            // Only cancel if this was the order's current payment session.
            if (order && order.stripeSessionId === session.id) {
                await cancelOrder(order.id);
            }
        }
    }

    return NextResponse.json({ received: true });
}