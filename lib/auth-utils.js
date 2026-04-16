import { auth } from "@/auth";
import { db } from "@/lib/prisma";

/**
 * getAuthUser()
 *
 * Shared helper used by all server actions.
 * - Calls auth() to get the current JWT session
 * - Looks up the full User row from DB using session.user.id
 * - Throws "Unauthorized" if no session, or "User not found" if row is missing
 *
 * Eliminates 4 lines of repeated boilerplate across every action.
 */
export async function getAuthUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) throw new Error("User not found");

  return user;
}
