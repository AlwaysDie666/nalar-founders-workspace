-- STEP 3: TABEL LAINNYA
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  due_date DATE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  subtotal NUMERIC(15,2) NOT NULL,
  tax NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  total NUMERIC(15,2) NOT NULL
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  channel TEXT NOT NULL DEFAULT 'umum',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'meeting',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_attendees (
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);
