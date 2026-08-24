import { supabase } from '../supabase';

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createEvent(event: { title: string; description?: string; start_time: string; end_time: string; type: string; created_by: string }) {
  const { data, error } = await supabase.from('calendar_events').insert(event).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}
