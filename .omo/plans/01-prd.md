# PRD - Nalar Founder Workspace

**Version**: 1.0 | **Date**: August 2026

## Overview
Web application internal untuk tim founder Nalar Group. Command center harian untuk mengelola tugas, proyek, keuangan, komunikasi, dan reporting. Bukan produk untuk dijual, tapi alat kerja tim.

## Users & Roles

| Role | Akses |
|------|-------|
| COO | Full Admin: manage users, approve, settings |
| CEO | Strategic: full data access, approve transaksi |
| CTO | Technical: tech tasks, infra, development |
| CPO | Product: product tasks, roadmap, feature |
| CMO | Marketing: marketing tasks, campaign |
| CFO | Finance: approve transaksi keuangan |
| Kreatif | Creative: tugas kreatif, asset, design |

## User Management Flow
1. COO undang user baru via email
2. User terima invitation dari Supabase
3. User buat akun (set password)
4. COO assign role
5. User login dan akses workspace

## Core Modules
1. Dashboard - greeting, KPI, charts, activity
2. Tugas - kanban, list view, subtasks, comments
3. Proyek - cards, milestones, timeline, budget
4. Faktur - create, status tracking, export PDF
5. Keuangan - income/expense, approval flow
6. Laporan - charts, export, filters
7. Kalender - monthly view, events, attendees
8. Pesan - channels, reactions, file sharing
