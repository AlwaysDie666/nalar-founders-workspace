import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchTransactions, createTransaction } from '../../lib/api/transactions';
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Download, X } from 'lucide-react';

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
  const [form, setForm] = useState({ type: 'income', description: '', amount: '', category: '', date: '' });

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
        category: form.category,
        description: form.description,
        transaction_date: form.date,
        status: 'pending',
        created_by: currentUser.id,
      });
      setShowAddModal(false);
      setForm({ type: 'income', description: '', amount: '', category: '', date: '' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Keuangan</h1>
          <p className="text-gray-500">Pantau pendapatan, pengeluaran, dan arus kas</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
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
            <p className="text-sm text-gray-500 mt-1">Labah Bersih</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
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
                <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">{t.category}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'approved' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                </td>
                <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Belum ada transaksi</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
                <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (IDR)</label>
                <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
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
