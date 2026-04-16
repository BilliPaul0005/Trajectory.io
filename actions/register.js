"use server";

import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * registerUser()
 *
 * Server action for email + password sign-up.
 * Hashes the password with bcrypt (12 rounds) before storing.
 * Returns { success: true } on success, throws on validation failure.
 */
export async function registerUser({ name, email, password }) {
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    throw new Error("All fields are required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: true };
}
