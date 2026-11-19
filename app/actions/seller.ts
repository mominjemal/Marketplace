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

// Validates the form. Never trust what the browser sends.
async function parseProduct(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const categoryId = String(formData.get("categoryId") ?? "");
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();

    if (title.length < 3) return { error: "Title must be at least 3 characters." };
    if (description.length < 10) return { error: "Description must be at least 10 characters." };
    if (!Number.isFinite(price) || price < 0.5) return { error: "Price must be at least $0.50." };
    if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number, 0 or more." };
    if (imageUrl && !/^https?:\/\//.test(imageUrl)) {
        return { error: "Image URL must start with http:// or https://" };
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return { error: "Please choose a category." };

    return {
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
    if ("error" in parsed) {
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
    if ("error" in parsed) {
        redirect(`/seller/${productId}/edit?error=${encodeURIComponent(parsed.error)}`);
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