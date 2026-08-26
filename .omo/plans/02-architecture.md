# Architecture Document - Nalar Founder Workspace

**Version**: 2.0 | **Date**: August 2026

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Routing | React Router 7 |
| Backend | Supabase (PostgreSQL + Auth) |
| Email | Resend (100 free/day) |
| Hosting | Vercel |
| State | React Context |

## Supabase Services
- Auth: Email/password + register page
- Database: PostgreSQL with Row Level Security
- Storage: File attachments (images, documents)

## Email Architecture
- Provider: Resend (gratis 100 email/hari)
- Domain: `nalar.co.id`
- API Routes (Vercel Serverless):
  - `POST /api/send-email` - generic email sender
  - `POST /api/weekly-task-reminder` - reminder update progress mingguan
  - `POST /api/h1-deadline` - notifikasi H-1 deadline task urgent

## Project Structure
```
src/
  components/
    layout/       - Layout, Sidebar, Header
    ui/           - Reusable UI components
  pages/
    auth/         - LoginPage, RegisterPage
    dashboard/    - DashboardPage
    tasks/        - TasksPage (kanban)
    projects/     - ProjectsPage
    invoices/     - InvoicePage
    finance/      - FinancePage
    reports/      - ReportsPage (with email report)
    calendar/     - CalendarPage
    admin/        - AdminPanel (COO only)
  context/        - AppContext
  lib/
    supabase.ts   - Supabase client init
    email.ts      - Email helpers & templates
    api/          - API modules (tasks, projects, etc.)
  types/          - TypeScript interfaces
api/              - Vercel serverless functions (email)
```

## Auth Flow
1. User register via RegisterPage → Supabase Auth signUp
2. Profile auto-created in `profiles` table
3. User login → Supabase Auth signIn
4. AppContext stores user profile (role from DB)
5. ProtectedRoute checks session
6. Role-based UI rendering

## Data Flow
- All data fetched from Supabase PostgreSQL
- Local state for UI (modals, filters)
- Context for global state (user)

## Cron Jobs (External)
Untuk email otomatis mingguan, panggil API endpoints via cron:
- `POST /api/weekly-task-reminder` - setiap Senin jam 8 pagi
- `POST /api/h1-deadline` - setiap hari jam 9 pagi
