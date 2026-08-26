// Email HTML template helpers — client-safe, no Resend/process imports.
// Actual sending happens in api/ Vercel serverless functions.

export function buildWeeklyReportHtml(data: {
  period: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  activeProjects: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">Laporan Mingguan Nalar Workspace</h1>
      <p style="color: #6b7280;">Periode: ${data.period}</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin: 0 0 10px 0;">Ringkasan Tugas</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0;">Total Tugas</td><td style="text-align: right; font-weight: bold;">${data.totalTasks}</td></tr>
          <tr><td style="padding: 5px 0;">Selesai</td><td style="text-align: right; color: #16a34a; font-weight: bold;">${data.completedTasks}</td></tr>
          <tr><td style="padding: 5px 0;">Sedang Dikerjakan</td><td style="text-align: right; color: #2563eb; font-weight: bold;">${data.inProgressTasks}</td></tr>
          <tr><td style="padding: 5px 0;">Terlambat</td><td style="text-align: right; color: #dc2626; font-weight: bold;">${data.overdueTasks}</td></tr>
        </table>
      </div>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin: 0 0 10px 0;">Ringkasan Keuangan</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0;">Total Pendapatan</td><td style="text-align: right; color: #16a34a; font-weight: bold;">Rp ${data.totalIncome.toLocaleString('id-ID')}</td></tr>
          <tr><td style="padding: 5px 0;">Total Pengeluaran</td><td style="text-align: right; color: #dc2626; font-weight: bold;">Rp ${data.totalExpense.toLocaleString('id-ID')}</td></tr>
          <tr><td style="padding: 5px 0;">Laba Bersih</td><td style="text-align: right; font-weight: bold;">Rp ${data.netProfit.toLocaleString('id-ID')}</td></tr>
        </table>
      </div>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin: 0 0 10px 0;">Proyek Aktif: ${data.activeProjects}</h2>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Email ini dikirim otomatis oleh Nalar Workspace.</p>
    </div>
  `;
}
