type Props = {
    action: (formData: FormData) => Promise<void>;
    categories: { id: string; name: string }[];
    submitLabel: string;
    error?: string;
    product?: {
        id: string;
        title: string;
        description: string;
        priceCents: number;
        stock: number;
        imageUrl: string | null;
        categoryId: string;
    };
};

export default function ProductForm({ action, categories, submitLabel, error, product }: Props) {
    const input = "w-full rounded border px-3 py-2";
    const label = "mb-1 block text-sm font-semibold";

    return (
        <form action={action} className="max-w-xl space-y-4">
            {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            {product && <input type="hidden" name="productId" value={product.id} />}

            <div>
                <label className={label}>Title</label>
                <input name="title" required defaultValue={product?.title} className={input} />
            </div>

            <div>
                <label className={label}>Description</label>
                <textarea
                    name="description"
                    required
                    rows={4}
                    defaultValue={product?.description}
                    className={input}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={label}>Price (USD)</label>
                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        min="0.5"
                        required
                        defaultValue={product ? (product.priceCents / 100).toFixed(2) : undefined}
                        className={input}
                    />
                </div>
                <div>
                    <label className={label}>Stock</label>
                    <input
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        required
                        defaultValue={product?.stock ?? 1}
                        className={input}
                    />
                </div>
            </div>

            <div>
                <label className={label}>Category</label>
                <select
                    name="categoryId"
                    required
                    defaultValue={product?.categoryId ?? ""}
                    className={input}
                >
                    <option value="" disabled>Choose a category</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className={label}>Image URL (optional)</label>
                <input
                    name="imageUrl"
                    placeholder="https://..."
                    defaultValue={product?.imageUrl ?? ""}
                    className={input}
                />
            </div>

            <button className="rounded bg-yellow-400 px-6 py-2 font-semibold">{submitLabel}</button>
        </form>
    );
}