# PRD - Nalar Founder Workspace

**Version**: 2.0 | **Date**: August 2026

## Overview
Web application internal untuk tim founder Nalar Group. Command center harian untuk mengelola tugas, proyek, keuangan, dan reporting. Bukan produk untuk dijual, tapi alat kerja tim.

## Users & Roles

| Role | Akses |
|------|-------|
| COO | Full Admin: manage users, approve, settings, laporan mingguan |
| CEO | Strategic: full data access, approve transaksi, laporan mingguan |
| CTO | Technical: tech tasks, infra, development |
| CPO | Product: product tasks, roadmap, feature |
| CMO | Marketing: marketing tasks, campaign |
| CFO | Finance: approve transaksi keuangan |
| Kreatif | Creative: tugas kreatif, asset, design |

## User Management Flow
1. COO undang user baru via register page
2. User daftar akun dengan email & password
3. COO assign role
4. User login dan akses workspace

## Core Modules
1. Dashboard - greeting, KPI, charts, activity
2. Tugas - kanban, list view, subtasks, comments
3. Proyek - cards, milestones, timeline, budget
4. Faktur - create, status tracking, export PDF
5. Keuangan - income/expense, approval flow
6. Laporan - charts, export, filters
7. Kalender - monthly view, events, attendees

## Email Notifications (NEW - v2.0)
1. **Laporan Mingguan** - dikirim ke CEO & COO setiap minggu, bisa diunduh (CSV)
2. **Weekly Task Reminder** - reminder ke semua user untuk update progress tugas mingguan
3. **H-1 Deadline Email** - notifikasi ke assignee untuk task dengan priority `urgent` yang deadline-nya besok

### Email Service
- Provider: **Resend** (gratis 100 email/hari)
- Domain email: `nalar.co.id`
- API routes: `/api/send-email`, `/api/weekly-task-reminder`, `/api/h1-deadline`

## Tech Stack
- Frontend: Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4
- Backend: Supabase (Auth, Database, RLS)
- Email: Resend
- Deployment: Vercel (domain: `nalar-founders-workspace.vercel.app`)
