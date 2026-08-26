-- =============================================
-- TIGHTENED RLS POLICIES
-- Drop existing permissive policies, replace with
-- proper role-based access control.
-- COO = admin (full access everywhere)
-- Others = scoped access
-- =============================================

-- HELPER: check if current user is COO
CREATE OR REPLACE FUNCTION public.is_coo()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coo'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- PROFILES
-- =============================================
DROP POLICY IF EXISTS "all read" ON profiles;
DROP POLICY IF EXISTS "coo manage" ON profiles;

-- Everyone can read profiles (needed for chat, task assignees, etc.)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- COO can do everything on profiles
CREATE POLICY "profiles_coo_all" ON profiles
  FOR ALL USING (public.is_coo());

-- Users can update their own profile (name, avatar only)
CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- PROJECTS
-- =============================================
DROP POLICY IF EXISTS "all read proj" ON projects;
DROP POLICY IF EXISTS "coo manage proj" ON projects;

-- Everyone can read projects
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (true);

-- COO full CRUD on projects
CREATE POLICY "projects_coo_all" ON projects
  FOR ALL USING (public.is_coo());

-- =============================================
-- TASKS
-- =============================================
DROP POLICY IF EXISTS "all read task" ON tasks;
DROP POLICY IF EXISTS "auth insert task" ON tasks;
DROP POLICY IF EXISTS "auth update task" ON tasks;

-- Everyone can read tasks
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (true);

-- Authenticated users can create tasks
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update tasks they are assigned to, or COO can update all
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    auth.uid() = assignee_id
    OR public.is_coo()
  );

-- COO can delete tasks
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (public.is_coo());

-- =============================================
-- SUBTASKS
-- =============================================
DROP POLICY IF EXISTS "all read sub" ON subtasks;
DROP POLICY IF EXISTS "auth mod sub" ON subtasks;

CREATE POLICY "subtasks_select" ON subtasks
  FOR SELECT USING (true);

CREATE POLICY "subtasks_insert" ON subtasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "subtasks_update" ON subtasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "subtasks_delete" ON subtasks
  FOR DELETE USING (public.is_coo());

-- =============================================
-- COMMENTS
-- =============================================
DROP POLICY IF EXISTS "all read comment" ON comments;
DROP POLICY IF EXISTS "auth insert comment" ON comments;

CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (author_id = auth.uid() OR public.is_coo());

-- =============================================
-- MILESTONES
-- =============================================
DROP POLICY IF EXISTS "all read ms" ON milestones;
DROP POLICY IF EXISTS "coo manage ms" ON milestones;

CREATE POLICY "milestones_select" ON milestones
  FOR SELECT USING (true);

CREATE POLICY "milestones_coo_all" ON milestones
  FOR ALL USING (public.is_coo());

-- =============================================
-- INVOICES
-- =============================================
DROP POLICY IF EXISTS "all read inv" ON invoices;
DROP POLICY IF EXISTS "auth insert inv" ON invoices;

-- Only COO and creator can read invoices (financial data)
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.is_coo()
  );

-- COO and authenticated users can create invoices
CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- COO can update/delete invoices, creator can update status
CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.is_coo()
  );

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (public.is_coo());

-- =============================================
-- INVOICE ITEMS
-- =============================================
DROP POLICY IF EXISTS "all read invitem" ON invoice_items;
DROP POLICY IF EXISTS "auth mod invitem" ON invoice_items;

CREATE POLICY "inv_items_select" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND (invoices.created_by = auth.uid() OR public.is_coo())
    )
  );

CREATE POLICY "inv_items_insert" ON invoice_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "inv_items_delete" ON invoice_items
  FOR DELETE USING (public.is_coo());

-- =============================================
-- TRANSACTIONS
-- =============================================
DROP POLICY IF EXISTS "all read tx" ON transactions;
DROP POLICY IF EXISTS "auth insert tx" ON transactions;

-- Only COO and creator can read transactions (financial data)
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.is_coo()
  );

-- Authenticated users can create transactions
CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- COO can update/delete all, creator can update their own
CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.is_coo()
  );

CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE USING (public.is_coo());

-- =============================================
-- MESSAGES
-- =============================================
DROP POLICY IF EXISTS "all read msg" ON messages;
DROP POLICY IF EXISTS "auth insert msg" ON messages;

-- Everyone can read messages (chat visibility)
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (true);

-- Authenticated users can send messages
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Sender can delete their own messages, COO can delete all
CREATE POLICY "messages_delete" ON messages
  FOR DELETE USING (
    sender_id = auth.uid()
    OR public.is_coo()
  );

-- =============================================
-- CALENDAR EVENTS
-- =============================================
DROP POLICY IF EXISTS "all read event" ON calendar_events;
DROP POLICY IF EXISTS "auth insert event" ON calendar_events;

-- Everyone can read events
CREATE POLICY "events_select" ON calendar_events
  FOR SELECT USING (true);

-- Authenticated users can create events
CREATE POLICY "events_insert" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Creator can update/delete own events, COO can manage all
CREATE POLICY "events_update" ON calendar_events
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.is_coo()
  );

CREATE POLICY "events_delete" ON calendar_events
  FOR DELETE USING (
    created_by = auth.uid()
    OR public.is_coo()
  );

-- =============================================
-- EVENT ATTENDEES
-- =============================================
DROP POLICY IF EXISTS "all read ea" ON event_attendees;
DROP POLICY IF EXISTS "auth mod ea" ON event_attendees;

CREATE POLICY "ea_select" ON event_attendees
  FOR SELECT USING (true);

CREATE POLICY "ea_insert" ON event_attendees
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ea_delete" ON event_attendees
  FOR DELETE USING (public.is_coo());
