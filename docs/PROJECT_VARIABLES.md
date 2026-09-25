# ArtMarket — Locked Project Variables

These values must stay consistent across every step. Do not let any prompt change 
or reinterpret them — copy these exact values when a prompt refers to "the theme 
colors" or "the models."

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Next.js API routes (same project, no separate backend)
- Database: PostgreSQL via Supabase
- ORM: Prisma
- Auth: NextAuth.js (credentials provider, bcrypt password hashing)
- AI: Groq — qwen/qwen3.8-27b (vision)

## Project Name
- artmarket

## Theme Colors (light theme — do not deviate)
```
background:      #FAFAF8
surface:         #FFFFFF
border:          #E5E2DC
text-primary:    #1A1A1A
text-secondary:  #6B6B6B
accent:          #B5482C
accent-hover:    #963C24
success:         #4A7C59
error:           #B3372C
```

## User Roles
- artist
- buyer
- admin

## Database Models (locked field names — every prompt must match these exactly)
- User: id, name, email, password, role, createdAt
- Artwork: id, artistId, title, description, medium, style, tags, price, imageUrl, status, createdAt
- Order: id, buyerId, artworkId, price, status, createdAt
- CartItem: id, buyerId, artworkId
- WishlistItem: id, buyerId, artworkId

## Core Routes (locked — don't let a prompt invent different paths)
```
/                              → Landing page
/login                         → Login
/register                      → Register
/artworks                      → Browse all artworks
/artworks/[id]                 → Artwork details
/cart                          → Cart
/wishlist                      → Wishlist
/checkout                      → Dummy checkout
/dashboard/artist              → Artist dashboard
/dashboard/artist/upload       → Upload + AI auto-fill
/dashboard/buyer               → Buyer dashboard
/dashboard/buyer/orders        → Purchase history
/dashboard/admin               → Admin dashboard
/dashboard/admin/users         → Manage users
/dashboard/admin/transactions  → View transactions
```
