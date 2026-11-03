import Link from "next/link";
import { login, signup } from "@/app/actions/auth";

export default function AuthForm({
    mode,
    error,
}: {
    mode: "login" | "signup";
    error?: string;
}) {
    const isSignup = mode === "signup";
    const input = "w-full rounded border px-3 py-2";

    return (
        <form
            action={isSignup ? signup : login}
            className="mx-auto mt-10 max-w-sm space-y-4 rounded-lg border p-6"
        >
            <h1 className="text-2xl font-bold">
                {isSignup ? "Create account" : "Log in"}
            </h1>

            {error && (
                <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
            )}

            {isSignup && <input name="name" placeholder="Your name" className={input} />}
            <input name="email" type="email" placeholder="Email" required className={input} />
            <input
                name="password"
                type="password"
                placeholder="Password (8+ characters)"
                required
                minLength={8}
                className={input}
            />

            <button className="w-full rounded bg-yellow-400 py-2 font-semibold">
                {isSignup ? "Sign up" : "Log in"}
            </button>

            <p className="text-sm">
                {isSignup ? (
                    <>Already have an account? <Link href="/login" className="text-blue-600">Log in</Link></>
                ) : (
                    <>New here? <Link href="/signup" className="text-blue-600">Create an account</Link></>
                )}
            </p>
        </form>
    );
}