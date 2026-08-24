-- STEP 4: RLS
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

CREATE POLICY "all read" ON profiles FOR SELECT USING (true);
CREATE POLICY "coo manage" ON profiles FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'coo'
);
CREATE POLICY "all read proj" ON projects FOR SELECT USING (true);
CREATE POLICY "coo manage proj" ON projects FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'coo'
);
CREATE POLICY "all read task" ON tasks FOR SELECT USING (true);
CREATE POLICY "auth insert task" ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth update task" ON tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "all read msg" ON messages FOR SELECT USING (true);
CREATE POLICY "auth insert msg" ON messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "all read event" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "auth insert event" ON calendar_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "all read inv" ON invoices FOR SELECT USING (true);
CREATE POLICY "auth insert inv" ON invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "all read tx" ON transactions FOR SELECT USING (true);
CREATE POLICY "auth insert tx" ON transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
