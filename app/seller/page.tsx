import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { becomeSeller, deleteProduct } from "@/app/actions/seller";

function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
}

type SearchParams = Promise<{ error?: string }>;

async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
    const { error } = await searchParams;

    const user = await getCurrentUser();
    if (!user) redirect("/login?error=" + encodeURIComponent("Please log in first."));

    if (user.role === "BUYER") {
        return (
            <div className="max-w-xl space-y-4">
                <p>
                    Want to sell here? Turn your account into a seller account and you can list
                    products in a minute.
                </p>
                <form action={becomeSeller}>
                    <button className="rounded bg-yellow-400 px-6 py-2 font-semibold">
                        Become a seller
                    </button>
                </form>
            </div>
        );
    }

    const products = await prisma.product.findMany({
        where: { sellerId: user.id },
        include: { category: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-4">
            {error && <p className="rounded bg-red-50 p-2 text-red-700">{error}</p>}

            <Link
                href="/seller/new"
                className="inline-block rounded bg-yellow-400 px-4 py-2 font-semibold"
            >
                + Add product
            </Link>

            {products.length === 0 ? (
                <p>You haven&apos;t listed anything yet.</p>
            ) : (
                <div className="space-y-3">
                    {products.map((p) => (
                        <div key={p.id} className="flex items-center gap-4 rounded-lg border p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={p.imageUrl ?? ""}
                                alt={p.title}
                                className="h-16 w-16 rounded object-cover"
                            />
                            <div className="flex-1">
                                <Link href={`/products/${p.id}`} className="font-semibold hover:underline">
                                    {p.title}
                                </Link>
                                <p className="text-sm text-gray-500">{p.category.name}</p>
                            </div>
                            <p className="w-24 text-right">{formatPrice(p.priceCents)}</p>
                            <p className="w-24 text-right text-sm">
                                {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                            </p>
                            <Link href={`/seller/${p.id}/edit`} className="text-blue-600 hover:underline">
                                Edit
                            </Link>
                            <form action={deleteProduct}>
                                <input type="hidden" name="productId" value={p.id} />
                                <button className="text-red-600 hover:underline">Delete</button>
                            </form>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SellerPage({ searchParams }: { searchParams: SearchParams }) {
    return (
        <main className="mx-auto max-w-5xl p-6">
            <h1 className="mb-6 text-3xl font-bold">Seller dashboard</h1>
            <Suspense fallback={<p>Loading...</p>}>
                <Dashboard searchParams={searchParams} />
            </Suspense>
        </main>
    );
}