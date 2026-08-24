import { supabase } from '../supabase';

export async function fetchMessages(channel: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, email, role)')
    .eq('channel', channel)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendMessage(content: string, senderId: string, channel: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ content, sender_id: senderId, channel })
    .select('*, sender:profiles!messages_sender_id_fkey(full_name, email, role)')
    .single();
  if (error) throw error;
  return data;
}
