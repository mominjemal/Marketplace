"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";

function fail(page: "login" | "signup", message: string): never {
    redirect(`/${page}?error=${encodeURIComponent(message)}`);
}

export async function signup(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email.includes("@")) fail("signup", "Please enter a valid email.");
    if (password.length < 8) fail("signup", "Password must be at least 8 characters.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) fail("signup", "An account with that email already exists.");

    const user = await prisma.user.create({
        data: {
            name: name || null,
            email,
            password: await bcrypt.hash(password, 10),
        },
    });

    await createSession(user.id);
    redirect("/");
}

export async function login(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user ? await bcrypt.compare(password, user.password) : false;

    // Same message for "no such user" and "wrong password" on purpose.
    if (!user || !ok) fail("login", "Invalid email or password.");

    await createSession(user.id);
    redirect("/");
}

export async function logout() {
    await destroySession();
    redirect("/");
}