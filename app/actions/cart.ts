"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function addToCart(formData: FormData) {
    const productId = String(formData.get("productId") ?? "");

    const user = await getCurrentUser();
    if (!user) {
        redirect(`/login?error=${encodeURIComponent("Please log in to add items to your cart.")}`);
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.stock < 1) redirect("/");

    const key = { userId_productId: { userId: user.id, productId } };
    const existing = await prisma.cartItem.findUnique({ where: key });
    const quantity = Math.min((existing?.quantity ?? 0) + 1, product.stock);

    await prisma.cartItem.upsert({
        where: key,
        update: { quantity },
        create: { userId: user.id, productId, quantity: 1 },
    });

    revalidatePath("/cart");
    redirect("/cart");
}

export async function setQuantity(formData: FormData) {
    const productId = String(formData.get("productId") ?? "");
    const requested = Number(formData.get("quantity"));

    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) redirect("/cart");

    const key = { userId_productId: { userId: user.id, productId } };

    if (!Number.isInteger(requested) || requested < 1) {
        await prisma.cartItem.deleteMany({ where: { userId: user.id, productId } });
    } else {
        await prisma.cartItem.update({
            where: key,
            data: { quantity: Math.min(requested, product.stock) },
        });
    }

    revalidatePath("/cart");
    redirect("/cart");
}

export async function removeFromCart(formData: FormData) {
    const productId = String(formData.get("productId") ?? "");

    const user = await getCurrentUser();
    if (!user) redirect("/login");

    await prisma.cartItem.deleteMany({ where: { userId: user.id, productId } });

    revalidatePath("/cart");
    redirect("/cart");
}