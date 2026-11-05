import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
}

async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const order = await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
    });

    // Same response whether it doesn't exist or belongs to someone else.
    if (!order || order.userId !== user.id) notFound();

    return (
        <div className="space-y-4">
            <p>
                Status: <span className="font-semibold">{order.status}</span> · Placed{" "}
                {order.createdAt.toLocaleString()}
            </p>

            {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.product.imageUrl ?? ""}
                        alt={item.product.title}
                        className="h-16 w-16 rounded object-cover"
                    />
                    <div className="flex-1">
                        <p className="font-semibold">{item.product.title}</p>
                        <p className="text-sm text-gray-500">
                            {item.quantity} × {formatPrice(item.unitPriceCents)}
                        </p>
                    </div>
                    <p className="font-semibold">
                        {formatPrice(item.quantity * item.unitPriceCents)}
                    </p>
                </div>
            ))}

            <p className="border-t pt-4 text-right text-xl font-bold">
                Total: {formatPrice(order.totalCents)}
            </p>
        </div>
    );
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <main className="mx-auto max-w-4xl p-6">
            <Link href="/orders" className="mb-4 inline-block text-blue-600 hover:underline">
                ← All orders
            </Link>
            <h1 className="mb-4 text-3xl font-bold">Order details</h1>
            <Suspense fallback={<p>Loading order...</p>}>
                <OrderDetail params={params} />
            </Suspense>
        </main>
    );
}