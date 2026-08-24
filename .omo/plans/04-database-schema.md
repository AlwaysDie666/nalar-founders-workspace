# Database Schema - Nalar Founder Workspace

**Version**: 1.0 | **Date**: August 2026

## Overview
PostgreSQL via Supabase dengan Row Level Security (RLS).

## Tables

### 1. profiles (extends auth.users)
```
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT UNIQUE NOT NULL
full_name TEXT NOT NULL
role TEXT NOT NULL DEFAULT 'kreatif'
avatar_url TEXT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### 2. tasks
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
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

### 3. subtasks
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id UUID REFERENCES tasks(id) ON DELETE CASCADE
title TEXT NOT NULL
completed BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
```

### 4. comments
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id UUID REFERENCES tasks(id) ON DELETE CASCADE
content TEXT NOT NULL
author_id UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
```

### 5. projects
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
name TEXT NOT NULL
description TEXT
status TEXT NOT NULL DEFAULT 'planning'
progress INTEGER DEFAULT 0
start_date DATE NOT NULL
end_date DATE
budget NUMERIC(15,2)
spent NUMERIC(15,2) DEFAULT 0
created_by UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### 6. project_members
```
project_id UUID REFERENCES projects(id) ON DELETE CASCADE
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
PRIMARY KEY (project_id, user_id)
```

### 7. milestones
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id UUID REFERENCES projects(id) ON DELETE CASCADE
name TEXT NOT NULL
completed BOOLEAN DEFAULT false
due_date DATE
created_at TIMESTAMPTZ DEFAULT now()
```

### 8. invoices
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
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

### 9. invoice_items
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE
description TEXT NOT NULL
quantity INTEGER NOT NULL DEFAULT 1
unit_price NUMERIC(15,2) NOT NULL
total NUMERIC(15,2) NOT NULL
```

### 10. transactions
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
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

### 11. messages
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
content TEXT NOT NULL
sender_id UUID REFERENCES profiles(id)
channel TEXT NOT NULL DEFAULT 'umum'
created_at TIMESTAMPTZ DEFAULT now()
```

### 12. calendar_events
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
title TEXT NOT NULL
description TEXT
start_time TIMESTAMPTZ NOT NULL
end_time TIMESTAMPTZ NOT NULL
type TEXT NOT NULL DEFAULT 'meeting'
created_by UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ DEFAULT now()
```

### 13. event_attendees
```
event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
PRIMARY KEY (event_id, user_id)
```

## RLS Policies
- profiles: users read all, COO manages all
- tasks: users read all, assignee/update own
- projects: members read, COO manages all
- invoices: finance roles read/write
- transactions: finance roles approve
- messages: authenticated users read/write
- calendar_events: authenticated users read/write
