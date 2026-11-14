import { prisma } from "./prisma";
import { stripe } from "./stripe";

// Creates a Stripe payment page for an existing PENDING order and returns its URL.
export async function createPaymentSession(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
    });
    if (!order || order.status !== "PENDING") {
        throw new Error("Order cannot be paid.");
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: order.items.map((item) => ({
            quantity: item.quantity,
            price_data: {
                currency: "usd",
                unit_amount: item.unitPriceCents, // from our database, never from the browser
                product_data: { name: item.product.title },
            },
        })),
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
        success_url: `${appUrl}/orders/${order.id}?success=1`,
        cancel_url: `${appUrl}/orders/${order.id}?canceled=1`,
    });

    await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
    });

    return session.url!;
}

// Cancels a PENDING order and returns its stock. Safe to call twice.
export async function cancelOrder(orderId: string) {
    await prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
            where: { id: orderId, status: "PENDING" },
            data: { status: "CANCELLED" },
        });
        if (result.count === 0) return; // already paid or cancelled

        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
            });
        }
    });
}