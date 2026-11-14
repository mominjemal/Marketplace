import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { setQuantity, removeFromCart } from "@/app/actions/cart";
import { placeOrder } from "@/app/actions/checkout";

function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
}

async function CartContents() {
    const user = await getCurrentUser();
    if (!user) redirect("/login?error=" + encodeURIComponent("Please log in to see your cart."));

    const items = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true },
        orderBy: { id: "asc" },
    });

    if (items.length === 0) {
        return (
            <p>
                Your cart is empty.{" "}
                <Link href="/" className="text-blue-600 hover:underline">
                    Keep shopping
                </Link>
            </p>
        );
    }

    const totalCents = items.reduce(
        (sum, i) => sum + i.quantity * i.product.priceCents,
        0
    );

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.product.imageUrl ?? ""}
                        alt={item.product.title}
                        className="h-20 w-20 rounded object-cover"
                    />
                    <div className="flex-1">
                        <Link href={`/products/${item.product.id}`} className="font-semibold hover:underline">
                            {item.product.title}
                        </Link>
                        <p>{formatPrice(item.product.priceCents)}</p>
                    </div>

                    <form action={setQuantity} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={item.productId} />
                        <input
                            name="quantity"
                            type="number"
                            min={1}
                            max={item.product.stock}
                            defaultValue={item.quantity}
                            className="w-16 rounded border px-2 py-1"
                        />
                        <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100">
                            Update
                        </button>
                    </form>

                    <p className="w-24 text-right font-semibold">
                        {formatPrice(item.quantity * item.product.priceCents)}
                    </p>

                    <form action={removeFromCart}>
                        <input type="hidden" name="productId" value={item.productId} />
                        <button className="text-sm text-red-600 hover:underline">Remove</button>
                    </form>
                </div>
            ))}

            <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xl font-bold">Subtotal: {formatPrice(totalCents)}</p>
                <form action={placeOrder}>
                    <button className="rounded bg-yellow-400 px-6 py-2 font-semibold">
                        Place order
                    </button>
                </form>
            </div>
        </div>
    );
}

async function CartError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;
    if (!error) return null;
    return <p className="mb-4 rounded bg-red-50 p-2 text-red-700">{error}</p>;
}

export default function CartPage({ searchParams, }: { searchParams: Promise<{ error?: string }>; }) {
    return (
        <main className="mx-auto max-w-4xl p-6">
            <h1 className="mb-6 text-3xl font-bold">Your cart</h1>
            <Suspense fallback={<p>Loading cart...</p>}>
                <CartError searchParams={searchParams} />
                <CartContents />
            </Suspense>
        </main>
    );
}