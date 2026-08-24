# Design System - Nalar Founder Workspace

**Version**: 1.0 | **Date**: August 2026

## Design Principles
1. **Professional & Clean** - Bukan demo, ini alat kerja sungguhan
2. **Indonesian First** - Semua label, status, navigasi dalam Bahasa Indonesia
3. **Role-Aware** - UI adaptif berdasarkan role user
4. **Consistent** - Pola yang sama di semua halaman
5. **Accessible** - Kontras warna baik, font readable

## Color Palette

### Primary
- Sidebar: `#0f172a` (slate-900)
- Accent: `#3b82f6` (blue-500)
- Hover: `#2563eb` (blue-600)

### Role Colors
| Role | Border Color | Badge BG |
|------|-------------|----------|
| CEO | `#f59e0b` (amber) | `bg-amber-100 text-amber-700` |
| CTO | `#3b82f6` (blue) | `bg-blue-100 text-blue-700` |
| CPO | `#8b5cf6` (violet) | `bg-violet-100 text-violet-700` |
| CMO | `#ec4899` (pink) | `bg-pink-100 text-pink-700` |
| CFO | `#10b981` (emerald) | `bg-emerald-100 text-emerald-700` |
| COO | `#6366f1` (indigo) | `bg-indigo-100 text-indigo-700` |
| Kreatif | `#f97316` (orange) | `bg-orange-100 text-orange-700` |

### Status Colors
| Status | Color |
|--------|-------|
| Belum Dikerjakan | `gray` |
| Sedang Dikerjakan | `blue` |
| Dalam Review | `yellow` |
| Selesai | `green` |

## Typography
- Font: Inter (system fallback)
- Heading: font-weight 600-700
- Body: font-weight 400
- Small/Labels: font-weight 500

## Component Patterns

### Cards
- Rounded corners: `rounded-xl`
- Shadow: `shadow-sm`
- Border: `border border-gray-200`
- Padding: `p-6`

### Buttons
- Primary: `bg-blue-600 hover:bg-blue-700 text-white`
- Secondary: `bg-gray-100 hover:bg-gray-200 text-gray-700`
- Danger: `bg-red-600 hover:bg-red-700 text-white`

### Forms
- Input: `border border-gray-300 rounded-lg px-3 py-2`
- Focus: `ring-2 ring-blue-500`
- Label: `text-sm font-medium text-gray-700`

### Sidebar
- Dark background: `bg-slate-900`
- Width: 256px collapsed 64px
- Nav items: icon + label, hover highlight
- Logo at top, logout at bottom
