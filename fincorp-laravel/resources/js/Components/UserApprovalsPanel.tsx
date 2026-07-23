import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  spatie_role?: string;
  status: string;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
}

interface UserApprovalsPanelProps {
  userId?: number;
}

const UserApprovalsPanel: React.FC<UserApprovalsPanelProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(userId || null);

  const fetchPending = async () => {
    try {
      const res = await api.get('/users/pending');
      setPendingUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch pending users', err);
      setErrorMsg('Gagal memuat pengguna menunggu persetujuan.');
    }
  };

  const fetchActive = async () => {
    try {
      const res = await api.get('/users/active');
      setActiveUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch active users', err);
      setErrorMsg('Gagal memuat pengguna aktif.');
    }
  };

  useEffect(() => {
    setLoading(true);
    
    // Fetch current user if not provided via props
    if (!currentUserId) {
      api.get('/user').then(res => {
        if (res.data && res.data.id) {
          setCurrentUserId(res.data.id);
        }
      }).catch(err => console.error("Failed to fetch current user", err));
    }

    if (activeTab === 'pending') {
      fetchPending().finally(() => setLoading(false));
    } else {
      fetchActive().finally(() => setLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/users/${id}/approve`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setSuccessMsg('User berhasil disetujui');
      // refetch active list silenty
      fetchActive();
    } catch (err) {
      setErrorMsg('Gagal menyetujui user. Coba lagi.');
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Yakin ingin menolak pendaftaran user ini?')) return;
    try {
      await api.post(`/users/${id}/reject`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setSuccessMsg('Pendaftaran user ditolak');
    } catch (err) {
      setErrorMsg('Gagal menolak user. Coba lagi.');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Yakin ingin menonaktifkan akun ini?')) return;
    try {
      await api.post(`/users/${id}/deactivate`);
      setActiveUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'inactive' } : u))
      );
      setSuccessMsg('Akun berhasil dinonaktifkan');
    } catch (err) {
      setErrorMsg('Gagal menonaktifkan akun.');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Superadmin';
      case 'admin_keuangan': return 'Admin Keuangan';
      case 'manajer': return 'Manajer';
      case 'finance_staff': return 'Finance Staff';
      case 'employee': return 'Karyawan';
      case 'investor': return 'Investor';
      default: return role;
    }
  };

  const totalPending = pendingUsers.length;
  const totalActive = activeUsers.filter(u => u.status === 'active').length;
  const totalInactive = activeUsers.filter(u => u.status === 'inactive').length;

  return (
    <div className="space-y-6 animate-fade-in mt-6 max-w-7xl mx-auto pb-20">
      
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Kelola User & Sistem</h1>
        <p className="text-sm text-zinc-500 mt-1">Manajemen persetujuan akun dan status pengguna</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg relative flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* KARTU SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6 shadow-sm bg-white border border-zinc-200">
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Total Pending</p>
          <p className="text-3xl font-black text-zinc-900">{totalPending}</p>
        </div>
        <div className="rounded-2xl p-6 shadow-sm bg-white border border-zinc-200">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Aktif</p>
          <p className="text-3xl font-black text-zinc-900">{totalActive}</p>
        </div>
        <div className="rounded-2xl p-6 shadow-sm bg-white border border-zinc-200">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Nonaktif</p>
          <p className="text-3xl font-black text-zinc-900">{totalInactive}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'border-[#1A7D47] text-[#1A7D47]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Menunggu Persetujuan
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'border-[#1A7D47] text-[#1A7D47]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Aktif
          </button>
        </nav>
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white shadow-sm border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A7D47]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6 font-semibold">Nama</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold">Role</th>
                  {activeTab === 'active' && <th className="py-4 px-6 font-semibold text-center">Status</th>}
                  <th className="py-4 px-6 font-semibold">{activeTab === 'pending' ? 'Mendaftar' : 'Bergabung'}</th>
                  <th className="py-4 px-6 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeTab === 'pending' ? (
                  pendingUsers.length > 0 ? (
                    pendingUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-sm font-semibold text-zinc-900">{u.name}</td>
                        <td className="py-4 px-6 text-sm text-zinc-600">{u.email}</td>
                        <td className="py-4 px-6 text-sm">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                            {getRoleLabel(u.spatie_role || u.role)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-500">
                          {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-right space-x-3">
                          <button
                            onClick={() => handleApprove(u.id)}
                            className="bg-[#1A7D47] text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-[#136136] transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleReject(u.id)}
                            className="border border-red-300 text-red-600 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-red-50 transition-colors"
                          >
                            Tolak
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-zinc-400">
                          <span className="material-symbols-outlined text-4xl mb-3 text-[#1A7D47]">check_circle</span>
                          <p className="text-sm font-medium">Tidak ada pendaftaran yang menunggu persetujuan</p>
                        </div>
                      </td>
                    </tr>
                  )
                ) : (
                  activeUsers.length > 0 ? (
                    activeUsers.map((u) => {
                      let badgeClass = 'bg-green-100 text-green-700';
                      let statusText = 'Aktif';
                      if (u.status === 'inactive') {
                        badgeClass = 'bg-gray-100 text-gray-600';
                        statusText = 'Nonaktif';
                      } else if (u.status === 'rejected') {
                        badgeClass = 'bg-red-100 text-red-600';
                        statusText = 'Ditolak';
                      }

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 text-sm font-semibold text-zinc-900">{u.name}</td>
                          <td className="py-4 px-6 text-sm text-zinc-600">{u.email}</td>
                          <td className="py-4 px-6 text-sm">
                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                              {getRoleLabel(u.spatie_role || u.role)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-zinc-500">
                            {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {u.status === 'active' && u.id !== currentUserId && (
                              <button
                                onClick={() => handleDeactivate(u.id)}
                                className="border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                Nonaktifkan
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500 text-sm">
                        Tidak ada user aktif ditemukan.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default UserApprovalsPanel;
