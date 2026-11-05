import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
}

async function OrderList() {
    const user = await getCurrentUser();
    if (!user) redirect("/login?error=" + encodeURIComponent("Please log in to see your orders."));

    const orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: { items: true },
        orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) return <p>You haven&apos;t placed any orders yet.</p>;

    return (
        <div className="space-y-3">
            {orders.map((o) => (
                <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:shadow"
                >
                    <div>
                        <p className="font-semibold">Order #{o.id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">
                            {o.createdAt.toLocaleDateString()} · {o.items.length} item(s)
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">{formatPrice(o.totalCents)}</p>
                        <p className="text-sm text-gray-500">{o.status}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default function OrdersPage() {
    return (
        <main className="mx-auto max-w-4xl p-6">
            <h1 className="mb-6 text-3xl font-bold">Your orders</h1>
            <Suspense fallback={<p>Loading orders...</p>}>
                <OrderList />
            </Suspense>
        </main>
    );
}