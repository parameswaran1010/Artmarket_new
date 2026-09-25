# ArtMarket — Project Restrictions

Rules that apply to every prompt below. If a generated result violates one of 
these, ask for a fix before moving to the next step.

## Do NOT
- Do not create a separate backend folder or separate server — API routes live 
  inside this same Next.js project under src/app/api/
- Do not use dark mode or a theme toggle — light theme only, using the exact 
  colors in PROJECT_VARIABLES.md
- Do not use gradient backgrounds, especially purple/blue gradients
- Do not use emojis in headings, buttons, or UI copy
- Do not add a UI component library (no shadcn, no MUI, no Chakra) — build the 
  handful of components we need ourselves (Button, Input, Card, etc.)
- Do not add animation libraries (no Framer Motion) unless explicitly asked
- Do not integrate a real payment gateway — checkout is a dummy form only
- Do not over-comment obvious code (e.g. no "// this is a button" style comments)
- Do not build generic/overengineered abstractions (e.g. a generic reusable data-
  fetching hook with retries/caching) for what should be a simple, direct fetch call
- Do not make every card/section perfectly symmetric — some intentional layout 
  variation is fine and expected
- Do not add features not listed in PROJECT_VARIABLES.md or the prompts file 
  without asking first

## Must
- Every dashboard (artist, buyer, admin) must use the same background/surface/
  border/text tokens — no visual inconsistency between roles
- Every protected route must check role server-side (in middleware or the API 
  route itself), never rely on hiding a UI element alone
- AI-generated artwork details must remain editable by the artist before 
  publishing — never auto-publish AI output directly
- Passwords must be hashed (bcrypt) — never stored in plain text
- Keep component and file naming simple and consistent with what earlier steps 
  already established — don't rename established files/models mid-project

## Scope boundary
- This is a college/personal project, not a production SaaS — prioritize 
  simplicity and readability over scalability, caching, or advanced optimization 
  unless asked
