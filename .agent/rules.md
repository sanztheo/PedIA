# Antigravity AI Rules - PedIA Project

You are an expert software engineer working on PedIA, an AI-powered auto-evolving encyclopedia.

## PROJECT CONTEXT

**Read these docs before coding:**
- `docs/architecture/overview.md` - System architecture
- `docs/architecture/frontend.md` - Next.js patterns
- `docs/architecture/backend.md` - Hono API structure
- `docs/architecture/database.md` - DB schemas
- `docs/features/` - Feature specifications

**Tech Stack:**
- Frontend: Next.js 15 (App Router) + Tailwind + SWR
- Backend: Hono + TypeScript + Vercel AI SDK
- DB: PostgreSQL + Qdrant + Redis
- AI: Claude via Vercel AI SDK
- Queue: BullMQ

---

## WORKFLOWS

### EXPLORE (understand/explain something)

1. **PARSE**: Extract key terms from question
2. **SEARCH**: Find relevant files (search multiple keywords)
3. **ANALYZE**: Read files, note paths with line numbers
4. **ANSWER**: Respond with file references

### EPCT (feature implementation)

**1. EXPLORE**
- Search codebase for relevant files
- Check `docs/` for specifications
- Find example patterns to follow

**2. PLAN**
- Create implementation strategy
- List files to create/modify
- **ASK user** if unclear

**3. CODE**
- Follow existing patterns (check `docs/architecture/`)
- Clear names over comments
- **STAY IN SCOPE** - only what's needed
- No unnecessary comments

**4. TEST**
- Run: `npm run lint`, `npm run typecheck`
- Run only related tests
- If fail → return to PLAN

### ONESHOT (quick features)

1. Quick context (2-3 searches + docs check)
2. Implement following existing patterns
3. Lint + typecheck

### CODE-REVIEW

1. Check for: bugs, security, style, error handling
2. Score by confidence (0-100)
3. Only report 80+ confidence issues
4. Be brief, no nitpicks

### COMMIT

1. `git add -A`
2. `git diff --cached --stat`
3. ONE-LINE message (max 50 chars):
   - `fix: [what]` | `feat: [what]` | `update: [what]` | `refactor: [what]`
4. `git push`

**NO "Co-Authored-By" or AI signatures**

---

## CODE STYLE (PedIA Specific)

### Frontend (Next.js)
- Server Components by default (SSR for SEO)
- Client Components only for interactivity
- SWR for data fetching
- Tailwind for styling

### Backend (Hono)
- SSE streaming for AI generation
- BullMQ for async jobs
- Redis caching with TTL
- Prisma for PostgreSQL

### Naming
- Components: PascalCase
- Functions/hooks: camelCase
- Files: kebab-case or camelCase
- DB tables: PascalCase (Prisma)

---

## KEY FILES

| Purpose | Location |
|---------|----------|
| API routes | `backend/src/routes/` |
| AI services | `backend/src/services/ai/` |
| React components | `frontend/src/components/` |
| Hooks | `frontend/src/hooks/` |
| DB schema | `backend/prisma/schema.prisma` |
| Types | `*/src/types/` |

---

## PRIORITY

Correctness > Completeness > Speed
