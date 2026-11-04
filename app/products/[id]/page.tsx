import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addToCart } from "@/app/actions/cart";

function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
}

async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true, seller: { select: { name: true } } },
    });

    if (!product) notFound();

    return (
        <div className="grid gap-8 md:grid-cols-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={product.imageUrl ?? ""}
                alt={product.title}
                className="w-full rounded-lg object-cover"
            />
            <div>
                <p className="text-sm text-gray-500">{product.category.name}</p>
                <h1 className="mb-2 text-3xl font-bold">{product.title}</h1>
                <p className="mb-4 text-2xl font-bold">{formatPrice(product.priceCents)}</p>
                <p className="mb-4">{product.description}</p>
                <p className="mb-1 text-sm">Sold by {product.seller.name ?? "Unknown"}</p>
                <p className="mb-6 text-sm">
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>

                <form action={addToCart}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                        disabled={product.stock === 0}
                        className="rounded bg-yellow-400 px-6 py-2 font-semibold disabled:opacity-50"
                    >
                        Add to cart
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ProductPage({ params, }: { params: Promise<{ id: string }>; }) {
    return (
        <main className="mx-auto max-w-5xl p-6">
            <Link href="/" className="mb-4 inline-block text-blue-600 hover:underline">
                ← Back to products
            </Link>
            <Suspense fallback={<p>Loading product...</p>}>
                <ProductDetail params={params} />
            </Suspense>
        </main>
    );
}