import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

async function Content({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;
    return <AuthForm mode="signup" error={error} />;
}

export default function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    return (
        <Suspense>
            <Content searchParams={searchParams} />
        </Suspense>
    );
}