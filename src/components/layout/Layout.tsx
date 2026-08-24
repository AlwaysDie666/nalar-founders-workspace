import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  DollarSign,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  Shield,
  Settings,
} from 'lucide-react';
import type { UserRole } from '../../types';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tugas', icon: CheckSquare },
  { path: '/projects', label: 'Proyek', icon: FolderKanban },
  { path: '/invoices', label: 'Faktur', icon: FileText },
  { path: '/finance', label: 'Keuangan', icon: DollarSign },
  { path: '/reports', label: 'Laporan', icon: BarChart3 },
  { path: '/calendar', label: 'Kalender', icon: Calendar },
  { path: '/chat', label: 'Pesan', icon: MessageSquare },
];

const roleConfig: Record<UserRole, { color: string; bg: string; dot: string; label: string }> = {
  ceo: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500', label: 'CEO' },
  cto: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', label: 'CTO' },
  cpo: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', label: 'CPO' },
  cmo: { color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200', dot: 'bg-pink-500', label: 'CMO' },
  cfo: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'CFO' },
  coo: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', label: 'COO' },
  kreatif: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-500', label: 'Kreatif' },
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser, sidebarOpen, setSidebarOpen, logout } = useApp();
  const location = useLocation();

  const role = currentUser?.role || 'kreatif';
  const roleStyle = roleConfig[role];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            {sidebarOpen && <span className="text-lg font-bold text-gray-900 tracking-tight">NALAR</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {currentUser?.name?.charAt(0) || '?'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email || ''}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-72 transition" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${roleStyle.bg} ${roleStyle.color}`}>
              <span className={`w-2 h-2 rounded-full ${roleStyle.dot}`}></span>
              <span>{roleStyle.label}</span>
            </div>

            {role === 'coo' && (
              <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition">
                <Settings size={20} />
              </Link>
            )}

            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="w-px h-8 bg-gray-200"></div>

            <button onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
              <LogOut size={18} />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
