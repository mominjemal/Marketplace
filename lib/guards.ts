import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

// Use at the top of any seller-only page or action.
export async function requireSeller() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login?error=" + encodeURIComponent("Please log in first."));
    }
    if (user.role !== "SELLER" && user.role !== "ADMIN") redirect("/seller");
    return user;
}