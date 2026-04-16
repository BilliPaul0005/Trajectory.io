import { handlers } from "@/auth";

// NextAuth v5 App Router handler — exposes GET and POST at /api/auth/[...nextauth]
export const { GET, POST } = handlers;
