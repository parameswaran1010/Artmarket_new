import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Only export the HTTP handlers — no other named exports
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
