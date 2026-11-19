import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/guards";
import { updateProduct } from "@/app/actions/seller";
import ProductForm from "@/components/ProductForm";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

async function EditForm({
    params,
    searchParams,
}: {
    params: Params;
    searchParams: SearchParams;
}) {
    const user = await requireSeller();
    const { id } = await params;
    const { error } = await searchParams;

    // Only find the product if it belongs to this seller.
    const product = await prisma.product.findFirst({
        where: { id, sellerId: user.id },
    });
    if (!product) notFound();

    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

    return (
        <ProductForm
            action={updateProduct}
            categories={categories}
            product={product}
            submitLabel="Save changes"
            error={error}
        />
    );
}

export default function EditProductPage({
    params,
    searchParams,
}: {
    params: Params;
    searchParams: SearchParams;
}) {
    return (
        <main className="mx-auto max-w-5xl p-6">
            <Link href="/seller" className="mb-4 inline-block text-blue-600 hover:underline">
                ← Dashboard
            </Link>
            <h1 className="mb-6 text-3xl font-bold">Edit product</h1>
            <Suspense fallback={<p>Loading...</p>}>
                <EditForm params={params} searchParams={searchParams} />
            </Suspense>
        </main>
    );
}