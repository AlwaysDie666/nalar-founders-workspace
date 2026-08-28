import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import {
  Plus, FolderKanban, Calendar, DollarSign, Trash2, X,
  ChevronLeft, Check, XCircle, Clock, MessageSquare, Send,
  ListTodo, ArrowRight, ChevronDown, ChevronRight, User, Pencil,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────

const CATEGORIES = [
  { key: 'general', label: 'Umum', color: 'bg-gray-100 text-gray-700' },
  { key: 'production', label: 'Produksi', color: 'bg-blue-100 text-blue-700' },
  { key: 'sales', label: 'Penjualan', color: 'bg-green-100 text-green-700' },
  { key: 'promotion', label: 'Promosi', color: 'bg-purple-100 text-purple-700' },
  { key: 'purchase', label: 'Pembelian', color: 'bg-orange-100 text-orange-700' },
  { key: 'marketing', label: 'Pemasaran', color: 'bg-pink-100 text-pink-700' },
  { key: 'creative', label: 'Kreatif', color: 'bg-red-100 text-red-700' },
  { key: 'development', label: 'Pengembangan', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'operations', label: 'Operasional', color: 'bg-yellow-100 text-yellow-700' },
];

const CATEGORY_MAP: Record<string, { key: string; label: string; color: string }> =
  Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

const PROJECT_STATUS = [
  { key: 'planning', label: 'Perencanaan', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'active', label: 'Aktif', color: 'bg-blue-100 text-blue-700' },
  { key: 'on_hold', label: 'Ditunda', color: 'bg-gray-100 text-gray-700' },
  { key: 'review', label: 'Review', color: 'bg-purple-100 text-purple-700' },
  { key: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-700' },
];

const PROJECT_STATUS_MAP: Record<string, { key: string; label: string; color: string }> =
  Object.fromEntries(PROJECT_STATUS.map(s => [s.key, s]));

const TASK_STATUS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  { key: 'in_progress', label: 'Dikerjakan', color: 'bg-blue-100 text-blue-700' },
  { key: 'review', label: 'Review', color: 'bg-purple-100 text-purple-700' },
  { key: 'done', label: 'Selesai', color: 'bg-green-100 text-green-700' },
];

const TASK_STATUS_MAP: Record<string, { key: string; label: string; color: string }> =
  Object.fromEntries(TASK_STATUS.map(s => [s.key, s]));

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'Rendah', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Sedang', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'Tinggi', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Mendesak', color: 'bg-red-100 text-red-700' },
};

const PROJECT_TRANSITIONS: Record<string, string[]> = {
  planning: ['active', 'on_hold'],
  active: ['on_hold', 'review'],
  on_hold: ['active'],
  review: ['completed', 'active'],
  completed: ['planning'],
};

const TASK_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress'],
  in_progress: ['review', 'todo'],
  review: ['done', 'in_progress'],
  done: ['todo'],
};

// ── Interfaces ─────────────────────────────────────────────

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
  created_by: string | null;
  category: string;
  created_at: string;
}

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
  project_id: string | null;
  parent_task_id: string | null;
  requested_by: string | null;
  approved_by: string | null;
  approval_status: string;
}

interface LogRow {
  id: string;
  project_id: string;
  task_id: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
  edited_at: string | null;
  edited_by: string | null;
}

interface ProfileRow {
  id: string;
  name: string;
  role: string;
  email: string;
}

// ── Helpers ────────────────────────────────────────────────

const fmt = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

// ── Local Components ───────────────────────────────────────

function AddSubtaskInline({ parentId, onAdd }: { parentId: string; onAdd: (parentId: string, title: string) => void }) {
  const [title, setTitle] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (title.trim()) {
      onAdd(parentId, title.trim());
      setTitle('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Tambah subtask..."
        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button type="submit" className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
        Tambah
      </button>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function ProjectsPage() {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'ceo' || currentUser?.role === 'coo';

  // ── List view state ──
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Detail view state ──
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // ── Modals ──
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  // ── Category grouping ──


  // ── Log editing ──
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogContent, setEditingLogContent] = useState('');

  // ── Task view state ──
  const [taskView, setTaskView] = useState<'board' | 'list'>('board');
  const [taskFilter, setTaskFilter] = useState<'all' | 'mine'>('all');

  // ── Effects ──
  useEffect(() => {
    loadProjects();
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject.id);
      loadLogs(selectedProject.id);
    }
  }, [selectedProject]);

  // ── Data loading ──
  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  async function loadProfiles() {
    const { data } = await supabase.from('profiles').select('id, name, role, email');
    setProfiles(data || []);
  }

  async function loadTasks(projectId: string) {
    const { data } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    setTasks(data || []);
  }

  async function loadLogs(projectId: string) {
    const { data } = await supabase.from('project_logs').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    setLogs(data || []);
  }

  // ── Computed ──
  const filtered = projects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    return true;
  });

  const rootTasks = [...tasks.filter(t => !t.parent_task_id)].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return 0;
  });


  function getProfile(id: string | null): ProfileRow | undefined {
    return profiles.find(p => p.id === id);
  }

  function getSubtasks(parentId: string): TaskRow[] {
    return tasks.filter(t => t.parent_task_id === parentId);
  }

  const visibleTasks = taskFilter === 'mine'
    ? rootTasks.filter(t => t.assignee_id === currentUser?.id)
    : rootTasks;

  const totalRootTasks = rootTasks.length;
  const doneRootTasks = rootTasks.filter(t => t.status === 'done').length;
  const computedProgress = totalRootTasks > 0 ? Math.round((doneRootTasks / totalRootTasks) * 100) : 0;

  const KANBAN_COLUMNS = [
    { key: 'todo', label: 'To Do', bg: 'bg-gray-50', headerBg: 'bg-gray-100', headerText: 'text-gray-700', border: 'border-gray-200' },
    { key: 'in_progress', label: 'Dikerjakan', bg: 'bg-blue-50', headerBg: 'bg-blue-100', headerText: 'text-blue-700', border: 'border-blue-200' },
    { key: 'review', label: 'Review', bg: 'bg-purple-50', headerBg: 'bg-purple-100', headerText: 'text-purple-700', border: 'border-purple-200' },
    { key: 'done', label: 'Selesai', bg: 'bg-green-50', headerBg: 'bg-green-100', headerText: 'text-green-700', border: 'border-green-200' },
  ] as const;

  // ── Handlers ──
  async function handleAddProject(e: FormEvent) {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const { data, error } = await supabase.from('projects').insert({
      name: form.get('name') as string,
      description: (form.get('description') as string) || null,
      budget: form.get('budget') ? Number(form.get('budget')) : null,
      start_date: new Date().toISOString().split('T')[0],
      status: 'planning',
      category: (form.get('category') as string) || 'general',
      created_by: currentUser?.id || null,
    }).select().single();
    if (!error && data) {
      setProjects([data, ...projects]);
      setShowAddModal(false);
    }
  }

  async function handleDeleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(projects.filter(p => p.id !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
  }

  async function handleUpdateProjectStatus(projectId: string, newStatus: string) {
    const { data } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId).select().single();
    if (data) {
      setProjects(projects.map(p => p.id === projectId ? data : p));
      if (selectedProject?.id === projectId) setSelectedProject(data);
    }
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!selectedProject) return;
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const { data, error } = await supabase.from('tasks').insert({
      title: form.get('title') as string,
      description: (form.get('description') as string) || null,
      priority: (form.get('priority') as string) || 'medium',
      assignee_id: (form.get('assignee_id') as string) || null,
      status: 'todo',
      project_id: selectedProject.id,
      approval_status: 'none',
    }).select().single();
    if (!error && data) {
      setTasks([data, ...tasks]);
      setShowAddTaskModal(false);
    }
  }

  async function handleAddSubtask(parentId: string, title: string) {
    if (!selectedProject || !title.trim()) return;
    const { data, error } = await supabase.from('tasks').insert({
      title: title.trim(),
      status: 'todo',
      priority: 'medium',
      project_id: selectedProject.id,
      parent_task_id: parentId,
      approval_status: 'none',
    }).select().single();
    if (!error && data) {
      setTasks([...tasks, data]);
    }
  }

  async function handleUpdateTaskStatus(taskId: string, newStatus: string) {
    const oldTask = tasks.find(t => t.id === taskId);
    const { data } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId).select().single();
    if (data) {
      const updatedTasks = tasks.map(t => t.id === taskId ? data : t);
      setTasks(updatedTasks);

      if (oldTask && oldTask.status !== newStatus && selectedProject) {
        const userName = currentUser?.name || 'User';
        const oldLabel = TASK_STATUS_MAP[oldTask.status]?.label || oldTask.status;
        const newLabel = TASK_STATUS_MAP[newStatus]?.label || newStatus;
        await supabase.from('project_logs').insert({
          project_id: selectedProject.id,
          task_id: taskId,
          content: `${userName} mengubah status "${data.title}" dari ${oldLabel} ke ${newLabel}`,
          created_by: currentUser?.id || null,
        });
        loadLogs(selectedProject.id);
      }

      if (selectedProject) {
        const projectRootTasks = updatedTasks.filter(t => !t.parent_task_id);
        const allDone = projectRootTasks.length > 0 && projectRootTasks.every(t => t.status === 'done');
        if (allDone && selectedProject.status !== 'review' && selectedProject.status !== 'completed') {
          await handleUpdateProjectStatus(selectedProject.id, 'review');
        }
      }

      if (selectedProject) {
        const projRootTasks = updatedTasks.filter(t => !t.parent_task_id);
        const doneCount = projRootTasks.filter(t => t.status === 'done').length;
        const total = projRootTasks.length;
        const newProgress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        const { data: updatedProject } = await supabase.from('projects').update({ progress: newProgress }).eq('id', selectedProject.id).select().single();
        if (updatedProject) {
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
          setSelectedProject(updatedProject);
        }
      }
    }
  }

  async function handleRequestTask(taskId: string) {
    const { data } = await supabase.from('tasks').update({
      requested_by: currentUser?.id ?? null,
      approval_status: 'pending',
    }).eq('id', taskId).select().single();
    if (data) {
      setTasks(tasks.map(t => t.id === taskId ? data : t));
    }
  }

  async function handleApproveTask(taskId: string, approved: boolean) {
    const task = tasks.find(t => t.id === taskId);
    const baseUpdate = {
      approval_status: approved ? 'approved' : 'rejected',
      approved_by: currentUser?.id ?? null,
    };
    const updateData = approved && task?.requested_by
      ? { ...baseUpdate, assignee_id: task.requested_by }
      : baseUpdate;
    const { data } = await supabase.from('tasks').update(updateData).eq('id', taskId).select().single();
    if (data) {
      setTasks(tasks.map(t => t.id === taskId ? data : t));
    }
  }

  async function handleAddLog(e: FormEvent) {
    e.preventDefault();
    if (!selectedProject) return;
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const { data, error } = await supabase.from('project_logs').insert({
      project_id: selectedProject.id,
      task_id: (form.get('task_id') as string) || null,
      content: form.get('content') as string,
      created_by: currentUser?.id || null,
    }).select().single();
    if (!error && data) {
      setLogs([data, ...logs]);
      setShowAddLogModal(false);
    }
  }

  async function handleDeleteLog(logId: string) {
    await supabase.from('project_logs').delete().eq('id', logId);
    setLogs(logs.filter(l => l.id !== logId));
  }

  async function handleSaveLogEdit(logId: string) {
    if (!editingLogContent.trim()) return;
    const { data } = await supabase.from('project_logs').update({
      content: editingLogContent.trim(),
      edited_at: new Date().toISOString(),
      edited_by: currentUser?.id || null,
    }).eq('id', logId).select().single();
    if (data) {
      setLogs(logs.map(l => l.id === logId ? data : l));
      setEditingLogId(null);
      setEditingLogContent('');
    }
  }


  function toggleTaskExpand(taskId: string) {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  // ── Render: Detail View ──
  if (selectedProject) {
    const cat = CATEGORY_MAP[selectedProject.category] || CATEGORY_MAP.general;
    const status = PROJECT_STATUS_MAP[selectedProject.status] || PROJECT_STATUS_MAP.planning;
    const transitions = PROJECT_TRANSITIONS[selectedProject.status] || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{selectedProject.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.color}`}>{cat.label}</span>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => handleDeleteProject(selectedProject.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {selectedProject.description && <p className="text-gray-600 mb-4">{selectedProject.description}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={14} />
              <span>{new Date(selectedProject.start_date).toLocaleDateString('id-ID')}</span>
              {selectedProject.end_date && <span> — {new Date(selectedProject.end_date).toLocaleDateString('id-ID')}</span>}
            </div>
            {selectedProject.budget != null && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign size={14} />
                <span>{fmt(selectedProject.spent || 0)} / {fmt(selectedProject.budget)}</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">{doneRootTasks} dari {totalRootTasks} tugas selesai</span>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${computedProgress}%` }} />
              </div>
            </div>
          </div>
          {/* Status workflow */}
          {transitions.length > 0 && isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 mr-1">Ubah status:</span>
              {transitions.map(nextStatus => {
                const next = PROJECT_STATUS_MAP[nextStatus];
                return next ? (
                  <button key={nextStatus} onClick={() => handleUpdateProjectStatus(selectedProject.id, nextStatus)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border hover:shadow-sm transition ${next.color}`}>
                    <ArrowRight size={12} /> {next.label}
                  </button>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <ListTodo size={16} /> Tugas ({rootTasks.length})
          </button>
          <button onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <MessageSquare size={16} /> Log Aktivitas ({logs.length})
          </button>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {isAdmin && (
                <button onClick={() => setShowAddTaskModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm">
                  <Plus size={18} /> Tambah Tugas
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setTaskFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${taskFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semua Tugas</button>
                  <button onClick={() => setTaskFilter('mine')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${taskFilter === 'mine' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tugas Saya</button>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setTaskView('board')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${taskView === 'board' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Board</button>
                  <button onClick={() => setTaskView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${taskView === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>List</button>
                </div>
              </div>
            </div>
            {visibleTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Belum ada tugas dalam proyek ini.</div>
            ) : taskView === 'board' ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map(col => {
                  const colTasks = visibleTasks.filter(t => t.status === col.key);
                  return (
                    <div key={col.key} className={`flex-shrink-0 w-72 ${col.bg} rounded-xl border ${col.border}`}>
                      <div className={`px-4 py-3 ${col.headerBg} rounded-t-xl flex items-center justify-between`}>
                        <span className={`text-sm font-semibold ${col.headerText}`}>{col.label}</span>
                        <span className={`text-xs font-medium ${col.headerText} opacity-70`}>{colTasks.length}</span>
                      </div>
                      <div className="p-3 space-y-3 min-h-[120px]">
                        {colTasks.map(task => {
                          const subtasks = getSubtasks(task.id);
                          const isExpanded = expandedTasks.has(task.id);
                          const pr = PRIORITY_MAP[task.priority];
                          const assignee = getProfile(task.assignee_id);
                          const taskTrans = TASK_TRANSITIONS[task.status] || [];
                          const hasSubtasks = subtasks.length > 0;
                          return (
                            <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-medium text-gray-800 text-sm leading-tight">{task.title}</h4>
                                {hasSubtasks && (
                                  <button onClick={() => toggleTaskExpand(task.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${pr?.color || ''}`}>{pr?.label || task.priority}</span>
                                {task.approval_status === 'pending' && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                    <Clock size={9} /> Menunggu
                                  </span>
                                )}
                                {task.approval_status === 'approved' && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                    <Check size={9} /> Disetujui
                                  </span>
                                )}
                                {task.approval_status === 'rejected' && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                    <XCircle size={9} /> Ditolak
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                {assignee && (
                                  <span className="flex items-center gap-1"><User size={11} /> {assignee.name}</span>
                                )}
                                {task.due_date && (
                                  <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(task.due_date).toLocaleDateString('id-ID')}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {taskTrans.map(nextStatus => {
                                  const next = TASK_STATUS_MAP[nextStatus];
                                  return next ? (
                                    <button key={nextStatus} onClick={() => handleUpdateTaskStatus(task.id, nextStatus)}
                                      className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50" title={`Ubah ke ${next.label}`}>
                                      → {next.label}
                                    </button>
                                  ) : null;
                                })}
                                {task.approval_status === 'none' && task.assignee_id !== currentUser?.id && (
                                  <button onClick={() => handleRequestTask(task.id)}
                                    className="flex items-center gap-0.5 px-2 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                                    <Send size={10} /> Minta
                                  </button>
                                )}
                                {task.approval_status === 'pending' && isAdmin && (
                                  <>
                                    <button onClick={() => handleApproveTask(task.id, true)}
                                      className="flex items-center gap-0.5 px-2 py-1 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100">
                                      <Check size={10} />
                                    </button>
                                    <button onClick={() => handleApproveTask(task.id, false)}
                                      className="flex items-center gap-0.5 px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">
                                      <XCircle size={10} />
                                    </button>
                                  </>
                                )}
                              </div>
                              {isExpanded && hasSubtasks && (
                                <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                                  {subtasks.map(sub => {
                                    const sts = TASK_STATUS_MAP[sub.status];
                                    const subAssignee = getProfile(sub.assignee_id);
                                    return (
                                      <div key={sub.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                          <span className="text-xs text-gray-700 truncate">{sub.title}</span>
                                          <span className={`px-1 py-0.5 rounded text-[10px] ${sts?.color || ''}`}>{sts?.label || sub.status}</span>
                                          {subAssignee && <span className="text-[10px] text-gray-400 truncate">— {subAssignee.name}</span>}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {(TASK_TRANSITIONS[sub.status] || []).map(nextStatus => {
                                            const next = TASK_STATUS_MAP[nextStatus];
                                            return next ? (
                                              <button key={nextStatus} onClick={() => handleUpdateTaskStatus(sub.id, nextStatus)}
                                                className="px-1 py-0.5 text-[10px] rounded border border-gray-200 hover:bg-gray-50">
                                                → {next.label}
                                              </button>
                                            ) : null;
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <AddSubtaskInline parentId={task.id} onAdd={handleAddSubtask} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleTasks.map(task => {
                  const subtasks = getSubtasks(task.id);
                  const isExpanded = expandedTasks.has(task.id);
                  const ts = TASK_STATUS_MAP[task.status];
                  const pr = PRIORITY_MAP[task.priority];
                  const assignee = getProfile(task.assignee_id);
                  const taskTrans = TASK_TRANSITIONS[task.status] || [];
                  const hasSubtasks = subtasks.length > 0;

                  return (
                    <div key={task.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {hasSubtasks && (
                              <button onClick={() => toggleTaskExpand(task.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                            <h4 className="font-medium text-gray-800">{task.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ts?.color || ''}`}>{ts?.label || task.status}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pr?.color || ''}`}>{pr?.label || task.priority}</span>
                            {task.approval_status === 'pending' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Clock size={10} /> Menunggu Persetujuan
                              </span>
                            )}
                            {task.approval_status === 'approved' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Check size={10} /> Disetujui
                              </span>
                            )}
                            {task.approval_status === 'rejected' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle size={10} /> Ditolak
                              </span>
                            )}
                          </div>
                          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                            {assignee && (
                              <span className="flex items-center gap-1"><User size={12} /> {assignee.name}</span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(task.due_date).toLocaleDateString('id-ID')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                          {taskTrans.map(nextStatus => {
                            const next = TASK_STATUS_MAP[nextStatus];
                            return next ? (
                              <button key={nextStatus} onClick={() => handleUpdateTaskStatus(task.id, nextStatus)}
                                className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50" title={`Ubah ke ${next.label}`}>
                                → {next.label}
                              </button>
                            ) : null;
                          })}
                          {task.approval_status === 'none' && task.assignee_id !== currentUser?.id && (
                            <button onClick={() => handleRequestTask(task.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                              <Send size={12} /> Minta Tugas
                            </button>
                          )}
                          {task.approval_status === 'pending' && isAdmin && (
                            <>
                              <button onClick={() => handleApproveTask(task.id, true)}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100">
                                <Check size={12} /> Setujui
                              </button>
                              <button onClick={() => handleApproveTask(task.id, false)}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">
                                <XCircle size={12} /> Tolak
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Subtasks */}
                      {isExpanded && hasSubtasks && (
                        <div className="mt-3 ml-6 space-y-2 border-l-2 border-gray-100 pl-4">
                          {subtasks.map(sub => {
                            const sts = TASK_STATUS_MAP[sub.status];
                            const subAssignee = getProfile(sub.assignee_id);
                            return (
                              <div key={sub.id} className="flex items-center justify-between gap-2 py-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-gray-700">{sub.title}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${sts?.color || ''}`}>{sts?.label || sub.status}</span>
                                  {subAssignee && <span className="text-xs text-gray-400">— {subAssignee.name}</span>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {(TASK_TRANSITIONS[sub.status] || []).map(nextStatus => {
                                    const next = TASK_STATUS_MAP[nextStatus];
                                    return next ? (
                                      <button key={nextStatus} onClick={() => handleUpdateTaskStatus(sub.id, nextStatus)}
                                        className="px-1.5 py-0.5 text-xs rounded border border-gray-200 hover:bg-gray-50">
                                        → {next.label}
                                      </button>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            );
                          })}
                          <AddSubtaskInline parentId={task.id} onAdd={handleAddSubtask} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {isAdmin && (
              <button onClick={() => setShowAddLogModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm">
                <Plus size={18} /> Tambah Log
              </button>
            )}
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Belum ada log aktivitas.</div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => {
                  const author = getProfile(log.created_by);
                  const isEditing = editingLogId === log.id;
                  return (
                    <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingLogContent}
                                onChange={e => setEditingLogContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveLogEdit(log.id)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                  Simpan
                                </button>
                                <button onClick={() => { setEditingLogId(null); setEditingLogContent(''); }}
                                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700">{log.content}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <Clock size={12} />
                            <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                            {author && <span>— {author.name}</span>}
                            {log.edited_at && (
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">Diedit</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isEditing && (
                            <button onClick={() => { setEditingLogId(log.id); setEditingLogContent(log.content); }}
                              className="p-1 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-500" title="Edit log">
                              <Pencil size={14} />
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={() => handleDeleteLog(log.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tambah Tugas</h2>
                <button onClick={() => setShowAddTaskModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Tugas</label>
                  <input name="title" required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                  <select name="priority" defaultValue="medium" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Mendesak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tugaskan Ke</label>
                  <select name="assignee_id" defaultValue="" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Belum Ditugaskan —</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddTaskModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Buat</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Log Modal */}
        {showAddLogModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tambah Log Aktivitas</h2>
                <button onClick={() => setShowAddLogModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <form onSubmit={handleAddLog} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Isi Log</label>
                  <textarea name="content" rows={3} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tuliskan aktivitas yang dilakukan..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terkait Tugas (opsional)</label>
                  <select name="task_id" defaultValue="" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Tidak Terkait Tugas —</option>
                    {rootTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddLogModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: List View ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Proyek</h1>
          <p className="text-gray-500">Kelola dan pantau proyek perusahaan</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm">
            <Plus size={18} /> Tambah Proyek
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {[{ key: 'all', label: 'Semua', color: '' }, ...PROJECT_STATUS].map(s => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === s.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ key: 'all', label: 'Semua Kategori', color: '' }, ...CATEGORIES].map(c => (
            <button key={c.key} onClick={() => setFilterCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterCategory === c.key ? 'bg-blue-600 text-white' : c.key === 'all' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : `${c.color} hover:opacity-80`}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Belum ada proyek. Klik "Tambah Proyek" untuk membuat baru.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => {
            const cat = CATEGORY_MAP[project.category] || CATEGORY_MAP.general;
            const status = PROJECT_STATUS_MAP[project.status] || PROJECT_STATUS_MAP.planning;
            return (
              <div key={project.id} onClick={() => setSelectedProject(project)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 rounded-lg bg-blue-50"><FolderKanban className="text-blue-500" size={24} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
                <div className="mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>{cat.label}</span>
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
                {project.budget != null && (
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
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tambah Proyek Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Proyek</label>
                <input name="name" required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select name="category" defaultValue="general" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
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
