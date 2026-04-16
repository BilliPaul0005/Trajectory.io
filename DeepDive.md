# Trajectory.io — Complete Technical Deep Dive & Interview Prep

---

## 1. How The Entire System Is Connected

### The Big Picture (Request Lifecycle)

```
Browser Request
     │
     ▼
middleware.js          ← Edge runtime: checks JWT, redirects to /sign-in if unauth
     │
     ▼
Next.js App Router
     │
   ┌─┴──────────────────────────────────────┐
   │                                        │
(auth) group                         (main) group
/sign-in, /sign-up                   /dashboard, /resume, /interview, etc.
No auth needed                       Auth required (enforced by middleware)
   │                                        │
   ▼                                        ▼
app/(auth)/sign-in/page.jsx          app/(main)/dashboard/page.jsx
  → Client Component                   → Server Component
  → Calls signIn() / registerUser()    → Calls getIndustryInsights() 
                                         (Server Action)
                                              │
                                              ▼
                                        lib/auth-utils.js → getAuthUser()
                                              │
                                              ▼
                                        auth.js → auth() → JWT decode
                                              │
                                              ▼
                                        Prisma → Neon PostgreSQL
                                              │
                                              ▼
                                        lib/ai.js → Groq API (LLaMA 3.3 70B)
                                              │
                                              ▼
                                        Returns data → rendered HTML → Browser
```

---

## 2. Layer-by-Layer File Analysis

### Layer 1: Entry Point & Routing

#### `middleware.js`
- **What it does:** Runs on EVERY request at the Edge (before the page renders)
- **How:** Wraps NextAuth's `auth()` function — if `req.auth` is null AND route is protected → redirect to `/sign-in`
- **Protected routes:** `/dashboard`, `/resume`, `/interview`, `/ai-cover-letter`, `/onboarding`
- **Key:** The `matcher` regex skips static files (images, CSS, JS) to avoid unnecessary auth checks

#### `app/layout.js` (Root Layout)
- **What it does:** Wraps every page — provides `<Providers>`, `<ThemeProvider>`, `<Header>`, `<Toaster>`, `<Footer>`
- **Key design:** `SessionProvider` lives in `components/providers.jsx` (a separate `"use client"` file) — this is required because Server Components cannot render client-side Context providers directly

#### `auth.js` (NextAuth Configuration)
- **Two providers:** Google OAuth + Credentials (email/password)
- **Adapter:** `PrismaAdapter` — auto-creates User+Account rows in DB when someone signs in with Google
- **Session strategy:** `jwt` — sessions are stored in an HTTP-only cookie (not the DB), making it stateless and fast
- **JWT callback:** Persists `user.id` into the token. Falls back to DB lookup by email on page refreshes when `user` object is missing
- **Session callback:** Exposes `session.user.id` to client components

---

### Layer 2: Authentication Utilities

#### `lib/auth-utils.js` → `getAuthUser()`
```
Every server action calls this first.
auth() → decode JWT → get session.user.id → db.user.findUnique()
```
- Eliminates 4 lines of repeated boilerplate in every action
- Throws `"Unauthorized"` if no session → action fails safely
- Throws `"User not found"` if session exists but DB row missing

#### `lib/checkUser.js` → `checkUser()`
- Called inside `Header` (server component) on every page load
- Ensures the DB User row exists (safety net for OAuth sign-ins)
- Different from `getAuthUser()`: doesn't throw, used for UI sync not action auth

#### `actions/register.js`
- Handles email/password sign-up
- Hashes password with `bcryptjs` (10 salt rounds)
- Creates User in DB → returns success → client calls `signIn("credentials")`

---

### Layer 3: Database (Prisma + Neon)

#### Schema Models & Their Relationships

```
User (1) ──────┬──── (1) Resume          (one resume per user, upserted)
               ├──── (N) CoverLetter     (many cover letters per user)
               ├──── (N) Assessment      (one per quiz attempt)
               ├──── (1?) IndustryInsight (shared: many users, one industry)
               ├──── (N) Account         (NextAuth: OAuth provider links)
               └──── (N) Session         (NextAuth: DB sessions — not used w/ JWT)
```

#### Key Design Decisions
- **`IndustryInsight` is shared** — if 1,000 users pick "Technology", they share ONE insight row. Only generated once, updated weekly. Saves thousands of API calls.
- **`Assessment.questions` is `Json[]`** — stores entire quiz attempt (question + answer + correct answer + explanation) without a separate QuizQuestion table. Trade-off: less queryable but simpler.
- **`Resume` uses `@unique` on `userId`** — enforces one resume per user at DB level
- **`skills` is `String[]`** — PostgreSQL native array type via Prisma

---

### Layer 4: Server Actions (The API Layer)

No separate REST API. Next.js Server Actions are used throughout — they run on the server but are called directly from client components like functions.

#### `actions/user.js` — `updateUser()`
Flow: `getAuthUser()` → check/generate IndustryInsight → `db.user.update()`

**Critical fix made:** Gemini/AI call was originally inside a Prisma `$transaction`. Removed — AI calls take 5-15s, Prisma transactions timeout at 5s. AI now runs BEFORE the transaction.

#### `actions/dashboard.js` — `generateAIInsights()`
- Sends structured JSON prompt to Groq (LLaMA 3.3 70B)
- Parses the JSON response (strips markdown code fences)
- Returns: salary ranges, growth rate, demand level, top skills, market trends

#### `actions/resume.js` — `improveWithAI()`
- Takes current resume section content + type
- Sends prompt with user's industry context for personalized improvement
- Uses user's profile data (industry, experience) for tailored suggestions

#### `actions/interview.js` — `generateQuiz()` + `saveQuizResult()`
- Generates 10 MCQ questions as JSON from LLaMA
- After submission: identifies wrong answers → generates targeted improvement tip
- Saves full attempt as `Assessment` with score + AI tip

#### `actions/cover-letter.js` — `generateCoverLetter()`
- Combines user's profile (industry, skills, bio, experience) + job details
- Generates formatted markdown cover letter
- Saves to DB → user can view/edit/delete

---

### Layer 5: AI Layer

#### `lib/ai.js` — Central Groq Client
```js
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// All 5 action files import generateText() from here
```
- Single swap point — change model or provider in ONE file
- Model: `llama-3.3-70b-versatile` — 14,400 req/day free

#### `lib/inngest/function.js` — Background Job
- **Trigger:** Cron `0 0 * * 0` (every Sunday midnight)
- **What it does:** Fetches all unique industries from DB → regenerates insights for each via Groq → updates `IndustryInsight` rows
- **Inngest steps:** Each `step.run()` is atomic and retriable — if Groq fails mid-loop, Inngest retries just that step, not the entire function
- **Connected via:** `app/api/inngest/route.js` (webhook endpoint)

---

### Layer 6: UI Components

#### `components/header.jsx`
- Server Component — can use `await auth()` directly
- Calls `checkUser()` on each load (user DB sync)
- Conditionally renders nav based on `isLoggedIn`
- Custom text logo `Trajectory.io` with gradient `.io`

#### `components/sign-out-button.jsx`
- Client Component (`"use client"`)
- Displays user avatar with dropdown: name + sign out button
- Calls NextAuth `signOut()` action

#### `hooks/use-fetch.js`
- Custom React hook wrapping any async function
- Returns `{ data, loading, error, fn }` 
- Used by ALL form submit handlers — handles loading states and error toasts automatically
- Pattern: `const { fn: submitFn, loading } = useFetch(serverAction)`

---

## 3. Complete Data Flow — Onboarding Example

```
1. User fills onboarding form (industry, skills, bio, experience)
   → onboarding-form.jsx (client component)

2. Zod validates + transforms:
   - "Python, React" → ["Python", "React"] (skills array)  
   - "2" → 2 (experience number)
   - industry + subIndustry → "technology-software-development"

3. useFetch hook calls updateUser(data) → Server Action

4. Server: getAuthUser()
   → auth() decodes JWT from cookie
   → session.user.id → db.user.findUnique()
   → returns full User object

5. Server: Check IndustryInsight
   → db.industryInsight.findUnique({ where: { industry } })
   → If null: generateText(prompt) → Groq API → LLaMA 3.3 70B
   → Parse JSON response → db.industryInsight.create()

6. Server: db.user.update({ industry, skills, experience, bio })

7. Return { success: true }

8. Client: useEffect detects updateResult?.success === true
   → toast.success("Profile completed!")
   → router.push("/dashboard")
```

---

## 4. SDE Interview Questions & Strong Answers

### 🔐 Authentication & Security

**Q1: Why did you choose NextAuth.js over Clerk or Firebase Auth?**
> "Clerk is a SaaS product — it's fast to set up but creates vendor lock-in and costs $25+/mo beyond the free tier. Firebase locks you into the Google ecosystem. NextAuth is open-source, self-hosted, and framework-native. I own the auth logic completely — I can read, audit, and modify every line. For a production app, that's a significant advantage. It also forced me to deeply understand OAuth flows, JWT tokens, and session management — which I can now explain from first principles."

**Q2: How does JWT session strategy work in your app?**  
> "When a user signs in, NextAuth calls the `jwt` callback and creates a signed JWT containing the user's ID. This token is stored in an HTTP-only cookie — the client can't read it via JavaScript, protecting against XSS. On every subsequent request, the middleware decodes this cookie using the `NEXTAUTH_SECRET`. No database hit is needed to verify auth — the JWT is self-contained. I chose JWT over database sessions because it's stateless and scales horizontally without session store coordination."

**Q3: How do you protect routes?**  
> "At the Edge level using `middleware.js`. It intercepts every request before any page code runs. Using NextAuth's `auth()` wrapper, it checks if `req.auth` is populated. If the route is in my protected list and there's no session, it instantly redirects to `/sign-in`. This prevents any server component from even starting to execute. The matcher regex also skips static assets to avoid unnecessary overhead."

**Q4: How does Google OAuth flow work end-to-end?**  
> "User clicks 'Sign in with Google' → NextAuth redirects to Google's consent screen → Google redirects back to `/api/auth/callback/google` with an authorization code → NextAuth exchanges it for access+ID tokens → PrismaAdapter checks if an Account row exists for that provider+providerAccountId combo → if not, creates User+Account rows → JWT is issued with the user's DB id → stored in HTTP-only cookie. On the next request the middleware just decodes the token."

**Q5: How do you handle password hashing?**  
> "Using bcryptjs with 10 salt rounds in `actions/register.js`. bcrypt is adaptive — you can increase rounds as hardware gets faster. The hashed password is stored in the `password` field on the User model. During sign-in, `bcrypt.compare()` does a constant-time comparison to prevent timing attacks. I never store or log plaintext passwords anywhere."

**Q6: What is the PrismaAdapter doing?**  
> "It bridges NextAuth and Prisma. When a user signs in with Google for the first time, NextAuth needs to persist their identity. The PrismaAdapter implements NextAuth's database adapter interface, translating NextAuth's internal operations into Prisma queries. It creates a `User` row and an `Account` row linking the Google identity to that user. On subsequent Google sign-ins for the same email, it finds the existing Account and skips creation."

---

### 🗄️ Database & Prisma

**Q7: Why is IndustryInsight shared across users?**  
> "It's a performance optimization. If 1,000 users all choose 'Technology → Software Development', generating 1,000 separate Groq API calls would be wasteful and expensive. Instead, the first user to select that industry triggers the generation, and all subsequent users with the same industry get the cached result. The data is refreshed weekly via an Inngest cron job. This is essentially application-level caching with database persistence."

**Q8: Why did you use `Json[]` for Assessment.questions instead of a separate table?**  
> "Trade-off decision. A normalized approach would have a `Question` table with FK to `Assessment`. But quiz questions are only ever read as a complete set — never queried individually. Storing them as `Json[]` makes reads O(1) (one DB query) and writes atomic. The downside is you can't run aggregate queries like 'what's the most common wrong answer across all users'. For the current scope, the simplicity of `Json[]` wins. I'd revisit this if analytics on individual questions became a requirement."

**Q9: What does `npx prisma db push` do vs `prisma migrate`?**  
> "`db push` applies schema changes directly to the DB without creating migration files. It's great for development and prototyping — fast iteration. `prisma migrate dev` creates versioned SQL migration files, which is what you use in production for auditability, rollbacks, and CI/CD pipelines. I used `db push` here because this is a portfolio project. In a production app with a team, I'd use proper migrations and commit them to git."

**Q10: How do you prevent N+1 query problems in Prisma?**  
> "Prisma's `include` option lets you eager-load relations in a single query. For example, `db.user.findUnique({ include: { industryInsight: true } })` fetches the user and their industry data in one SQL JOIN, not two separate queries. If I needed to fetch 100 users with their cover letters, I'd use `include` rather than looping and calling `findMany` per user."

---

### ⚙️ Next.js & Architecture

**Q11: Explain Server Actions — why use them instead of a REST API?**  
> "Server Actions are async functions that run on the server but are called from client components as if they were regular JavaScript functions. Next.js handles the serialization/deserialization and the HTTP POST request internally. Benefits: no need to write API route handlers, no need to manually handle CORS, no separate API layer to maintain. The client imports the function directly — the bundler strips the implementation from the client bundle and replaces it with an RPC call. For a full-stack Next.js app, this drastically reduces boilerplate."

**Q12: What's the difference between Server Components and Client Components?**  
> "Server Components render on the server, have direct access to DB/file system, and send zero JavaScript to the client — great for data fetching and static content. Client Components render in the browser with `useState`, `useEffect`, event handlers — needed for interactivity. In this app, pages like `/dashboard` are Server Components that fetch data directly. Forms like `OnboardingForm` are Client Components that handle user input. The rule: use Server Components by default, add `'use client'` only when you need browser APIs or React hooks."

**Q13: Why is `SessionProvider` in a separate `providers.jsx` file?**  
> "Because `SessionProvider` is a `'use client'` component — it uses React Context internally. In Next.js 15, the root `layout.js` is a Server Component. You can import client components into server components, but there's a constraint: a client component boundary must be explicitly declared. If you import `SessionProvider` directly into the server layout and render it wrapping HTML/body, React's hook reconciler loses track of hook counts across client-side navigation, causing the 'rendered more hooks than during previous render' error. The fix is creating a dedicated `Providers` client component that declares its own boundary clearly."

**Q14: How does the `useFetch` custom hook work?**  
> "It's a reusable wrapper around any async function — particularly Server Actions. It manages three pieces of state: `data`, `loading`, and `error`. When `fn()` is called, it sets loading to true, awaits the async operation, updates data on success or calls `toast.error()` on failure, then sets loading to false. Every form in the app uses `const { fn, loading, data } = useFetch(serverAction)` — it eliminates redundant try/catch and loading state code across all components."

**Q15: What is Turbopack and why use it?**  
> "Turbopack is Next.js's Rust-based bundler replacing Webpack. It only compiles what's needed for the current page — incremental compilation. In this project it made hot reload nearly instant. It's still in beta but usable for development. For production builds, Next.js still uses its standard bundler."

---

### 🤖 AI Integration

**Q16: How do you ensure the AI always returns valid JSON?**  
> "Two approaches. First, the prompt explicitly says 'Return ONLY the JSON' and provides the exact schema structure. Second, after receiving the response I strip any markdown code fences with a regex (`/```(?:json)?\n?/g`) before calling `JSON.parse()`. If parsing still fails, the error is caught and a meaningful error is thrown. In production, I'd add a retry with an explicit instruction like 'Your previous response was not valid JSON' if the first attempt fails."

**Q17: Why is the AI call outside the Prisma transaction in `updateUser`?**  
> "Prisma's interactive transactions have a default 5-second timeout. An LLM API call to Groq can take anywhere from 3-15 seconds depending on model load. If the AI call is inside the transaction, the DB connection stays open the entire time — and if the AI takes 8 seconds, the transaction times out, rolls back, and the user gets an error even though the AI call succeeded. Moving the AI call outside means: call AI, get result, THEN open a fast (<100ms) DB transaction for the write. No timeout risk."

**Q18: Why Groq over Gemini or OpenAI?**  
> "The `@google/generative-ai` package had its free-tier quota exhausted on the project's Google Cloud account. Groq provides 14,400 requests per day free with no credit card, using their custom GROQ chips which give the fastest inference available — typically 500+ tokens/second vs ~50 with standard providers. The model `llama-3.3-70b-versatile` is Meta's open-source LLaMA 3.3, comparable in quality to GPT-4o-mini for structured generation tasks. Groq's API is OpenAI-compatible, so migration is straightforward."

---

### 🔄 Background Jobs & Inngest

**Q19: Explain how Inngest works in this project.**  
> "Inngest is a durable execution platform. I define a function in `lib/inngest/function.js` with a cron trigger (`0 0 * * 0` = every Sunday midnight). Inngest's SDK exposes a webhook endpoint at `/api/inngest`. When the cron fires, Inngest calls that endpoint, which executes the function. Each `step.run()` inside is atomic — if the Groq call fails for one industry, Inngest automatically retries just that step without re-running the entire function. During development, the Inngest Dev Server UI shows real-time execution logs."

**Q20: Why refresh industry insights weekly instead of on every request?**  
> "Industry salary data and market trends don't change daily or even weekly — they shift over months. Generating fresh AI insights on every dashboard load would: (1) add 3-5 seconds of latency, (2) consume API quota proportional to DAU (daily active users), and (3) provide no meaningful benefit since the data wouldn't actually change. The weekly cron approach means one API call per industry per week regardless of how many users load the dashboard — much more efficient and scalable."

---

### 🏗️ Design Patterns & Decisions

**Q21: What design patterns did you use?**  
> 
> - **DRY (Don't Repeat Yourself):** `getAuthUser()` — auth + DB lookup in one helper imported by all actions
> - **Repository-like Pattern:** All DB operations are in `actions/` — UI never talks to DB directly  
> - **Single Responsibility:** `lib/ai.js` has one job: wrap the AI client. `lib/auth-utils.js` has one job: authenticate and return user.
> - **Facade Pattern:** `generateText()` hides Groq's message format complexity behind a simple `prompt → string` interface
> - **Adapter Pattern:** `PrismaAdapter` adapts NextAuth's db interface to Prisma's API

**Q22: How would you add a new feature — say, a LinkedIn profile analyzer?**  
> "1. Add a new Server Action in `actions/linkedin.js` that calls `generateText()` with a prompt. 2. Create a new page at `app/(main)/linkedin/page.jsx`. 3. Add `/linkedin` to the protected routes in `middleware.js`. 4. Add a link in the header's Growth Tools dropdown. 5. Optionally add a `LinkedInAnalysis` model to `schema.prisma` if results need persistence. The architecture makes additions clean — each feature is isolated in its own action file."

**Q23: What are the limitations of this architecture?**  
> "A few honest ones: (1) Server Actions don't support streaming — long AI responses block until complete. For better UX I'd use the Vercel AI SDK's `useChat` hook with streaming. (2) The single `Resume` per user (enforced by `@unique`) limits users to one resume version — real users want multiple. (3) Inngest requires a deployed webhook URL to receive cron triggers — local testing needs the Inngest CLI. (4) JWT strategy means there's no server-side way to immediately invalidate a session — you have to wait for the JWT to expire."

**Q24: How would you scale this to 100,000 users?**  
> "Current bottlenecks: (1) Groq API rate limits — add a queue with Bull/BullMQ so AI requests are processed with backpressure. (2) DB connection pooling — Neon already supports pgBouncer connection pooling, but I'd verify connection limits. (3) IndustryInsight generation — shared caching means this already scales well regardless of user count. (4) Resume and cover letter storage — move content to S3/Blob storage instead of DB `Text` fields. (5) Add Redis caching for frequently-read `IndustryInsight` data."

---

### 🔍 Debugging Reality Check

**Q25: What bugs did you face and fix?**  
> "Three real ones worth mentioning:
> 1. **AI in transaction timeout:** Gemini/AI call inside `db.$transaction()` caused 5s timeout — fixed by moving AI call before the transaction
> 2. **`updateResult?.success` never truthy:** `updateUser()` was returning the raw Prisma User object (which has no `.success` field), so the form never redirected. Fixed by returning `{ success: true }`  
> 3. **'Rendered more hooks' error:** `SessionProvider` was wrapping `<html>` and `<body>` directly in a Server Component layout — React lost hook count tracking on navigation. Fixed by creating a dedicated `Providers` client component boundary"

---

## 5. Quick-Fire Questions (30-second answers)

| Question | Answer |
|---|---|
| What is `cuid()`? | Collision-resistant unique ID — URL-safe, sortable, better than UUID for DB PKs |
| What is `@db.Text` in Prisma? | Maps to PostgreSQL `TEXT` (unlimited length) instead of default `VARCHAR(191)` |
| What does `revalidatePath("/")` do? | Clears Next.js's cache for that route, forcing fresh server render |
| What is `suppressHydrationWarning`? | Prevents React warning when server/client HTML differs (common with theme providers) |
| What are Zod transforms? | Zod schema method that converts data during validation — used to convert skills string → array |
| Why `bcryptjs` not `bcrypt`? | `bcrypt` requires native bindings (C++ compilation issues on some systems). `bcryptjs` is pure JS — works everywhere |
| What is `@unique([provider, providerAccountId])`? | Composite unique constraint — prevents same OAuth account being linked twice |
| What does `onDelete: Cascade` do? | When a User is deleted, all their Accounts/Sessions are automatically deleted too |
| What is the `matcher` in middleware? | Regex that determines which routes the middleware runs on — excludes static files for performance |
| Why `temperature: 0.7` in AI calls? | Controls randomness — 0 = deterministic, 1 = creative. 0.7 balances structured JSON output with natural language variation |
