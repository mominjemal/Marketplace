import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { payOrder, cancelMyOrder } from "@/app/actions/orders";

function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
}

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ success?: string; canceled?: string }>;

async function OrderDetail({
    params,
    searchParams,
}: {
    params: Params;
    searchParams: SearchParams;
}) {
    const { id } = await params;
    const { success, canceled } = await searchParams;

    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const order = await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
    });

    if (!order || order.userId !== user.id) notFound();

    return (
        <div className="space-y-4">
            {success && order.status === "PENDING" && (
                <p className="rounded bg-blue-50 p-2 text-blue-800">
                    Thanks! We&apos;re confirming your payment. Refresh in a few seconds.
                </p>
            )}
            {success && order.status === "PAID" && (
                <p className="rounded bg-green-50 p-2 text-green-800">
                    Payment received. Thank you for your order!
                </p>
            )}
            {canceled && order.status === "PENDING" && (
                <p className="rounded bg-yellow-50 p-2 text-yellow-800">
                    Payment was not completed. You can try again below.
                </p>
            )}

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

            {order.status === "PENDING" && (
                <div className="flex justify-end gap-3">
                    <form action={cancelMyOrder}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="rounded border px-4 py-2 hover:bg-gray-100">
                            Cancel order
                        </button>
                    </form>
                    <form action={payOrder}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="rounded bg-yellow-400 px-6 py-2 font-semibold">
                            Pay now
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function OrderPage({
    params,
    searchParams,
}: {
    params: Params;
    searchParams: SearchParams;
}) {
    return (
        <main className="mx-auto max-w-4xl p-6">
            <Link href="/orders" className="mb-4 inline-block text-blue-600 hover:underline">
                ← All orders
            </Link>
            <h1 className="mb-4 text-3xl font-bold">Order details</h1>
            <Suspense fallback={<p>Loading order...</p>}>
                <OrderDetail params={params} searchParams={searchParams} />
            </Suspense>
        </main>
    );
}