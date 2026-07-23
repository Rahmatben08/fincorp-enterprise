import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface AuditTrailPanelProps {
  theme: string;
}

const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({ theme }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs');
        setLogs(res.data);
      } catch (err) {
        console.warn('API error, using fallback for Audit Log', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (act.includes('APPROVE') || act.includes('VERIFIED') || act.includes('LUNAS') || act.includes('SUCCESS')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (act.includes('REJECT') || act.includes('FAIL') || act.includes('ERROR') || act.includes('MISMATCH')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (act.includes('CREATE')) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    if (act.includes('DEACTIVATE')) {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }
    return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction ? log.action?.includes(filterAction) : true;
    const matchesRole = filterRole ? log.user?.includes(filterRole) : true; // Approximation if role is not directly in log
    return matchesSearch && matchesAction && matchesRole;
  });

  return (
    <div className={`border rounded-[16px] p-6 space-y-4 backdrop-blur-md animate-fade-in ${cardClass} max-w-7xl mx-auto mt-6 pb-20`}>
      <div>
        <h3 className={`font-extrabold text-2xl tracking-tight ${titleClass}`}>Audit Trail Aktivitas Sistem</h3>
        <p className="text-sm text-zinc-500 mt-1">Log transaksi mutlak yang dijamin keamanannya dan tidak dapat diubah.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 my-6">
        <input 
          type="text" 
          placeholder="Cari (nama, aksi, detail)..." 
          className="p-2 border rounded-lg text-sm flex-1 dark:bg-zinc-900 dark:border-zinc-800"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          className="p-2 border rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-800"
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="">Semua Aksi</option>
          <option value="LOGIN">Login</option>
          <option value="APPROVE">Approve</option>
          <option value="REJECT">Reject</option>
          <option value="CREATE">Create</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white shadow-sm border border-zinc-200 rounded-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-slate-500 border-slate-200 bg-[#f8fafc]'}`}>
              <th className="py-4 px-6">Waktu Kejadian</th>
              <th className="py-4 px-6">User</th>
              <th className="py-4 px-6">Aksi</th>
              <th className="py-4 px-6">Detail</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {loading ? (
               <tr>
                 <td colSpan={4} className="py-16 text-center text-zinc-500">Loading...</td>
               </tr>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id} className={`transition-colors hover:bg-gray-50 ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'text-zinc-700'}`}>
                  <td className="py-4 px-6 text-sm text-zinc-500">
                    {new Date(log.created_at || log.timestamp).toLocaleString('id-ID', {
                       day: '2-digit', month: 'short', year: 'numeric',
                       hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className={`py-4 px-6 text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{log.user || 'Sistem'}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-zinc-600 max-w-xs truncate" title={log.description}>{log.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                 <td colSpan={4} className="py-16 text-center">
                   <div className="text-zinc-500">Belum ada aktivitas tercatat</div>
                 </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrailPanel;
