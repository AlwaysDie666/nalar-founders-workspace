import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchTransactions } from '../../lib/api/transactions';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, FolderKanban, CheckSquare, Download } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const fmt = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<{ type: string; amount: number; transaction_date: string }[]>([]);
  const [projects, setProjects] = useState<{ status: string }[]>([]);
  const [tasks, setTasks] = useState<{ status: string }[]>([]);

  useEffect(() => {
    fetchTransactions().then((d) => setTransactions(d || [])).catch(() => {});
    supabase.from('projects').select('status').then(({ data }) => setProjects(data || []));
    supabase.from('tasks').select('status').then(({ data }) => setTasks(data || []));
  }, []);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

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
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
          <Download size={18} /> Export Laporan
        </button>
      </div>

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
