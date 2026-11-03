import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ q?: string; category?: string }>;

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildHref(q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

async function Filters({ searchParams }: { searchParams: SearchParams }) {
  const { q, category } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1 text-sm ${active ? "bg-black text-white" : "hover:bg-gray-100"
    }`;

  return (
    <div className="mb-6 space-y-4">
      <form action="/" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products..."
          className="flex-1 rounded border px-3 py-2"
        />
        {category && <input type="hidden" name="category" value={category} />}
        <button className="rounded bg-yellow-400 px-4 py-2 font-semibold">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link href={buildHref(q)} className={pill(!category)}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref(q, c.slug)}
            className={pill(category === c.slug)}
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const { q, category } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  if (products.length === 0) {
    return <p className="text-gray-500">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/products/${p.id}`}
          className="rounded-lg border p-3 hover:shadow"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl ?? ""}
            alt={p.title}
            className="mb-3 aspect-square w-full rounded object-cover"
          />
          <p className="text-xs text-gray-500">{p.category.name}</p>
          <h2 className="font-semibold">{p.title}</h2>
          <p className="font-bold">{formatPrice(p.priceCents)}</p>
        </Link>
      ))}
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Marketplace</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <Filters searchParams={searchParams} />
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </main>
  );
}