-- ============================================
-- NALAR FOUNDER WORKSPACE - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kreatif',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'kreatif')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. PROJECTS
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  budget NUMERIC(15,2),
  spent NUMERIC(15,2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. PROJECT MEMBERS
-- ============================================
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

-- ============================================
-- 4. TASKS
-- ============================================
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

-- ============================================
-- 5. SUBTASKS
-- ============================================
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. COMMENTS
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. MILESTONES
-- ============================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. INVOICES
-- ============================================
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

-- ============================================
-- 9. INVOICE ITEMS
-- ============================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  total NUMERIC(15,2) NOT NULL
);

-- ============================================
-- 10. TRANSACTIONS
-- ============================================
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

-- ============================================
-- 11. MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  channel TEXT NOT NULL DEFAULT 'umum',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 12. CALENDAR EVENTS
-- ============================================
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

-- ============================================
-- 13. EVENT ATTENDEES
-- ============================================
CREATE TABLE event_attendees (
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone reads, COO manages
CREATE POLICY "Profiles: all read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: COO manage" ON profiles FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'coo'
);

-- Projects: all read, COO manage
CREATE POLICY "Projects: all read" ON projects FOR SELECT USING (true);
CREATE POLICY "Projects: COO manage" ON projects FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'coo'
);

-- Tasks: all read, auth write
CREATE POLICY "Tasks: all read" ON tasks FOR SELECT USING (true);
CREATE POLICY "Tasks: auth insert" ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Tasks: auth update" ON tasks FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Messages: all read, auth insert
CREATE POLICY "Messages: all read" ON messages FOR SELECT USING (true);
CREATE POLICY "Messages: auth insert" ON messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Calendar: all read, auth insert
CREATE POLICY "Calendar: all read" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Calendar: auth insert" ON calendar_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Invoices: all read, auth insert
CREATE POLICY "Invoices: all read" ON invoices FOR SELECT USING (true);
CREATE POLICY "Invoices: auth insert" ON invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Transactions: all read, auth insert
CREATE POLICY "Transactions: all read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Transactions: auth insert" ON transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- ============================================
-- INITIAL DATA (COO admin account)
-- ============================================
-- Run this after creating your first user via Supabase Auth
-- UPDATE profiles SET role = 'coo' WHERE email = 'your-email@domain.com';
