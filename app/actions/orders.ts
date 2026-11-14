"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createPaymentSession, cancelOrder } from "@/lib/orders";

async function ownedPendingOrder(orderId: string) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id) redirect("/orders");
    return order;
}

export async function payOrder(formData: FormData) {
    const orderId = String(formData.get("orderId") ?? "");
    const order = await ownedPendingOrder(orderId);
    if (order.status !== "PENDING") redirect(`/orders/${order.id}`);

    const url = await createPaymentSession(order.id);
    redirect(url);
}

export async function cancelMyOrder(formData: FormData) {
    const orderId = String(formData.get("orderId") ?? "");
    const order = await ownedPendingOrder(orderId);

    await cancelOrder(order.id);
    redirect(`/orders/${order.id}`);
}