"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

class CheckoutError extends Error { }

export async function placeOrder() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login?error=" + encodeURIComponent("Please log in to check out."));
    }

    let orderId: string;

    try {
        orderId = await prisma.$transaction(async (tx) => {
            const items = await tx.cartItem.findMany({
                where: { userId: user.id },
                include: { product: true },
            });

            if (items.length === 0) throw new CheckoutError("Your cart is empty.");

            let totalCents = 0;

            for (const item of items) {
                // Atomic: only decrements if enough stock is still there.
                const result = await tx.product.updateMany({
                    where: { id: item.productId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                });

                if (result.count === 0) {
                    throw new CheckoutError(`Not enough stock for "${item.product.title}".`);
                }

                totalCents += item.quantity * item.product.priceCents;
            }

            const order = await tx.order.create({
                data: {
                    userId: user.id,
                    totalCents,
                    items: {
                        create: items.map((i) => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPriceCents: i.product.priceCents, // price at time of purchase
                        })),
                    },
                },
            });

            await tx.cartItem.deleteMany({ where: { userId: user.id } });

            return order.id;
        });
    } catch (e) {
        if (e instanceof CheckoutError) {
            redirect(`/cart?error=${encodeURIComponent(e.message)}`);
        }
        throw e;
    }

    revalidatePath("/cart");
    redirect(`/orders/${orderId}`);
}