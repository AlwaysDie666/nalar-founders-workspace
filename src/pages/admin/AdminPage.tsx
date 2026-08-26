import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { Plus, Trash2, X } from 'lucide-react';

const roleOptions = [
  { value: 'ceo', label: 'CEO' },
  { value: 'cto', label: 'CTO' },
  { value: 'cpo', label: 'CPO' },
  { value: 'cmo', label: 'CMO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'coo', label: 'COO' },
  { value: 'kreatif', label: 'Kreatif' },
];

const roleColors: Record<string, string> = {
  ceo: 'bg-purple-100 text-purple-700',
  cto: 'bg-blue-100 text-blue-700',
  cpo: 'bg-green-100 text-green-700',
  cmo: 'bg-pink-100 text-pink-700',
  cfo: 'bg-amber-100 text-amber-700',
  coo: 'bg-orange-100 text-orange-700',
  kreatif: 'bg-gray-100 text-gray-700',
};

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', role: 'kreatif' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    setUsers(data || []);
    setLoading(false);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    // Check if email already exists
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', form.email).single();
    if (existing) {
      setMessage('Email sudah terdaftar.');
      return;
    }

    // Create auth user with a temporary password
    const tempPassword = 'Nalar@' + Math.random().toString(36).slice(-6);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      setMessage('Gagal membuat akun: ' + authError.message);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: form.email,
      full_name: form.full_name,
      role: form.role,
      is_active: true,
      needs_password_change: true,
    });

    if (profileError) {
      setMessage('Gagal membuat profil: ' + profileError.message);
      return;
    }

    setMessage(`Akun berhasil dibuat! Password sementara: ${tempPassword}`);
    setForm({ email: '', full_name: '', role: 'kreatif' });
    setShowAdd(false);
    loadUsers();
  }

  async function handleDeleteUser(id: string) {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    await supabaseAdmin.auth.admin.deleteUser(id);
    loadUsers();
  }

  async function handleToggleActive(id: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    loadUsers();
  }

  async function handleRoleChange(id: string, newRole: string) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    loadUsers();
  }

  if (currentUser?.role !== 'coo') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Hanya COO yang bisa mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h1>
          <p className="text-gray-500">Kelola akun dan role anggota tim</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Tambah User
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('berhasil') || message.includes('Password') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
          <button onClick={() => setMessage('')} className="ml-2 font-bold">×</button>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tambah User Baru</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" required value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <button type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Buat Akun
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat data...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada pengguna terdaftar</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">User</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                      {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.id !== currentUser?.id && (
                      <button onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
