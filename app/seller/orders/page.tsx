import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/guards";
import { markShipped } from "@/app/actions/seller";

async function ShipList() {
    const user = await requireSeller();

    const items = await prisma.orderItem.findMany({
        where: {
            product: { sellerId: user.id },
            order: { status: { in: ["PAID", "SHIPPED"] } },
        },
        include: {
            product: true,
            order: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { order: { createdAt: "desc" } },
    });

    const toShip = items.filter((i) => !i.shippedAt);
    const shipped = items.filter((i) => i.shippedAt);

    return (
        <div className="space-y-8">
            <section>
                <h2 className="mb-3 text-xl font-semibold">To ship ({toShip.length})</h2>
                {toShip.length === 0 ? (
                    <p className="text-gray-500">Nothing waiting to ship.</p>
                ) : (
                    <div className="space-y-3">
                        {toShip.map((i) => (
                            <div key={i.id} className="flex items-center gap-4 rounded-lg border p-3">
                                <div className="flex-1">
                                    <p className="font-semibold">
                                        {i.quantity} × {i.product.title}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Order #{i.order.id.slice(-8)} · {i.order.createdAt.toLocaleDateString()} ·
                                        Buyer: {i.order.user.name ?? i.order.user.email}
                                    </p>
                                </div>
                                <form action={markShipped}>
                                    <input type="hidden" name="orderItemId" value={i.id} />
                                    <button className="rounded bg-yellow-400 px-4 py-2 font-semibold">
                                        Mark as shipped
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="mb-3 text-xl font-semibold">Shipped ({shipped.length})</h2>
                {shipped.length === 0 ? (
                    <p className="text-gray-500">Nothing shipped yet.</p>
                ) : (
                    <div className="space-y-3">
                        {shipped.map((i) => (
                            <div key={i.id} className="rounded-lg border p-3">
                                <p className="font-semibold">
                                    {i.quantity} × {i.product.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Order #{i.order.id.slice(-8)} · shipped {i.shippedAt!.toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default function SellerOrdersPage() {
    return (
        <main className="mx-auto max-w-5xl p-6">
            <Link href="/seller" className="mb-4 inline-block text-blue-600 hover:underline">
                ← Dashboard
            </Link>
            <h1 className="mb-6 text-3xl font-bold">Orders to ship</h1>
            <Suspense fallback={<p>Loading...</p>}>
                <ShipList />
            </Suspense>
        </main>
    );
}