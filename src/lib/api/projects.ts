import { supabase } from '../supabase';

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProject(project: { name: string; description?: string; status: string; start_date: string; end_date?: string; budget?: number; created_by: string }) {
  const { data, error } = await supabase.from('projects').insert(project).select().single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
