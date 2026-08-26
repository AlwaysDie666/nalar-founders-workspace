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
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .not('email', 'is', null);

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ message: 'Tidak ada user untuk dikirimi email.' });
    }

    let sentCount = 0;

    for (const profile of profiles) {
      const { data: pendingTasks } = await supabase
        .from('tasks')
        .select('title, project:projects(name), due_date, status')
        .eq('assignee_id', profile.id)
        .in('status', ['todo', 'in_progress']);

      if (!pendingTasks || pendingTasks.length === 0) continue;

      const taskRows = pendingTasks.map((t: any) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${t.title}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${t.project?.name || '-'}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${t.due_date ? new Date(t.due_date).toLocaleDateString('id-ID') : '-'}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${t.status === 'in_progress' ? 'Sedang Dikerjakan' : 'Belum Dikerjakan'}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="color:#1e40af;">Reminder Update Progress Mingguan</h1>
          <p>Halo ${profile.name || 'Tim'},</p>
          <p>Berikut adalah tugas-tugas yang perlu kamu update progress-nya:</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:8px;text-align:left;">Tugas</th>
                <th style="padding:8px;text-align:left;">Proyek</th>
                <th style="padding:8px;text-align:left;">Deadline</th>
                <th style="padding:8px;text-align:left;">Status</th>
              </tr>
            </thead>
            <tbody>${taskRows}</tbody>
          </table>
          <p style="color:#9ca3af;font-size:12px;">Email ini dikirim otomatis setiap minggu oleh Nalar Workspace.</p>
        </div>
      `;

      await resend.emails.send({
        from: 'Nalar Workspace <noreply@nalar.co.id>',
        to: profile.email,
        subject: 'Reminder Update Progress Mingguan - Nalar Workspace',
        html,
      });

      sentCount++;
    }

    return res.status(200).json({ success: true, sent: sentCount });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal mengirim weekly task reminder.' });
  }
}
