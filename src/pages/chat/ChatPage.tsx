import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { Send, Hash, Users, Search } from 'lucide-react';

const channels = [
  { id: 'umum', name: 'Umum' },
  { id: 'teknologi', name: 'Teknologi' },
  { id: 'keuangan', name: 'Keuangan' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'operasional', name: 'Operasional' },
];

const roleColors: Record<string, string> = {
  ceo: 'from-purple-500 to-pink-500',
  cto: 'from-blue-500 to-cyan-500',
  cpo: 'from-green-500 to-emerald-500',
  cmo: 'from-pink-500 to-rose-500',
  cfo: 'from-yellow-500 to-orange-500',
  coo: 'from-orange-500 to-red-500',
  kreatif: 'from-gray-500 to-gray-600',
};

interface MessageRow {
  id: string;
  content: string;
  channel: string;
  created_at: string;
  sender: { full_name: string; role: string } | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
}

export default function ChatPage() {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [activeChannel, setActiveChannel] = useState('umum');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadMessages(); loadUsers(); }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, role)')
      .eq('channel', 'umum')
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('id, full_name, role');
    setUsers(data || []);
  }

  async function switchChannel(channelId: string) {
    setActiveChannel(channelId);
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, role)')
      .eq('channel', channelId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function handleSend() {
    if (!newMessage.trim() || !currentUser) return;
    const { data, error } = await supabase
      .from('messages')
      .insert({ content: newMessage, sender_id: currentUser.id, channel: activeChannel })
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, role)')
      .single();
    if (!error && data) {
      setMessages([...messages, data]);
      setNewMessage('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Channel</h2>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {channels.map((ch) => (
            <button key={ch.id} onClick={() => switchChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 ${activeChannel === ch.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Hash size={16} />
              <span>{ch.name}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Tim</h3>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${roleColors[u.role] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white text-xs`}>
                  {u.full_name.charAt(0)}
                </div>
                <span className="text-sm text-gray-600">{u.full_name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Hash size={18} className="text-gray-400" />
            <span className="font-medium text-gray-800">{channels.find((c) => c.id === activeChannel)?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg"><Search size={18} className="text-gray-500" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg"><Users size={18} className="text-gray-500" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg) => {
            const senderName = (msg.sender as { full_name: string })?.full_name || 'User';
            const senderRole = (msg.sender as { role: string })?.role || 'kreatif';
            return (
              <div key={msg.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColors[senderRole]} flex items-center justify-center text-white text-sm flex-shrink-0`}>
                  {senderName.charAt(0)}
                </div>
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800 text-sm">{senderName}</span>
                    <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="inline-block px-4 py-2 rounded-2xl text-sm bg-gray-100 text-gray-800 rounded-tl-none">{msg.content}</div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && <div className="text-center py-12 text-gray-400">Belum ada pesan di channel ini</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..." className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleSend} disabled={!newMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
