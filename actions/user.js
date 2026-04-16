"use server";

import { db } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  let user;

  // ── Step 0: Auth check ─────────────────────────────────────────────────────
  try {
    user = await getAuthUser();
  } catch (authErr) {
    console.error("[updateUser] Auth failed:", authErr.message);
    throw new Error("Not authenticated");
  }

  // ── Step 1: Gemini / industry insight ─────────────────────────────────────
  try {
    let industryInsight = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    if (!industryInsight) {
      console.log("[updateUser] Generating AI insights for:", data.industry);
      const insights = await generateAIInsights(data.industry);
      console.log("[updateUser] AI insights received, saving to DB...");
      industryInsight = await db.industryInsight.create({
        data: {
          industry:   data.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  } catch (aiErr) {
    // Log the full Gemini error so we can see it in the terminal
    console.error("[updateUser] Gemini/DB insight error:", aiErr.message);
    console.error("[updateUser] Full error:", aiErr);
    throw new Error(`AI insight failed: ${aiErr.message}`);
  }

  // ── Step 2: Update user row ────────────────────────────────────────────────
  try {
    console.log("[updateUser] Updating user:", user.id, "skills type:", typeof data.skills, data.skills);
    await db.user.update({
      where: { id: user.id },
      data: {
        industry:   data.industry,
        experience: data.experience,
        bio:        data.bio,
        skills:     data.skills,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (dbErr) {
    console.error("[updateUser] DB update error:", dbErr.message);
    console.error("[updateUser] DB full error:", dbErr);
    throw new Error(`DB update failed: ${dbErr.message}`);
  }
}

export async function getUserOnboardingStatus() {
  const user = await getAuthUser();
  try {
    const freshUser = await db.user.findUnique({
      where:  { id: user.id },
      select: { industry: true },
    });
    return { isOnboarded: !!freshUser?.industry };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}
