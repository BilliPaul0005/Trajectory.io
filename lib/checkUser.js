import { auth } from "@/auth";
import { db } from "@/lib/prisma";

/**
 * checkUser()
 *
 * Called in the Header on every request.
 * With NextAuth + PrismaAdapter, OAuth users are auto-created by the adapter.
 * This function handles edge cases like a missing DB row for credential users.
 */
export const checkUser = async () => {
  const session = await auth();

  if (!session?.user) return null;

  try {
    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (existingUser) return existingUser;

    // Safety net: create row if somehow missing (e.g. manual DB wipe)
    const newUser = await db.user.create({
      data: {
        id:    session.user.id,
        name:  session.user.name,
        image: session.user.image,
        email: session.user.email,
      },
    });

    return newUser;
  } catch (error) {
    console.log("checkUser error:", error.message);
    return null;
  }
};
