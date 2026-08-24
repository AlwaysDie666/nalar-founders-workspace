import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Calendar, X } from 'lucide-react';

const columns = [
  { id: 'todo', label: 'Belum Dikerjakan', color: 'bg-gray-50', dot: 'bg-gray-400' },
  { id: 'in_progress', label: 'Sedang Dikerjakan', color: 'bg-blue-50', dot: 'bg-blue-500' },
  { id: 'review', label: 'Dalam Review', color: 'bg-amber-50', dot: 'bg-amber-500' },
  { id: 'done', label: 'Selesai', color: 'bg-green-50', dot: 'bg-green-500' },
];

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  tags: string[] | null;
  created_at: string;
  assignee?: { full_name: string; role: string } | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
}

export default function TasksPage() {
  const { currentUser } = useApp();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name, role)')
      .order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('id, full_name, role');
    setUsers(data || []);
  }

  const filteredTasks = tasks.filter((task) => {
    const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const getTasksByStatus = (status: string) => filteredTasks.filter((t) => t.status === status);

  async function handleStatusChange(taskId: string, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const { data, error } = await supabase.from('tasks').insert({
      title: form.get('title') as string,
      description: form.get('description') as string || null,
      priority: form.get('priority') as string,
      assignee_id: form.get('assignee') as string || null,
      due_date: form.get('dueDate') as string || null,
      created_by: currentUser?.id || null,
      status: 'todo',
    }).select('*, assignee:profiles!tasks_assignee_id_fkey(full_name, role)').single();
    if (!error && data) {
      setTasks([data, ...tasks]);
      setShowAddModal(false);
    }
  }

  async function handleDeleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(tasks.filter((t) => t.id !== id));
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Tugas</h1>
          <p className="text-gray-500">Kelola dan pantau tugas tim Anda</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Tambah Tugas
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari tugas..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Semua Prioritas</option>
          <option value="urgent">Urgent</option>
          <option value="high">Tinggi</option>
          <option value="medium">Sedang</option>
          <option value="low">Rendah</option>
        </select>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Memuat data...</div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div key={column.id} className="w-80 flex-shrink-0">
                  <div className={`${column.color} rounded-lg p-3 mb-4`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700">{column.label}</h3>
                      <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">{columnTasks.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}></div>
                            <span className="text-xs font-medium text-gray-500 uppercase">{task.priority}</span>
                          </div>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">{task.title}</h4>
                        {task.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-2 mb-3">
                          {task.tags?.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar size={14} />
                            <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID') : 'Tanpa deadline'}</span>
                          </div>
                          {task.assignee && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                                {task.assignee.full_name.charAt(0)}
                              </div>
                              <span className="text-xs text-gray-500">{task.assignee.full_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                          {column.id !== 'todo' && (
                            <button onClick={() => {
                              const order = ['todo', 'in_progress', 'review', 'done'];
                              const idx = order.indexOf(task.status);
                              if (idx > 0) handleStatusChange(task.id, order[idx - 1]);
                            }} className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">
                              Sebelumnya
                            </button>
                          )}
                          {column.id !== 'done' && (
                            <button onClick={() => {
                              const order = ['todo', 'in_progress', 'review', 'done'];
                              const idx = order.indexOf(task.status);
                              if (idx < order.length - 1) handleStatusChange(task.id, order[idx + 1]);
                            }} className="flex-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">
                              Selanjutnya
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">Belum ada tugas</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tambah Tugas Baru</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input name="title" required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                  <select name="priority" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penanggung Jawab</label>
                  <select name="assignee" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Belum ditugaskan</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input type="date" name="dueDate" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tambah</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
