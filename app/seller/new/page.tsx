import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/guards";
import { createProduct } from "@/app/actions/seller";
import ProductForm from "@/components/ProductForm";

async function NewProductForm({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    await requireSeller();
    const { error } = await searchParams;
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

    return (
        <ProductForm
            action={createProduct}
            categories={categories}
            submitLabel="Create product"
            error={error}
        />
    );
}

export default function NewProductPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    return (
        <main className="mx-auto max-w-5xl p-6">
            <Link href="/seller" className="mb-4 inline-block text-blue-600 hover:underline">
                ← Dashboard
            </Link>
            <h1 className="mb-6 text-3xl font-bold">Add a product</h1>
            <Suspense fallback={<p>Loading...</p>}>
                <NewProductForm searchParams={searchParams} />
            </Suspense>
        </main>
    );
}