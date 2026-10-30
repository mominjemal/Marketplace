import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function ProductGrid() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="rounded-lg border p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl ?? ""}
            alt={p.title}
            className="mb-3 aspect-square w-full rounded object-cover"
          />
          <p className="text-xs text-gray-500">{p.category.name}</p>
          <h2 className="font-semibold">{p.title}</h2>
          <p className="font-bold">{formatPrice(p.priceCents)}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Marketplace</h1>
      <Suspense fallback={<p>Loading products...</p>}>
        <ProductGrid />
      </Suspense>
    </main>
  );
}