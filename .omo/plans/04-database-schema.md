# Database Schema - Nalar Founder Workspace

**Version**: 2.0 | **Date**: August 2026

## Overview
PostgreSQL via Supabase dengan Row Level Security (RLS). Self-registration disabled — COO creates users via Admin Panel.

## Tables

### 1. profiles (extends auth.users)
```
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT NOT NULL
full_name TEXT NOT NULL
role TEXT NOT NULL DEFAULT 'kreatif'
avatar_url TEXT
is_active BOOLEAN DEFAULT true
needs_password_change BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```
- `role`: 'ceo' | 'cto' | 'cpo' | 'cmo' | 'cfo' | 'coo' | 'kreatif'
- `needs_password_change`: true when COO creates user; user sets password on first login

### 2. tasks
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title TEXT NOT NULL
description TEXT
status TEXT NOT NULL DEFAULT 'todo'
priority TEXT NOT NULL DEFAULT 'medium'
assignee_id UUID REFERENCES profiles(id)
created_by UUID REFERENCES profiles(id)
project_id UUID REFERENCES projects(id)
due_date DATE
tags TEXT[]
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```
- `status`: 'todo' | 'in_progress' | 'review' | 'done'
- `priority`: 'low' | 'medium' | 'high' | 'urgent'

### 3. subtasks
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
task_id UUID REFERENCES tasks(id) ON DELETE CASCADE
title TEXT NOT NULL
completed BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
```

### 4. comments
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
task_id UUID REFERENCES tasks(id) ON DELETE CASCADE
content TEXT NOT NULL
author_id UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
```

### 5. projects
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name TEXT NOT NULL
description TEXT
status TEXT NOT NULL DEFAULT 'planning'
progress INTEGER DEFAULT 0
budget NUMERIC(15,2) DEFAULT 0
spent NUMERIC(15,2) DEFAULT 0
start_date DATE
end_date DATE
created_by UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```
- `status`: 'planning' | 'active' | 'on_hold' | 'completed'

### 6. project_members
```
project_id UUID REFERENCES projects(id) ON DELETE CASCADE
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
PRIMARY KEY (project_id, user_id)
```

### 7. milestones
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
project_id UUID REFERENCES projects(id) ON DELETE CASCADE
name TEXT NOT NULL
completed BOOLEAN DEFAULT false
due_date DATE
created_at TIMESTAMPTZ DEFAULT now()
```

### 8. invoices
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
invoice_number TEXT UNIQUE NOT NULL
client_name TEXT NOT NULL
client_email TEXT
client_address TEXT
subtotal NUMERIC(15,2) NOT NULL
tax NUMERIC(15,2) DEFAULT 0
total NUMERIC(15,2) NOT NULL
status TEXT NOT NULL DEFAULT 'draft'
issue_date DATE NOT NULL
due_date DATE NOT NULL
paid_date DATE
notes TEXT
created_by UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
```
- `status`: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
- Export: HTML + Markdown available for client/archival

### 9. invoice_items
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE
description TEXT NOT NULL
quantity INTEGER NOT NULL DEFAULT 1
unit_price NUMERIC(15,2) NOT NULL
total NUMERIC(15,2) NOT NULL
```

### 10. transactions
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
type TEXT NOT NULL
amount NUMERIC(15,2) NOT NULL
category TEXT NOT NULL
description TEXT
transaction_date DATE NOT NULL
status TEXT NOT NULL DEFAULT 'pending'
created_by UUID REFERENCES profiles(id)
approved_by UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
```
- `type`: 'income' | 'expense'
- `status`: 'pending' | 'approved' | 'rejected'

### 11. calendar_events
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title TEXT NOT NULL
description TEXT
start_time TIMESTAMPTZ NOT NULL
end_time TIMESTAMPTZ NOT NULL
type TEXT NOT NULL DEFAULT 'meeting'
created_by UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
```

### 12. event_attendees
```
event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
PRIMARY KEY (event_id, user_id)
```

### 13. user_invitations (unused, for future email invite flow)
```
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
email TEXT NOT NULL
role TEXT NOT NULL DEFAULT 'kreatif'
invited_by UUID REFERENCES profiles(id)
expires_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

## RLS Policies
- **profiles**: users read all, COO manages all, users update own (name/avatar)
- **tasks**: users read all, assignee can update status, COO manages all
- **projects**: users read all, COO manages all
- **invoices**: creator + COO read, creator can update status, COO manages all
- **transactions**: creator + COO read, creator can update own, COO manages all
- **messages**: authenticated users read/write (chat removed in v2)
- **calendar_events**: authenticated users read/write

## Auth Flow (v2)
1. COO creates user via Admin Panel → Supabase auth + profile created
2. COO shares temp password with user directly
3. User logs in → redirected to `/set-password` (needs_password_change = true)
4. User sets new password → needs_password_change set to false
5. User can now access all modules normally

## Env Variables Required
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Anonymous/public key
- `VITE_SUPABASE_SERVICE_ROLE_KEY` — Service role key (for admin user creation only)
