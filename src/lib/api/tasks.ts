import { supabase } from '../supabase';
import type { Database } from '../../types/database';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name, email, role)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTask(task: TaskInsert) {
  const { data, error } = await supabase.from('tasks').insert(task).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: TaskUpdate) {
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
