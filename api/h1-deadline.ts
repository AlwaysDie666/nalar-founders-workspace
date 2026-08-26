import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: urgentTasks, error: taskError } = await supabase
      .from('tasks')
      .select('title, due_date, assignee:profiles(name, email), project:projects(name)')
      .eq('priority', 'urgent')
      .eq('due_date', tomorrowStr)
      .in('status', ['todo', 'in_progress']);

    if (taskError) throw taskError;
    if (!urgentTasks || urgentTasks.length === 0) {
      return res.status(200).json({ message: 'Tidak ada task urgent dengan deadline besok.' });
    }

    let sentCount = 0;

    for (const task of urgentTasks) {
      const assignee = task.assignee as any;
      if (!assignee?.email) continue;

      const project = task.project as any;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="color:#dc2626;">⚠️ Deadline Besok!</h1>
          <p>Halo ${assignee.name || 'Tim'},</p>
          <p>Tugas berikut memiliki deadline <strong>besok</strong>:</p>
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin:20px 0;">
            <h2 style="margin:0 0 5px 0;color:#991b1b;">${task.title}</h2>
            <p style="margin:5px 0;color:#6b7280;">Proyek: ${project?.name || '-'}</p>
            <p style="margin:5px 0;color:#dc2626;font-weight:bold;">Deadline: ${new Date(task.due_date).toLocaleDateString('id-ID')}</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;">Email ini dikirim otomatis oleh Nalar Workspace.</p>
        </div>
      `;

      await resend.emails.send({
        from: 'Nalar Workspace <noreply@nalar.co.id>',
        to: assignee.email,
        subject: `⚠️ Deadline Besok: ${task.title}`,
        html,
      });

      sentCount++;
    }

    return res.status(200).json({ success: true, sent: sentCount });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal mengirim H-1 deadline reminder.' });
  }
}
