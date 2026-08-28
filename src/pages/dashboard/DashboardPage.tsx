import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { Users, DollarSign, CheckCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { KPI } from '../../types';

const roleLabels: Record<string, string> = {
  ceo: 'Strategic Overview', cto: 'Technology Overview', cpo: 'Product Overview',
  cmo: 'Marketing Overview', cfo: 'Financial Overview', coo: 'Operations Overview', kreatif: 'Creative Overview',
};

const fmt = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const KPICard = ({ kpi }: { kpi: KPI }) => {
  const colorClass = kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-blue-500';
  const bgClass = kpi.trend === 'up' ? 'bg-green-50' : kpi.trend === 'down' ? 'bg-red-50' : 'bg-blue-50';
  const iconMap: Record<string, React.ReactNode> = {
    dollar: <DollarSign className={colorClass} size={24} />,
    folder: <CheckCircle className={colorClass} size={24} />,
    users: <Users className={colorClass} size={24} />,
    clock: <Clock className={colorClass} size={24} />,
    check: <CheckCircle className={colorClass} size={24} />,
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}>{iconMap[kpi.icon || 'check']}</div>
        {kpi.trend === 'up' && <span className="flex items-center text-green-600 text-sm font-medium"><ArrowUpRight size={16} />{kpi.change}%</span>}
        {kpi.trend === 'down' && <span className="flex items-center text-red-600 text-sm font-medium"><ArrowDownRight size={16} />{Math.abs(kpi.change || 0)}%</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
        <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { currentUser } = useApp();
  const [tasks, setTasks] = useState<{ id: string; title: string; status: string; priority: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; status: string; progress: number }[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const role = currentUser?.role || 'ceo';

  useEffect(() => {
    supabase.from('tasks').select('id, title, status, priority').then(({ data }) => setTasks(data || []));
    supabase.from('projects').select('id, name, status, progress').then(({ data }) => setProjects(data || []));
    supabase.from('transactions').select('type, amount').then(({ data }) => {
      const txData = data || [];
      setTotalIncome(txData.filter((t: { type: string; amount: number }) => t.type === 'income').reduce((s: number, t: { type: string; amount: number }) => s + t.amount, 0));
      setTotalExpense(txData.filter((t: { type: string; amount: number }) => t.type === 'expense').reduce((s: number, t: { type: string; amount: number }) => s + t.amount, 0));
    });
  }, []);

  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const activeProjects = projects.filter((p) => p.status === 'active');
  const netProfit = totalIncome - totalExpense;
  const kpis: KPI[] = [
    { label: 'Total Tugas', value: tasks.length, icon: 'check', trend: 'neutral', change: 0 },
    { label: 'Tugas Aktif', value: inProgress, icon: 'clock', trend: inProgress > 0 ? 'up' : 'neutral', change: 0 },
    { label: 'Proyek Aktif', value: activeProjects.length, icon: 'folder', trend: activeProjects.length > 0 ? 'up' : 'neutral', change: 0 },
    { label: 'Total Pendapatan', value: fmt(totalIncome), icon: 'dollar', trend: 'up', change: 0 },
    { label: 'Total Pengeluaran', value: fmt(totalExpense), icon: 'dollar', trend: 'down', change: 0 },
    { label: 'Laba Bersih', value: fmt(netProfit), icon: 'dollar', trend: netProfit >= 0 ? 'up' : 'down', change: 0 },
  ];
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 18 ? 'Selamat Siang' : 'Selamat Malam';
  const statusLabels: Record<string, string> = { todo: 'Belum Dikerjakan', in_progress: 'Sedang Dikerjakan', review: 'Dalam Review', done: 'Selesai' };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">{greeting}, {currentUser?.name || 'User'}!</h1>
        <p className="text-blue-100 mt-1">{roleLabels[role] || 'Dashboard'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Tugas Terbaru</h2>
            <a href="/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Lihat Semua</a>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <p className="font-medium text-gray-800">{task.title}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-700' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : task.status === 'review' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[task.status] || task.status}
                </span>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center py-6 text-gray-400">Belum ada tugas</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Proyek Aktif</h2>
            <a href="/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Lihat Semua</a>
          </div>
          <div className="space-y-4">
            {activeProjects.map((p) => (
              <div key={p.id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">{p.name}</h3>
                  <span className="text-sm font-medium text-blue-600">{p.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${p.progress}%` }}></div>
                </div>
              </div>
            ))}
            {activeProjects.length === 0 && <p className="text-center py-6 text-gray-400">Belum ada proyek aktif</p>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Keuangan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="text-green-600" size={20} />
              <span className="text-sm font-medium text-green-700">Pendapatan</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{fmt(totalIncome)}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="text-red-600" size={20} />
              <span className="text-sm font-medium text-red-700">Pengeluaran</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{fmt(totalExpense)}</p>
          </div>
          <div className={`p-4 rounded-lg border ${netProfit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={netProfit >= 0 ? 'text-blue-600' : 'text-red-600'} size={20} />
              <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Laba Bersih</span>
            </div>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(netProfit)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
