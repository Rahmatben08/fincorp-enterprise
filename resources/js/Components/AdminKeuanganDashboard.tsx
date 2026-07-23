import React, { useState } from 'react';
import api from '../services/api';
import { ReimbursementPanel } from './ReimbursementPanel';
import { generateTransactionJournalPDF } from '../utils/pdfGenerator';
import { Printer, Wallet, ArrowDownRight, ArrowUpRight, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

const InvoiceDetailModal: React.FC<{ invoice: any, onClose: () => void, isDark: boolean, formatRupiah: (val: number) => string, onMarkPaid: (id: string) => void }> = ({ invoice, onClose, isDark, formatRupiah, onMarkPaid }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in transition-all duration-300">
    <div className={`w-full max-w-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
      <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h3 className={`font-semibold text-[18px] ${isDark ? 'text-white' : 'text-slate-800'}`}>Detail Invoice</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
          <XCircle size={24} />
        </button>
      </div>
      <div className={`p-6 space-y-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        <div>
          <p className="text-[12px] uppercase font-medium text-slate-500 tracking-wider">Nama Klien / Vendor</p>
          <p className={`font-semibold text-lg mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{invoice.vendor}</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[12px] uppercase font-medium text-slate-500 tracking-wider">Nomor Invoice</p>
            <p className="font-medium mt-1">{invoice.id}</p>
          </div>
          <div>
            <p className="text-[12px] uppercase font-medium text-slate-500 tracking-wider">Status / Jatuh Tempo</p>
            <p className="font-semibold text-[#b91c1c] mt-1">{invoice.dueDate}</p>
          </div>
        </div>
        <div>
          <p className="text-[12px] uppercase font-medium text-slate-500 tracking-wider">Nominal Tagihan</p>
          <p className="font-bold text-[24px] text-[#b91c1c] mt-1">{formatRupiah(invoice.amount)}</p>
        </div>
      </div>
      <div className={`p-6 border-t flex justify-end gap-4 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
         <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 text-slate-800 hover:bg-slate-100 font-medium rounded-[8px] transition-all duration-200 text-[14px]">
           Tutup
         </button>
         <button onClick={() => onMarkPaid(invoice.id)} className="px-5 py-2.5 bg-[#00A651] hover:bg-[#1A7D47] text-white font-medium rounded-[8px] transition-all duration-200 text-[14px]">
           Tandai Lunas
         </button>
      </div>
    </div>
  </div>
);

interface AdminKeuanganDashboardProps {
  isDark: boolean;
  theme: string;
  transactions: any[];
  invoices?: any[];
  refreshTransactions: () => void;
}

export const AdminKeuanganDashboard: React.FC<AdminKeuanganDashboardProps> = ({ isDark, theme, transactions, invoices = [], refreshTransactions }) => {
  const cardClass = isDark ? 'bg-slate-900/50 border border-slate-800 text-slate-300' : 'bg-white shadow-[0_4px_15px_rgba(0,0,0,0.03)] border-0 text-slate-700';
  const titleClass = isDark ? 'text-white' : 'text-slate-800';
  
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const pendingVerifications = transactions.filter(t => t.status === 'pending');
  const dueInvoices = invoices.filter(inv => inv.status !== 'Lunas').map(inv => ({
    id: inv.invoice_number,
    vendor: inv.client,
    amount: inv.amount,
    dueDate: inv.due_date,
    status: inv.status
  }));

  const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  const handleAction = async (id: string, verify: boolean) => {
    try {
      await api.post(`/transactions/${id}/verify?verify=${verify}`);
      refreshTransactions();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.patch(`/invoices/${id}/mark-paid`);
      setSelectedInvoice(null);
      refreshTransactions();
    } catch (err) {
      console.error('Failed to mark invoice as paid', err);
    }
  };

  return (
    <div className="space-y-[32px] animate-fade-in mt-6">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h1 className={`text-[28px] font-bold ${titleClass}`}>Dashboard Keuangan</h1>
        <button 
          onClick={() => generateTransactionJournalPDF(transactions)} 
          className="px-5 py-2.5 bg-[#1A7D47] text-white hover:bg-[#146337] rounded-[8px] font-medium text-[14px] flex items-center gap-2 transition-all duration-200"
        >
          <Printer size={20} /> Cetak Jurnal
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
        {/* Card 1: Saldo Kas */}
        <div className={`p-6 rounded-[20px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] ${cardClass}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[14px] font-medium text-slate-500">Saldo Kas Aktif</p>
              <h2 className={`text-[32px] font-bold mt-2 ${titleClass}`}>Rp 1.25B</h2>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#dcfce7] text-[#15803d]">
              <Wallet size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-[#15803d] text-[14px] font-medium"><ArrowUpRight size={16} className="mr-1" /> +12.5%</span>
            <span className="text-[12px] text-slate-500">vs bulan lalu</span>
          </div>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className={`p-6 rounded-[20px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] ${cardClass}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[14px] font-medium text-slate-500">Pengeluaran (Bulan Ini)</p>
              <h2 className={`text-[32px] font-bold mt-2 ${titleClass}`}>Rp 340M</h2>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#fee2e2] text-[#b91c1c]">
              <ArrowDownRight size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-[#b91c1c] text-[14px] font-medium"><ArrowUpRight size={16} className="mr-1" /> +5.2%</span>
            <span className="text-[12px] text-slate-500">vs bulan lalu</span>
          </div>
        </div>

        {/* Card 3: Menunggu Verifikasi */}
        <div className={`p-6 rounded-[20px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] ${cardClass}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[14px] font-medium text-slate-500">Menunggu Verifikasi</p>
              <h2 className={`text-[32px] font-bold mt-2 ${titleClass}`}>{pendingVerifications.length}</h2>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#ffedd5] text-[#c2410c]">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[12px] text-slate-500">Segera tindak lanjuti</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        
        {/* Pending Verifications */}
        <div className={`p-6 rounded-[16px] ${cardClass} flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-semibold text-[18px] ${titleClass}`}>Tugas Verifikasi</h3>
            <span className="bg-[#ffedd5] text-[#c2410c] text-[12px] font-medium px-3 py-1 rounded-full">
              {pendingVerifications.length} Menunggu
            </span>
          </div>
          
          <div className="flex-1 space-y-4">
            {pendingVerifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-[14px]">
                Tidak ada transaksi yang menunggu verifikasi.
              </div>
            ) : (
              pendingVerifications.map((tx, idx) => (
                <div key={idx} className={`p-4 rounded-[12px] border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-[#f8fafc]'} flex justify-between items-center transition-all duration-200 hover:shadow-sm`}>
                  <div className="max-w-[150px] sm:max-w-[200px]">
                    <p className={`text-[14px] font-semibold ${titleClass} truncate`} title={tx.description}>{tx.description}</p>
                    <p className="text-[12px] text-slate-500 mt-1">{tx.date || tx.transactionDate} • {tx.creatorEmail || 'staff'}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[14px] font-bold text-[#3949AB] mb-3">{formatRupiah(tx.amount)}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(tx.id || tx.transactionId, true)} className="flex items-center gap-1 px-3 py-1.5 bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0] rounded-[8px] text-[12px] font-medium transition-colors">
                        <CheckCircle size={14} /> Setuju
                      </button>
                      <button onClick={() => handleAction(tx.id || tx.transactionId, false)} className="flex items-center gap-1 px-3 py-1.5 bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] rounded-[8px] text-[12px] font-medium transition-colors">
                        <XCircle size={14} /> Tolak
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Due Invoices */}
        <div className={`p-6 rounded-[16px] ${cardClass} flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-semibold text-[18px] ${titleClass}`}>Invoice Jatuh Tempo</h3>
            <span className="bg-[#fee2e2] text-[#b91c1c] text-[12px] font-medium px-3 py-1 rounded-full">
              Aksi Diperlukan
            </span>
          </div>
          
          <div className="flex-1 space-y-4">
            {dueInvoices.length === 0 ? (
               <div className="text-center py-8 text-slate-500 text-[14px]">
                 Tidak ada invoice jatuh tempo.
               </div>
            ) : (
              dueInvoices.map((inv, idx) => (
                <div key={idx} className={`p-4 rounded-[12px] border ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-[#f8fafc]'} flex justify-between items-center transition-all duration-200 hover:shadow-sm`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#fee2e2] text-[#b91c1c]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className={`text-[14px] font-semibold ${titleClass}`}>{inv.vendor}</p>
                      <p className="text-[12px] text-slate-500 mt-1">{inv.id} • Tempo: <span className="font-semibold text-[#b91c1c]">{inv.dueDate}</span></p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[14px] font-bold text-[#b91c1c] mb-2">{formatRupiah(inv.amount)}</p>
                    <button data-testid={`lihat-detail-invoice-${idx+1}`} onClick={() => setSelectedInvoice(inv)} className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-[8px] text-[12px] font-medium transition-colors">
                      Detail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
      {/* We can style ReimbursementPanel later if needed, but keeping it functional for now */}
      <ReimbursementPanel isDark={isDark} theme={theme} userRole="admin_keuangan" />

      {selectedInvoice && (
        <InvoiceDetailModal 
          invoice={selectedInvoice} 
          isDark={isDark} 
          onClose={() => setSelectedInvoice(null)} 
          formatRupiah={formatRupiah}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  );
};
