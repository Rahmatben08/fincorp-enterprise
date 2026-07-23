import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';

Chart.register(...registerables);

interface SuperadminPanelProps {
  isDark: boolean;
  theme: string;
}

export const SuperadminPanel: React.FC<SuperadminPanelProps> = ({ isDark, theme }) => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cashflowChartRef = useRef<HTMLCanvasElement>(null);
  const budgetChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          pendingRes, activeRes, txRes, invRes, payRes, budRes, auditRes
        ] = await Promise.allSettled([
          api.get('/users/pending'),
          api.get('/users/active'),
          api.get('/transactions'),
          api.get('/invoices'),
          api.get('/payables'),
          api.get('/budgets'),
          api.get('/audit-logs')
        ]);

        if (pendingRes.status === 'fulfilled') setPendingUsers(pendingRes.value.data);
        if (activeRes.status === 'fulfilled') setActiveUsers(activeRes.value.data);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value.data.data || txRes.value.data);
        if (invRes.status === 'fulfilled') setInvoices(invRes.value.data);
        if (payRes.status === 'fulfilled') setPayables(payRes.value.data);
        if (budRes.status === 'fulfilled') setBudgets(budRes.value.data);
        if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch superadmin aggregate data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Compute Aggregates
  const totalActiveUsers = activeUsers.length;
  const totalPendingUsers = pendingUsers.length;
  
  const today = new Date().toISOString().split('T')[0];
  const txToday = Array.isArray(transactions) ? transactions.filter(tx => {
    const txDate = (tx.date || tx.transactionDate || '').split('T')[0];
    return txDate === today;
  }).length : 0;

  // Budget Health Avg
  let totalAllocated = 0;
  let totalUsed = 0;
  budgets.forEach(b => {
    totalAllocated += Number(b.allocated || 0);
    totalUsed += Number(b.used || 0);
  });
  const avgBudgetUsed = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;
  
  let budgetHealthStatus = 'Sehat';
  let budgetHealthClass = 'text-[#1A7D47] bg-green-50';
  if (avgBudgetUsed >= 90) {
    budgetHealthStatus = 'Kritis';
    budgetHealthClass = 'text-red-700 bg-red-50';
  } else if (avgBudgetUsed >= 75) {
    budgetHealthStatus = 'Waspada';
    budgetHealthClass = 'text-yellow-700 bg-yellow-50';
  }

  // Financial Overview
  const totalIncome = Array.isArray(transactions) ? transactions.filter(t => t.type === 'income' && t.status === 'approved').reduce((sum, t) => sum + Number(t.amount || 0), 0) : 0;
  const totalExpense = Array.isArray(transactions) ? transactions.filter(t => t.type === 'expense' && t.status === 'approved').reduce((sum, t) => sum + Number(t.amount || 0), 0) : 0;
  const netCash = totalIncome - totalExpense;

  const totalAR = Array.isArray(invoices) ? invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.amount || 0), 0) : 0;
  const totalAP = Array.isArray(payables) ? payables.filter(p => p.status !== 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  // Render Charts
  useEffect(() => {
    if (loading) return;

    let cashflowChartInstance: Chart | null = null;
    let budgetChartInstance: Chart | null = null;

    if (cashflowChartRef.current && Array.isArray(transactions)) {
      const monthlyData = Array.from({length: 6}, (_, i) => {
        const month = i + 1;
        const monthTx = transactions.filter(tx => {
          if (!tx.date && !tx.transactionDate) return false;
          const txDateObj = new Date(tx.date || tx.transactionDate);
          return (txDateObj.getMonth() + 1) === month && txDateObj.getFullYear() === 2026;
        });
        
        const income = monthTx.filter(tx => tx.type === 'income' && tx.status === 'approved').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        const expense = monthTx.filter(tx => tx.type === 'expense' && tx.status === 'approved').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        
        return { month, income, expense, net: income - expense };
      });

      cashflowChartInstance = new Chart(cashflowChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
          datasets: [
            {
              type: 'bar',
              label: 'Total Pendapatan',
              data: monthlyData.map(d => d.income),
              backgroundColor: 'rgba(26, 125, 71, 0.8)',
              borderRadius: 6,
              order: 2
            },
            {
              type: 'bar', 
              label: 'Total Pengeluaran',
              data: monthlyData.map(d => d.expense),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderRadius: 6,
              order: 2
            },
            {
              type: 'line',
              label: 'Kas Bersih',
              data: monthlyData.map(d => d.net),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2.5,
              pointBackgroundColor: '#3b82f6',
              pointRadius: 5,
              pointHoverRadius: 7,
              tension: 0.4,
              fill: false,
              order: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (ctx) => {
                  const val = ctx.parsed.y as number;
                  return `${ctx.dataset.label}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#6b7280' }
            },
            y: {
              grid: { 
                color: 'rgba(107, 114, 128, 0.1)',
                drawBorder: false
              } as any,
              ticks: {
                color: '#6b7280',
                callback: (val) => {
                  if (Math.abs(val as number) >= 1000000) return `Rp ${((val as number)/1000000).toFixed(0)}jt`;
                  return `Rp ${val}`;
                }
              }
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          }
        }
      });
    }

    if (budgetChartRef.current && Array.isArray(budgets) && budgets.length > 0) {
      const labels = budgets.map(b => b.division || b.division_name);
      const data = budgets.map(b => Number(b.allocated || 0));
      
      budgetChartInstance = new Chart(budgetChartRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ['#1A7D47', '#2563eb', '#0891b2', '#0d9488', '#059669', '#4f46e5'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    }

    return () => {
      if (cashflowChartInstance) cashflowChartInstance.destroy();
      if (budgetChartInstance) budgetChartInstance.destroy();
    };
  }, [loading, transactions, budgets]);

  const getTimeAgo = (dateString: string) => {
    const logDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - logDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${Math.floor(diffHours / 24)} hari lalu`;
  };

  const getBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (act.includes('APPROVE') || act.includes('VERIFIED') || act.includes('LUNAS') || act.includes('SUCCESS')) return 'bg-green-100 text-green-700 border-green-200';
    if (act.includes('REJECT') || act.includes('FAIL') || act.includes('ERROR') || act.includes('MISMATCH')) return 'bg-red-100 text-red-700 border-red-200';
    if (act.includes('CREATE')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (act.includes('DEACTIVATE')) return 'bg-gray-100 text-gray-700 border-gray-200';
    return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  };

  if (loading) return <div className="text-center py-20">Loading Eagle Eye Dashboard...</div>;

  return (
    <div className="space-y-6 animate-fade-in mb-20 max-w-7xl mx-auto">
      <div className="mb-6 mt-6">
        <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Dashboard Superadmin</h1>
        <p className="text-sm text-zinc-500 mt-1">Eagle Eye Overview: Ringkasan seluruh metrik sistem dan aktivitas platform</p>
      </div>

      {/* SECTION 1: SYSTEM HEALTH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-3xl p-6 shadow-sm bg-indigo-50 border border-indigo-100 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Total User Aktif</p>
            <div className="text-4xl font-black text-indigo-900">{totalActiveUsers}</div>
          </div>
        </div>
        <div className={`rounded-3xl p-6 shadow-sm bg-amber-50 border border-amber-100 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1`}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            {totalPendingUsers > 0 && <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse shadow-sm">Aksi Dibutuhkan</span>}
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Pending Akun</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-amber-900">{totalPendingUsers}</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl p-6 shadow-sm bg-emerald-50 border border-emerald-100 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Transaksi Hari Ini</p>
            <div className="text-4xl font-black text-emerald-900">{txToday}</div>
          </div>
        </div>
        <div className="rounded-3xl p-6 shadow-sm bg-sky-50 border border-sky-100 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
            <Link to="/budgets" className="text-[10px] font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full hover:bg-sky-200 transition-colors">Lihat &rarr;</Link>
          </div>
          <div>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">Budget Health</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xl font-black ${budgetHealthClass.split(' ')[0]}`}>{budgetHealthStatus}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${budgetHealthClass}`}>{avgBudgetUsed.toFixed(1)}% Used</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FINANCIAL OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl p-8 shadow-sm bg-emerald-50 border border-emerald-100 relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 group">
          <div className="absolute -right-4 -top-4 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-9xl">account_balance</span>
          </div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 relative z-10">Total Kas Bersih</p>
          <p className="text-4xl font-black text-emerald-900 truncate relative z-10 tracking-tight">{formatRupiah(netCash)}</p>
          <p className="text-xs text-emerald-600/80 mt-2 font-medium relative z-10">Selisih Pemasukan & Pengeluaran Disetujui</p>
        </div>
        <div className="rounded-3xl p-8 shadow-sm bg-blue-50 border border-blue-100 relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 group">
          <div className="absolute -right-4 -top-4 opacity-10 text-blue-500 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-9xl">arrow_upward_alt</span>
          </div>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 relative z-10">Total Piutang Berjalan</p>
          <p className="text-4xl font-black text-blue-900 truncate relative z-10 tracking-tight">{formatRupiah(totalAR)}</p>
          <p className="text-xs text-blue-600/80 mt-2 font-medium relative z-10">Tagihan klien belum lunas</p>
        </div>
        <div className="rounded-3xl p-8 shadow-sm bg-rose-50 border border-rose-100 relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 group">
          <div className="absolute -right-4 -top-4 opacity-10 text-rose-500 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-9xl">arrow_downward_alt</span>
          </div>
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2 relative z-10">Total Utang Berjalan</p>
          <p className="text-4xl font-black text-rose-900 truncate relative z-10 tracking-tight">{formatRupiah(totalAP)}</p>
          <p className="text-xs text-rose-600/80 mt-2 font-medium relative z-10">Tagihan vendor belum dibayar</p>
        </div>
      </div>

      {/* SECTION 3: DUAL CHART */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 shadow-sm bg-white border border-zinc-200">
          <h3 className="text-sm font-black text-zinc-900 mb-4">Visualisasi Arus Kas & Likuiditas (H1)</h3>
          <div style={{ height: '320px', position: 'relative' }} className="w-full">
            {transactions.length > 0 ? <canvas ref={cashflowChartRef}></canvas> : <div className="absolute inset-0 flex justify-center items-center text-sm text-zinc-400">Tidak ada data transaksi</div>}
          </div>
        </div>
        <div className="rounded-2xl p-6 shadow-sm bg-white border border-zinc-200">
          <h3 className="text-sm font-black text-zinc-900 mb-4">Komposisi Budget per Divisi</h3>
          <div className="h-64 relative w-full">
            {budgets.length > 0 ? <canvas ref={budgetChartRef}></canvas> : <div className="absolute inset-0 flex justify-center items-center text-sm text-zinc-400">Tidak ada data budget</div>}
          </div>
        </div>
      </div>

      {/* SECTION 4 & 5: AUDIT LOGS & PENDING WIDGET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Audit Logs (takes 2 columns) */}
        <div className="rounded-2xl p-6 shadow-sm bg-white border border-zinc-200 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-zinc-900">Recent Audit Logs</h3>
            <Link to="/audit-trail" className="text-xs font-bold text-[#1A7D47] hover:underline">Lihat Semua Log →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-4">Waktu</th>
                  <th className="py-2 px-4">User</th>
                  <th className="py-2 px-4">Aksi</th>
                  <th className="py-2 px-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.length > 0 ? auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{new Date(log.created_at || log.timestamp).toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase text-white shadow-sm
                          ${(log.user || 'S').substring(0,1).toLowerCase() < 'k' ? 'bg-indigo-500' : (log.user || 'S').substring(0,1).toLowerCase() < 't' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          {(log.user || 'S').substring(0, 1)}
                        </div>
                        <span className="truncate max-w-[120px] block" title={log.user || 'Sistem'}>{log.user || 'Sistem'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 truncate max-w-[200px]" title={log.description}>{log.description}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-6 text-center text-zinc-500">Belum ada log tercatat</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals Widget */}
        <div className="rounded-2xl p-6 shadow-sm bg-white border border-zinc-200">
          <h3 className="text-sm font-black text-zinc-900 mb-4">Pendaftaran Baru</h3>
          {pendingUsers.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {pendingUsers.slice(0, 4).map(u => (
                  <div key={u.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{u.name}</p>
                      <p className="text-[10px] text-zinc-500">{u.email}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] uppercase font-bold">{u.spatie_role || u.role}</span>
                  </div>
                ))}
                {pendingUsers.length > 4 && <p className="text-[10px] text-zinc-400 italic">+{pendingUsers.length - 4} akun lainnya...</p>}
              </div>
              <Link to="/user-approvals" className="block text-center w-full bg-[#1A7D47] text-white rounded-lg py-2 text-xs font-bold hover:bg-[#136136] transition-colors">
                Kelola Persetujuan →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center py-10 text-zinc-400">
              <span className="material-symbols-outlined text-4xl mb-2 text-[#1A7D47]">check_circle</span>
              <p className="text-xs font-medium">Tidak ada akun yang menunggu persetujuan</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
