import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { ReimbursementPanel } from './ReimbursementPanel';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Transaction {
  id: number;
  transactionId?: string; // fallback if needed
  date?: string;
  transactionDate?: string;
  description: string;
  type: string;
  amount: number | string;
  status: string;
  created_by?: number | string;
  creatorEmail?: string;
  verified_by?: number | string;
  verified_at?: string;
}

interface ManagerDashboardProps {
  isDark: boolean;
  theme: string;
  transactions: Transaction[];
  userRole: string;
  userId?: number;
  refreshTransactions?: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ isDark, theme, transactions, userRole, userId, refreshTransactions }) => {
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';

  const [transactionList, setTransactionList] = useState<Transaction[]>(transactions);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sync prop to state if prop changes
  useEffect(() => {
    setTransactionList(transactions);
  }, [transactions]);

  const pendingApprovals = transactionList.filter(t => t.status === 'verified');
  const approvedCount = transactionList.filter(t => t.status === 'approved').length;
  const rejectedCount = transactionList.filter(t => t.status === 'rejected').length;

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0);
  };

  const handleApprove = async (id: number) => {
    try {
      setErrorMsg(null);
      await api.post(`/transactions/${id}/approve`);
      setTransactionList(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' } : t));
      if (selectedTransaction?.id === id) setShowDetailModal(false);
    } catch (err: any) {
      const msg = err.response?.status === 403
        ? 'Tidak dapat menyetujui: Anda terlibat dalam transaksi ini'
        : 'Gagal menyetujui transaksi. Coba lagi.';
      setErrorMsg(msg);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Yakin ingin menolak transaksi ini?')) return;
    try {
      setErrorMsg(null);
      await api.post(`/transactions/${id}/reject`);
      setTransactionList(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t));
      if (selectedTransaction?.id === id) setShowDetailModal(false);
    } catch (err: any) {
      const msg = err.response?.status === 403
        ? 'Tidak dapat menolak: Anda terlibat dalam transaksi ini'
        : 'Gagal menolak transaksi. Coba lagi.';
      setErrorMsg(msg);
    }
  };

  const handleDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDetailModal(true);
  };

  // Chart setup
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    Chart.defaults.color = isDark ? '#a1a1aa' : '#52525b';
    Chart.defaults.font.family = 'Inter, sans-serif';

    const draft = transactionList.filter(t => t.status === 'draft').length;
    const pending = transactionList.filter(t => t.status === 'pending').length;
    const verified = pendingApprovals.length;
    const approved = approvedCount;
    const rejected = rejectedCount;

    const dataPoints = [draft, pending, verified, approved, rejected];
    
    if (chartCanvasRef.current && dataPoints.some(v => v > 0)) {
      const ctx = chartCanvasRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Draft', 'Pending', 'Verified', 'Approved', 'Rejected'],
            datasets: [{
              label: 'Jumlah Transaksi',
              data: dataPoints,
              backgroundColor: ['#94a3b8', '#3b82f6', '#f59e0b', '#1A7D47', '#ef4444'],
              borderWidth: 0,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
              x: { grid: { display: false } }
            }
          }
        });
      }
    }
  }, [transactionList, isDark]);

  return (
    <div className="space-y-6 animate-fade-in mt-6">
      
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-red-500">error</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button onClick={() => setErrorMsg(null)} className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Kartu Metrik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 border ${cardClass}`}>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Transaksi</p>
          <p className={`text-3xl font-black ${titleClass}`}>{transactionList.length}</p>
        </div>
        <div className={`rounded-2xl p-6 border ${cardClass}`}>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Menunggu Approval</p>
          <p className={`text-3xl font-black text-amber-600`}>{pendingApprovals.length}</p>
        </div>
        <div className={`rounded-2xl p-6 border ${cardClass}`}>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Disetujui</p>
          <p className={`text-3xl font-black text-emerald-600`}>{approvedCount}</p>
        </div>
        <div className={`rounded-2xl p-6 border ${cardClass}`}>
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Ditolak</p>
          <p className={`text-3xl font-black text-rose-600`}>{rejectedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TABEL PENDING APPROVAL */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardClass}`}>
          <h3 className={`font-semibold text-lg mb-4 ${titleClass}`}>Transaksi Menunggu Persetujuan</h3>
          
          <div className="overflow-x-auto">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                <p className="text-zinc-500 text-sm font-medium">Semua transaksi telah diproses</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-4 font-semibold">Tanggal</th>
                    <th className="py-3 px-4 font-semibold">Deskripsi</th>
                    <th className="py-3 px-4 font-semibold">Tipe</th>
                    <th className="py-3 px-4 font-semibold">Jumlah</th>
                    <th className="py-3 px-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {pendingApprovals.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm">{tx.date || tx.transactionDate}</td>
                      <td className={`py-3 px-4 text-sm font-medium ${titleClass} max-w-[200px] truncate`} title={tx.description}>
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 text-sm capitalize">{tx.type}</td>
                      <td className="py-3 px-4 text-sm font-bold text-red-600">{formatCurrency(tx.amount)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleDetail(tx)} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium shadow-sm">
                            Detail
                          </button>
                          <button onClick={() => handleApprove(tx.id)} className="px-3 py-1 bg-[#1A7D47] text-white hover:bg-[#146337] rounded-lg text-xs font-medium shadow-sm transition-colors">
                            Setujui
                          </button>
                          <button onClick={() => handleReject(tx.id)} className="px-3 py-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium shadow-sm transition-colors">
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* GRAFIK BAR */}
        <div className={`p-6 rounded-2xl border ${cardClass}`}>
          <h3 className={`font-semibold text-lg mb-4 ${titleClass}`}>Ringkasan Status Transaksi</h3>
          <div className="h-[250px] relative flex items-center justify-center">
            {transactionList.length > 0 ? (
              <canvas ref={chartCanvasRef}></canvas>
            ) : (
              <span className="text-zinc-400 font-medium text-sm">Belum ada data transaksi</span>
            )}
          </div>
        </div>
      </div>
      
      <ReimbursementPanel isDark={isDark} theme={theme} userRole="manajer" />

      {/* MODAL DETAIL TRANSAKSI */}
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
                <p className={`font-semibold mt-1 ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{selectedTransaction.date || selectedTransaction.transactionDate}</p>
              </div>
              <div>
                <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">DESKRIPSI</p>
                <p className={`font-semibold mt-1 ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{selectedTransaction.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">TIPE</p>
                  <p className={`font-semibold mt-1 ${isDark ? 'text-zinc-200' : 'text-gray-800'} capitalize`}>{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">JUMLAH</p>
                  <p className="font-bold text-red-600 mt-1 text-lg">
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider mb-1">STATUS</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                    ${selectedTransaction.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 
                      selectedTransaction.status === 'verified' ? 'bg-amber-100 text-amber-800' :
                      selectedTransaction.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-zinc-100 text-zinc-800'}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">DIBUAT OLEH</p>
                  <p className={`font-medium mt-1 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{selectedTransaction.created_by || selectedTransaction.creatorEmail || 'System'}</p>
                </div>
              </div>
              
              {selectedTransaction.verified_by && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[12px] text-zinc-500 uppercase font-medium tracking-wider">DIVERIFIKASI OLEH</p>
                  <p className={`font-medium mt-1 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>User #{selectedTransaction.verified_by} pada {selectedTransaction.verified_at}</p>
                </div>
              )}
            </div>
            
            <div className={`mt-8 pt-4 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium rounded-lg transition-all duration-200 text-sm"
              >
                Tutup
              </button>
              
              {selectedTransaction.status === 'verified' && (
                <>
                  <button onClick={() => handleReject(selectedTransaction.id)} className="px-5 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-all text-sm">
                    Tolak
                  </button>
                  <button onClick={() => handleApprove(selectedTransaction.id)} className="px-5 py-2.5 bg-[#1A7D47] hover:bg-[#146337] text-white font-medium rounded-lg transition-all text-sm">
                    Setujui
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
