# ArtMarket — Curated Digital Art Marketplace

A modern, full-stack art marketplace web application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **Supabase PostgreSQL**, **NextAuth.js**, and **Groq AI Vision**.

---

## 🎨 Overview

**ArtMarket** provides a platform for artists to showcase and sell their original artwork, and for buyers to discover, collect, and purchase pieces with a seamless checkout flow. Artists can leverage AI-assisted artwork metadata tagging (powered by Groq Vision models) to automatically analyze their uploaded artwork images, extracting descriptive titles, mediums, styles, and tags.

---

## ⚡ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components, Server Actions / Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Tailored Warm/Editorial Aesthetic)
- **Database & Storage**:
  - PostgreSQL hosted on [Supabase](https://supabase.com/)
  - Supabase Storage (for artwork image uploads)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: NextAuth.js (Credentials Provider with `bcryptjs` password hashing)
- **AI Integration**: Groq API (`qwen/qwen3.8-27b` / vision models for artwork analysis)

---

## 🚀 Key Features

### 1. Role-Based Access Control
- **Artist**:
  - Upload artwork images to Supabase Storage with instant preview.
  - One-click AI metadata generation (title, description, medium, style, tags, suggested pricing).
  - Manage, update, or remove portfolio artworks.
- **Buyer**:
  - Browse curated artwork catalogue with filtering and search.
  - View high-resolution artwork detail pages.
  - Cart and Wishlist management.
  - Checkout flow with order confirmation.
  - View order history and purchased pieces.
- **Admin**:
  - Platform overview dashboard.
  - User management (view and manage registered artists, buyers, and administrators).
  - Transaction and order auditing.

### 2. AI-Powered Artwork Intake
- Upload an artwork image and trigger AI vision inference via Groq.
- Automatically suggests medium (oil, acrylic, watercolor, digital, etc.), artistic style, descriptive text, relevant search tags, and price points.
- The artist retains full control to review and edit all fields before publishing.

---

## 📁 Project Structure

```
artmarket/
├── docs/                      # Project locked specifications and design constraints
│   ├── PROJECT_RESTRICTIONS.md
│   └── PROJECT_VARIABLES.md
├── prisma/
│   ├── schema.prisma          # Database schema (User, Artwork, Order, CartItem, WishlistItem)
│   └── seed.ts                # Database seed script (creates initial admin)
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router pages and API routes
│   │   ├── (auth)/            # Login & registration pages
│   │   ├── api/               # API endpoints (auth, artworks, cart, wishlist, upload, etc.)
│   │   ├── artworks/          # Catalogue and single artwork detail pages
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout experience
│   │   ├── dashboard/         # Role-based dashboards (artist, buyer, admin)
│   │   └── wishlist/          # Saved artworks
│   ├── components/            # Shared UI components & layout navigation
│   ├── lib/                   # Database client, auth options, Supabase helper
│   ├── middleware.ts          # Server-side route protection & role redirection
│   └── types/                 # TypeScript typings
├── .env.example               # Environment variables template
├── .gitattributes             # Git line ending normalization
├── .gitignore                 # Ignore patterns for node_modules, .env, build outputs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js** (v18.17.0 or higher recommended)
- **npm**, **yarn**, or **pnpm**
- A **Supabase** account (for PostgreSQL database and Storage bucket `artworks`)
- A **Groq** API Key

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/parameswaran1010/Artmarket_new.git
cd Artmarket_new
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the appropriate credentials:
- `DATABASE_URL` & `DIRECT_URL`: Supabase PostgreSQL connection strings.
- `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`.
- `NEXTAUTH_URL`: `http://localhost:3000` (for local development).
- `GROQ_API_KEY`: Your Groq API key.
- `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Supabase API credentials.

### 4. Database Setup & Seeding

Push the schema to your database and generate the Prisma Client:

```bash
npx prisma db push
npx prisma generate
```

Seed the default administrator user:

```bash
npm run prisma:seed # or: npx prisma db seed
```

> **Default Seed Admin:**
> - Email: `admin@gmail.com`
> - Password: `admin123`

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the production bundle.
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Runs ESLint checks.

---

## 📄 License

This project is licensed under the MIT License.
