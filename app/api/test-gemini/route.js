// Test endpoint: http://localhost:3000/api/test-gemini
// (kept same URL so you don't have to change the bookmark)
export async function GET() {
  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return Response.json(
      { error: "GROQ_API_KEY is not set in .env" },
      { status: 500 }
    );
  }

  try {
    // Dynamic import so the route doesn't crash if groq-sdk isn't installed yet
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: key });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say hello in one word." }],
    });

    const text = completion.choices[0]?.message?.content;
    return Response.json({ ok: true, model: "llama-3.3-70b-versatile", response: text });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
