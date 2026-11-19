"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSeller } from "@/lib/guards";

export async function becomeSeller() {
    const user = await getCurrentUser();
    if (!user) redirect("/login?error=" + encodeURIComponent("Please log in first."));

    if (user.role === "BUYER") {
        await prisma.user.update({ where: { id: user.id }, data: { role: "SELLER" } });
    }
    redirect("/seller");
}
type ProductInput = {
    title: string;
    description: string;
    priceCents: number;
    stock: number;
    categoryId: string;
    imageUrl: string | null;
};

type ParseResult =
    | { ok: true; data: ProductInput }
    | { ok: false; error: string };

// Validates the form. Never trust what the browser sends.
async function parseProduct(formData: FormData): Promise<ParseResult> {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const categoryId = String(formData.get("categoryId") ?? "");
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();

    if (title.length < 3) {
        return { ok: false, error: "Title must be at least 3 characters." };
    }
    if (description.length < 10) {
        return { ok: false, error: "Description must be at least 10 characters." };
    }
    if (!Number.isFinite(price) || price < 0.5) {
        return { ok: false, error: "Price must be at least $0.50." };
    }
    if (!Number.isInteger(stock) || stock < 0) {
        return { ok: false, error: "Stock must be a whole number, 0 or more." };
    }
    if (imageUrl && !/^https?:\/\//.test(imageUrl)) {
        return { ok: false, error: "Image URL must start with http:// or https://" };
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return { ok: false, error: "Please choose a category." };

    return {
        ok: true,
        data: {
            title,
            description,
            priceCents: Math.round(price * 100), // dollars to cents
            stock,
            categoryId,
            imageUrl: imageUrl || null,
        },
    };
}

export async function createProduct(formData: FormData) {
    const user = await requireSeller();

    const parsed = await parseProduct(formData);
    if (!parsed.ok) {
        redirect(`/seller/new?error=${encodeURIComponent(parsed.error)}`);
    }

    await prisma.product.create({ data: { ...parsed.data, sellerId: user.id } });

    revalidatePath("/");
    redirect("/seller");
}

export async function updateProduct(formData: FormData) {
    const user = await requireSeller();
    const productId = String(formData.get("productId") ?? "");

    const parsed = await parseProduct(formData);
    if (!parsed.ok) {
        redirect(`/seller/new?error=${encodeURIComponent(parsed.error)}`);
    }

    // sellerId in the filter means you can only update your own product.
    await prisma.product.updateMany({
        where: { id: productId, sellerId: user.id },
        data: parsed.data,
    });

    revalidatePath("/");
    revalidatePath(`/products/${productId}`);
    redirect("/seller");
}

export async function deleteProduct(formData: FormData) {
    const user = await requireSeller();
    const productId = String(formData.get("productId") ?? "");

    const product = await prisma.product.findFirst({
        where: { id: productId, sellerId: user.id },
    });
    if (!product) redirect("/seller");

    // Past orders point at this product, so deleting would break order history.
    const orderCount = await prisma.orderItem.count({ where: { productId } });
    if (orderCount > 0) {
        redirect(
            "/seller?error=" +
            encodeURIComponent(
                `"${product.title}" has been ordered, so it can't be deleted. Edit it and set stock to 0 instead.`
            )
        );
    }

    await prisma.$transaction([
        prisma.review.deleteMany({ where: { productId } }),
        prisma.product.delete({ where: { id: productId } }),
    ]);

    revalidatePath("/");
    redirect("/seller");
}

export async function markShipped(formData: FormData) {
    const user = await requireSeller();
    const orderItemId = String(formData.get("orderItemId") ?? "");

    await prisma.$transaction(async (tx) => {
        // Only your own item, in a paid order, that hasn't shipped yet.
        const item = await tx.orderItem.findFirst({
            where: {
                id: orderItemId,
                shippedAt: null,
                product: { sellerId: user.id },
                order: { status: "PAID" },
            },
        });
        if (!item) return;

        // Lock the order row so two sellers shipping the last items at the same
        // moment can't both think the other one is still pending.
        await tx.order.updateMany({
            where: { id: item.orderId, status: "PAID" },
            data: { status: "PAID" },
        });

        await tx.orderItem.updateMany({
            where: { id: item.id, shippedAt: null },
            data: { shippedAt: new Date() },
        });

        const remaining = await tx.orderItem.count({
            where: { orderId: item.orderId, shippedAt: null },
        });

        if (remaining === 0) {
            await tx.order.update({
                where: { id: item.orderId },
                data: { status: "SHIPPED" },
            });
        }
    });

    revalidatePath("/seller/orders");
    redirect("/seller/orders");
}