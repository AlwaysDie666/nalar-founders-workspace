import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchTransactions, createTransaction } from '../../lib/api/transactions';
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Download, X, Eye } from 'lucide-react';

interface Tx {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  status: string;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function FinancePage() {
  const { currentUser } = useApp();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailTx, setDetailTx] = useState<Tx | null>(null);
  const [form, setForm] = useState({ type: 'income', description: '', amount: '', date: '' });

  // Export date range
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState({ start: '', end: '' });

  const loadData = async () => {
    try {
      const data = await fetchTransactions();
      setTransactions(data || []);
    } catch {
      // empty
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await createTransaction({
        type: form.type,
        amount: Number(form.amount),
        category: '',
        description: form.description,
        transaction_date: form.date,
        status: 'completed',
        created_by: currentUser.id,
      });
      setShowAddModal(false);
      setForm({ type: 'income', description: '', amount: '', date: '' });
      loadData();
    } catch (err) {
      console.error(err);
    }
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

  const exportCsv = () => {
    const start = exportRange.start ? new Date(exportRange.start) : null;
    const end = exportRange.end ? new Date(exportRange.end) : null;
    const data = transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });

    const rows = [
      'Laporan Keuangan Nalar Workspace',
      exportRange.start && exportRange.end
        ? `Periode,${exportRange.start} - ${exportRange.end}`
        : 'Periode,Semua',
      '',
      'Tanggal,Tipe,Deskripsi,Jumlah (IDR)',
      ...data.map((t) =>
        `${new Date(t.transaction_date).toLocaleDateString('id-ID')},${t.type === 'income' ? 'Pendapatan' : 'Pengeluaran'},"${t.description}",${t.type === 'income' ? '' : '-'}${t.amount}`
      ),
      '',
      `Total Pendapatan,${totalIncome}`,
      `Total Pengeluaran,${totalExpense}`,
      `Laba Bersih,${netProfit}`,
    ].join('\n');

    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(rows, `laporan-keuangan-${dateStr}.csv`, 'text/csv');
    setShowExportModal(false);
  };

  const exportHtml = () => {
    const start = exportRange.start ? new Date(exportRange.start) : null;
    const end = exportRange.end ? new Date(exportRange.end) : null;
    const data = transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });

    const periode = exportRange.start && exportRange.end
      ? `${exportRange.start} - ${exportRange.end}`
      : 'Semua Data';

    const rows = data.map((t) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${t.type === 'income' ? 'Pendapatan' : 'Pengeluaran'}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${t.description}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:${t.type === 'income' ? '#16a34a' : '#dc2626'};">
          ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Laporan Keuangan</title></head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;">
  <h1 style="color:#1e40af;">Laporan Keuangan</h1>
  <p style="color:#6b7280;">Periode: ${periode}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:24px 0;">
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;">
      <p style="margin:0;color:#16a34a;font-size:13px;">Pendapatan</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;">${fmt(totalIncome)}</p>
    </div>
    <div style="background:#fef2f2;padding:16px;border-radius:8px;text-align:center;">
      <p style="margin:0;color:#dc2626;font-size:13px;">Pengeluaran</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;">${fmt(totalExpense)}</p>
    </div>
    <div style="background:#eff6ff;padding:16px;border-radius:8px;text-align:center;">
      <p style="margin:0;color:#2563eb;font-size:13px;">Laba Bersih</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;">${fmt(netProfit)}</p>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-top:20px;">
    <thead><tr style="background:#f3f4f6;">
      <th style="padding:10px;text-align:left;">Tanggal</th>
      <th style="padding:10px;text-align:left;">Tipe</th>
      <th style="padding:10px;text-align:left;">Deskripsi</th>
      <th style="padding:10px;text-align:right;">Jumlah</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:40px;text-align:center;color:#9ca3af;font-size:12px;">Dibuat oleh Nalar Workspace</p>
</body></html>`;

    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(html, `laporan-keuangan-${dateStr}.html`, 'text/html');
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Keuangan</h1>
          <p className="text-gray-500">Pantau pendapatan, pengeluaran, dan arus kas</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={18} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} /> Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-50"><TrendingUp className="text-green-500" size={24} /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-800">{fmt(totalIncome)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Pendapatan</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-red-50"><TrendingDown className="text-red-500" size={24} /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-800">{fmt(totalExpense)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Pengeluaran</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-50"><DollarSign className="text-blue-500" size={24} /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-800">{fmt(netProfit)}</p>
            <p className="text-sm text-gray-500 mt-1">Laba Bersih</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari transaksi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-lg capitalize ${filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{type === 'all' ? 'Semua' : type === 'income' ? 'Pendapatan' : 'Pengeluaran'}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailTx(t)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {t.type === 'income' ? <ArrowUpRight className="text-green-500" size={18} /> : <ArrowDownRight className="text-red-500" size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{t.description}</p>
                      <p className="text-sm text-gray-500 capitalize">{t.type === 'income' ? 'Pendapatan' : 'Pengeluaran'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
                <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</td>
                <td className="px-6 py-4 text-center">
                  <Eye size={16} className="text-gray-400 inline" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Belum ada transaksi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Detail Transaksi</h2>
              <button onClick={() => setDetailTx(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              {/* Type + Amount hero */}
              <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl">
                <div className={`p-3 rounded-xl ${detailTx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {detailTx.type === 'income' ? <TrendingUp className="text-green-500" size={28} /> : <TrendingDown className="text-red-500" size={28} />}
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{detailTx.type === 'income' ? 'Pendapatan' : 'Pengeluaran'}</p>
                  <p className={`text-3xl font-bold ${detailTx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {detailTx.type === 'income' ? '+' : '-'}{fmt(detailTx.amount)}
                  </p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Deskripsi</p>
                  <p className="font-medium text-gray-800">{detailTx.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Tanggal Transaksi</p>
                  <p className="font-medium text-gray-800">{new Date(detailTx.transaction_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Kategori</p>
                  <p className="font-medium text-gray-800">{detailTx.category || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${detailTx.status === 'completed' ? 'bg-green-100 text-green-700' : detailTx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {detailTx.status === 'completed' ? 'Selesai' : detailTx.status === 'pending' ? 'Menunggu' : detailTx.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const dateStr = new Date(detailTx.transaction_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    const lines = [
                      'Detail Transaksi',
                      '',
                      `Tipe,${detailTx.type === 'income' ? 'Pendapatan' : 'Pengeluaran'}`,
                      `Jumlah,${detailTx.type === 'income' ? '+' : '-'}${fmt(detailTx.amount)}`,
                      `Deskripsi,${detailTx.description}`,
                      `Tanggal,${dateStr}`,
                      `Kategori,${detailTx.category || '-'}`,
                      `Status,${detailTx.status}`,
                    ].join('\n');
                    downloadFile(lines, `transaksi-${detailTx.id}.csv`, 'text/csv');
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  <Download size={16} /> Export Detail
                </button>
                <button onClick={() => setDetailTx(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Date Range Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Export Laporan</h2>
              <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                <input type="date" value={exportRange.start} onChange={(e) => setExportRange({ ...exportRange, start: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                <input type="date" value={exportRange.end} onChange={(e) => setExportRange({ ...exportRange, end: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <p className="text-xs text-gray-400">Kosongkan untuk export semua data</p>
              <div className="flex gap-3 pt-2">
                <button onClick={exportCsv} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Download size={16} /> CSV
                </button>
                <button onClick={exportHtml} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Download size={16} /> HTML
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tambah Transaksi</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="income">Pendapatan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Contoh: Penjualan produk X" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (IDR)</label>
                <input type="number" required min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
