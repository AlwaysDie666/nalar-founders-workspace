import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchInvoices, createInvoice, updateInvoiceStatus } from '../../lib/api/invoices';
import { fetchProjects } from '../../lib/api/projects';
import { Plus, Search, CheckCircle, Eye, Download, X, Trash2, FileText, ArrowRight, Send } from 'lucide-react';

const fmt = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const getStatusStyle = (docType: string, status: string): string => {
  const map: Record<string, Record<string, string>> = {
    invoice: { draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700' },
    quotation: { draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' },
  };
  return map[docType]?.[status] || 'bg-gray-100 text-gray-700';
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Terkirim', paid: 'Lunas',
  overdue: 'Jatuh Tempo', accepted: 'Diterima', rejected: 'Ditolak',
};

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface StoredItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface DocRow {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address: string;
  items: StoredItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  doc_type: 'invoice' | 'quotation';
  project_name?: string;
}

interface ProjectRow {
  id: string;
  name: string;
}

const QTN_KEY = 'nalar_quotations';
const genId = () => crypto.randomUUID();

function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
}

function generateDocNumber(prefix: string, projectName: string, allDocs: { invoice_number: string }[]): string {
  const initials = computeInitials(projectName);
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const pattern = new RegExp(`^\\w{2,4}/${initials}/${yymm}/(\\d{3})$`);
  let maxNum = 0;
  for (const doc of allDocs) {
    const match = doc.invoice_number.match(pattern);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }
  return `${prefix}/${initials}/${yymm}/${String(maxNum + 1).padStart(3, '0')}`;
}

function loadQuotations(): DocRow[] {
  try {
    const raw = localStorage.getItem(QTN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQuotations(qtns: DocRow[]) {
  localStorage.setItem(QTN_KEY, JSON.stringify(qtns));
}

export default function InvoicePage() {
  const { currentUser } = useApp();
  const [invoices, setInvoices] = useState<DocRow[]>([]);
  const [quotations, setQuotations] = useState<DocRow[]>(() => loadQuotations());
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [docFilter, setDocFilter] = useState<'all' | 'invoice' | 'quotation'>('all');
  const [fs, setFs] = useState('all');
  const [sq, setSq] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sel, setSel] = useState<DocRow | null>(null);
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientAddress: '', notes: '' });
  const [selectedProject, setSelectedProject] = useState('');
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');

  const loadData = async () => {
    try {
      const [invData, projData] = await Promise.all([fetchInvoices(), fetchProjects()]);
      setInvoices((invData || []).map((inv) => ({
        id: inv.id as string,
        invoice_number: inv.invoice_number as string,
        client_name: inv.client_name as string,
        client_email: (inv.client_email as string) || '',
        client_address: (inv.client_address as string) || '',
        items: (inv.items || []) as StoredItem[],
        subtotal: inv.subtotal as number,
        tax: inv.tax as number,
        total: inv.total as number,
        status: inv.status as string,
        issue_date: inv.issue_date as string,
        due_date: inv.due_date as string,
        paid_date: (inv.paid_date as string) || null,
        notes: (inv.notes as string) || null,
        doc_type: 'invoice' as const,
      })));
      setProjects(projData || []);
    } catch { /* empty */ }
    setQuotations(loadQuotations());
  };

  useEffect(() => { loadData(); }, []);

  const allDocs: DocRow[] = [...invoices, ...quotations]
    .sort((a, b) => b.issue_date.localeCompare(a.issue_date));

  const filtered = allDocs.filter((doc) => {
    const matchDoc = docFilter === 'all' || doc.doc_type === docFilter;
    const matchStatus = fs === 'all' || doc.status === fs;
    const matchSearch = doc.client_name.toLowerCase().includes(sq.toLowerCase()) ||
      doc.invoice_number.toLowerCase().includes(sq.toLowerCase());
    return matchDoc && matchStatus && matchSearch;
  });

  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0);

  const markPaid = async (id: string) => {
    try {
      await updateInvoiceStatus(id, 'paid', new Date().toISOString().split('T')[0]);
      setSel(null);
      loadData();
    } catch (err) { console.error(err); }
  };

  const setQuotationStatus = (id: string, newStatus: string) => {
    const updated = quotations.map((q) => q.id === id ? { ...q, status: newStatus } : q);
    saveQuotations(updated);
    setQuotations(updated);
    setSel(null);
  };

  const convertToInvoice = async (qtn: DocRow) => {
    if (!currentUser) return;
    const invoiceNum = generateDocNumber('INV', qtn.project_name || qtn.client_name, allDocs);
    try {
      await createInvoice({
        invoice_number: invoiceNum,
        client_name: qtn.client_name,
        client_email: qtn.client_email,
        client_address: qtn.client_address,
        subtotal: qtn.subtotal,
        tax: qtn.tax,
        total: qtn.total,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: qtn.notes || undefined,
        created_by: currentUser.id,
      }, qtn.items.map(({ id: _id, ...rest }) => rest));
      const remaining = quotations.filter((q) => q.id !== qtn.id);
      saveQuotations(remaining);
      setQuotations(remaining);
      setSel(null);
      loadData();
    } catch (err) { console.error(err); }
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

  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name || '';

  const resetForm = () => {
    setShowCreate(false);
    setForm({ clientName: '', clientEmail: '', clientAddress: '', notes: '' });
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    setSelectedProject('');
    setDocType('invoice');
  };

  const generateDocHtml = (doc: DocRow) => {
    const title = doc.doc_type === 'quotation' ? 'QUOTATION' : 'INVOICE';
    const itemRows = (doc.items || []).map(item => `
      <tr>
        <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
        <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;">Rp ${item.unit_price.toLocaleString('id-ID')}</td>
        <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">Rp ${item.total.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title} ${doc.invoice_number}</title></head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
    <div>
      <h1 style="margin:0;color:#1e40af;font-size:28px;">${title}</h1>
      <p style="margin:5px 0 0;color:#6b7280;">${doc.invoice_number}</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;font-size:14px;color:#6b7280;">Status: <strong style="color:${doc.status === 'paid' || doc.status === 'accepted' ? '#16a34a' : doc.status === 'overdue' || doc.status === 'rejected' ? '#dc2626' : '#2563eb'}">${STATUS_LABELS[doc.status] || doc.status.toUpperCase()}</strong></p>
      <p style="margin:5px 0 0;font-size:14px;color:#6b7280;">Tanggal: ${new Date(doc.issue_date).toLocaleDateString('id-ID')}</p>
      <p style="margin:5px 0 0;font-size:14px;color:#6b7280;">Jatuh Tempo: ${new Date(doc.due_date).toLocaleDateString('id-ID')}</p>
    </div>
  </div>
  <div style="margin-bottom:30px;">
    <h3 style="margin:0 0 5px;color:#374151;font-size:14px;">KEPADA:</h3>
    <p style="margin:0;font-weight:600;">${doc.client_name}</p>
    <p style="margin:2px 0 0;color:#6b7280;font-size:14px;">${doc.client_email || ''}</p>
    <p style="margin:2px 0 0;color:#6b7280;font-size:14px;">${doc.client_address || ''}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
    <thead><tr style="background:#f3f4f6;">
      <th style="padding:10px 15px;text-align:left;font-size:13px;color:#6b7280;">Deskripsi</th>
      <th style="padding:10px 15px;text-align:center;font-size:13px;color:#6b7280;">Qty</th>
      <th style="padding:10px 15px;text-align:right;font-size:13px;color:#6b7280;">Harga</th>
      <th style="padding:10px 15px;text-align:right;font-size:13px;color:#6b7280;">Total</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;">
    <div style="width:280px;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;"><span style="color:#6b7280;">Subtotal</span><span>Rp ${doc.subtotal.toLocaleString('id-ID')}</span></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;"><span style="color:#6b7280;">Pajak (11%)</span><span>Rp ${doc.tax.toLocaleString('id-ID')}</span></div>
      <div style="display:flex;justify-content:space-between;padding:12px 0 0;font-size:18px;font-weight:700;border-top:2px solid #e5e7eb;"><span>Total</span><span>Rp ${doc.total.toLocaleString('id-ID')}</span></div>
    </div>
  </div>
  ${doc.notes ? `<div style="margin-top:30px;padding:15px;background:#f9fafb;border-radius:8px;"><p style="margin:0;font-size:14px;color:#6b7280;"><strong>Catatan:</strong> ${doc.notes}</p></div>` : ''}
  <p style="margin-top:40px;text-align:center;color:#9ca3af;font-size:12px;">Dibuat oleh Nalar Workspace</p>
</body></html>`;
  };

  const generateDocMd = (doc: DocRow) => {
    const title = doc.doc_type === 'quotation' ? 'Quotation' : 'Invoice';
    const itemRows = (doc.items || []).map(item =>
      `| ${item.description} | ${item.quantity} | Rp ${item.unit_price.toLocaleString('id-ID')} | Rp ${item.total.toLocaleString('id-ID')} |`
    ).join('\n');

    return `# ${title} ${doc.invoice_number}

**Status:** ${STATUS_LABELS[doc.status] || doc.status.toUpperCase()}
**Tanggal:** ${new Date(doc.issue_date).toLocaleDateString('id-ID')}
**Jatuh Tempo:** ${new Date(doc.due_date).toLocaleDateString('id-ID')}

## Kepada
**${doc.client_name}**
${doc.client_email || ''}
${doc.client_address || ''}

## Rincian

| Deskripsi | Qty | Harga | Total |
|-----------|-----|-------|-------|
${itemRows}

## Ringkasan

| | |
|---|---|
| Subtotal | Rp ${doc.subtotal.toLocaleString('id-ID')} |
| Pajak (11%) | Rp ${doc.tax.toLocaleString('id-ID')} |
| **Total** | **Rp ${doc.total.toLocaleString('id-ID')}** |

${doc.notes ? `**Catatan:** ${doc.notes}` : ''}

---
*Dibuat oleh Nalar Workspace*`;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHtml = (doc: DocRow) => {
    const prefix = doc.doc_type === 'quotation' ? 'quotation' : 'invoice';
    downloadFile(generateDocHtml(doc), `${prefix}-${doc.invoice_number}.html`, 'text/html');
  };

  const exportMd = (doc: DocRow) => {
    const prefix = doc.doc_type === 'quotation' ? 'quotation' : 'invoice';
    downloadFile(generateDocMd(doc), `${prefix}-${doc.invoice_number}.md`, 'text/markdown');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const filteredItems = items.filter((it) => it.description);
    const projectName = getProjectName(selectedProject);

    if (docType === 'invoice') {
      const invoiceNum = generateDocNumber('INV', projectName || form.clientName, allDocs);
      try {
        await createInvoice({
          invoice_number: invoiceNum,
          client_name: form.clientName,
          client_email: form.clientEmail,
          client_address: form.clientAddress,
          subtotal, tax, total,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          notes: form.notes || undefined,
          created_by: currentUser.id,
        }, filteredItems);
        resetForm();
        loadData();
      } catch (err) { console.error(err); }
    } else {
      const qtnNum = generateDocNumber('QTN', projectName || form.clientName, allDocs);
      const newQtn: DocRow = {
        id: genId(),
        invoice_number: qtnNum,
        client_name: form.clientName,
        client_email: form.clientEmail,
        client_address: form.clientAddress,
        items: filteredItems.map((it, idx) => ({ ...it, id: `q-${Date.now()}-${idx}` })),
        subtotal, tax, total,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        paid_date: null,
        notes: form.notes || null,
        doc_type: 'quotation',
        project_name: projectName,
      };
      const updated = [...quotations, newQtn];
      saveQuotations(updated);
      setQuotations(updated);
      resetForm();
    }
  };

  const statusOpts = docFilter === 'quotation'
    ? ['all', 'draft', 'sent', 'accepted', 'rejected']
    : ['all', 'draft', 'sent', 'paid', 'overdue'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dokumen</h1>
          <p className="text-gray-500">Kelola invoice dan quotation Anda</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={18} /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} /> Dokumen Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Pendapatan</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Belum Dibayar</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Jatuh Tempo</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalOverdue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Draft</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{allDocs.filter((i) => i.status === 'draft').length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'invoice', 'quotation'] as const).map((t) => (
          <button key={t} onClick={() => { setDocFilter(t); setFs('all'); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${docFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'all' ? 'Semua' : t === 'invoice' ? 'Invoice' : 'Quotation'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari dokumen..." value={sq} onChange={(e) => setSq(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {statusOpts.map((s) => (
            <button key={s} onClick={() => setFs(s)}
              className={`px-3 py-2 rounded-lg text-sm ${fs === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'all' ? 'Semua' : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dokumen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klien</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className={doc.doc_type === 'quotation' ? 'text-purple-500' : 'text-blue-500'} />
                    <span className={`font-medium ${doc.doc_type === 'quotation' ? 'text-purple-700' : 'text-gray-800'}`}>{doc.invoice_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{doc.client_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.doc_type === 'quotation' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {doc.doc_type === 'quotation' ? 'Quotation' : 'Invoice'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(doc.doc_type, doc.status)}`}>
                    {STATUS_LABELS[doc.status] || doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(doc.due_date).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-800">{fmt(doc.total)}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setSel(doc)} className="p-1 hover:bg-gray-100 rounded"><Eye size={16} className="text-gray-500" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Belum ada dokumen</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">{sel.invoice_number}</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${sel.doc_type === 'quotation' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {sel.doc_type === 'quotation' ? 'Quotation' : 'Invoice'}
                </span>
              </div>
              <button onClick={() => setSel(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Klien</h3>
                <p className="font-medium">{sel.client_name}</p>
                <p className="text-sm text-gray-500">{sel.client_email}</p>
                <p className="text-sm text-gray-500">{sel.client_address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(sel.doc_type, sel.status)}`}>
                  {STATUS_LABELS[sel.status] || sel.status}
                </span>
                <p className="text-sm text-gray-500 mt-2">Tanggal: {new Date(sel.issue_date).toLocaleDateString('id-ID')}</p>
                <p className="text-sm text-gray-500">Jatuh Tempo: {new Date(sel.due_date).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
            <table className="w-full mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produk/Layanan</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Harga Satuan</th>
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
                <div className="flex justify-between text-sm"><span className="text-gray-500">Pajak (11%)</span><span>{fmt(sel.tax)}</span></div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total</span><span>{fmt(sel.total)}</span></div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t flex-wrap">
              {sel.doc_type === 'invoice' && sel.status !== 'paid' && (
                <button onClick={() => markPaid(sel.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <CheckCircle size={18} /> Tandai Lunas
                </button>
              )}
              {sel.doc_type === 'quotation' && sel.status === 'draft' && (
                <button onClick={() => setQuotationStatus(sel.id, 'sent')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Send size={18} /> Kirim
                </button>
              )}
              {sel.doc_type === 'quotation' && sel.status === 'sent' && (
                <>
                  <button onClick={() => setQuotationStatus(sel.id, 'accepted')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <CheckCircle size={18} /> Diterima
                  </button>
                  <button onClick={() => setQuotationStatus(sel.id, 'rejected')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <X size={18} /> Ditolak
                  </button>
                </>
              )}
              {sel.doc_type === 'quotation' && sel.status === 'accepted' && (
                <button onClick={() => convertToInvoice(sel)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <ArrowRight size={18} /> Konversi ke Invoice
                </button>
              )}
              {sel.doc_type === 'quotation' && sel.status === 'rejected' && (
                <button onClick={() => setQuotationStatus(sel.id, 'draft')} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Kembali ke Draft
                </button>
              )}
              <button onClick={() => exportHtml(sel)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                <Download size={16} /> Export HTML
              </button>
              <button onClick={() => exportMd(sel)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                <Download size={16} /> Export Markdown
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Buat Dokumen Baru</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Dokumen</label>
                  <div className="flex gap-2">
                    {(['invoice', 'quotation'] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setDocType(t)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border ${docType === t
                          ? t === 'invoice' ? 'bg-blue-600 text-white border-blue-600' : 'bg-purple-600 text-white border-purple-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {t === 'invoice' ? 'Invoice' : 'Quotation'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proyek</label>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" required>
                    <option value="">Pilih proyek...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({computeInitials(p.name)})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Klien</label>
                  <input required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Klien</label>
                  <input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Klien</label>
                <input value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items</label>
                  <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700">+ Tambah Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input placeholder="Nama produk/layanan" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 leading-none mb-1">Qty</span>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 leading-none mb-1">Harga Satuan (Rp)</span>
                        <input type="number" min="0" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                          className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                      <span className="w-32 text-right text-sm font-medium">{fmt(item.total)}</span>
                      {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={14} className="text-red-500" /></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Pajak (11%)</span><span>{fmt(tax)}</span></div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total</span><span>{fmt(total)}</span></div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className={`flex-1 px-4 py-2 text-white rounded-lg ${docType === 'invoice' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                  {docType === 'invoice' ? 'Buat Invoice' : 'Buat Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
