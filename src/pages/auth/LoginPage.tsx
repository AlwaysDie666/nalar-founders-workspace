import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.error) {
      setError('Email atau password salah.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Shield size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NALAR GROUP</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Founder Workspace<br />
            <span className="text-blue-400">Management System</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-md">
            Platform terpadu untuk mengelola operasional perusahaan.
            Akses dashboard, tugas, proyek, keuangan, dan komunikasi tim
            dalam satu sistem yang aman.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold">7</div>
              <div className="text-sm text-slate-400">Role Akses</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-slate-400">Modul Utama</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-slate-400">Akses Online</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold">Real-time</div>
              <div className="text-sm text-slate-400">Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">NALAR GROUP</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Masuk ke Workspace</h2>
          <p className="text-gray-500 mt-1 mb-8">Gunakan akun yang telah didaftarkan</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="nama@nalar.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Masukkan password" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 disabled:opacity-70">
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">Daftar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
