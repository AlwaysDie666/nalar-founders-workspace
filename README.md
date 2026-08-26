# Nalar Founder Workspace

Internal workspace untuk tim Nalar Group. Dashboard, tugas, proyek, keuangan, invoice, kalender, dan admin panel — semua terintegrasi dengan Supabase.

## Tech Stack
- **Frontend**: React 19 + TypeScript 6 + Vite 8
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router 7
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/AlwaysDie666/nalar-founders-workspace.git
cd nalar-founders-workspace
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```bash
cp .env.example .env.local
```

Required variables:
- `VITE_SUPABASE_URL` — From Supabase Dashboard → Settings → API
- `VITE_SUPABASE_ANON_KEY` — From Supabase Dashboard → Settings → API
- `VITE_SUPABASE_SERVICE_ROLE_KEY` — From Supabase Dashboard → Settings → API (keep secret, used only for admin user creation)

### 3. Database Setup
Go to Supabase Dashboard → SQL Editor and run:
1. `supabase-full-schema.sql` — Creates all tables with `IF NOT EXISTS`
2. `supabase-rls-tightened.sql` — Sets up Row Level Security policies

Both use `IF NOT EXISTS` so they're safe to re-run.

### 4. Start Dev Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Auth Flow
1. COO logs in → Admin Panel (`/admin`) → creates user with name, email, role
2. COO shares the generated temp password with the user
3. User logs in with email + temp password → redirected to `/set-password`
4. User sets their own password → can now access all modules

Self-registration is disabled. Only COO can create accounts.

## Modules

| Module | Description | Access |
|--------|-------------|--------|
| Dashboard | Overview & KPIs | All |
| Tasks | Kanban + Priority view | All |
| Projects | Project tracking | All |
| Finance | Income/expense tracking | All |
| Invoices | Invoice management + HTML/MD export | All |
| Reports | Analytics + CSV/HTML/MD export | CEO, COO |
| Calendar | Events & scheduling | All |
| Admin | User management | COO only |

## Roles
`ceo` | `cto` | `cpo` | `cmo` | `cfo` | `coo` | `kreatif`

## Project Structure
```
src/
├── components/layout/    # Layout, Sidebar, Header
├── context/             # AppContext (auth state)
├── lib/                 # supabase.ts, supabase-admin.ts, api/
├── pages/
│   ├── auth/            # LoginPage, SetPasswordPage
│   ├── dashboard/       # DashboardPage
│   ├── tasks/           # TasksPage (kanban + priority)
│   ├── projects/        # ProjectsPage
│   ├── finance/         # FinancePage
│   ├── invoices/        # InvoicePage
│   ├── reports/         # ReportsPage
│   ├── calendar/        # CalendarPage
│   └── admin/           # AdminPage (COO only)
├── types/               # TypeScript types
└── utils/               # Helpers
supabase-full-schema.sql  # Full database schema
supabase-rls-tightened.sql # RLS policies
```

## Scripts
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```
