import { supabase } from '../supabase';

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createInvoice(invoice: {
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes?: string;
  created_by: string;
}, items: { description: string; quantity: number; unit_price: number; total: number }[]) {
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single();
  if (invErr) throw invErr;

  if (items.length > 0) {
    const rows = items.map((it) => ({ ...it, invoice_id: inv.id }));
    const { error: itemErr } = await supabase.from('invoice_items').insert(rows);
    if (itemErr) throw itemErr;
  }

  return inv;
}

export async function updateInvoiceStatus(id: string, status: string, paidDate?: string) {
  const updates: Record<string, unknown> = { status };
  if (paidDate) updates.paid_date = paidDate;
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}
