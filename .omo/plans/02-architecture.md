# Architecture Document - Nalar Founder Workspace

**Version**: 1.0 | **Date**: August 2026

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Routing | React Router 7 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Hosting | Vercel |
| State | React Context + Supabase Realtime |

## Supabase Services
- Auth: Email/password, invitation flow
- Database: PostgreSQL with Row Level Security
- Realtime: Live updates for chat, tasks
- Storage: File attachments (images, documents)

## Project Structure
```
src/
  components/
    layout/       - Layout, Sidebar, Header
    ui/           - Reusable UI components
  pages/
    auth/         - LoginPage
    dashboard/    - DashboardPage
    tasks/        - TasksPage (kanban)
    projects/     - ProjectsPage
    invoices/     - InvoicePage
    finance/      - FinancePage
    reports/      - ReportsPage
    calendar/     - CalendarPage
    chat/         - ChatPage
    admin/        - AdminPanel (COO only)
  context/        - AppContext, AuthContext
  lib/            - Supabase client, helpers
  types/          - TypeScript interfaces
  utils/          - Helpers, formatters
  hooks/          - Custom React hooks
```

## Auth Flow
1. User login via Supabase Auth
2. Supabase returns session + user metadata
3. AppContext stores user profile (role from DB)
4. ProtectedRoute checks session
5. Role-based UI rendering

## Data Flow
- All data fetched from Supabase PostgreSQL
- Realtime subscriptions for chat and tasks
- Local state for UI (modals, filters)
- Context for global state (user, theme)
