import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "./prisma";

const COOKIE = "session";
const SESSION_DAYS = 30;

// We store only a hash of the token, so a leaked database can't be used to log in.
function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.session.create({
        data: { token: hashToken(token), userId, expiresAt },
    });

    const store = await cookies();
    store.set(COOKIE, token, {
        httpOnly: true, // JavaScript in the browser can't read it
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
        path: "/",
    });
}

export async function getCurrentUser() {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
        where: { token: hashToken(token) },
        include: {
            user: { select: { id: true, email: true, name: true, role: true } },
        },
    });

    if (!session || session.expiresAt < new Date()) return null;
    return session.user;
}

export async function destroySession() {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (token) {
        await prisma.session.deleteMany({ where: { token: hashToken(token) } });
    }
    store.delete(COOKIE);
}