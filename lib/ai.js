import Groq from "groq-sdk";

// Centralized Groq client — all server actions import from here.
// Model: llama-3.3-70b-versatile (free, 14,400 req/day, fast)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Simple wrapper: send a text prompt, get a string back.
 * Replaces Gemini's model.generateContent(prompt) pattern.
 */
export async function generateText(prompt) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content ?? "";
}
