import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchInvoices, createInvoice, updateInvoiceStatus } from '../../lib/api/invoices';
import { Plus, Search, CheckCircle, Eye, Download, X, Trash2, FileText } from 'lucide-react';

const fmt = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const sc: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address: string;
  items: { id: string; description: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function InvoicePage() {
  const { currentUser } = useApp();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [fs, setFs] = useState('all');
  const [sq, setSq] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sel, setSel] = useState<InvoiceRow | null>(null);
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientAddress: '', notes: '' });

  const loadData = async () => {
    try {
      const data = await fetchInvoices();
      setInvoices(data || []);
    } catch {
      // empty
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = invoices.filter((inv) => {
    const ms = fs === 'all' || inv.status === fs;
    const mss = inv.client_name.toLowerCase().includes(sq.toLowerCase()) || inv.invoice_number.toLowerCase().includes(sq.toLowerCase());
    return ms && mss;
  });

  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0);

  const markPaid = async (id: string) => {
    try {
      await updateInvoiceStatus(id, 'paid', new Date().toISOString().split('T')[0]);
      setSel(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);

  const updateItem = (idx: number, field: string, value: string | number) => {
    const u = [...items];
    u[idx] = { ...u[idx], [field]: value };
    if (field === 'quantity' || field === 'unit_price') u[idx].total = u[idx].quantity * u[idx].unit_price;
    setItems(u);
  };

  const removeItem = (idx: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const invoiceNum = `INV-${Date.now().toString(36).toUpperCase()}`;
    try {
      await createInvoice({
        invoice_number: invoiceNum,
        client_name: form.clientName,
        client_email: form.clientEmail,
        client_address: form.clientAddress,
        subtotal,
        tax,
        total,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: form.notes || undefined,
        created_by: currentUser.id,
      }, items.filter((it) => it.description));
      setShowCreate(false);
      setForm({ clientName: '', clientEmail: '', clientAddress: '', notes: '' });
      setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500">Kelola dan lacak invoice Anda</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={18} /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} /> Invoice Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalOverdue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Draft</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{invoices.filter((i) => i.status === 'draft').length}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari invoice..." value={sq} onChange={(e) => setSq(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
            <button key={s} onClick={() => setFs(s)} className={`px-3 py-2 rounded-lg text-sm capitalize ${fs === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s === 'all' ? 'Semua' : s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    <span className="font-medium text-gray-800">{inv.invoice_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{inv.client_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc[inv.status] || 'bg-gray-100 text-gray-700'}`}>{inv.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.due_date).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-800">{fmt(inv.total)}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setSel(inv)} className="p-1 hover:bg-gray-100 rounded"><Eye size={16} className="text-gray-500" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada invoice</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{sel.invoice_number}</h2>
              <button onClick={() => setSel(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Client</h3>
                <p className="font-medium">{sel.client_name}</p>
                <p className="text-sm text-gray-500">{sel.client_email}</p>
                <p className="text-sm text-gray-500">{sel.client_address}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc[sel.status] || 'bg-gray-100 text-gray-700'}`}>{sel.status}</span>
                <p className="text-sm text-gray-500 mt-2">Issue: {new Date(sel.issue_date).toLocaleDateString('id-ID')}</p>
                <p className="text-sm text-gray-500">Due: {new Date(sel.due_date).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
            <table className="w-full mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(sel.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right">{fmt(item.unit_price)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{fmt(sel.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (11%)</span><span>{fmt(sel.tax)}</span></div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total</span><span>{fmt(sel.total)}</span></div>
              </div>
            </div>
            {sel.status !== 'paid' && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button onClick={() => markPaid(sel.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <CheckCircle size={18} /> Tandai Lunas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Buat Invoice Baru</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Client</label>
                  <input required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Client</label>
                  <input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Client</label>
                <input value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items</label>
                  <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <input type="number" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))} className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <span className="w-32 text-right text-sm font-medium">{fmt(item.total)}</span>
                      {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={14} className="text-red-500" /></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (11%)</span><span>{fmt(tax)}</span></div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total</span><span>{fmt(total)}</span></div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Buat Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
