import { supabase } from '../supabase';

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTransaction(tx: { type: string; amount: number; category: string; description: string; transaction_date: string; status: string; created_by: string }) {
  const { data, error } = await supabase.from('transactions').insert(tx).select().single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
