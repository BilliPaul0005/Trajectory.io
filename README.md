<div align="center">

# 🚀 Trajectory.io

### *Your AI-Powered Career Acceleration Platform*

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

> **Land your dream job faster.** Trajectory.io uses cutting-edge AI to craft your resume, generate cover letters, prepare you for interviews, and surface real-time industry insights — all in one place.

<br/>

[**🌐 Live Demo**](https://trajectoryio.vercel.app) &nbsp;·&nbsp;
[**🐛 Report a Bug**](https://github.com/BilliPaul0005/Trajectory.io/issues) &nbsp;·&nbsp;
[**✨ Request Feature**](https://github.com/BilliPaul0005/Trajectory.io/issues)

</div>

---

## 📸 Screenshots

<div align="center">

| Landing Page | Onboarding | Dashboard |
|:---:|:---:|:---:|
| ![Landing](https://placehold.co/280x160/0a0a0a/38bdf8?text=Landing+Page&font=montserrat) | ![Onboard](https://placehold.co/280x160/0a0a0a/38bdf8?text=Onboarding&font=montserrat) | ![Dashboard](https://placehold.co/280x160/0a0a0a/38bdf8?text=Dashboard&font=montserrat) |

| Resume Builder | Interview Prep | Cover Letter |
|:---:|:---:|:---:|
| ![Resume](https://placehold.co/280x160/0a0a0a/38bdf8?text=Resume+Builder&font=montserrat) | ![Interview](https://placehold.co/280x160/0a0a0a/38bdf8?text=Interview+Prep&font=montserrat) | ![Cover](https://placehold.co/280x160/0a0a0a/38bdf8?text=Cover+Letter&font=montserrat) |

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 AI Resume Builder
Build a professional, ATS-optimized resume with AI assistance. Get real-time improvement suggestions tailored to your industry and role.

</td>
<td width="50%">

### 📝 AI Cover Letter Generator
Generate compelling, personalized cover letters for any job in seconds. The AI adapts tone and content to the specific company and role.

</td>
</tr>
<tr>
<td width="50%">

### 🎯 Mock Interview Prep
Practice with AI-generated industry-specific quiz questions. Get instant feedback, explanations, and personalized improvement tips after every session.

</td>
<td width="50%">

### 📊 Industry Insights Dashboard
Access real-time salary data, market trends, in-demand skills, and growth rates for your industry — updated weekly via automated AI jobs.

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Secure Authentication
Sign in with Google OAuth or email/password. All sessions are JWT-based, encrypted, and managed by NextAuth.js v5 — no vendor lock-in.

</td>
<td width="50%">

### 🔄 Automated Weekly Refresh
Inngest-powered background jobs refresh industry insights every Sunday, ensuring you always have the most current career market data.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router + Turbopack) | Full-stack React framework |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) + PrismaAdapter | Google OAuth & Email/Password |
| **Database** | [PostgreSQL](https://neon.tech/) via Neon | Serverless cloud database |
| **ORM** | [Prisma](https://prisma.io/) | Type-safe database client |
| **AI / LLM** | [Groq](https://groq.com/) (LLaMA 3.3 70B) | Ultra-fast AI generation |
| **Background Jobs** | [Inngest](https://www.inngest.com/) | Cron scheduling & webhooks |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://radix-ui.com/) | Accessible component library |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Validated form management |
| **PDF Export** | [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) | Resume export to PDF |
| **Charts** | [Recharts](https://recharts.org/) | Salary & analytics visualization |
| **Markdown** | [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor) | Rich text editing |

</div>

---

## 🏗️ Architecture

```
trajectory.io/
├── 📁 app/
│   ├── (auth)/          # Sign-in & Sign-up pages
│   ├── (main)/          # Protected app pages
│   │   ├── dashboard/   # Industry insights
│   │   ├── resume/      # Resume builder
│   │   ├── interview/   # Quiz & prep
│   │   ├── ai-cover-letter/ # Cover letter gen
│   │   └── onboarding/  # User profile setup
│   └── api/
│       └── auth/        # NextAuth.js route handlers
├── 📁 actions/          # Next.js Server Actions
│   ├── user.js          # Profile management
│   ├── dashboard.js     # AI insights generation
│   ├── resume.js        # Resume CRUD + AI improve
│   ├── interview.js     # Quiz generation & scoring
│   └── cover-letter.js  # Cover letter generation
├── 📁 lib/
│   ├── ai.js            # Centralized Groq AI client
│   ├── auth-utils.js    # getAuthUser() helper
│   ├── prisma.js        # Prisma DB client
│   └── inngest/         # Background job definitions
├── 📁 components/       # Reusable React components
├── 📁 prisma/
│   └── schema.prisma    # Database schema
├── auth.js              # NextAuth.js configuration
└── middleware.js        # Route protection
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `18+`
- A [Neon](https://neon.tech) account (free PostgreSQL)
- A [Google Cloud](https://console.cloud.google.com) project (for OAuth)
- A [Groq](https://console.groq.com) account (free AI API)

### 1. Clone the repository

```bash
git clone https://github.com/BilliPaul0005/Trajectory.io.git
cd Trajectory.io
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# ─── DATABASE ──────────────────────────────────────────────────────────────
# Get from: https://neon.tech → New Project → Connection String
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ─── NEXTAUTH ──────────────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=your_32_byte_random_hex_string

# ─── GOOGLE OAUTH ──────────────────────────────────────────────────────────
# Get from: https://console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ─── GROQ AI ───────────────────────────────────────────────────────────────
# Get free key from: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key
```

### 4. Push database schema

```bash
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** 🎉

---

## 🔑 Getting Your API Keys

<details>
<summary><b>🟦 Google OAuth (Sign In with Google)</b></summary>

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Set **Authorized redirect URIs** to:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy **Client ID** and **Client Secret**

</details>

<details>
<summary><b>🟩 Groq AI API Key (Free — 14,400 req/day)</b></summary>

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google or GitHub (free, no credit card)
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy the key starting with `gsk_`

</details>

<details>
<summary><b>🟧 Neon PostgreSQL Database</b></summary>

1. Go to [neon.tech](https://neon.tech) and sign up (free tier available)
2. Create a new project
3. Go to **Connection Details**
4. Copy the **Connection String** (pooled)
5. Append `&channel_binding=require` to the end

</details>

---

## 📱 Key Pages

| Route | Description | Auth Required |
|---|---|---|
| `/` | Landing page with features overview | ❌ |
| `/sign-in` | Email/password & Google OAuth login | ❌ |
| `/sign-up` | New account registration | ❌ |
| `/onboarding` | Industry & skills profile setup | ✅ |
| `/dashboard` | AI industry insights & salary data | ✅ |
| `/resume` | Resume builder with AI improvement | ✅ |
| `/interview` | Mock interview quiz & history | ✅ |
| `/ai-cover-letter` | Cover letter generator & manager | ✅ |

---

## 🗄️ Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  image         String?
  password      String?           // Hashed with bcryptjs
  industry      String?           // e.g., "technology-software-development"
  experience    Int?
  bio           String?
  skills        String[]
  industryInsight IndustryInsight? @relation(fields: [industry], references: [industry])
  // ... NextAuth models: Account, Session, VerificationToken
}
```

---

## 🔒 Authentication Flow

```
User visits protected route
        ↓
middleware.js checks JWT session
        ↓
No session? → Redirect to /sign-in
        ↓
Signs in (Google OAuth or Email/Password)
        ↓
NextAuth creates/finds User in DB via PrismaAdapter
        ↓
JWT issued with user.id → stored in HTTP-only cookie
        ↓
Session available in all Server Components & Actions
        ↓
Not onboarded? → Redirect to /onboarding
        ↓
Full app access ✅
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a **Pull Request**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ using Next.js, Prisma, Groq AI, and NextAuth.js**

⭐ **Star this repo if it helped you!** ⭐

[![GitHub stars](https://img.shields.io/github/stars/BilliPaul0005/Trajectory.io?style=social)](https://github.com/BilliPaul0005/Trajectory.io)
[![GitHub forks](https://img.shields.io/github/forks/BilliPaul0005/Trajectory.io?style=social)](https://github.com/BilliPaul0005/Trajectory.io/fork)

</div>
