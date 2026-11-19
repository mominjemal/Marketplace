
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

async function UserMenu() {
    const user = await getCurrentUser();

    if (!user) {
        return (
            <div className="flex gap-4">
                <Link href="/login">Log in</Link>
                <Link href="/signup">Sign up</Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <Link href="/orders">Orders</Link>

            <Link href="/seller">
                {user.role === "BUYER" ? "Sell" : "My products"}
            </Link>

            <span>Hi, {user.name ?? user.email}</span>

            <form action={logout}>
                <button>Log out</button>
            </form>
        </div>
    );
}

export default function Header() {
    return (
        <header className="flex items-center justify-between border-b px-6 py-3">
            <Link href="/" className="text-xl font-bold">
                Marketplace
            </Link>

            <Suspense fallback={<div />}>
                <UserMenu />
            </Suspense>
        </header>
    );
}
