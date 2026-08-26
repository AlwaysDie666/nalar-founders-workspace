import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { fetchTransactions } from '../../lib/api/transactions';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, FolderKanban, CheckSquare, Download, Mail } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const fmt = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function ReportsPage() {
  const { currentUser } = useApp();
  const [transactions, setTransactions] = useState<{ type: string; amount: number; transaction_date: string }[]>([]);
  const [projects, setProjects] = useState<{ status: string; name: string }[]>([]);
  const [tasks, setTasks] = useState<{ status: string; priority: string; title: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const isPrivileged = currentUser?.role === 'ceo' || currentUser?.role === 'coo';

  useEffect(() => {
    fetchTransactions().then((d) => setTransactions(d || [])).catch(() => {});
    supabase.from('projects').select('status, name').then(({ data }) => setProjects(data || []));
    supabase.from('tasks').select('status, priority, title').then(({ data }) => setTasks(data || []));
  }, []);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const period = `${weekStart.toLocaleDateString('id-ID')} - ${weekEnd.toLocaleDateString('id-ID')}`;

  const downloadReport = () => {
    const csvContent = [
      'Laporan Mingguan Nalar Workspace',
      `Periode,${period}`,
      '',
      'Ringkasan Tugas',
      `Total,${tasks.length}`,
      `Selesai,${completedTasks}`,
      '',
      'Ringkasan Keuangan',
      `Pendapatan,${totalIncome}`,
      `Pengeluaran,${totalExpense}`,
      `Labah Bersih,${totalIncome - totalExpense}`,
      '',
      'Proyek Aktif',
      `Jumlah,${activeProjects}`,
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-mingguan-${now.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendWeeklyReport = async () => {
    if (!currentUser) return;
    setSending(true);
    setMessage('');
    try {
      const { data: cooUsers } = await supabase
        .from('profiles')
        .select('email')
        .in('role', ['ceo', 'coo']);

      if (cooUsers && cooUsers.length > 0) {
        for (const user of cooUsers) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: user.email,
              subject: `Laporan Mingguan Nalar Workspace - ${period}`,
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h1 style="color:#1e40af;">Laporan Mingguan</h1><p>Periode: ${period}</p><h2>Tugas</h2><p>Total: ${tasks.length} | Selesai: ${completedTasks}</p><h2>Keuangan</h2><p>Pendapatan: Rp ${totalIncome.toLocaleString('id-ID')}</p><p>Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}</p><p>Labah Bersih: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}</p><p>Proyek Aktif: ${activeProjects}</p></div>`,
            }),
          });
        }
        setMessage(`Laporan berhasil dikirim ke ${cooUsers.length} penerima.`);
      } else {
        setMessage('Tidak ditemukan user CEO/COO.');
      }
    } catch {
      setMessage('Gagal mengirim email. Pastikan RESEND_API_KEY sudah benar.');
    } finally {
      setSending(false);
    }
  };

  const projectStatusData = [
    { name: 'Aktif', value: projects.filter((p) => p.status === 'active').length },
    { name: 'Selesai', value: projects.filter((p) => p.status === 'completed').length },
    { name: 'Perencanaan', value: projects.filter((p) => p.status === 'planning').length },
    { name: 'Ditunda', value: projects.filter((p) => p.status === 'on_hold').length },
  ];

  const taskStatusData = [
    { name: 'Belum Dikerjakan', value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'Sedang Dikerjakan', value: tasks.filter((t) => t.status === 'in_progress').length },
    { name: 'Dalam Review', value: tasks.filter((t) => t.status === 'review').length },
    { name: 'Selesai', value: tasks.filter((t) => t.status === 'done').length },
  ];

  const monthlyData = (() => {
    const map: Record<string, { income: number; expense: number }> = {};
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    MONTHS.forEach((m) => { map[m] = { income: 0, expense: 0 }; });
    transactions.forEach((t) => {
      const d = new Date(t.transaction_date);
      const m = MONTHS[d.getMonth()];
      if (m) {
        if (t.type === 'income') map[m].income += t.amount;
        else map[m].expense += t.amount;
      }
    });
    return MONTHS.map((m) => ({ month: m, income: map[m].income, expense: map[m].expense }));
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan & Analitik</h1>
          <p className="text-gray-500">Wawasan bisnis dan metrik performa</p>
        </div>
        {isPrivileged && (
          <div className="flex gap-3">
            <button onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
              <Download size={18} /> Unduh CSV
            </button>
            <button onClick={sendWeeklyReport} disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400">
              <Mail size={18} /> {sending ? 'Mengirim...' : 'Kirim Laporan Mingguan'}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="p-3 rounded-lg bg-green-50 mb-3"><DollarSign className="text-green-500" size={24} /></div>
          <p className="text-2xl font-bold text-gray-800">{fmt(totalIncome)}</p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="p-3 rounded-lg bg-red-50 mb-3"><TrendingUp className="text-red-500" size={24} /></div>
          <p className="text-2xl font-bold text-gray-800">{fmt(totalExpense)}</p>
          <p className="text-sm text-gray-500">Total Expenses</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="p-3 rounded-lg bg-blue-50 mb-3"><FolderKanban className="text-blue-500" size={24} /></div>
          <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
          <p className="text-sm text-gray-500">Total Projects</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="p-3 rounded-lg bg-purple-50 mb-3"><CheckSquare className="text-purple-500" size={24} /></div>
          <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
          <p className="text-sm text-gray-500">Total Tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => fmt(Number(value))} />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Project Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {projectStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={taskStatusData} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {taskStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => fmt(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={2} name="Income" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expense" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
