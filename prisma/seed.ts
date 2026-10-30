import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
    const seller = await prisma.user.upsert({
        where: { email: "seller@example.com" },
        update: {},
        create: {
            email: "seller@example.com",
            name: "Demo Seller",
            password: "placeholder-we-will-hash-real-passwords-later",
            role: "SELLER",
        },
    });

    const categoryData = [
        { name: "Electronics", slug: "electronics" },
        { name: "Books", slug: "books" },
        { name: "Home", slug: "home" },
    ];

    const categories: Record<string, string> = {};
    for (const c of categoryData) {
        const cat = await prisma.category.upsert({
            where: { slug: c.slug },
            update: {},
            create: c,
        });
        categories[c.slug] = cat.id;
    }

    await prisma.product.deleteMany();

    const products = [
        { title: "Wireless Headphones", priceCents: 5999, cat: "electronics" },
        { title: "Mechanical Keyboard", priceCents: 8900, cat: "electronics" },
        { title: "USB-C Charger", priceCents: 1999, cat: "electronics" },
        { title: "JavaScript Handbook", priceCents: 2499, cat: "books" },
        { title: "Learn SQL in a Weekend", priceCents: 1899, cat: "books" },
        { title: "Desk Lamp", priceCents: 3200, cat: "home" },
        { title: "Ceramic Coffee Mug", priceCents: 1200, cat: "home" },
        { title: "Throw Blanket", priceCents: 4500, cat: "home" },
    ];

    for (const [i, p] of products.entries()) {
        await prisma.product.create({
            data: {
                title: p.title,
                description: `${p.title}: a great demo product for our marketplace.`,
                priceCents: p.priceCents,
                stock: 20,
                imageUrl: `https://picsum.photos/seed/product${i}/400/400`,
                sellerId: seller.id,
                categoryId: categories[p.cat],
            },
        });
    }

    console.log("Seeded!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());