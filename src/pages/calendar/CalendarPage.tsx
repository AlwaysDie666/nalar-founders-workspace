import { useState, useEffect } from 'react';
import { fetchEvents, createEvent } from '../../lib/api/events';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react';

const typeColors: Record<string, string> = {
  meeting: 'bg-blue-100 text-blue-700 border-blue-300',
  deadline: 'bg-red-100 text-red-700 border-red-300',
  event: 'bg-green-100 text-green-700 border-green-300',
  reminder: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

const typeDots: Record<string, string> = {
  meeting: 'bg-blue-500',
  deadline: 'bg-red-500',
  event: 'bg-green-500',
  reminder: 'bg-yellow-500',
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

interface RawEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: string;
  created_by?: string;
}

export default function CalendarPage() {
  const { currentUser } = useApp();
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '', type: 'meeting' });

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data || []);
    } catch {
      // empty
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) =>
    events.filter((e) => {
      const d = new Date(e.start_time);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

  const upcomingEvents = events
    .filter((e) => new Date(e.start_time) >= today)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await createEvent({
        title: form.title,
        description: form.description || undefined,
        start_time: form.start_time,
        end_time: form.end_time,
        type: form.type,
        created_by: currentUser.id,
      });
      setShowAdd(false);
      setForm({ title: '', description: '', start_time: '', end_time: '', type: 'meeting' });
      loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kalender</h1>
          <p className="text-gray-500">Kelola jadwal dan acara Anda</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{MONTHS[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div key={day} className={`min-h-[80px] p-2 border rounded-lg ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div key={event.id} className={`text-xs px-1 py-0.5 rounded border ${typeColors[event.type] || 'bg-gray-100 text-gray-700'}`}>
                        {event.title.substring(0, 12)}{event.title.length > 12 ? '...' : ''}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-xs text-gray-500">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Acara Mendatang</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className={`p-4 rounded-lg border ${typeColors[event.type] || 'bg-gray-100 text-gray-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${typeDots[event.type] || 'bg-gray-500'}`} />
                  <span className="text-xs font-medium uppercase">{event.type}</span>
                </div>
                <h3 className="font-medium text-gray-800">{event.title}</h3>
                {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{new Date(event.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && <p className="text-gray-400 text-center py-4">Belum ada acara</p>}
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tambah Acara</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="event">Event</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
                <input type="datetime-local" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
                <input type="datetime-local" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
