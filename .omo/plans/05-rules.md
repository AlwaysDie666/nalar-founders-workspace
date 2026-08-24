# Rules & Conventions - Nalar Founder Workspace

**Version**: 1.0 | **Date**: August 2026

## TypeScript Rules
- `verbatimModuleSyntax` enabled: all type-only imports must use `import type`
- `noUnusedLocals` enabled: no unused variables
- `noUnusedParameters` enabled: no unused parameters
- Strict mode: no `any`, no `@ts-ignore`
- Use interfaces for objects, type for unions/enums

## Code Style
- Functional components only (no class components)
- Hooks for state and side effects
- Single responsibility per component
- File naming: PascalCase for components, camelCase for utils
- Folder structure: feature-based organization

## Supabase Rules
- All queries through Supabase client
- RLS policies for every table
- Auth check on every protected route
- Use `supabase.auth.getUser()` for server-side checks
- Store user role in `profiles` table, not metadata

## Indonesian Language
- All UI text in Bahasa Indonesia
- Navigation labels: Tugas, Proyek, Faktur, Keuangan, Laporan, Kalender, Pesan
- Status labels: Belum Dikerjakan, Sedang Dikerjakan, Dalam Review, Selesai
- Date format: DD/MM/YYYY
- Currency: IDR (Rp)

## Git Rules
- Branch naming: feature/name, fix/name, chore/name
- Commit messages: verb + description in English
- No commits to main without review
- Squash merge for feature branches

## Security Rules
- Never expose API keys in frontend
- Use environment variables for Supabase config
- Validate all inputs on client and server
- RLS policies must be tested
- No sensitive data in localStorage

## Performance Rules
- Lazy load pages with React.lazy
- Use React.memo for expensive components
- Debounce search/filter inputs
- Pagination for large lists (max 50 per page)
- Image optimization with lazy loading

## Component Rules
- One component per file
- Props interface defined above component
- Export default at bottom
- No inline styles, use Tailwind classes
- Max 200 lines per component
