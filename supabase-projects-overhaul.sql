-- ============================================
-- PROJECTS OVERHAUL: Categories, Tasks, Logs, Status
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Add category to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- 2. Add project_id to tasks (link task to project)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- 3. Add parent_task_id for subtasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- 4. Add approval fields to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'none'; -- none, pending, approved, rejected

-- 5. Create project_logs table
CREATE TABLE IF NOT EXISTS project_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable RLS on project_logs
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for project_logs
CREATE POLICY "project_logs_select" ON project_logs
  FOR SELECT USING (true);

CREATE POLICY "project_logs_insert" ON project_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "project_logs_update" ON project_logs
  FOR UPDATE USING (true);

CREATE POLICY "project_logs_delete" ON project_logs
  FOR DELETE USING (true);

-- 8. Grant permissions
GRANT SELECT ON project_logs TO anon;
GRANT ALL ON project_logs TO authenticated;
GRANT ALL ON project_logs TO service_role;

-- 9. Project categories reference
-- Options: general, production, sales, promotion, purchase, marketing, creative, development, operations
