import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Transaction {
  id: number;
  date: string;
  description: string;
  type: string;
  amount: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client: string;
  amount: string; // From API it's string
  due_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Payable {
  id: number;
  vendor: string;
  invoice_number: string;
  amount: string; // From API it's string
  due_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface FinanceStaffDashboardProps {
  isDark: boolean;
  theme: 'light' | 'dark';
}

export const FinanceStaffDashboard: React.FC<FinanceStaffDashboardProps> = ({ isDark }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const handleDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };
  
  const cashFlowCanvasRef = useRef<HTMLCanvasElement>(null);
  const expenseCanvasRef = useRef<HTMLCanvasElement>(null);
  const cashFlowChartInstance = useRef<any>(null);
  const expenseChartInstance = useRef<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, invRes, payRes] = await Promise.all([
        api.get('/transactions').catch(() => ({ data: [] })),
        api.get('/invoices').catch(() => ({ data: [] })),
        api.get('/payables').catch(() => ({ data: [] }))
      ]);

      setTransactions(txRes.data || []);
      setInvoices(invRes.data || []);
      setPayables(payRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamic data preparation for charts
  const transactionsByDate = transactions.reduce((acc: Record<string, number>, t) => {
    if (!acc[t.date]) acc[t.date] = 0;
    if (t.type === 'income' || t.type === 'Pendapatan') {
      acc[t.date] += Number(t.amount);
    } else {
      acc[t.date] -= Number(t.amount);
    }
    return acc;
  }, {});

  const cashFlowLabels = Object.keys(transactionsByDate).sort();
  const cashFlowData = cashFlowLabels.map(date => transactionsByDate[date]);
  
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense' || t.type === 'Pengeluaran')
    .reduce((acc: Record<string, number>, t) => {
      const cat = t.description ? t.description.substring(0, 20) : 'Lain-lain';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(t.amount);
      return acc;
    }, {});
    
  const expenseLabels = Object.keys(expenseByCategory);
  const expenseData = expenseLabels.map(cat => expenseByCategory[cat]);

  useEffect(() => {
    if (!loading) {
      if (cashFlowChartInstance.current) {
        cashFlowChartInstance.current.destroy();
        cashFlowChartInstance.current = null;
      }
      if (expenseChartInstance.current) {
        expenseChartInstance.current.destroy();
        expenseChartInstance.current = null;
      }

      Chart.defaults.color = isDark ? '#a1a1aa' : '#52525b';
      Chart.defaults.font.family = 'Inter, sans-serif';

      if (cashFlowCanvasRef.current && cashFlowData.length > 0) {
        const ctx = cashFlowCanvasRef.current.getContext('2d');
        if (ctx) {
          cashFlowChartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
              labels: cashFlowLabels,
              datasets: [{
                label: 'Arus Kas Harian (Rp)',
                data: cashFlowData,
                borderColor: '#1A7D47',
                backgroundColor: 'rgba(26, 125, 71, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#1A7D47',
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#1A7D47',
                pointRadius: 4,
                pointHoverRadius: 6
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
              }
            }
          });
        }
      }

      if (expenseCanvasRef.current && expenseData.length > 0) {
        const ctx = expenseCanvasRef.current.getContext('2d');
        if (ctx) {
          expenseChartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: expenseLabels,
              datasets: [{
                data: expenseData,
                backgroundColor: ['#1A7D47', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',
              plugins: {
                legend: { position: 'right' }
              }
            }
          });
        }
      }
    }
    
    return () => {
      if (cashFlowChartInstance.current) cashFlowChartInstance.current.destroy();
      if (expenseChartInstance.current) expenseChartInstance.current.destroy();
    };
  }, [loading, isDark, transactions]);

  const handleSubmitDraft = async (id: number) => {
    try {
      const response = await api.post(`/transactions/${id}/submit`);
      
      // Optimistic update
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status: 'pending' } : tx));
      
      // Flash message component simulation
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-[#1A7D47] text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in font-medium flex items-center gap-2';
      toast.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Transaksi berhasil di-submit untuk Approval';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3000);

    } catch (err) {
      console.error(err);
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in font-medium flex items-center gap-2';
      toast.innerHTML = '<span class="material-symbols-outlined">error</span> Gagal memproses submit transaksi';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // Calculations
  const revenue = transactions.filter(t => t.type === 'income' || t.type === 'Pendapatan').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense' || t.type === 'Pengeluaran').reduce((sum, t) => sum + Number(t.amount), 0);
  const cashFlow = revenue - expense;
  
  // Tagihan dan Kewajiban - Filter status !== 'Lunas', pastikan amount di-parse sebagai Number
  const unpaidInvoices = invoices.filter(i => i.status !== 'Lunas').reduce((sum, i) => sum + Number(i.amount), 0);
  const unpaidPayables = payables.filter(p => p.status !== 'Lunas').reduce((sum, p) => sum + Number(p.amount), 0);

  const cardClass = isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-[#f8fafc] text-zinc-600 border-zinc-200';

  if (loading) {
    return <div className="text-center p-12 animate-pulse text-zinc-500">Memuat data Dashboard Finance Staff...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-2xl font-black ${titleClass}`}>Dashboard Staf Keuangan</h2>
        <p className={`text-sm mt-1 ${textClass}`}>Pusat kendali laporan harian, arus kas, dan pengajuan jurnal.</p>
      </div>

      {/* METRIC CARDS - GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className={`p-6 rounded-[16px] shadow-sm border ${cardClass}`}>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Pendapatan</p>
          <p className="text-2xl font-black mt-2 text-emerald-600 truncate" title={formatCurrency(revenue)}>{formatCurrency(revenue)}</p>
        </div>
        
        <div className={`p-6 rounded-[16px] shadow-sm border ${cardClass}`}>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Pengeluaran</p>
          <p className="text-2xl font-black mt-2 text-rose-600 truncate" title={formatCurrency(expense)}>{formatCurrency(expense)}</p>
        </div>

        <div className={`p-6 rounded-[16px] shadow-sm border ${isDark ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Kas Bersih</p>
          <p className={`text-2xl font-black mt-2 truncate ${cashFlow >= 0 ? 'text-emerald-700' : 'text-rose-600'}`} title={formatCurrency(cashFlow)}>
            {formatCurrency(cashFlow)}
          </p>
        </div>

        <div className={`p-6 rounded-[16px] shadow-sm border ${cardClass}`}>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Tagihan (Piutang)</p>
          <p className="text-2xl font-black mt-2 text-blue-600 truncate" title={formatCurrency(unpaidInvoices)}>{formatCurrency(unpaidInvoices)}</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Data real-time dari sistem</span>
        </div>

        <div className={`p-6 rounded-[16px] shadow-sm border ${cardClass}`}>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Kewajiban (Utang)</p>
          <p className="text-2xl font-black mt-2 text-amber-600 truncate" title={formatCurrency(unpaidPayables)}>{formatCurrency(unpaidPayables)}</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Data real-time dari sistem</span>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-[16px] shadow-sm border ${cardClass}`}>
          <h3 className={`font-bold mb-4 ${titleClass}`}>Arus Kas Harian</h3>
          <div className="h-[250px] relative flex items-center justify-center">
            {cashFlowData.length > 0 ? (
              <canvas ref={cashFlowCanvasRef}></canvas>
            ) : (
              <span className="text-zinc-400 font-medium text-sm">Belum ada data transaksi</span>
            )}
          </div>
        </div>
        <div className={`p-6 rounded-[16px] shadow-sm border ${cardClass}`}>
          <h3 className={`font-bold mb-4 ${titleClass}`}>Komposisi Pengeluaran</h3>
          <div className="h-[250px] relative flex items-center justify-center">
            {expenseData.length > 0 ? (
              <canvas ref={expenseCanvasRef}></canvas>
            ) : (
              <span className="text-zinc-400 font-medium text-sm">Belum ada data transaksi</span>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className={`rounded-[16px] overflow-hidden border ${cardClass}`}>
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className={`font-bold ${titleClass}`}>Jurnal Transaksi Aktif</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="p-4 font-bold">Tanggal</th>
                <th className="p-4 font-bold">Deskripsi</th>
                <th className="p-4 font-bold">Tipe</th>
                <th className="p-4 font-bold text-right">Jumlah</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-zinc-500">Tidak ada data transaksi.</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-50'}`}>
                  <td className={`p-4 font-medium ${titleClass}`}>{tx.date}</td>
                  <td className={`p-4 ${textClass}`}>{tx.description}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      tx.type === 'income' || tx.type === 'Pendapatan' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold ${tx.type === 'income' || tx.type === 'Pendapatan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(Number(tx.amount))}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      tx.status === 'draft' ? 'bg-yellow-100 text-yellow-800'
                      : tx.status === 'pending' || tx.status === 'submitted' ? 'bg-blue-100 text-blue-800'
                      : tx.status === 'approved' || tx.status === 'verified' ? 'bg-green-100 text-green-800'
                      : tx.status === 'rejected' ? 'bg-red-100 text-red-800'
                      : 'bg-zinc-100 text-zinc-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {tx.status === 'draft' ? (
                      <button 
                        onClick={() => handleSubmitDraft(tx.id)}
                        className="px-3 py-1.5 bg-[#1A7D47] text-white hover:bg-[#155f38] rounded-lg text-xs font-medium transition-all shadow-sm"
                      >
                        Submit untuk Approval
                      </button>
                    ) : (
                      <button onClick={() => handleDetail(tx)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-all shadow-sm">
                        Detail
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in transition-all duration-300">
          <div className={`bg-white rounded-2xl p-6 w-full max-w-md shadow-xl ${isDark ? 'bg-[#18181b] border border-zinc-800' : 'bg-white'}`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h3 className={`font-semibold text-lg ${isDark ? 'text-zinc-100' : 'text-gray-800'}`}>
                Detail Transaksi
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-zinc-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">cancel</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">TANGGAL</p>
                <p className={`font-semibold mt-1 ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{selectedTransaction.date}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">DESKRIPSI</p>
                <p className={`font-semibold mt-1 ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{selectedTransaction.description}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">TIPE</p>
                <p className={`font-semibold mt-1 ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{selectedTransaction.type}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">JUMLAH</p>
                <p className="font-bold text-red-600 mt-1 text-xl">
                  {formatCurrency(Number(selectedTransaction.amount))}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider mb-1">STATUS</p>
                {selectedTransaction.status === 'Completed' || selectedTransaction.status === 'Selesai' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Selesai
                  </span>
                ) : selectedTransaction.status === 'Pending' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                    {selectedTransaction.status}
                  </span>
                )}
              </div>
            </div>
            
            <div className={`mt-8 pt-4 border-t flex justify-end ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium rounded-[8px] transition-all duration-200 text-[14px]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

