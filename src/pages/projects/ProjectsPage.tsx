import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { Plus, FolderKanban, Calendar, DollarSign, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-700',
  active: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-gray-100 text-gray-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<string, string> = {
  planning: 'Perencanaan',
  active: 'Aktif',
  on_hold: 'Ditunda',
  completed: 'Selesai',
};

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  spent: number | null;
  created_at: string;
}

export default function ProjectsPage() {
  const { currentUser } = useApp();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  const filtered = projects.filter((p) => filterStatus === 'all' || p.status === filterStatus);

  const fmt = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const { data, error } = await supabase.from('projects').insert({
      name: form.get('name') as string,
      description: form.get('description') as string || null,
      budget: form.get('budget') ? Number(form.get('budget')) : null,
      start_date: new Date().toISOString().split('T')[0],
      status: 'planning',
      created_by: currentUser?.id || null,
    }).select().single();
    if (!error && data) {
      setProjects([data, ...projects]);
      setShowAddModal(false);
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(projects.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Proyek</h1>
          <p className="text-gray-500">Kelola dan pantau proyek perusahaan</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm">
          <Plus size={18} /> Tambah Proyek
        </button>
      </div>

      <div className="flex gap-2">
        {[{ key: 'all', label: 'Semua' }, { key: 'planning', label: 'Perencanaan' }, { key: 'active', label: 'Aktif' }, { key: 'on_hold', label: 'Ditunda' }, { key: 'completed', label: 'Selesai' }].map((s) => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)}
            className={`px-4 py-2 rounded-lg text-sm ${filterStatus === s.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada proyek. Klik "Tambah Proyek" untuk membuat baru.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div key={project.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 rounded-lg bg-blue-50"><FolderKanban className="text-blue-500" size={24} /></div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>{statusLabels[project.status] || project.status}</span>
                  <button onClick={() => handleDelete(project.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
              {project.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-blue-600">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              {project.budget && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <DollarSign size={14} />
                  <span>{fmt(project.spent || 0)} / {fmt(project.budget)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-500 pt-3 border-t border-gray-100">
                <Calendar size={14} />
                <span>{new Date(project.start_date).toLocaleDateString('id-ID')}</span>
                {project.end_date && <span> — {new Date(project.end_date).toLocaleDateString('id-ID')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tambah Proyek Baru</h2>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Proyek</label>
                <input name="name" required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (IDR)</label>
                <input name="budget" type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Buat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
