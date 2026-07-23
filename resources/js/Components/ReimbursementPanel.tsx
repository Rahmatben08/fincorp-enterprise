import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface ReimbursementPanelProps {
  isDark: boolean;
  theme: string;
  userRole: string;
}

export const ReimbursementPanel: React.FC<ReimbursementPanelProps> = ({ isDark, theme, userRole }) => {
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Custom toast mock since we don't pass showToast
  const showToastLocal = (msg: string) => {
    alert(msg);
  };

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reimbursements');
      setReimbursements(res.data);
    } catch (error) {
      console.error('Failed to fetch reimbursements', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    setSubmitting(true);
    try {
      await api.post('/reimbursements', { amount: parseFloat(amount), description });
      showToastLocal('Reimbursement diajukan.');
      setAmount('');
      setDescription('');
      fetchReimbursements();
    } catch (err) {
      showToastLocal('Gagal mengajukan reimbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: number, action: 'verify' | 'approve', value: boolean) => {
    try {
      await api.post(`/reimbursements/${id}/${action}?${action}=${value}`);
      showToastLocal(`Berhasil ${value ? action : 'tolak'} reimbursement.`);
      fetchReimbursements();
    } catch (err) {
      showToastLocal(`Gagal memproses aksi.`);
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  const renderBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold">Approved</span>;
      case 'rejected': return <span className="bg-rose-500/20 text-rose-500 px-2 py-1 rounded text-[10px] font-bold">Rejected</span>;
      case 'verified': return <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-[10px] font-bold">Verified</span>;
      default: return <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded text-[10px] font-bold">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Pengajuan (Hanya Employee) */}
        {userRole === 'employee' && (
          <div className={`p-6 rounded-3xl border ${cardClass} lg:col-span-1 h-fit`}>
            <h3 className={`font-black text-sm mb-4 ${titleClass}`}>Ajukan Reimbursement</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-zinc-500">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border \${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'} focus:ring-2 focus:ring-emerald-500 outline-none`}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold text-zinc-500">Deskripsi Keperluan</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border \${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'} focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px]`}
                  placeholder="Deskripsikan pengeluaran..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                {submitting ? 'Mengirim...' : 'Ajukan Klaim'}
              </button>
            </form>
          </div>
        )}

        {/* Daftar Reimbursement */}
        <div className={`p-6 rounded-3xl border ${cardClass} ${userRole === 'employee' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className={`font-black text-sm mb-4 ${titleClass}`}>Daftar Klaim Reimbursement</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className={`text-xs uppercase tracking-wider ${isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-[#f8fafc] text-slate-600'}`}>
                <tr>
                  <th className="p-4 font-bold rounded-tl-xl">Karyawan</th>
                  <th className="p-4 font-bold">Deskripsi</th>
                  <th className="p-4 font-bold">Jumlah</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center text-zinc-500">Loading...</td></tr>
                ) : reimbursements.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-zinc-500">Belum ada pengajuan klaim.</td></tr>
                ) : (
                  reimbursements.map((r) => (
                    <tr key={r.id} className={`border-b ${isDark ? 'border-zinc-800/30' : 'border-zinc-100'} hover:bg-zinc-500/5`}>
                      <td className="p-3">
                        <p className={`font-bold ${titleClass}`}>{r.user ? r.user.name : 'Anda'}</p>
                        <p className="text-[9px] text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="p-3"><p className="max-w-[150px] truncate" title={r.description}>{r.description}</p></td>
                      <td className="p-3 font-bold">{formatRupiah(r.amount)}</td>
                      <td className="p-3">{renderBadge(r.status)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {userRole === 'admin_keuangan' && r.status === 'pending' && (
                            <>
                              <button onClick={() => handleAction(r.id, 'verify', true)} className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] font-bold">Verifikasi</button>
                              <button onClick={() => handleAction(r.id, 'verify', false)} className="px-2 py-1 bg-rose-500 text-white rounded text-[10px] font-bold">Tolak</button>
                            </>
                          )}
                          {(userRole === 'manajer' || userRole === 'superadmin') && r.status === 'verified' && (
                            <>
                              <button onClick={() => handleAction(r.id, 'approve', true)} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold">Setujui</button>
                              <button onClick={() => handleAction(r.id, 'approve', false)} className="px-2 py-1 bg-rose-500 text-white rounded text-[10px] font-bold">Tolak</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
};
