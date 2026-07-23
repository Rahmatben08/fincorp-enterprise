import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface DivisionBudget {
  id: number;
  division: string;
  allocated: string;
  used: string;
  status: string;
}

interface BudgetingDashboardProps {
  isDark: boolean;
}

export const BudgetingDashboard: React.FC<BudgetingDashboardProps> = ({ isDark }) => {
  const [budgets, setBudgets] = useState<DivisionBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await api.get('/budgets');
        setBudgets(response.data);
      } catch (err) {
        console.error('Failed to fetch budgets:', err);
        setErrorMsg('Gagal memuat data anggaran.');
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, []);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0);
  };

  const totalAllocated = budgets.reduce((acc, curr) => acc + Number(curr.allocated || 0), 0);
  const totalUsed = budgets.reduce((acc, curr) => acc + Number(curr.used || 0), 0);
  const totalRemaining = totalAllocated - totalUsed;

  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in mt-6">
      
      <div className="mb-6">
        <h1 className={`text-2xl font-black ${titleClass}`}>Manajemen Anggaran</h1>
        <p className="text-sm text-zinc-500 mt-1">Monitoring alokasi dan realisasi anggaran per divisi</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* KARTU SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-6 border ${cardClass}`}>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Anggaran</p>
          <p className={`text-3xl font-black ${titleClass}`}>{formatCurrency(totalAllocated)}</p>
        </div>
        <div className={`rounded-2xl p-6 border ${cardClass}`}>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Total Terpakai</p>
          <p className={`text-3xl font-black text-blue-600`}>{formatCurrency(totalUsed)}</p>
        </div>
        <div className={`rounded-2xl p-6 border ${cardClass}`}>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Sisa Anggaran</p>
          <p className={`text-3xl font-black ${totalRemaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>

      {/* TABEL DIVISI */}
      <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`${isDark ? 'bg-zinc-900/50 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-500 border-slate-200'} border-b text-xs uppercase tracking-wider`}>
                <th className="py-4 px-6 font-semibold">Divisi</th>
                <th className="py-4 px-6 font-semibold text-right">Anggaran</th>
                <th className="py-4 px-6 font-semibold text-right">Terpakai</th>
                <th className="py-4 px-6 font-semibold text-right">Sisa</th>
                <th className="py-4 px-6 font-semibold">% Terpakai</th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-200'}`}>
              {budgets.map((b) => {
                const allocated = Number(b.allocated) || 0;
                const used = Number(b.used) || 0;
                const remaining = allocated - used;
                const pct = allocated > 0 ? (used / allocated) * 100 : 0;
                
                let badgeClass = 'bg-green-100 text-green-700';
                let bgProgress = 'bg-[#1A7D47]';
                let statusText = 'Aman';
                
                if (pct >= 90) {
                  badgeClass = 'bg-red-100 text-red-700';
                  bgProgress = 'bg-red-500';
                  statusText = 'Kritis';
                } else if (pct >= 75) {
                  badgeClass = 'bg-yellow-100 text-yellow-700';
                  bgProgress = 'bg-yellow-500';
                  statusText = 'Peringatan';
                }
                
                return (
                  <tr key={b.id} className={`${isDark ? 'hover:bg-zinc-900' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className={`py-4 px-6 text-sm font-semibold ${titleClass}`}>{b.division}</td>
                    <td className="py-4 px-6 text-sm font-medium text-right text-zinc-500 dark:text-zinc-400">{formatCurrency(allocated)}</td>
                    <td className="py-4 px-6 text-sm font-medium text-right text-zinc-500 dark:text-zinc-400">{formatCurrency(used)}</td>
                    <td className={`py-4 px-6 text-sm font-bold text-right ${remaining < 0 ? 'text-red-500' : titleClass}`}>
                      {formatCurrency(remaining)}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium w-1/4">
                      <div className="flex items-center gap-3">
                        <span className={`w-12 text-right ${pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                          {pct.toFixed(1)}%
                        </span>
                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-1000 ${bgProgress}`} 
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}`}>
                        {statusText}
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {budgets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">
                    Tidak ada data anggaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
