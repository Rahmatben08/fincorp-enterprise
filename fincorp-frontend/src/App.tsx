/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api, { keycloak } from './services/api';
import { UserRole } from './types';
import AIAssistantUI from './components/AIAssistantUI';

// Declare Chart.js globally since it is loaded via CDN in index.html
declare global {
  interface Window {
    Chart: any;
  }
}

// ==========================================
// 🛠️ THEME HELPERS & TRANSLATION CONSTANTS
// ==========================================
export type ThemeMode = 'light' | 'dark';

// ==========================================
// 🍞 TOAST NOTIFICATION CONTEXT
// ==========================================
export type ToastType = 'success' | 'error' | 'info';
interface ToastContextType { showToast: (msg: string, type?: ToastType) => void; }
const ToastContext = React.createContext<ToastContextType>({ showToast: () => {} });
export const useToast = () => React.useContext(ToastContext);

export const ToastProvider: React.FC<{children: React.ReactNode, isDark: boolean}> = ({children, isDark}) => {
  const [toast, setToast] = useState<{msg: string, type: ToastType, visible: boolean, id: number}>({msg: '', type: 'info', visible: false, id: 0});

  const showToast = React.useCallback((msg: string, type: ToastType = 'info') => {
    const newId = Date.now();
    setToast({ msg, type, visible: true, id: newId });
    setTimeout(() => {
      setToast(prev => prev.id === newId ? {...prev, visible: false} : prev);
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 border ${
        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      } ${
        toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
        toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
        isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-zinc-800 border-zinc-200'
      }`}>
        <span className="material-symbols-outlined text-lg">
          {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
        </span>
        <p className="text-sm font-bold">{toast.msg}</p>
      </div>
    </ToastContext.Provider>
  );
};

// ==========================================
// ⏳ SKELETON LOADER
// ==========================================
export const SkeletonLoader: React.FC<{ rows?: number, isDark?: boolean }> = ({ rows = 4, isDark = true }) => {
  return (
    <div className="space-y-4 w-full animate-pulse p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`h-10 w-full rounded-md ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-200'}`}></div>
      ))}
    </div>
  );
};

// ==========================================
// 📊 EXPORT & PRINT HELPERS
// ==========================================
const exportToExcel = (data: any[], filename: string, headersMap: { [key: string]: string }) => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }
  
  const keys = Object.keys(headersMap);
  const csvHeaders = keys.map(key => headersMap[key]).join(',');
  
  const csvRows = data.map(item => {
    return keys.map(key => {
      const val = item[key] !== undefined && item[key] !== null ? String(item[key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [csvHeaders, ...csvRows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printTransactionsPDF = (data: any[], theme: ThemeMode) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#09090b' : '#ffffff';
  const textColor = isDark ? '#d4d4d8' : '#1e293b';
  const cardBg = isDark ? '#18181b' : '#f8fafc';
  const borderColor = isDark ? '#27272a' : '#e2e8f0';

  let rowsHtml = data.map(tx => `
    <tr style="border-bottom: 1px solid ${borderColor}; font-size: 11px;">
      <td style="padding: 12px 10px; font-weight: bold; color: ${isDark ? '#f4f4f5' : '#0f172a'};">${tx.transactionId}</td>
      <td style="padding: 12px 10px; color: ${isDark ? '#a1a1aa' : '#475569'};">${tx.transactionDate || '-'}</td>
      <td style="padding: 12px 10px; font-weight: bold; color: ${tx.type === 'Pendapatan' ? '#10b981' : '#ef4444'}">${tx.type}</td>
      <td style="padding: 12px 10px; color: ${textColor};">${tx.category}</td>
      <td style="padding: 12px 10px; font-weight: bold; color: ${isDark ? '#f4f4f5' : '#0f172a'};">Rp ${Number(tx.amount).toLocaleString('id-ID')}</td>
      <td style="padding: 12px 10px; color: ${isDark ? '#a1a1aa' : '#475569'};">${tx.description}</td>
      <td style="padding: 12px 10px;"><span style="padding: 3px 8px; background-color: ${tx.status === 'Lunas' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${tx.status === 'Lunas' ? '#10b981' : '#d97706'}; border-radius: 6px; font-weight: bold; font-size: 9px; text-transform: uppercase;">${tx.status}</span></td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Laporan Jurnal Transaksi - PT Expro Gio Nusantara</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: ${textColor}; background-color: ${bgColor}; }
          h1 { color: #10b981; font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 0.05em; }
          p { margin: 3px 0; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { background-color: ${cardBg}; padding: 14px 10px; text-align: left; border-bottom: 2px solid ${borderColor}; font-size: 11px; color: ${isDark ? '#a1a1aa' : '#475569'}; font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px double #10b981; padding-bottom: 20px;">
          <div>
            <h1>PT Expro Gio Nusantara</h1>
            <p>Jasa Rekayasa Mekanikal, Elektrikal, Sipil &amp; IT Infrastructure</p>
            <p style="color: #10b981;">https://exprogionusantara.com</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 16px; color: ${isDark ? '#f4f4f5' : '#0f172a'}; font-weight: 900; letter-spacing: 0.02em;">LAPORAN JURNAL TRANSAKSI</h2>
            <p style="color: ${isDark ? '#a1a1aa' : '#475569'};">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Jumlah</th>
              <th>Deskripsi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const printPayslipPDF = (pay: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const base = Number(pay.baseSalary || 8500000);
  const allowance = Number(pay.allowance || 1500000);
  const bonus = Number(pay.bonus || 0);
  const tax = Number(pay.tax || 0);
  const bpjs = Number(pay.bpjs || 0);
  const net = Number(pay.netSalary || 0);

  printWindow.document.write(`
    <html>
      <head>
        <title>Slip Gaji ${pay.period} - ${pay.employeeName || pay.employeeEmail}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 50px; color: #1e293b; background-color: #fff; line-height: 1.6; }
          .header { border-bottom: 2px solid #004d34; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 22px; font-weight: 900; color: #004d34; letter-spacing: -0.02em; }
          .title { font-size: 16px; font-weight: 800; text-align: right; text-transform: uppercase; color: #0f172a; }
          .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 35px; font-size: 11px; }
          .meta-label { font-weight: bold; color: #64748b; padding-bottom: 6px; }
          .meta-value { color: #0f172a; font-weight: 600; padding-bottom: 6px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 12px; }
          .table th { background-color: #f8fafc; padding: 12px 10px; border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569; font-weight: 800; }
          .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }
          .total-row { font-weight: bold; font-size: 13px; background-color: #f8fafc; }
          .signatures { display: grid; grid-template-cols: 1fr 1fr; gap: 80px; text-align: center; margin-top: 60px; font-size: 11px; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div>
            <div class="logo">🟢 PT Expro Gio Nusantara</div>
            <p style="margin: 3px 0; font-size: 10px; color: #64748b;">FinCorp Enterprise Portal - Slip Gaji Karyawan Resmi</p>
          </div>
          <div class="title">
            SLIP GAJI RESMI
            <p style="font-size: 10px; color: #64748b; font-weight: normal; margin: 0;">Periode: ${pay.period}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <table style="width: 100%;">
              <tr><td class="meta-label" style="width: 130px;">Nama Karyawan:</td><td class="meta-value">${pay.employeeName || 'Karyawan'}</td></tr>
              <tr><td class="meta-label">Email:</td><td class="meta-value">${pay.employeeEmail}</td></tr>
              <tr><td class="meta-label">Divisi:</td><td class="meta-value">${pay.division}</td></tr>
            </table>
          </div>
          <div style="text-align: right;">
            <table style="width: 100%; margin-left: auto;">
              <tr><td class="meta-label">ID Slip:</td><td class="meta-value" style="font-family: monospace; font-size: 12px;">${pay.payrollId}</td></tr>
              <tr><td class="meta-label">Tanggal Cair:</td><td class="meta-value">${pay.releaseDate || '-'}</td></tr>
              <tr><td class="meta-label">Status:</td><td class="meta-value" style="color: #047857;">LUNAS (Transfer Bank)</td></tr>
            </table>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Rincian Pendapatan</th>
              <th>Jumlah (Rupiah)</th>
              <th>Rincian Potongan</th>
              <th>Jumlah (Rupiah)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gaji Pokok</td>
              <td>Rp ${base.toLocaleString('id-ID')}</td>
              <td>Pajak Penghasilan (PPh 21 - 5%)</td>
              <td>Rp ${tax.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td>Tunjangan Jabatan</td>
              <td>Rp ${allowance.toLocaleString('id-ID')}</td>
              <td>Iuran BPJS Ketenagakerjaan (2%)</td>
              <td>Rp ${bpjs.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td>Bonus KPI Kinerja</td>
              <td style="color: #047857; font-weight: 600;">+Rp ${bonus.toLocaleString('id-ID')}</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr class="total-row">
              <td>Total Pendapatan Kotor</td>
              <td>Rp ${(base + allowance + bonus).toLocaleString('id-ID')}</td>
              <td>Total Potongan</td>
              <td style="color: #b91c1c;">Rp ${(tax + bpjs).toLocaleString('id-ID')}</td>
            </tr>
            <tr style="background-color: #d1fae5; font-weight: 900; font-size: 14px;">
              <td colspan="2" style="color: #065f46; padding: 16px 10px;">JUMLAH BERSIH DITERIMA (TAKE HOME PAY)</td>
              <td colspan="2" style="color: #065f46; text-align: right; padding: 16px 10px;">Rp ${net.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <p>Penerima Gaji,</p>
            <br/><br/><br/>
            <p style="text-decoration: underline; font-weight: bold;">${pay.employeeName || 'Karyawan'}</p>
          </div>
          <div>
            <p>Manajer HR &amp; Keuangan,</p>
            <br/><br/><br/>
            <p style="text-decoration: underline; font-weight: bold;">Siti Handayani, S.E.</p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ==========================================
// 🏠 SAAS PROFESSIONAL LANDING PAGE (LIGHT/DARK)
// ==========================================
interface LandingPageProps {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ theme, setTheme }) => {
  const [showRegModal, setShowRegModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [division, setDivision] = useState('IT (Teknologi Informasi)');
  const [regSuccess, setRegSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#070708] text-zinc-100' : 'bg-zinc-50 text-zinc-800';
  const borderClass = isDark ? 'border-zinc-800/80' : 'border-zinc-200';
  const headerBg = isDark ? 'bg-[#09090b]/80' : 'bg-white/80';
  const footerBg = isDark ? 'bg-[#070708]' : 'bg-zinc-100';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setSubmitting(true);
    try {
      await api.post('/user-approvals/register', { email, fullName, division, status: 'Pending' });
      showToast('Registrasi berhasil. Menunggu approval admin.', 'success');
      setFullName('');
      setEmail('');
      setDivision('IT & Teknologi');
    } catch (err: any) {
      showToast('Registrasi gagal. Silakan coba lagi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col font-sans transition-colors duration-300 relative selection:bg-emerald-500/30 selection:text-emerald-300`}>
      {/* Decorative Radial Aurora Gradients */}
      <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none ${isDark ? 'bg-emerald-900/10' : 'bg-emerald-500/5'}`}></div>
      <div className={`absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full blur-[100px] pointer-events-none ${isDark ? 'bg-[#004d34]/10' : 'bg-[#004d34]/5'}`}></div>

      {/* Corporate Top Navigation Header */}
      <header className={`border-b ${borderClass} ${headerBg} backdrop-blur-md sticky top-0 z-40 transition-colors`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg">E</div>
            <div>
              <h1 className={`font-black text-xs tracking-wider leading-none uppercase ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>PT EXPRO GIO</h1>
              <span className="text-[9px] text-emerald-600 font-extrabold tracking-widest uppercase">NUSANTARA TBK</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold text-zinc-400">
            <a href="#tentang-kami" className={`hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>TENTANG KAMI</a>
            <a href="#tata-kelola" className={`hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>TATA KELOLA</a>
            <a href="#investor" className={`hover:text-emerald-500 transition-colors text-emerald-500`}>HUBUNGAN INVESTOR</a>
            <a href="#media" className={`hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>MEDIA</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-lg border ${borderClass} hover:bg-emerald-500/10 hover:text-emerald-400 transition-all flex items-center justify-center`}
              title="Ganti Tema Visual"
            >
              <span className="material-symbols-outlined text-base leading-none">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <Link to="/login" className={`px-4 py-2 rounded-lg text-[10px] font-extrabold transition-all shadow-sm ${isDark ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-950' : 'bg-zinc-950 hover:bg-zinc-900 text-white'}`}>
              PORTAL KARYAWAN
            </Link>
          </div>
        </div>
      </header>

      {/* Corporate Investor Relations Hero */}
      <section id="hero" className="py-24 px-6 relative max-w-7xl mx-auto w-full">
        <div className={`absolute top-0 right-0 w-[800px] h-[800px] blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse ${isDark ? 'bg-emerald-900/10' : 'bg-emerald-500/10'}`}></div>
        
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-zinc-900 border-zinc-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Laporan Kinerja Kuartal I - 2026 Tersedia
          </div>
          
          <h2 className={`text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Mendorong Pertumbuhan Melalui <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">Inovasi Rekayasa</span>
          </h2>
          
          <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Kami berkomitmen memberikan nilai jangka panjang bagi para pemegang saham melalui portofolio infrastruktur, layanan rekayasa industri, dan integrasi teknologi yang berkelanjutan.
          </p>
        </div>

        {/* Live Stock & Market Ticker */}
        <div className={`mt-16 border rounded-xl p-4 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>IDX Ticker</span>
              <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>EXPRO</p>
            </div>
            <div className="h-10 w-px bg-zinc-700/30"></div>
            <div className="space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Harga Saham</span>
              <p className={`text-2xl font-black flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Rp 6.420 <span className="text-sm font-bold animate-pulse">▲ +1.24%</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>IHSG: 7.210 <span className="text-emerald-500">▲</span></div>
            <div className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>USD/IDR: 15.420 <span className="text-red-500">▼</span></div>
          </div>
        </div>
      </section>

      {/* Financial Highlights */}
      <section id="investor" className={`py-20 border-t relative z-10 px-6 ${isDark ? 'border-zinc-800/50 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="space-y-2">
              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Sorotan Keuangan 2025</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Ikhtisar kinerja finansial konsolidasian tahunan (Audited).</p>
            </div>
            <button className={`px-4 py-2 text-xs font-bold border rounded-lg hover:border-emerald-500 transition-colors ${isDark ? 'border-zinc-800 text-emerald-400' : 'border-zinc-300 text-emerald-700'}`}>Lihat Laporan Penuh</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-8 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pendapatan Bersih</span>
              <p className={`text-4xl font-black mt-2 mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Rp 24,5 T</p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500"><span className="material-symbols-outlined text-sm">trending_up</span> +14.2% YoY</div>
            </div>
            <div className={`p-8 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Laba Bersih</span>
              <p className={`text-4xl font-black mt-2 mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Rp 3,2 T</p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500"><span className="material-symbols-outlined text-sm">trending_up</span> +18.5% YoY</div>
            </div>
            <div className={`p-8 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Aset Ekuitas</span>
              <p className={`text-4xl font-black mt-2 mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Rp 45,8 T</p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500"><span className="material-symbols-outlined text-sm">trending_up</span> +9.4% YoY</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reports and Publications (Tata Kelola) */}
      <section id="tata-kelola" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-zinc-800/20">
        <h3 className={`text-2xl font-black mb-12 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Laporan & Publikasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`flex gap-6 p-6 rounded-xl border hover:border-emerald-500/50 transition-all cursor-pointer group ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className={`w-24 h-32 rounded flex-shrink-0 flex items-center justify-center border shadow-inner ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
              <span className="material-symbols-outlined text-4xl text-emerald-600">book</span>
            </div>
            <div className="space-y-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Publikasi 2025</span>
              <h4 className={`text-lg font-black group-hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Laporan Tahunan 2025</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Membangun Ketahanan Melalui Sinergi Bisnis dan Teknologi Berkelanjutan.</p>
              <button className="text-xs font-bold text-emerald-600 flex items-center gap-1"><span className="material-symbols-outlined text-sm">download</span> Unduh PDF (14 MB)</button>
            </div>
          </div>
          
          <div className={`flex gap-6 p-6 rounded-xl border hover:border-emerald-500/50 transition-all cursor-pointer group ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className={`w-24 h-32 rounded flex-shrink-0 flex items-center justify-center border shadow-inner ${isDark ? 'bg-emerald-950 border-emerald-900' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className="material-symbols-outlined text-4xl text-emerald-600">eco</span>
            </div>
            <div className="space-y-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Publikasi 2025</span>
              <h4 className={`text-lg font-black group-hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Laporan Keberlanjutan 2025</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>ESG Report: Fokus pada efisiensi energi hijau dan komitmen lingkungan hidup.</p>
              <button className="text-xs font-bold text-emerald-600 flex items-center gap-1"><span className="material-symbols-outlined text-sm">download</span> Unduh PDF (8 MB)</button>
            </div>
          </div>
        </div>
      </section>

      {/* Media & Press Releases */}
      <section id="media" className={`py-20 border-t relative z-10 px-6 ${isDark ? 'border-zinc-800/50 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50/50'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="space-y-2">
              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Siaran Pers & Media</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Berita terbaru dan pembaruan strategis korporat.</p>
            </div>
            <button className={`px-4 py-2 text-xs font-bold border rounded-lg hover:border-emerald-500 transition-colors ${isDark ? 'border-zinc-800 text-emerald-400' : 'border-zinc-300 text-emerald-700'}`}>Lihat Semua Berita</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl border hover:border-emerald-500/50 transition-all cursor-pointer ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="text-[9px] font-bold text-emerald-500 mb-2">12 JUN 2026</div>
              <h4 className={`text-sm font-black mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Akuisisi Strategis Infrastruktur Cloud</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>FinCorp Enterprise resmi mengakuisisi pusat data tier 4 untuk memperkuat fondasi digital.</p>
            </div>
            <div className={`p-6 rounded-xl border hover:border-emerald-500/50 transition-all cursor-pointer ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="text-[9px] font-bold text-emerald-500 mb-2">08 MEI 2026</div>
              <h4 className={`text-sm font-black mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>RUPS Tahunan 2026 Menyepakati Dividen</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Rapat Umum Pemegang Saham menyepakati pembagian dividen Rp 280 per lembar saham.</p>
            </div>
            <div className={`p-6 rounded-xl border hover:border-emerald-500/50 transition-all cursor-pointer ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="text-[9px] font-bold text-emerald-500 mb-2">24 APR 2026</div>
              <h4 className={`text-sm font-black mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Penghargaan Green Energy Initiatives</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Rekayasa kelistrikan (MEP) ramah lingkungan memenangkan apresiasi skala internasional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase (Tentang Kami) */}
      <section id="tentang-kami" className={`py-24 border-t relative z-10 px-6 ${isDark ? 'border-zinc-800/50 bg-[#070708]' : 'border-zinc-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Portofolio Bisnis Utama</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Komitmen menyajikan kualitas pengerjaan MEP dan teknologi sistem informasi berstandar tinggi.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-6 rounded-xl transition-all duration-300 space-y-4 border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-emerald-500/20' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-lg">architecture</span>
              </div>
              <h4 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Infrastruktur Sipil & Arsitektur</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Pembangunan gedung hunian, instalasi saluran air & plumbing, pengerjaan interior, hingga penyempurnaan eksterior fasad.</p>
            </div>
            
            <div className={`p-6 rounded-xl transition-all duration-300 space-y-4 border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-emerald-500/20' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-lg">bolt</span>
              </div>
              <h4 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Mekanikal, Elektrikal & Elektronika</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Integrasi sistem HVAC, perpajakan industri, pemasangan kelistrikan tegangan menengah, dan sistem keamanan tata suara terpadu.</p>
            </div>

            <div className={`p-6 rounded-xl transition-all duration-300 space-y-4 border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-emerald-500/20' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-lg">code_blocks</span>
              </div>
              <h4 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Sistem Informasi & Manajemen TI</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Pengembangan & kustomisasi perangkat lunak, sistem akademik (CBT), aplikasi e-POS korporat, hingga konsultasi manajemen proyek TI.</p>
            </div>

            <div className={`p-6 rounded-xl transition-all duration-300 space-y-4 border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-emerald-500/20' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-lg">router</span>
              </div>
              <h4 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Jaringan & Telekomunikasi</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Penyediaan infrastruktur kabel fiber optik (FO) berkinerja tinggi serta layanan jual kembali (reselling) jasa jaringan telekomunikasi.</p>
            </div>
      {/* Services Showcase (Tentang Kami) */}
          </div>
        </div>
      </section>

      {/* Anchor Clients / Track Record */}
      <section id="klien" className={`py-20 border-t relative z-10 px-6 ${isDark ? 'border-zinc-800/50 bg-[#0a0a0c]' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Portofolio Kepercayaan (Anchor Clients)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Mitra Strategis dan Rekam Jejak Proyek Utama Nasional.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MedcoEnergi */}
            <div className={`p-8 rounded-xl border flex flex-col gap-4 transition-all duration-300 ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/30' : 'bg-white border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="flex items-center gap-3 border-b pb-4 border-zinc-800/30">
                <span className="material-symbols-outlined text-3xl text-emerald-500">factory</span>
                <h4 className={`font-black text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>MedcoEnergi (Medco Power)</h4>
              </div>
              <ul className={`text-xs space-y-3 list-disc pl-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li>Instalasi Switch Gear Panel pada PT. MPE</li>
                <li>Sistem Kontrol Panel untuk Genset 250 kVa pada PT. MPR</li>
                <li>Penyediaan ATS Panel 800 kVa untuk RSUD Pali</li>
              </ul>
            </div>

            {/* Pupuk Indonesia */}
            <div className={`p-8 rounded-xl border flex flex-col gap-4 transition-all duration-300 ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/30' : 'bg-white border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="flex items-center gap-3 border-b pb-4 border-zinc-800/30">
                <span className="material-symbols-outlined text-3xl text-emerald-500">agriculture</span>
                <h4 className={`font-black text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Pupuk Indonesia Holding</h4>
              </div>
              <ul className={`text-xs space-y-3 list-disc pl-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li>Perancangan & Pembuatan Aplikasi Fert Innovation</li>
                <li>Digitalisasi manajemen pupuk terintegrasi</li>
              </ul>
            </div>

            {/* Kemendikbud */}
            <div className={`p-8 rounded-xl border flex flex-col gap-4 transition-all duration-300 ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/30' : 'bg-white border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="flex items-center gap-3 border-b pb-4 border-zinc-800/30">
                <span className="material-symbols-outlined text-3xl text-emerald-500">school</span>
                <h4 className={`font-black text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Kementerian Pendidikan & Kebudayaan</h4>
              </div>
              <ul className={`text-xs space-y-3 list-disc pl-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li>Implementasi Radio Streaming SMAN 6 PLG</li>
                <li>Sistem Ujian Online CBT SMAN 10 PLG</li>
                <li>Pengembangan Sistem Informasi & Website Sekolah terpadu</li>
              </ul>
            </div>

            {/* KemenPUPR */}
            <div className={`p-8 rounded-xl border flex flex-col gap-4 transition-all duration-300 ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/30' : 'bg-white border-zinc-200 hover:border-emerald-500/40'}`}>
              <div className="flex items-center gap-3 border-b pb-4 border-zinc-800/30">
                <span className="material-symbols-outlined text-3xl text-emerald-500">engineering</span>
                <h4 className={`font-black text-lg ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Kementerian PUPR</h4>
              </div>
              <ul className={`text-xs space-y-3 list-disc pl-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <li>Manajemen Instalasi Listrik Pekerjaan Umum (PU) Jalan Nasional Wilayah III</li>
                <li>Pengadaan Barang dan Jasa infrastruktur kelistrikan negara</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-10 text-center text-xs text-zinc-500 mt-auto ${borderClass} ${footerBg}`}>
        <p className={`font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>&copy; 2026 PT Expro Gio Nusantara. All rights reserved.</p>
        <p className="text-[10px] text-zinc-600 mt-1">FinCorp Suite - Dashboard Finansial, Payroll Bulanan &amp; Asisten Kognitif AI</p>
      </footer>

      {/* Staff Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl p-8 shadow-2xl space-y-6 border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>Registrasi Karyawan Baru</h3>
              <button onClick={() => { setShowRegModal(false); setRegSuccess(false); }} className="text-zinc-500 hover:text-zinc-300 font-bold text-xl">&times;</button>
            </div>

            {regSuccess ? (
              <div className="text-center py-8 space-y-4">
                <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
                <h4 className="font-black text-emerald-500 text-xs uppercase tracking-wider">Aktivasi Diajukan!</h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-655'}`}>
                  Pendaftaran Anda berhasil dicatat dalam antrean. Hubungi administrator HR Keuangan untuk menyetujui akun Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-500">Nama Lengkap</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Rudi Hermawan" className={`w-full p-3 border rounded-lg focus:border-emerald-500 outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} required />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-500">Email Perusahaan</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Contoh: rudi@exprogio.com" className={`w-full p-3 border rounded-lg focus:border-emerald-500 outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} required />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-500">Divisi</label>
                  <select value={division} onChange={(e) => setDivision(e.target.value)} className={`w-full p-3 border rounded-lg focus:border-emerald-500 outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}>
                    <option value="IT (Teknologi Informasi)">IT (Teknologi Informasi)</option>
                    <option value="Layanan Elektrikal (MEP)">Layanan Elektrikal (MEP)</option>
                    <option value="Pembangunan / Sipil">Pembangunan / Sipil</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting} className={`w-full py-3.5 rounded-lg font-bold transition-all border shadow-md mt-6 ${
                  isDark 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-900 hover:text-white' 
                    : 'bg-zinc-950 border-zinc-950 text-white hover:bg-zinc-900'
                }`}>
                  {submitting ? 'Memproses...' : 'Kirim Permohonan Registrasi'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🔑 MODERN SAAS GATEWAY LOGIN (LIGHT/DARK)
// ==========================================
interface LoginPortalProps {
  theme: ThemeMode;
  handleMockLogin: (role: UserRole, name: string) => void;
}

const LoginPortal: React.FC<LoginPortalProps> = ({ theme, handleMockLogin }) => {
  const [activeTab, setActiveTab] = useState<'management' | 'staff' | 'investor'>('management');
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#070708]' : 'bg-zinc-50';
  const cardClass = isDark ? 'bg-zinc-900/80 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-2xl';
  const tabActiveBorder = 'border-emerald-500';

  const handleLoginClick = (role: UserRole, name: string) => {
    handleMockLogin(role, name);
    navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-6 font-sans relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-[100px] pointer-events-none animate-pulse ${isDark ? 'bg-emerald-900/10' : 'bg-emerald-500/10'}`}></div>
      <div className={`w-full max-w-md rounded-2xl relative animate-fade-in z-10 ${cardClass} shadow-2xl overflow-hidden backdrop-blur-md`}>
        {/* Header branding */}
        <div className={`p-8 text-center border-b space-y-3 ${isDark ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-100 bg-zinc-50/50'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg mx-auto text-lg">E</div>
          <h2 className={`font-black text-sm uppercase tracking-widest leading-none ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>PT EXPRO GIO NUSANTARA</h2>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Enterprise Gateway</p>
        </div>

        {/* Tab switcher */}
        <div className={`flex border-b text-xs font-bold text-center ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <button 
            onClick={() => setActiveTab('management')} 
            className={`w-1/3 py-4 transition-all border-b-2 ${
              activeTab === 'management' ? `${tabActiveBorder} text-emerald-500 font-black` : `border-transparent text-zinc-500 ${isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-800'}`
            }`}
          >
            Manajemen
          </button>
          <button 
            onClick={() => setActiveTab('staff')} 
            className={`w-1/3 py-4 transition-all border-b-2 ${
              activeTab === 'staff' ? `${tabActiveBorder} text-emerald-500 font-black` : `border-transparent text-zinc-500 ${isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-800'}`
            }`}
          >
            Staf &amp; Karyawan
          </button>
          <button 
            onClick={() => setActiveTab('investor')} 
            className={`w-1/3 py-4 transition-all border-b-2 ${
              activeTab === 'investor' ? `${tabActiveBorder} text-emerald-500 font-black` : `border-transparent text-zinc-500 ${isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-800'}`
            }`}
          >
            Investor
          </button>
        </div>

        {/* Content list */}
        <div className="p-8 space-y-4">
          {activeTab === 'investor' ? (
            <div className="space-y-2.5">
              <p className="text-[10px] text-zinc-500 font-bold mb-2 uppercase tracking-wider">Akses Stakeholder:</p>
              
              <button 
                onClick={() => handleLoginClick('investor', 'Bpk. Budi (Dewan Komisaris)')} 
                className={`w-full p-4 border rounded-xl text-left transition-all duration-300 flex justify-between items-center group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/60' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500">account_balance</span>
                  <div>
                    <span className={`font-extrabold block text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Portal Pemegang Saham</span>
                    <span className="text-[9px] text-zinc-500">Kinerja Saham, Dividen, &amp; Metrik ESG</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-emerald-500 text-sm">arrow_forward</span>
              </button>
            </div>
          ) : activeTab === 'management' ? (
            <div className="space-y-2.5">
              <p className="text-[10px] text-zinc-500 font-bold mb-2 uppercase tracking-wider">Otoritas Jabatan:</p>
              
              <button 
                onClick={() => handleLoginClick('superadmin', 'Zulkifli Lubis (Superadmin)')} 
                className={`w-full p-4 border rounded-xl text-left transition-all duration-300 flex justify-between items-center group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/60' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500">shield_person</span>
                  <div>
                    <span className={`font-extrabold block text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Superadmin System</span>
                    <span className="text-[9px] text-zinc-500">Akses Penuh, Audit Trail, &amp; System Log</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-emerald-500 text-sm">arrow_forward</span>
              </button>

              <button 
                onClick={() => handleLoginClick('admin', 'Siti Handayani (Admin)')} 
                className={`w-full p-4 border rounded-xl text-left transition-all duration-300 flex justify-between items-center group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/60' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500">account_balance_wallet</span>
                  <div>
                    <span className={`font-extrabold block text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Admin Keuangan &amp; HR</span>
                    <span className="text-[9px] text-zinc-500">Penggajian, Persetujuan User baru, Jurnal Transaksi</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-emerald-500 text-sm">arrow_forward</span>
              </button>

              <button 
                onClick={() => handleLoginClick('manager', 'Hendra Wijaya (Manajer)')} 
                className={`w-full p-4 border rounded-xl text-left transition-all duration-300 flex justify-between items-center group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/60' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500">supervisor_account</span>
                  <div>
                    <span className={`font-extrabold block text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Manajer / Direksi</span>
                    <span className="text-[9px] text-zinc-500">Persetujuan pengeluaran &gt;= Rp 50jt</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-emerald-500 text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">Akses Karyawan:</p>
              
              <button 
                onClick={() => handleLoginClick('staff', 'Agus Pratama (Staff)')} 
                className={`w-full p-4 border rounded-xl text-left transition-all duration-300 flex justify-between items-center group hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/60' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500">badge</span>
                  <div>
                    <span className={`font-extrabold block text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Agus Pratama (Staff IT)</span>
                    <span className="text-[9px] text-zinc-500">Pantau Gaji Pokok, Bonus KPI Bulanan, Jurnal Transaksi</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-emerald-500 text-sm">arrow_forward</span>
              </button>

              <div className={`border p-4 rounded-xl text-[10px] text-zinc-500 leading-relaxed ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="font-bold text-zinc-400 block mb-1">💡 Mengalami Masalah Login?</span>
                Staf baru yang telah mendaftar di halaman depan harus menunggu verifikasi dan persetujuan dari Admin HR sebelum dapat masuk ke dalam portal ini.
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <Link to="/" className="text-[10px] text-emerald-500 font-bold hover:underline">← Halaman Utama</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📊 DASHBOARD & STAFF COGNITIVE CHARTS
// ==========================================
interface DashboardProps {
  theme: ThemeMode;
}

const DashboardInvestor: React.FC<DashboardProps> = ({ theme }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [esgMetrics, setEsgMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  useEffect(() => {
    const fetchInvestorData = async () => {
      try {
        const [docsRes, esgRes] = await Promise.all([
          api.get('/investor/documents'),
          api.get('/investor/esg-metrics')
        ]);
        setDocuments(docsRes.data);
        setEsgMetrics(esgRes.data);
      } catch (err) {
        console.warn('API error fetching investor data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestorData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`p-6 border rounded-xl relative overflow-hidden ${isDark ? 'bg-[#0f1914] border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none -z-10 animate-pulse ${isDark ? 'bg-emerald-600/20' : 'bg-emerald-400/20'}`}></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h3 className={`text-lg font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Portal Investor & Stakeholder</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-700/70'}`}>Akses eksklusif data kinerja ESG, riwayat dividen, dan dokumen finansial tahunan PT Expro Gio Nusantara.</p>
          </div>
          <div className={`px-4 py-2 rounded-lg border text-center ${isDark ? 'bg-black/40 border-emerald-900/50 text-white' : 'bg-white/60 border-emerald-200 text-zinc-900'}`}>
            <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Nilai Saham (EXPRO)</p>
            <p className="text-xl font-black mt-0.5">Rp 6.420 <span className="text-xs text-emerald-500 animate-pulse">▲</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`border rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-zinc-500/20">
            <h4 className={`font-extrabold text-xs tracking-wider uppercase ${titleClass}`}>Metrik Keberlanjutan (ESG)</h4>
            <span className="material-symbols-outlined text-zinc-400 text-sm">eco</span>
          </div>
          {loading ? <p className="text-xs text-zinc-500">Memuat metrik...</p> : (
            <div className="space-y-4">
              {esgMetrics.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-emerald-500 text-[14px]">
                        {m.category === 'Lingkungan' ? 'forest' : m.category === 'Sosial' ? 'groups' : 'gavel'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${titleClass}`}>{m.name}</p>
                      <p className={`text-[10px] ${textClass}`}>{m.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${titleClass}`}>{m.value} <span className="text-[10px] font-normal text-zinc-500">{m.unit}</span></p>
                    <span className={`text-[10px] font-bold ${m.trend === 'up' ? 'text-emerald-500' : m.trend === 'down' ? 'text-red-500' : 'text-blue-500'}`}>
                      {m.trend === 'up' ? '▲ Meningkat' : m.trend === 'down' ? '▼ Menurun' : '■ Stabil'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`border rounded-xl p-5 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-zinc-500/20">
            <h4 className={`font-extrabold text-xs tracking-wider uppercase ${titleClass}`}>Pusat Unduhan Laporan</h4>
            <span className="material-symbols-outlined text-zinc-400 text-sm">download</span>
          </div>
          {loading ? <p className="text-xs text-zinc-500">Memuat dokumen...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className={tableHeaderClass}>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Dokumen</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Tanggal Rilis</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-500/20">
                  {documents.map((doc, i) => (
                    <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                      <td className={`p-3 font-medium ${titleClass}`}>{doc.title}</td>
                      <td className={`p-3 ${textClass}`}>{doc.publishDate}</td>
                      <td className="p-3 text-right">
                        <button className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded shadow-sm transition-colors text-[10px]">
                          Unduh PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ theme }) => {
  const userRole = localStorage.getItem('mock_user_role') || 'staff';
  if (userRole === 'investor') {
    return <DashboardInvestor theme={theme} />;
  }

  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mgmtCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, invRes, payRes] = await Promise.all([
          api.get('/transactions'),
          api.get('/invoices'),
          api.get('/payroll')
        ]);
        setTransactions(txRes.data);
        setInvoices(invRes.data);
        setPayrolls(payRes.data);
        // Pending approvals = transaksi berstatus "Menunggu Approval" dari database
        const pending = txRes.data
          .filter((t: any) => t.status === 'Menunggu Approval')
          .map((t: any) => ({
            id: t.transactionId,
            date: t.transactionDate,
            submitter: t.creatorEmail,
            amount: t.amount,
            purpose: t.description,
            status: t.status
          }));
        setPendingApprovals(pending);
      } catch (err) {
        console.warn('API error on Dashboard, akan menampilkan data kosong', err);
        setTransactions([]);
        setInvoices([]);
        setPayrolls([]);
        setReimbursements([]);
        setPendingApprovals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Initialize Charts using global Chart.js from CDN
  useEffect(() => {
    if (!loading && window.Chart) {
      let kpiChart: any = null;
      let mgmtChart: any = null;

      // Set Chart.js Defaults based on active Theme
      window.Chart.defaults.color = isDark ? '#71717a' : '#52525b';
      window.Chart.defaults.font.family = 'Inter, sans-serif';

      if (canvasRef.current && userRole === 'staff') {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          kpiChart = new window.Chart(ctx, {
            type: 'line',
            data: {
              labels: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'],
              datasets: [
                {
                  label: 'KPI Capaian Kinerja (%)',
                  data: [82, 85, 90, 88, 92, 95],
                  borderColor: '#10b981',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.03)' : 'rgba(16, 185, 129, 0.05)',
                  tension: 0.35,
                  borderWidth: 3,
                  fill: true,
                  yAxisID: 'y',
                  pointBackgroundColor: '#10b981',
                  pointHoverRadius: 6
                },
                {
                  label: 'Gaji Bersih (Juta Rp)',
                  data: [9.2, 9.5, 9.8, 9.6, 9.9, 10.4],
                  borderColor: '#3b82f6',
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.03)' : 'rgba(59, 130, 246, 0.05)',
                  tension: 0.35,
                  borderWidth: 3,
                  fill: true,
                  yAxisID: 'y1',
                  pointBackgroundColor: '#3b82f6',
                  pointHoverRadius: 6
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { boxWidth: 12, font: { size: 10, weight: '600' } } } },
              scales: {
                y: { type: 'linear', position: 'left', grid: { color: isDark ? 'rgba(39, 39, 42, 0.4)' : 'rgba(228, 228, 231, 0.8)' }, title: { display: true, text: 'Nilai KPI (%)', color: isDark ? '#a1a1aa' : '#52525b', font: { size: 10, weight: 'bold' } }, min: 50, max: 100 },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Take Home Pay (Juta Rp)', color: isDark ? '#a1a1aa' : '#52525b', font: { size: 10, weight: 'bold' } }, min: 5, max: 15 }
              }
            }
          });
        }
      }

      // Aggregate real transaction data for the last 6 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentMonth = new Date().getMonth();
      const dynamicLabels = [];
      for (let i = 5; i >= 0; i--) {
        dynamicLabels.push(monthNames[(currentMonth - i + 12) % 12]);
      }
      const monthlyIncome = Array(6).fill(0);
      const monthlyExpense = Array(6).fill(0);
      
      transactions.forEach(t => {
        if (t.status === 'Lunas' && t.transactionDate) {
          const date = new Date(t.transactionDate);
          const monthDiff = (new Date().getFullYear() - date.getFullYear()) * 12 + new Date().getMonth() - date.getMonth();
          if (monthDiff >= 0 && monthDiff < 6) {
            const index = 5 - monthDiff;
            if (t.type === 'Pendapatan') {
              monthlyIncome[index] += t.amount / 1000000;
            } else if (t.type === 'Pengeluaran') {
              monthlyExpense[index] += t.amount / 1000000;
            }
          }
        }
      });

      if (mgmtCanvasRef.current && userRole !== 'staff') {
        const mgmtCtx = mgmtCanvasRef.current.getContext('2d');
        if (mgmtCtx) {
          mgmtChart = new window.Chart(mgmtCtx, {
            type: 'bar',
            data: {
              labels: dynamicLabels,
              datasets: [
                {
                  label: 'Total Pendapatan (Juta Rp)',
                  data: monthlyIncome,
                  backgroundColor: '#10b981',
                  borderRadius: 4,
                },
                {
                  label: 'Total Pengeluaran (Juta Rp)',
                  data: monthlyExpense,
                  backgroundColor: '#f43f5e',
                  borderRadius: 4,
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: isDark ? '#a1a1aa' : '#52525b', font: { size: 10, weight: '600' } } } },
              scales: {
                y: { grid: { color: isDark ? 'rgba(39, 39, 42, 0.4)' : 'rgba(228, 228, 231, 0.8)' }, ticks: { color: isDark ? '#a1a1aa' : '#52525b' } },
                x: { grid: { display: false }, ticks: { color: isDark ? '#a1a1aa' : '#52525b' } }
              }
            }
          });
        }
      }

      return () => {
        if (kpiChart) kpiChart.destroy();
        if (mgmtChart) mgmtChart.destroy();
      };
    }
    return undefined;
  }, [loading, theme, userRole]);

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  if (loading) {
    return <SkeletonLoader isDark={isDark} rows={6} />;
  }

  // ==========================================
  // VIEW UNTUK PERAN: STAFF KARYAWAN
  // ==========================================
  if (userRole === 'staff') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className={`text-lg font-black ${titleClass}`}>Dashboard Karyawan</h2>
          <p className={`text-xs mt-1 ${textClass}`}>Metrik pencapaian kinerja, slip gaji terbit, dan asisten AI finansial.</p>
        </div>

        {/* Staff Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-6 rounded-xl backdrop-blur-md transition-all hover:border-emerald-500/20 border ${cardClass}`}>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Take Home Pay (Bulan Ini)</p>
            <p className="text-2xl font-black text-emerald-500 mt-2">{formatRupiah(10426462)}</p>
            <span className="text-[9px] text-zinc-500 block mt-1">Periode: Juni 2026</span>
          </div>
          <div className={`p-6 rounded-xl backdrop-blur-md transition-all hover:border-emerald-500/20 border ${cardClass}`}>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Capaian KPI Kinerja</p>
            <p className="text-2xl font-black text-blue-500 mt-2">95.00%</p>
            <span className="text-[9px] text-emerald-500 font-bold block mt-1">▲ +3% dibanding bulan lalu</span>
          </div>
          <div className={`p-6 rounded-xl backdrop-blur-md transition-all hover:border-emerald-500/20 border ${cardClass}`}>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bonus Capaian Kinerja</p>
            <p className="text-2xl font-black text-amber-500 mt-2">{formatRupiah(1211250)}</p>
            <span className="text-[9px] text-zinc-500 block mt-1">Kategori: Sangat Baik (A)</span>
          </div>
        </div>

        {/* Graphical KPI Chart Section */}
        <div className={`rounded-xl p-6 space-y-4 backdrop-blur-md border ${cardClass}`}>
          <h3 className={`font-extrabold text-xs ${titleClass}`}>Hubungan KPI Kinerja &amp; Take Home Pay Bulanan</h3>
          <div className="h-64 relative w-full">
            <canvas ref={canvasRef}></canvas>
          </div>
        </div>

        {/* Payslips List Table */}
        <div className={`rounded-xl p-6 space-y-4 backdrop-blur-md border ${cardClass}`}>
          <h3 className={`font-extrabold text-xs ${titleClass}`}>Daftar Slip Gaji Resmi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
                  <th className="p-3.5">ID Slip</th>
                  <th className="p-3.5">Periode</th>
                  <th className="p-3.5">Gaji Pokok</th>
                  <th className="p-3.5">Bonus KPI</th>
                  <th className="p-3.5">Potongan (Tax+BPJS)</th>
                  <th className="p-3.5">Tanggal Cair</th>
                  <th className="p-3.5 font-bold text-white">Gaji Bersih</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
                {payrolls.map(pay => (
                  <tr key={pay.payrollId} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                    <td className={`p-3.5 font-mono font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{pay.payrollId}</td>
                    <td className="p-3.5 font-bold">{pay.period}</td>
                    <td className="p-3.5">{formatRupiah(pay.baseSalary || 8500000)}</td>
                    <td className="p-3.5 text-emerald-500 font-bold">+{formatRupiah(pay.bonus)}</td>
                    <td className="p-3.5 text-red-500 font-medium">-{formatRupiah((pay.baseSalary || 8500000) * 0.07)}</td>
                    <td className="p-3.5 text-zinc-500 font-mono">{pay.releaseDate}</td>
                    <td className="p-3.5 font-black text-emerald-500">{formatRupiah(pay.netSalary)}</td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => printPayslipPDF({
                          ...pay,
                          employeeName: pay.employeeName || 'Agus Pratama',
                          employeeEmail: pay.employeeEmail || 'staff@exprogio.com',
                          division: pay.division || 'IT (Teknologi Informasi)',
                          baseSalary: pay.baseSalary || 8500000,
                          allowance: pay.allowance || 1500000,
                          tax: pay.tax || (pay.baseSalary || 8500000) * 0.05,
                          bpjs: pay.bpjs || (pay.baseSalary || 8500000) * 0.02
                        })} 
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-lg font-bold text-[10px] transition-all"
                      >
                        <span className="material-symbols-outlined text-[12px]">description</span> Slip Gaji (PDF)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reimbursement List Table */}
        <div className={`rounded-xl p-6 space-y-4 backdrop-blur-md border ${cardClass}`}>
          <h3 className={`font-extrabold text-xs ${titleClass}`}>Status Pengajuan Dana (Reimbursement)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
                  <th className="p-3.5">ID Pengajuan</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Tujuan Pengajuan</th>
                  <th className="p-3.5">Nominal (Rp)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
                {reimbursements.map(rmb => (
                  <tr key={rmb.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                    <td className={`p-3.5 font-mono font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{rmb.id}</td>
                    <td className="p-3.5 font-mono text-zinc-500">{rmb.date}</td>
                    <td className="p-3.5 font-bold">{rmb.purpose}</td>
                    <td className="p-3.5 font-black text-amber-500">{formatRupiah(rmb.amount)}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold border uppercase whitespace-nowrap inline-block ${
                        rmb.status === 'Disetujui'
                          ? (isDark ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                          : (isDark ? 'bg-amber-950/30 text-amber-400 border-amber-800/30' : 'bg-amber-50 text-amber-700 border-amber-200')
                      }`}>
                        {rmb.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW UNTUK PERAN: MANAGEMENT
  // ==========================================
  const revenue = transactions.filter(t => t.type === 'Pendapatan').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'Pengeluaran').reduce((sum, t) => sum + t.amount, 0);
  const cashFlow = revenue - expense;
  const unpaidInvoices = invoices.filter(i => i.status !== 'Lunas').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-lg font-black ${titleClass}`}>Dashboard Eksekutif</h2>
        <p className={`text-xs mt-1 ${textClass}`}>Ringkasan arus kas korporat, tagihan piutang, dan log pengeluaran proyek.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`p-5 rounded-xl backdrop-blur-md hover:border-emerald-500/20 transition-all border ${cardClass}`}>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Pendapatan</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatRupiah(revenue)}</p>
        </div>
        <div className={`p-5 rounded-xl backdrop-blur-md hover:border-emerald-500/20 transition-all border ${cardClass}`}>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Pengeluaran</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{formatRupiah(expense)}</p>
        </div>
        <div className={`p-5 rounded-xl backdrop-blur-md hover:border-emerald-500/20 transition-all border ${cardClass}`}>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Kas Bersih (Liquidity)</p>
          <p className={`text-2xl font-black mt-1 ${
            cashFlow >= 0 
              ? (isDark ? 'text-emerald-400' : 'text-emerald-700') 
              : (isDark ? 'text-rose-400' : 'text-rose-600')
          }`}>{formatRupiah(cashFlow)}</p>
        </div>
        <div className={`p-5 rounded-xl backdrop-blur-md hover:border-emerald-500/20 transition-all border ${cardClass}`}>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tagihan (Piutang)</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{formatRupiah(unpaidInvoices)}</p>
        </div>
        <div className={`p-5 rounded-xl backdrop-blur-md hover:border-emerald-500/20 transition-all border ${cardClass}`}>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Kewajiban (Hutang)</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{formatRupiah(450000000)}</p>
        </div>
      </div>
      {/* Graphical Financial Chart Section */}
      <div className={`rounded-xl p-6 space-y-6 backdrop-blur-md border ${cardClass}`}>
        <div>
          <h3 className={`font-extrabold text-sm ${titleClass}`}>Visualisasi Arus Kas & Likuiditas (H1)</h3>
          <p className={`text-[10px] ${textClass}`}>Perbandingan Pemasukan (Zamrud) vs Pengeluaran (Merah) Semester 1</p>
        </div>
        
        {/* CSS-Based Dynamic Bar Chart */}
        <div className="flex items-end space-x-2 md:space-x-6 h-64 w-full pt-4 border-b border-l border-zinc-500/30 px-2 pb-2 relative">
          
          {/* Y-Axis Labels */}
          <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-[9px] text-zinc-500 font-bold pb-2">
            <span>250M</span>
            <span>200M</span>
            <span>150M</span>
            <span>100M</span>
            <span>50M</span>
            <span>0</span>
          </div>

          {[
            { month: 'Jan', rev: 120, exp: 80 },
            { month: 'Feb', rev: 150, exp: 95 },
            { month: 'Mar', rev: 180, exp: 110 },
            { month: 'Apr', rev: 210, exp: 105 },
            { month: 'Mei', rev: 190, exp: 90 },
            { month: 'Jun', rev: 250, exp: 130 }
          ].map((data) => {
            const revHeight = (data.rev / 250) * 100;
            const expHeight = (data.exp / 250) * 100;
            return (
              <div key={data.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-zinc-900 text-white text-[9px] p-2 rounded-lg shadow-xl whitespace-nowrap z-10 pointer-events-none">
                  <p className="font-bold border-b border-zinc-700 pb-1 mb-1">{data.month} 2026</p>
                  <p className="text-emerald-400">In: Rp {data.rev} Juta</p>
                  <p className="text-rose-400">Out: Rp {data.exp} Juta</p>
                </div>
                
                <div className="flex items-end justify-center space-x-1 w-full h-full pb-1">
                  {/* Revenue Bar */}
                  <div 
                    className="w-[30%] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm animate-[grow_1.5s_ease-out_forwards]"
                    style={{ height: `${revHeight}%` }}
                  ></div>
                  {/* Expense Bar */}
                  <div 
                    className="w-[30%] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm animate-[grow_1.5s_ease-out_forwards] delay-100"
                    style={{ height: `${expHeight}%` }}
                  ></div>
                </div>
                {/* X-Axis Label */}
                <span className="text-[10px] font-bold text-zinc-500 mt-2">{data.month}</span>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className={`text-[10px] font-bold ${textClass}`}>Total Pendapatan</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className={`text-[10px] font-bold ${textClass}`}>Total Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Invoice list inside dashboard */}
      <div className={`rounded-xl p-6 backdrop-blur-md border ${cardClass}`}>
        <h3 className={`font-extrabold text-xs mb-4 ${titleClass}`}>Invoice Piutang Klien</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
                <th className="p-3.5">Invoice ID</th>
                <th className="p-3.5">Nama Klien</th>
                <th className="p-3.5">Jumlah Tagihan</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {invoices.map(inv => (
                <tr key={inv.invoiceId} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className={`p-3.5 font-mono font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{inv.invoiceId}</td>
                  <td className="p-3.5 font-bold">{inv.clientName}</td>
                  <td className={`p-3.5 font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{formatRupiah(inv.amount)}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold border uppercase whitespace-nowrap inline-block ${
                      inv.status === 'Lunas'
                        ? (isDark ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                        : inv.status === 'Jatuh Tempo'
                        ? (isDark ? 'bg-red-950/30 text-red-400 border-red-800/30' : 'bg-red-50 text-red-700 border-red-200')
                        : (isDark ? 'bg-amber-950/30 text-amber-400 border-amber-800/30' : 'bg-amber-50 text-amber-700 border-amber-200')
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Pending Approvals Table */}
      <div className={`rounded-xl p-6 backdrop-blur-md border border-amber-500/30 ${cardClass}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-extrabold text-xs text-amber-500 flex items-center gap-2`}><span className="material-symbols-outlined text-sm">warning</span> Menunggu Approval (Pengeluaran &gt; 50 Jt)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
                <th className="p-3.5">ID TRX</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Pengaju (Staf)</th>
                <th className="p-3.5">Tujuan Pengeluaran</th>
                <th className="p-3.5">Nominal (Rp)</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {pendingApprovals.map(req => (
                <tr key={req.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className={`p-3.5 font-mono font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{req.id}</td>
                  <td className="p-3.5 font-mono text-zinc-500">{req.date}</td>
                  <td className="p-3.5 font-bold">{req.submitter}</td>
                  <td className="p-3.5">{req.purpose}</td>
                  <td className="p-3.5 font-black text-rose-500">{formatRupiah(req.amount)}</td>
                  <td className="p-3.5 flex justify-end gap-2">
                    <button className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-md font-bold text-[9px] transition-all flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">check</span> Approve</button>
                    <button className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-md font-bold text-[9px] transition-all flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">close</span> Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📝 TRANSACTIONS COMPONENT (LIGHT/DARK)
// ==========================================
interface TransactionsProps {
  theme: ThemeMode;
  userRole?: UserRole | null;
}

const Transactions: React.FC<TransactionsProps> = ({ theme, userRole }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState('Pendapatan');
  const [category, setCategory] = useState('Kontrak Proyek IT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const { showToast } = useToast();

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.warn('API error, using mock fallback', err);
      const savedMock = localStorage.getItem('mock_transactions');
      if (savedMock) {
        setTransactions(JSON.parse(savedMock));
      } else {
        const initialMock = [
          { transactionId: 'TX-001', transactionDate: '2026-06-10', type: 'Pendapatan', category: 'Kontrak Proyek IT', amount: 250000000, description: 'DP Proyek ERP PT Semen Nusantara', creatorEmail: 'admin@exprogio.com', status: 'Lunas' },
          { transactionId: 'TX-002', transactionDate: '2026-06-15', type: 'Pendapatan', category: 'Instalasi Elektrikal', amount: 180000000, description: 'Termin 1 Pemasangan Gardu Listrik Pabrik Logam Tangerang', creatorEmail: 'admin@exprogio.com', status: 'Lunas' },
          { transactionId: 'TX-003', transactionDate: '2026-06-25', type: 'Pengeluaran', category: 'Instalasi Elektrikal', amount: 60000000, description: 'Pembelian Kabel Tembaga NYY 4x95mm Supreme', creatorEmail: 'staff@exprogio.com', status: 'Lunas' },
          { transactionId: 'TX-004', transactionDate: '2026-06-28', type: 'Pengeluaran', category: 'Gaji & Payroll', amount: 45000000, description: 'Alokasi Penggajian Karyawan & Staff Periode Juni 2026', creatorEmail: 'admin@exprogio.com', status: 'Lunas' },
          { transactionId: 'TX-005', transactionDate: '2026-07-01', type: 'Pendapatan', category: 'Kontrak Proyek IT', amount: 120000000, description: 'Pelunasan Invoice Proyek Cloud Infrastructure PT Telkom', creatorEmail: 'admin@exprogio.com', status: 'Lunas' },
          { transactionId: 'TX-006', transactionDate: '2026-07-02', type: 'Pengeluaran', category: 'Operasional Kantor', amount: 8500000, description: 'Sewa Cloud Server AWS Production & Domain Perusahaan', creatorEmail: 'staff@exprogio.com', status: 'Lunas' },
          { transactionId: 'TX-007', transactionDate: '2026-07-02', type: 'Pengeluaran', category: 'Operasional Kantor', amount: 2400000, description: 'Klaim Reimbursement Transport Pengawasan Sipil Cikarang', creatorEmail: 'staff@exprogio.com', status: 'Lunas' },
          { transactionId: 'TX-008', transactionDate: '2026-07-02', type: 'Pengeluaran', category: 'Instalasi Elektrikal', amount: 75000000, description: 'Pengadaan Sub-Panel Listrik Proyek Gedung Sudirman Kav 24', creatorEmail: 'staff@exprogio.com', status: 'Menunggu Approval' }
        ];
        setTransactions(initialMock);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Nominal harus lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      setFormError('Deskripsi transaksi tidak boleh kosong.');
      return;
    }
    setSubmitting(true);
    
    let initialStatus = 'Lunas';
    if (type === 'Pengeluaran' && parseFloat(amount) >= 50000000 && userRole === 'staff') {
      initialStatus = 'Menunggu Approval';
    }

    const payload = { type, category, amount: parseFloat(amount), description, status: initialStatus };

    try {
      await api.post('/transactions', payload);
      setAmount('');
      setDescription('');
      showToast('Transaksi berhasil dicatat.', 'success');
      fetchTransactions();
    } catch (err) {
      showToast('Gagal mencatat transaksi (menggunakan mock lokal)', 'error');
      const mockNew = {
        transactionId: 'TX-' + Math.floor(Math.random() * 100000).toString().padStart(3, '0'),
        transactionDate: new Date().toISOString().split('T')[0],
        type,
        category,
        amount: parseFloat(amount),
        description,
        creatorEmail: localStorage.getItem('mock_user_email') || 'staff@exprogio.com',
        status: initialStatus
      };
      setTransactions([mockNew, ...transactions]);
      setAmount('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await api.post(`/transactions/${id}/approve?approve=${approve}`);
      showToast(`Transaksi ${approve ? 'disetujui' : 'ditolak'}`, 'success');
      fetchTransactions();
    } catch (err) {
      showToast('Gagal memproses persetujuan', 'error');
      const updated = transactions.map(t => 
        t.transactionId === id ? { ...t, status: approve ? 'Lunas' : 'Ditolak' } : t
      );
      setTransactions(updated);
      localStorage.setItem('mock_transactions', JSON.stringify(updated));
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  if (loading) return <SkeletonLoader isDark={isDark} rows={5} />;

  const showInputForm = userRole === 'admin' || userRole === 'staff' || !userRole;

  return (
    <div className={`grid grid-cols-1 gap-6 animate-fade-in ${showInputForm ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-5xl mx-auto'}`}>
      
      {/* Transaction List Table */}
      <div className={`${showInputForm ? 'lg:col-span-2' : ''} border rounded-xl p-6 space-y-6 backdrop-blur-md ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h3 className={`font-extrabold text-xs ${titleClass}`}>Jurnal Kas Finansial</h3>
            <span className="text-[9px] text-zinc-500">Total: {transactions.length} Item</span>
            </div>
            <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 border rounded-lg ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white border-zinc-250'}`}>
              <span className="material-symbols-outlined text-[14px] text-zinc-500">search</span>
              <input type="text" placeholder="Cari TX-ID..." className="bg-transparent text-[10px] w-24 outline-none placeholder-zinc-500" disabled />
            </div>
            <button 
              onClick={() => exportToExcel(transactions, 'Jurnal_Transaksi_PT_Expro_Gio_Nusantara.csv', {
                transactionId: 'ID Transaksi',
                transactionDate: 'Tanggal',
                type: 'Tipe',
                category: 'Kategori',
                amount: 'Jumlah (Rp)',
                description: 'Deskripsi',
                creatorEmail: 'Pembuat',
                status: 'Status'
              })} 
              className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850' 
                  : 'bg-zinc-100 border-zinc-250 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
              }`}
            >
              <span className="material-symbols-outlined text-xs">download</span> Ekspor Excel
            </button>
            <button 
              onClick={() => printTransactionsPDF(transactions, theme)} 
              className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850' 
                  : 'bg-zinc-100 border-zinc-250 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
              }`}
            >
              <span className="material-symbols-outlined text-xs">print</span> Cetak Jurnal (PDF)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Jumlah</th>
                <th className="p-3.5">Deskripsi</th>
                <th className="p-3.5">Status</th>
                {(userRole === 'manager' || userRole === 'superadmin') && <th className="p-3.5">Aksi</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {transactions.map(tx => (
                <tr key={tx.transactionId} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className={`p-3.5 font-mono font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{tx.transactionId}</td>
                  <td className="p-3.5">
                    <span className="block font-bold">{tx.category}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${tx.type === 'Pendapatan' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`p-3.5 font-black whitespace-nowrap ${
                    tx.type === 'Pendapatan' 
                      ? (isDark ? 'text-emerald-400' : 'text-emerald-700') 
                      : (isDark ? 'text-rose-400' : 'text-rose-600')
                  }`}>
                    {tx.type === 'Pendapatan' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </td>
                  <td className="p-3.5 text-zinc-400">
                    <div className="max-w-[180px] truncate" title={tx.description}>
                      {tx.description}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold border uppercase whitespace-nowrap inline-block ${
                      tx.status === 'Lunas'
                        ? (isDark ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30' : 'bg-emerald-50 text-emerald-700 border-emerald-250')
                        : tx.status === 'Ditolak'
                        ? (isDark ? 'bg-red-950/30 text-red-400 border-red-800/30' : 'bg-red-50 text-red-700 border-red-250')
                        : (isDark ? 'bg-amber-950/30 text-amber-400 border-amber-800/30' : 'bg-amber-50 text-amber-700 border-amber-250')
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  {(userRole === 'manager' || userRole === 'superadmin') && (
                    <td className="p-3.5 space-x-1.5">
                      {tx.status === 'Menunggu Approval' && (
                        <>
                          <button onClick={() => handleApprove(tx.transactionId, true)} className="px-2.5 py-1 bg-emerald-500 text-zinc-950 rounded-lg text-[9px] hover:bg-emerald-400 font-extrabold transition-all">Setujui</button>
                          <button onClick={() => handleApprove(tx.transactionId, false)} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-extrabold transition-all">Tolak</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Form Panel */}
      {showInputForm && (
      <div className={`border rounded-xl p-6 space-y-4 h-fit backdrop-blur-md ${cardClass}`}>
        <h3 className={`font-extrabold text-xs ${titleClass}`}>Catat Transaksi</h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {formError && (
            <div className="bg-red-500/10 text-red-500 font-bold p-2.5 rounded border border-red-500/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span> {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-bold text-zinc-500">Tipe Transaksi</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={`w-full p-2.5 border rounded-lg focus:border-emerald-500 outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}>
              <option value="Pendapatan">Pendapatan (+)</option>
              <option value="Pengeluaran">Pengeluaran (-)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-zinc-500">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full p-2.5 border rounded-lg focus:border-emerald-500 outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}>
              <option value="Kontrak Proyek IT">Kontrak Proyek IT</option>
              <option value="Instalasi Elektrikal">Instalasi Elektrikal</option>
              <option value="Pembangunan / Sipil">Pembangunan / Sipil</option>
              <option value="Gaji &amp; Payroll">Gaji &amp; Payroll</option>
              <option value="Operasional Kantor">Operasional Kantor</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-zinc-500">Jumlah (Rupiah)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 15000000" className={`w-full p-2.5 border rounded-lg focus:border-emerald-500 outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} required />
            {type === 'Pengeluaran' && parseFloat(amount) >= 50000000 && userRole === 'staff' && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs leading-none">warning</span>
                <span>Nilai pengeluaran &gt;= Rp 50jt membutuhkan persetujuan Manajer.</span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-zinc-500">Deskripsi / Catatan</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Rincian pengeluaran/pendapatan..." className={`w-full p-2.5 border rounded-lg focus:border-emerald-500 outline-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} required></textarea>
          </div>

          <button type="submit" disabled={submitting} className={`w-full py-3 rounded-lg font-bold transition-all border shadow-sm ${
            isDark 
              ? 'bg-white text-black border-white hover:bg-zinc-200' 
              : 'bg-black text-white border-black hover:bg-zinc-800'
          }`}>
            {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
      )}

    </div>
  );
};

// ==========================================
// 💵 PAYROLL COMPONENT (LIGHT/DARK)
// ==========================================
interface PayrollProps {
  theme: ThemeMode;
  userRole?: UserRole | null;
}

const Payroll: React.FC<PayrollProps> = ({ theme, userRole }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [period, setPeriod] = useState('Juli 2026');

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  const fetchData = async () => {
    try {
      const [empRes, payRes] = await Promise.all([api.get('/employees'), api.get('/payroll')]);
      setEmployees(empRes.data);
      setPayrolls(payRes.data);
    } catch (err) {
      console.warn('API error, using mock fallback', err);
      setEmployees([
        { employeeId: 1, fullName: 'Agus Pratama', email: 'staff@exprogio.com', division: 'IT (Teknologi Informasi)', baseSalary: 8500000, allowance: 1500000, kpiTarget: 100, kpiAchieved: 95 },
        { employeeId: 2, fullName: 'Dewi Lestari', email: 'dewi@exprogio.com', division: 'Layanan Elektrikal (MEP)', baseSalary: 7800000, allowance: 1200000, kpiTarget: 100, kpiAchieved: 88 },
        { employeeId: 3, fullName: 'Budi Santoso', email: 'budi@exprogio.com', division: 'Pembangunan / Sipil', baseSalary: 6500000, allowance: 1000000, kpiTarget: 100, kpiAchieved: 75 }
      ]);
      const savedMock = localStorage.getItem('mock_payrolls');
      if (savedMock) {
        setPayrolls(JSON.parse(savedMock));
      } else {
        const initialMock = [
          { payrollId: 'SL-10001', employeeName: 'Agus Pratama', employeeEmail: 'staff@exprogio.com', division: 'IT (Teknologi Informasi)', period: 'Juni 2026', baseSalary: 8500000, allowance: 1500000, bonus: 1211250, tax: 560562, bpjs: 224225, netSalary: 10426463, releaseDate: '2026-06-28' }
        ];
        setPayrolls(initialMock);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { showToast } = useToast();

  const handleProcessPayroll = async () => {
    if (!period) return;
    setProcessing(true);
    try {
      // Coba panggil endpoint process di backend
      await api.post('/payroll/process', { period });
      showToast(`Gaji periode ${period} berhasil diproses dan tersimpan di database!`, 'success');
      fetchData();
    } catch (err: any) {
      // Jika backend belum punya endpoint process, hitung di frontend dan POST satu per satu ke database
      try {
        const processed = employees.map(emp => {
          const base = emp.baseSalary;
          const allowance = emp.allowance;
          const kpiPct = emp.kpiAchieved / 100.0;
          const bonus = base * 0.15 * kpiPct;
          const gross = base + allowance + bonus;
          const tax = gross * 0.05;
          const bpjs = gross * 0.02;
          const net = gross - tax - bpjs;
          return {
            payrollId: `SL-${emp.employeeId}-${Date.now() % 100000}`,
            employeeEmail: emp.email,
            employeeName: emp.fullName,
            division: emp.division,
            period,
            baseSalary: base,
            allowance,
            bonus,
            tax,
            bpjs,
            netSalary: net,
            releaseDate: new Date().toISOString().split('T')[0]
          };
        });

        // Simpan setiap record payroll ke database via API
        await Promise.all(processed.map(p => api.post('/payroll', p)));
        showToast(`Gaji ${processed.length} karyawan periode ${period} berhasil diproses dan tersimpan ke database!`, 'success');
        fetchData();
      } catch (innerErr) {
        console.error('Gagal memproses payroll', innerErr);
        showToast('Gagal memproses payroll. Pastikan backend berjalan dan coba lagi.', 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  if (loading) return <SkeletonLoader isDark={isDark} rows={4} />;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header and calculation trigger panel */}
      <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border p-6 rounded-xl backdrop-blur-md ${cardClass}`}>
        <div>
          <h3 className={`font-extrabold text-xs ${titleClass}`}>
            {userRole === 'admin' ? 'Pemrosesan Payroll Bulanan' : 'Laporan Eksekutif Payroll'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 mb-3">
            {userRole === 'admin' 
              ? 'Lakukan kalkulasi slip gaji serentak menggunakan parameter pencapaian KPI bulanan.'
              : 'Tinjauan rekapitulasi data penggajian karyawan, capaian KPI, dan beban anggaran bulan ini.'}
          </p>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] uppercase tracking-wider font-bold rounded flex items-center gap-2 print:hidden">
            <span className="material-symbols-outlined text-[14px]">print</span>
            Cetak Rekap Gaji
          </button>
        </div>
        {userRole === 'admin' && (
          <div className="flex items-center gap-2 text-xs">
            <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Periode (ex: Juli 2026)" className={`p-2.5 border rounded-lg focus:border-emerald-500 outline-none max-w-[150px] ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} />
            <button onClick={handleProcessPayroll} disabled={processing} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg">
              {processing ? 'Memproses...' : 'Kalkulasi Gaji'}
            </button>
          </div>
        )}
      </div>

      {/* Directory of Employees */}
      <div className={`border rounded-xl p-6 space-y-4 backdrop-blur-md ${cardClass}`}>
        <h4 className={`font-extrabold text-xs ${titleClass}`}>Direktori Gaji Karyawan Aktif</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
                <th className="p-3.5">Nama</th>
                <th className="p-3.5">Divisi</th>
                <th className="p-3.5">Gaji Pokok</th>
                <th className="p-3.5">Tunjangan</th>
                <th className="p-3.5">KPI Capaian</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {employees.map(emp => (
                <tr key={emp.employeeId} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className="p-3.5">
                    <span className={`block font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{emp.fullName}</span>
                    <span className="text-[10px] text-zinc-500">{emp.email}</span>
                  </td>
                  <td className="p-3.5">{emp.division}</td>
                  <td className="p-3.5 font-semibold text-zinc-400">{formatRupiah(emp.baseSalary)}</td>
                  <td className="p-3.5 text-zinc-400">{formatRupiah(emp.allowance)}</td>
                  <td className="p-3.5 font-bold text-emerald-400">{emp.kpiAchieved}% / {emp.kpiTarget}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslips Table */}
      <div className={`border rounded-xl p-6 space-y-4 backdrop-blur-md ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h4 className={`font-extrabold text-xs ${titleClass}`}>Arsip Slip Gaji Terbit</h4>
          <button 
            onClick={() => exportToExcel(payrolls, 'Payroll_Slip_Gaji_PT_Expro_Gio_Nusantara.csv', {
              payrollId: 'ID Slip',
              employeeName: 'Nama Karyawan',
              employeeEmail: 'Email',
              division: 'Divisi',
              period: 'Periode',
              baseSalary: 'Gaji Pokok',
              allowance: 'Tunjangan',
              bonus: 'Bonus KPI',
              tax: 'PPh 21',
              bpjs: 'Potongan BPJS',
              netSalary: 'Gaji Bersih',
              releaseDate: 'Tanggal Cair'
            })} 
            className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850' 
                : 'bg-zinc-100 border-zinc-250 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
            }`}
          >
            <span className="material-symbols-outlined text-xs">download</span> Ekspor Excel Payroll
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
                <th className="p-3.5">ID Slip</th>
                <th className="p-3.5">Karyawan</th>
                <th className="p-3.5">Periode</th>
                <th className="p-3.5">Gaji Pokok</th>
                <th className="p-3.5">Bonus KPI</th>
                <th className="p-3.5">Potongan Tax+BPJS</th>
                <th className="p-3.5 font-bold text-white">Gaji Bersih</th>
                <th className="p-3.5 text-right">Laporan</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {payrolls.map(pay => (
                <tr key={pay.payrollId} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className="p-3.5 font-mono font-bold text-zinc-400">{pay.payrollId}</td>
                  <td className="p-3.5">
                    <span className={`block font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{pay.employeeName}</span>
                    <span className="text-[10px] text-zinc-500">{pay.employeeEmail}</span>
                  </td>
                  <td className="p-3.5 font-bold">{pay.period}</td>
                  <td className="p-3.5">{formatRupiah(pay.baseSalary)}</td>
                  <td className="p-3.5 text-emerald-500 font-bold">{formatRupiah(pay.bonus)}</td>
                  <td className="p-3.5 text-red-500">-{formatRupiah(pay.tax + pay.bpjs)}</td>
                  <td className="p-3.5 font-black text-emerald-500">{formatRupiah(pay.netSalary)}</td>
                  <td className="p-3.5 text-right">
                    <button 
                      onClick={() => printPayslipPDF(pay)} 
                      className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850' 
                          : 'bg-zinc-100 border-zinc-250 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">print</span> Cetak Slip (PDF)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// ==========================================
// 👥 USER APPROVALS COMPONENT (LIGHT/DARK)
// ==========================================
interface UserApprovalsProps {
  theme: ThemeMode;
}

const UserApprovals: React.FC<UserApprovalsProps> = ({ theme }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  const fetchUsers = async () => {
    try {
      const res = await api.get('/user-approvals');
      setUsers(res.data);
    } catch (err) {
      setUsers([
        { email: 'rudi@exprogio.com', fullName: 'Rudi Hermawan', division: 'Pembangunan / Sipil', status: 'Pending' },
        { email: 'santi@exprogio.com', fullName: 'Santi Rahayu', division: 'Layanan Elektrikal (MEP)', status: 'Pending' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (email: string, approve: boolean) => {
    try {
      await api.post(`/user-approvals/${email}/approve?approve=${approve}`);
      fetchUsers();
    } catch (err) {
      setUsers(users.filter(u => u.email !== email));
    }
  };

  if (loading) return <SkeletonLoader isDark={isDark} rows={3} />;

  return (
    <div className={`border rounded-xl p-6 space-y-4 backdrop-blur-md animate-fade-in ${cardClass}`}>
      <div>
        <h3 className={`font-extrabold text-xs ${titleClass}`}>Verifikasi Pendaftaran Karyawan Baru</h3>
        <p className="text-[11px] text-zinc-400 mt-1">Otorisasi akun staf sebelum diizinkan mengakses portal payroll.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
              <th className="p-3.5">Nama Lengkap</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Divisi Penugasan</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-500 font-mono">Tidak ada permohonan registrasi pending saat ini.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.email} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className={`p-3.5 font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-950'}`}>{u.fullName}</td>
                  <td className="p-3.5">{u.email}</td>
                  <td className="p-3.5 text-zinc-400">{u.division}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold border uppercase whitespace-nowrap inline-block ${
                      isDark ? 'bg-amber-950/30 text-amber-400 border-amber-800/30' : 'bg-amber-50 text-amber-700 border-amber-250'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button 
                      onClick={() => handleAction(u.email, true)} 
                      className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-emerald-400 hover:text-emerald-300 hover:bg-zinc-850' 
                          : 'bg-zinc-100 border-zinc-250 text-emerald-800 hover:bg-zinc-200'
                      }`}
                    >
                      Setujui
                    </button>
                    <button 
                      onClick={() => handleAction(u.email, false)} 
                      className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-rose-400 hover:text-rose-300 hover:bg-zinc-850' 
                          : 'bg-zinc-100 border-zinc-250 text-rose-700 hover:bg-zinc-200'
                      }`}
                    >
                      Tolak
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 🛡️ AUDIT TRAIL LOGS COMPONENT (LIGHT/DARK)
// ==========================================
interface AuditTrailProps {
  theme: ThemeMode;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ theme }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

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

  if (loading) return <SkeletonLoader isDark={isDark} rows={6} />;

  return (
    <div className={`border rounded-xl p-6 space-y-4 backdrop-blur-md animate-fade-in ${cardClass}`}>
      <div>
        <h3 className={`font-extrabold text-xs ${titleClass}`}>Audit Trail Aktivitas Sistem</h3>
        <p className="text-[11px] text-zinc-400 mt-1">Log transaksi mutlak yang dijamin keamanannya dan tidak dapat diubah.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className={`border-b uppercase tracking-wider text-[9px] font-bold ${tableHeaderClass}`}>
              <th className="p-3.5">ID Log</th>
              <th className="p-3.5">Pelaku</th>
              <th className="p-3.5">Tindakan</th>
              <th className="p-3.5">Keterangan</th>
              <th className="p-3.5">Waktu Kejadian</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
            {logs.map(log => (
              <tr key={log.logId} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                <td className="p-3.5 font-mono text-zinc-500">#{log.logId}</td>
                <td className="p-3.5 font-bold text-zinc-400">{log.userEmail}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-md text-[9px] font-bold uppercase tracking-wider">
                    {log.action}
                  </span>
                </td>
                <td className="p-3.5 text-zinc-450">{log.description}</td>
                <td className="p-3.5 text-zinc-500 font-mono">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 🤖 GIO AI COGNITIVE HUD (INDUSTRY 5.0)
// ==========================================
const AiAssistant: React.FC<{isDark: boolean}> = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { sender: 'ai', text: 'Halo! Saya GIO AI, asisten kognitif Industri 5.0 Anda. Ada yang ingin Anda diskusikan tentang data keuangan dan kinerja?' }
  ]);

  const questions = [
    { q: "Analisis Arus Kas", a: "Analisis Finansial GIO AI:\n- Arus Kas Bersih saat ini positif berdasarkan data jurnal transaksi PostgreSQL.\n- Pantau invoice yang belum lunas di modul Piutang (AR).\n- Rekomendasi: Segera follow up tagihan yang sudah Jatuh Tempo!" },
    { q: "Bagaimana naikkan bonus KPI?", a: "Formula Bonus Kinerja:\nBonus dihitung 15% dari Gaji Pokok dikali persentase pencapaian KPI Anda. Tingkatkan skor capaian KPI bulanan Anda mendekati 100% untuk memaksimalkan bonus!" },
    { q: "Status Integritas Sistem", a: "Semua sistem berjalan normal:\n- PostgreSQL: Terhubung (Port 5433 via Docker)\n- Auth Mode: MockUserFilter (pg-local)\n- Payroll Service: Siap memproses batch ke database\n- Semua data tersimpan permanen di PostgreSQL." }
  ];

  const handleAsk = (q: string, a: string) => {
    setMessages(prev => [...prev, { sender: 'user', text: q }, { sender: 'ai', text: a }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Glassmorphic Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border ${
          isDark 
            ? 'bg-[#111814] text-emerald-400 border-[#1b2b24] hover:border-[#2c7a53]' 
            : 'bg-[#f4f9f6] text-[#2c7a53] border-[#d8eae0] hover:border-[#86c9a6]'
        }`}
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        ) : (
          <span className="material-symbols-outlined text-lg leading-none">smart_toy</span>
        )}
      </button>

      {/* HUD terminal chat window */}
      {isOpen && (
        <div className={`absolute bottom-16 right-0 w-[340px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border ${
          isDark ? 'bg-[#111814] border-[#1b2b24]' : 'bg-[#f4f9f6] border-[#d8eae0]'
        }`}>
          {/* Header */}
          <div className={`border-b p-4 ${
            isDark ? 'bg-[#0a100d] border-[#1b2b24]' : 'bg-[#e8f4ed] border-[#d8eae0]'
          }`}>
            <h4 className={`font-extrabold text-xs tracking-wide ${
              isDark ? 'text-zinc-200' : 'text-zinc-800'
            }`}>GIO AI HUD Terminal</h4>
            <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 block ${
              isDark ? 'text-emerald-500' : 'text-[#2c7a53]'
            }`}>Kognisi Sistem FinCorp 5.0</span>
          </div>

          {/* Messages Area */}
          <div className={`flex-grow p-4 space-y-3 max-h-72 overflow-y-auto font-mono text-[10px] leading-relaxed ${
            isDark ? 'text-zinc-300' : 'text-zinc-800'
          }`}>
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg max-w-[90%] border ${
                msg.sender === 'user' 
                  ? (isDark ? 'bg-[#1a2e24] border-[#2c4f3e] text-[#a3e6c2] ml-auto' : 'bg-[#cce8d9] border-[#a3e6c2] text-[#164a33] ml-auto')
                  : (isDark ? 'bg-[#0f1f18] border-[#1b2b24] text-[#71cfa0]' : 'bg-[#eef7f2] border-[#d8eae0] text-[#2c7a53]')
              } whitespace-pre-line`}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Predefined prompts */}
          <div className={`p-4 border-t flex flex-col gap-1.5 ${
            isDark ? 'border-[#1b2b24] bg-[#0a100d]' : 'border-[#d8eae0] bg-[#e8f4ed]'
          }`}>
            <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
              isDark ? 'text-zinc-500' : 'text-[#2c7a53]'
            }`}>Pilih Rencana Dialog:</span>
            <div className="grid grid-cols-1 gap-1.5">
              {questions.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleAsk(item.q, item.a)}
                  className={`w-full text-left px-3 py-2 border text-[9px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    isDark 
                      ? 'bg-[#111814] hover:bg-[#1a2e24] border-[#1b2b24] hover:border-[#2c7a53] text-zinc-300 hover:text-white' 
                      : 'bg-white hover:bg-[#cce8d9] border-[#d8eae0] hover:border-[#86c9a6] text-[#164a33] hover:text-[#0a2e1d]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[11px] ${isDark ? 'text-emerald-500' : 'text-[#2c7a53]'}`}>chevron_right</span>
                  <span>{item.q}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 💸 MANAJEMEN PIUTANG (ACCOUNTS RECEIVABLE)
// ==========================================
const AccountsReceivable: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.get('/invoices');
        setInvoices(res.data);
      } catch (err) {
        console.warn('Gagal memuat invoice', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getAgingCategory = (dueDate: string, status: string) => {
    if (status === 'Lunas') return { label: 'Lunas', color: 'text-emerald-500 bg-emerald-500/10' };
    const diffTime = new Date().getTime() - new Date(dueDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { label: 'Belum Jatuh Tempo', color: 'text-blue-500 bg-blue-500/10' };
    if (diffDays <= 30) return { label: `Menunggak ${diffDays} Hari`, color: 'text-orange-500 bg-orange-500/10' };
    if (diffDays <= 60) return { label: `Menunggak ${diffDays} Hari`, color: 'text-red-500 bg-red-500/10 font-bold' };
    return { label: `Menunggak ${diffDays} Hari (Kritis)`, color: 'text-white bg-red-600 font-black animate-pulse' };
  };

  const { showToast } = useToast();

  const handleReminder = async (invoiceId: string, client: string) => {
    try {
      await api.post(`/invoices/${invoiceId}/reminder`);
      showToast(`Email Surat Peringatan (SP) Penagihan berhasil dikirim ke klien: ${client}`, 'success');
    } catch (err) {
      console.error('Gagal kirim penagihan', err);
      showToast(`Gagal mengirim penagihan ke ${client}. Silakan coba lagi.`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${titleClass}`}>Aging Schedule &amp; Piutang (AR)</h2>
          <p className={`text-sm mt-1 ${textClass}`}>Pemantauan umur piutang faktur (Invoice) dan penagihan klien.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">print</span>
          Cetak Daftar Piutang
        </button>
      </div>

      <div className={`border rounded-xl p-6 ${cardClass}`}>
        {loading ? <SkeletonLoader isDark={isDark} rows={3} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className={tableHeaderClass}>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">No. Invoice</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Nama Klien</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Jatuh Tempo</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Nilai Tagihan</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Status Aging</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-500/20">
                {invoices.map((inv, i) => {
                  const aging = getAgingCategory(inv.dueDate, inv.status);
                  const isOverdue = new Date() > new Date(inv.dueDate) && inv.status !== 'Lunas';
                  return (
                    <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                      <td className={`p-3 font-medium ${titleClass}`}>{inv.invoiceId}</td>
                      <td className={`p-3 ${textClass}`}>{inv.clientName}</td>
                      <td className={`p-3 ${textClass}`}>{inv.dueDate}</td>
                      <td className={`p-3 font-bold ${titleClass}`}>{formatCurrency(inv.balance)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] ${aging.color}`}>
                          {aging.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isOverdue && (
                          <button 
                            onClick={() => handleReminder(inv.invoiceId, inv.clientName)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded shadow-sm transition-colors text-[10px]"
                          >
                            Kirim Penagihan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 🏭 MANAJEMEN UTANG VENDOR (ACCOUNTS PAYABLE)
// ==========================================
const AccountsPayable: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [payables, setPayables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  useEffect(() => {
    const fetchPayables = async () => {
      try {
        const res = await api.get('/payables');
        setPayables(res.data);
      } catch (err) {
        console.warn('Gagal memuat tagihan vendor', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayables();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getAgingCategory = (dueDate: string, status: string) => {
    if (status === 'Lunas') return { label: 'Lunas', color: 'text-emerald-500 bg-emerald-500/10' };
    const diffTime = new Date().getTime() - new Date(dueDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { label: 'Aman', color: 'text-emerald-500 bg-emerald-500/10' };
    if (diffDays <= 15) return { label: `Telat ${diffDays} Hari`, color: 'text-orange-500 bg-orange-500/10' };
    return { label: `Telat ${diffDays} Hari (Warning)`, color: 'text-red-500 bg-red-500/10 font-bold animate-pulse' };
  };

  const { showToast } = useToast();

  const handlePayment = async (vendorInvoiceId: string, vendorName: string) => {
    const confirm = window.confirm(`Konfirmasi pelunasan tagihan ${vendorInvoiceId} kepada ${vendorName}?`);
    if (!confirm) return;
    try {
      await api.put(`/payables/${vendorInvoiceId}/pay`);
      // Refresh data
      const res = await api.get('/payables');
      setPayables(res.data);
      showToast(`Tagihan ${vendorInvoiceId} kepada ${vendorName} berhasil dilunasi dan tercatat di jurnal pengeluaran!`, 'success');
    } catch (err) {
      console.error('Gagal melunasi tagihan vendor', err);
      showToast('Gagal memproses pembayaran. Silakan coba lagi.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${titleClass}`}>Utang &amp; Tagihan Vendor (AP)</h2>
          <p className={`text-sm mt-1 ${textClass}`}>Pemantauan kewajiban pembayaran material proyek dan supplier.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">print</span>
          Cetak Daftar Utang
        </button>
      </div>

      <div className={`border rounded-xl p-6 ${cardClass}`}>
        {loading ? <p className="text-zinc-500 animate-pulse">Memuat data utang...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className={tableHeaderClass}>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">No. Ref</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Nama Supplier / Vendor</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Jatuh Tempo</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Kewajiban Pembayaran</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Status Tempo</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-center">Aksi (Approve)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-500/20">
                {payables.map((pay, i) => {
                  const aging = getAgingCategory(pay.dueDate, pay.status);
                  const isOverdue = new Date() > new Date(pay.dueDate) && pay.status !== 'Lunas';
                  return (
                    <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                      <td className={`p-3 font-medium ${titleClass}`}>{pay.vendorInvoiceId}</td>
                      <td className={`p-3 ${textClass}`}>{pay.vendorName}</td>
                      <td className={`p-3 ${textClass}`}>{pay.dueDate}</td>
                      <td className={`p-3 font-bold ${titleClass}`}>{formatCurrency(pay.amount)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] ${aging.color}`}>
                          {aging.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isOverdue && (
                          <button 
                            onClick={() => handlePayment(pay.vendorInvoiceId, pay.vendorName)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded shadow-sm transition-colors text-[10px]"
                          >
                            Bayar Tagihan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// ⚖️ KALKULATOR PAJAK OTOMATIS (TAX ENGINE)
// ==========================================
const TaxDashboard: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const [invRes, payRes] = await Promise.all([
          api.get('/invoices'),
          api.get('/payroll/my') // Note: In a real admin dashboard we'd fetch all payrolls
        ]);
        setInvoices(invRes.data);
        setPayrolls(payRes.data);
      } catch (err) {
        console.warn('Gagal memuat pajak', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTaxes();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-2xl font-black tracking-tight ${titleClass}`}>Kalkulator Pajak (Tax Engine)</h2>
        <p className={`text-sm mt-1 ${textClass}`}>Estimasi Kewajiban PPN 11% &amp; Pemotongan PPh 21 Karyawan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PPN SECTION */}
        <div className={`border rounded-xl p-6 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-zinc-500/20">
            <h4 className={`font-extrabold text-sm uppercase tracking-wider ${titleClass}`}>PPN Keluaran (11%)</h4>
            <span className="material-symbols-outlined text-blue-500 text-xl">account_balance</span>
          </div>
          {loading ? <p className="text-zinc-500 animate-pulse">Memuat...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className={tableHeaderClass}>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px]">No. Invoice</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-right">Dasar Pengenaan Pajak (DPP)</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-right">PPN 11%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-500/20">
                  {invoices.map((inv, i) => {
                    const dpp = inv.amount;
                    const ppn = dpp * 0.11;
                    return (
                      <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                        <td className={`p-3 font-medium ${titleClass}`}>{inv.invoiceId}</td>
                        <td className={`p-3 text-right ${textClass}`}>{formatCurrency(dpp)}</td>
                        <td className={`p-3 text-right font-bold text-blue-500`}>{formatCurrency(ppn)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PPh 21 SECTION */}
        <div className={`border rounded-xl p-6 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-zinc-500/20">
            <h4 className={`font-extrabold text-sm uppercase tracking-wider ${titleClass}`}>Pemotongan PPh 21</h4>
            <span className="material-symbols-outlined text-orange-500 text-xl">receipt_long</span>
          </div>
          {loading ? <p className="text-zinc-500 animate-pulse">Memuat...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className={tableHeaderClass}>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Karyawan</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-right">Gaji Kotor</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-right">Potongan PPh 21</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-500/20">
                  {payrolls.map((pay, i) => {
                    const gross = pay.baseSalary + pay.allowance + pay.bonus;
                    return (
                      <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                        <td className={`p-3 font-medium ${titleClass}`}>{pay.employeeName}</td>
                        <td className={`p-3 text-right ${textClass}`}>{formatCurrency(gross)}</td>
                        <td className={`p-3 text-right font-bold text-orange-500`}>{formatCurrency(pay.tax)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📊 SYSTEM MANAJEMEN ANGGARAN (BUDGETING)
// ==========================================
const BudgetingDashboard: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const res = await api.get('/budgets');
        setBudgets(res.data);
      } catch (err) {
        console.warn('Gagal memuat anggaran', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-2xl font-black tracking-tight ${titleClass}`}>Manajemen Pagu Anggaran</h2>
        <p className={`text-sm mt-1 ${textClass}`}>Pemantauan serapan dana operasional & capex setiap divisi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p className="text-zinc-500 animate-pulse">Memuat data anggaran...</p>
        ) : budgets.map(b => {
          const percentage = Math.min(100, Math.round((b.usedBudget / b.allocatedBudget) * 100));
          const isWarning = percentage > 85;
          return (
            <div key={b.budgetId} className={`p-6 border rounded-xl relative overflow-hidden ${cardClass}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`font-black text-lg ${titleClass}`}>{b.divisionName}</h3>
                  <p className={`text-xs ${textClass}`}>Periode: {b.period} | Ref: {b.budgetId}</p>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold ${isWarning ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {percentage}% Terpakai
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className={textClass}>Realisasi: {formatCurrency(b.usedBudget)}</span>
                  <span className={titleClass}>Pagu: {formatCurrency(b.allocatedBudget)}</span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                  <div 
                    className={`h-full transition-all duration-1000 ${isWarning ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className={`text-[10px] text-right mt-1 ${isWarning ? 'text-red-500 animate-pulse font-bold' : textClass}`}>
                  Sisa Anggaran: {formatCurrency(b.allocatedBudget - b.usedBudget)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 📈 PEMBUAT LAPORAN KEUANGAN (GL / LABA RUGI)
// ==========================================
const FinancialReportGenerator: React.FC<{ theme: ThemeMode, userRole?: UserRole | null }> = ({ theme, userRole }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // ACC status disimpan di localStorage sebagai state sementara sesi, dan dilaporkan ke audit log backend
  const [accRequested, setAccRequested] = useState(() => localStorage.getItem('fincorp_acc_requested') === 'true');
  const [accApproved, setAccApproved] = useState(() => localStorage.getItem('fincorp_acc_approved') === 'true');
  const [accProcessing, setAccProcessing] = useState(false);

  const handleRequestAcc = async () => {
    setAccProcessing(true);
    try {
      await api.post('/audit-logs/action', { action: 'REQUEST_ACC', description: 'Admin meminta persetujuan (ACC) laporan keuangan kepada Direksi.' });
    } catch (_) { /* simpan audit log gagal tidak blokir aksi */ }
    setAccRequested(true);
    localStorage.setItem('fincorp_acc_requested', 'true');
    setAccProcessing(false);
  };

  const handleApproveAcc = async () => {
    setAccProcessing(true);
    try {
      await api.post('/audit-logs/action', { action: 'APPROVE_ACC', description: 'Superadmin/Direktur menyetujui (ACC) laporan keuangan periode berjalan.' });
    } catch (_) { /* simpan audit log gagal tidak blokir aksi */ }
    setAccApproved(true);
    localStorage.setItem('fincorp_acc_approved', 'true');
    setAccProcessing(false);
  };

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#0a0a0a] border-zinc-800' : 'bg-white border-zinc-200 shadow-xl';
  const textClass = isDark ? 'text-zinc-400 print:text-black' : 'text-zinc-600 print:text-black';
  const titleClass = isDark ? 'text-white print:text-black' : 'text-zinc-900 print:text-black';
  const borderClass = isDark ? 'border-zinc-800 print:border-zinc-300' : 'border-zinc-200 print:border-zinc-300';

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/reports/profit-loss');
        setReport(res.data);
      } catch (err) {
        console.warn('API error, using fallback report', err);
        // Fallback: hitung dari data transaksi di localStorage
        const savedTx = localStorage.getItem('mock_transactions');
        if (savedTx) {
          const txList = JSON.parse(savedTx);
          const rev = txList.filter((t: any) => t.type === 'Pendapatan').reduce((s: number, t: any) => s + t.amount, 0);
          const exp = txList.filter((t: any) => t.type === 'Pengeluaran').reduce((s: number, t: any) => s + t.amount, 0);
          setReport({ totalRevenue: rev, totalExpense: exp, netProfit: rev - exp, revenueByCategory: {}, expenseByCategory: {} });
        } else {
          setReport({ totalRevenue: 0, totalExpense: 0, netProfit: 0, revenueByCategory: {}, expenseByCategory: {} });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const handleDownloadCSV = async () => {
    try {
      const res = await api.get('/transactions');
      if (res.data && res.data.length > 0) {
        exportToExcel(res.data, 'Laporan_Keuangan_FinCorp.csv', {
          transactionDate: 'Tanggal',
          type: 'Tipe',
          category: 'Kategori',
          description: 'Deskripsi',
          amount: 'Nominal',
          status: 'Status'
        });
      } else {
        alert("Tidak ada data transaksi untuk diekspor");
      }
    } catch (err) {
      console.error("Gagal mengambil data untuk export", err);
      alert("Gagal mengunduh laporan.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${titleClass}`}>Dashboard Keuangan</h2>
          <p className={`text-sm mt-1 ${textClass}`}>Ringkasan Eksekutif & Tindak Lanjut</p>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 animate-pulse text-center py-12">Mengagregasi Data Keuangan...</p>
      ) : report ? (
        <>
          {/* Dashboard Summary View (Web Only) */}
          <div className="print:hidden space-y-6">
             {/* Cards for Revenue, Expense, Profit */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className={`p-5 rounded-2xl border ${cardClass} shadow-sm hover:border-emerald-500/50 transition-colors`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${textClass}`}>Total Pendapatan</p>
                         <span className="material-symbols-outlined text-emerald-500 text-lg">arrow_upward</span>
                     </div>
                     <p className={`text-2xl font-black text-emerald-500 mt-2`}>{formatCurrency(report.totalRevenue)}</p>
                 </div>
                 <div className={`p-5 rounded-2xl border ${cardClass} shadow-sm hover:border-red-500/50 transition-colors`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${textClass}`}>Total Pengeluaran</p>
                         <span className="material-symbols-outlined text-red-500 text-lg">arrow_downward</span>
                     </div>
                     <p className={`text-2xl font-black text-red-500 mt-2`}>{formatCurrency(report.totalExpense)}</p>
                 </div>
                 <div className={`p-5 rounded-2xl border ${cardClass} shadow-sm bg-gradient-to-br ${isDark ? 'from-emerald-900/20 to-transparent border-emerald-900/50' : 'from-emerald-50 to-transparent border-emerald-200'}`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Laba Bersih</p>
                         <span className="material-symbols-outlined text-emerald-500 text-lg">account_balance</span>
                     </div>
                     <p className={`text-2xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'} mt-2`}>{formatCurrency(report.netProfit)}</p>
                 </div>
             </div>

             {/* Actionable List */}
             <div className={`border rounded-2xl ${cardClass} overflow-hidden shadow-sm`}>
                <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
                   <h3 className={`text-sm font-extrabold tracking-wide uppercase ${titleClass}`}>Tindak Lanjut & Pelaporan</h3>
                </div>
                <div className="p-4 space-y-3">
                   <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border ${borderClass} hover:bg-black/5 transition-colors gap-4`}>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">analytics</span>
                         </div>
                         <div>
                             <p className={`font-black text-sm ${titleClass}`}>Laba Bersih Bulan Ini</p>
                             <p className={`text-xs mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                 {formatCurrency(report.netProfit)} <span className="text-zinc-400 mx-1">•</span> 
                                 {userRole === 'superadmin' || userRole === 'manager' 
                                   ? (accApproved ? 'Disetujui oleh Direksi' : 'Menunggu Persetujuan Anda') 
                                   : (accApproved ? 'Disetujui oleh Direksi' : (accRequested ? 'Menunggu Persetujuan Direksi' : 'Membutuhkan ACC Direksi'))}
                             </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         {userRole === 'superadmin' || userRole === 'manager' ? (
                             accApproved ? (
                                 <button disabled className="px-4 py-2 bg-zinc-800 text-emerald-400 text-xs font-bold rounded-lg shadow-inner flex items-center gap-2 cursor-not-allowed">
                                     <span className="material-symbols-outlined text-[16px]">task_alt</span> Laporan Disetujui
                                 </button>
                             ) : (
                                 <button 
                                     onClick={handleApproveAcc}
                                     disabled={accProcessing}
                                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-2">
                                     <span className="material-symbols-outlined text-[16px]">{accProcessing ? 'hourglass_top' : 'thumb_up'}</span> {accProcessing ? 'Memproses...' : 'Setujui (ACC) Laporan'}
                                 </button>
                             )
                         ) : (
                             accApproved ? (
                                 <button disabled className="px-4 py-2 bg-zinc-800 text-emerald-400 text-xs font-bold rounded-lg shadow-inner flex items-center gap-2 cursor-not-allowed">
                                     <span className="material-symbols-outlined text-[16px]">task_alt</span> Laporan Disetujui
                                 </button>
                             ) : accRequested ? (
                                 <button disabled className="px-4 py-2 bg-zinc-800 text-emerald-400 text-xs font-bold rounded-lg shadow-inner flex items-center gap-2 cursor-not-allowed">
                                     <span className="material-symbols-outlined text-[16px] animate-pulse">pending</span> Menunggu ACC...
                                 </button>
                             ) : (
                                 <button 
                                     onClick={handleRequestAcc}
                                     disabled={accProcessing}
                                     className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-2">
                                     <span className="material-symbols-outlined text-[16px]">{accProcessing ? 'hourglass_top' : 'verified'}</span> {accProcessing ? 'Memproses...' : 'Tindak Lanjuti ACC'}
                                 </button>
                             )
                         )}
                         <button onClick={() => window.print()} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-2">
                             <span className="material-symbols-outlined text-[16px]">print</span> Cetak Dokumen
                         </button>
                      </div>
                   </div>
                   
                   <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border ${borderClass} hover:bg-black/5 transition-colors gap-4`}>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">receipt_long</span>
                         </div>
                         <div>
                             <p className={`font-black text-sm ${titleClass}`}>Laporan Arus Kas Keluar</p>
                             <p className={`text-xs mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                 Beban Operasional IT <span className="text-zinc-400 mx-1">•</span> {formatCurrency(350000000)}
                             </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         <button 
                             onClick={handleDownloadCSV}
                             className={`px-4 py-2 border ${borderClass} hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${titleClass}`}>
                             <span className="material-symbols-outlined text-[16px]">download</span> Unduh Rincian (CSV)
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Printable Document View (Hidden on Web, visible on Print) */}
          <div className="hidden print:block print:p-0 print:m-0 print:bg-white print:text-black">
              {/* Kop Surat / Header */}
              <div className="text-center space-y-2 mb-10 border-b pb-6 border-black">
                <h1 className="text-xl font-black tracking-widest uppercase">Laporan Laba Rugi (Profit & Loss)</h1>
                <p className="text-xs uppercase font-bold tracking-wider">PT EXPRO GIO NUSANTARA</p>
                <p className="text-[10px]">Periode Berjalan - {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {/* PENDAPATAN */}
              <div className="mb-8">
                <h3 className="text-sm font-extrabold uppercase border-b border-black pb-2 mb-3">A. Pendapatan (Revenue)</h3>
                <div className="space-y-2 pl-4">
                  {Object.entries(report.revenueByCategory).map(([cat, val]: any) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span>{cat}</span>
                      <span className="font-medium">{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-black border-t mt-3 pt-2 border-black">
                  <span>Total Pendapatan</span>
                  <span className="text-black">{formatCurrency(report.totalRevenue)}</span>
                </div>
              </div>

              {/* PENGELUARAN */}
              <div className="mb-8">
                <h3 className="text-sm font-extrabold uppercase border-b border-black pb-2 mb-3">B. Beban / Pengeluaran (Expenses)</h3>
                <div className="space-y-2 pl-4">
                  {Object.entries(report.expenseByCategory).map(([cat, val]: any) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span>{cat}</span>
                      <span className="font-medium">{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-black border-t mt-3 pt-2 border-black">
                  <span>Total Beban Pokok &amp; Operasional</span>
                  <span className="text-black">({formatCurrency(report.totalExpense)})</span>
                </div>
              </div>

              {/* LABA BERSIH */}
              <div className="flex justify-between items-center text-sm font-black border-t-2 mt-6 pt-4 border-black">
                <span className="uppercase tracking-wider">Laba / (Rugi) Bersih</span>
                <span className="text-xl">
                  {formatCurrency(report.netProfit)}
                </span>
              </div>
              
              {/* Tanda Tangan */}
              <div className="mt-16 pt-8 border-t border-dashed border-black flex justify-between text-[10px] uppercase tracking-widest text-center">
                <div>
                  <p className="mb-12">Disiapkan Oleh</p>
                  <p className="font-bold border-t border-black pt-2 inline-block px-4">Finance Controller</p>
                </div>
                <div>
                  <p className="mb-12">Disetujui Oleh</p>
                  <p className="font-bold border-t border-black pt-2 inline-block px-4">Direktur Utama</p>
                </div>
              </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

// ==========================================
// 🚀 MAIN APPLICATION ROOT (WITH ROUTING & SYSTEM GUARDS)
// ==========================================
const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'keycloak' | 'mock' | 'loading'>('loading');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  // Theme State Mode
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme_mode') as ThemeMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme_mode', theme);
  }, [theme]);

  const isDark = theme === 'dark';

  useEffect(() => {
    // Read local session if existing
    const sessionEmail = localStorage.getItem('mock_user_email');
    const sessionRole = localStorage.getItem('mock_user_role') as UserRole;
    
    if (sessionEmail && sessionRole) {
      setUserRole(sessionRole);
      setUserName(sessionEmail === 'superadmin@exprogio.com' ? 'Zulkifli Lubis (Superadmin)' :
                  sessionEmail === 'admin@exprogio.com' ? 'Siti Handayani (Admin)' :
                  sessionEmail === 'manager@exprogio.com' ? 'Hendra Wijaya (Manajer)' : 'Agus Pratama (Staff)');
      setAuthenticated(true);
    }

    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
    
    const checkKeycloakServer = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const response = await fetch(`${keycloakUrl}/realms/fincorp-realm/.well-known/openid-configuration`, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.issuer) {
            setAuthMode('keycloak');
            keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false })
              .then((auth) => {
                if (auth) {
                  setAuthenticated(true);
                  const realmRoles = keycloak.realmAccess?.roles || [];
                  const activeRole = realmRoles.find(r => r === 'superadmin' || r === 'admin' || r === 'manager' || r === 'staff') as UserRole;
                  setUserRole(activeRole || 'staff');
                  setUserName(keycloak.tokenParsed?.given_name || 'Karyawan');
                }
              })
              .catch(() => setAuthMode('mock'));
            return;
          }
        }
        setAuthMode('mock');
      } catch (err) {
        setAuthMode('mock');
      }
    };

    checkKeycloakServer();
  }, []);

  const handleMockLogin = (role: UserRole, name: string) => {
    const emailMap: Record<UserRole, string> = {
      superadmin: 'superadmin@exprogio.com',
      admin: 'admin@exprogio.com',
      manager: 'manager@exprogio.com',
      staff: 'staff@exprogio.com',
      investor: 'investor@exprogio.com'
    };
    localStorage.setItem('mock_user_email', emailMap[role]);
    localStorage.setItem('mock_user_role', role);
    setUserRole(role);
    setUserName(name);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('mock_user_email');
    localStorage.removeItem('mock_user_role');
    setAuthenticated(false);
    setUserRole(null);
    setUserName('');
    if (authMode === 'keycloak') {
      keycloak.logout();
    }
  };

  if (authMode === 'loading') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-[#070708]' : 'bg-zinc-50'}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-xs font-mono text-zinc-500">Membuka FinCorp Secure Node...</p>
        </div>
      </div>
    );
  }

  const GuardedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: UserRole[] }) => {
    if (!authenticated) return <Navigate to="/login" />;
    return allowedRoles.includes(userRole!) ? <>{children}</> : <Navigate to="/403" />;
  };



  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!authenticated) return <Navigate to="/login" />;
    
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Close mobile menu on route change
    useEffect(() => {
      setIsMobileMenuOpen(false);
    }, [location.pathname]);
    
    // Live Clock
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const formattedTime = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedClock = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

    const layoutBg = isDark ? 'bg-[#070708]' : 'bg-zinc-50';
    const sidebarBg = isDark ? 'bg-[#09090b]' : 'bg-zinc-100';
    const sidebarBorder = isDark ? 'border-zinc-850' : 'border-zinc-200';
    const clockBg = isDark ? 'bg-zinc-950/60' : 'bg-white shadow-sm';
    
    const getLinkClass = (path: string) => {
      const isActive = location.pathname === path;
      if (isActive) {
        return isDark 
          ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 pl-3.5 text-xs font-black flex items-center gap-2.5 py-2.5 rounded-r transition-all'
          : 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-650 pl-3.5 text-xs font-black flex items-center gap-2.5 py-2.5 rounded-r transition-all';
      }
      return isDark
        ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 pl-3.5 text-xs font-bold flex items-center gap-2.5 py-2.5 rounded transition-all'
        : 'text-zinc-650 hover:text-emerald-950 hover:bg-zinc-200 pl-3.5 text-xs font-bold flex items-center gap-2.5 py-2.5 rounded transition-all';
    };

    return (
      <div className={`flex flex-col md:flex-row min-h-screen ${layoutBg} ${isDark ? 'text-zinc-100' : 'text-zinc-800'} font-sans antialiased transition-colors duration-300`}>
        
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b ${sidebarBorder} ${sidebarBg} sticky top-0 z-40`}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PT EXPRO GIO NUSANTARA Logo" className="h-6 w-auto object-contain" />
            <span className="text-[9px] text-emerald-600 tracking-widest font-bold uppercase mt-1 block">FINCORP</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-600 transition-colors">
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 ${sidebarBg} flex flex-col justify-between p-6 shrink-0 shadow-2xl border-r ${sidebarBorder} transition-transform duration-300 ease-in-out print:hidden`}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <img src="/logo.png" alt="PT EXPRO GIO NUSANTARA Logo" className="h-10 w-auto object-contain" />
              <div className="hidden md:block">
                <span className="text-[8px] text-emerald-600 tracking-widest font-bold uppercase mt-1 block">FINCORP SUITE</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border text-xs ${isDark ? 'bg-zinc-950/60 border-zinc-850' : 'bg-white border-zinc-200 shadow-sm'}`}>
              <p className={`font-extrabold text-[11px] truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{userName}</p>
              <p className="text-emerald-600 font-black uppercase text-[8px] tracking-wider mt-0.5">{userRole}</p>
            </div>

            {/* Live Clock Card */}
            <div className={`border p-3 rounded-lg text-[10px] space-y-0.5 font-mono ${sidebarBorder} ${clockBg}`}>
              <p className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Time Engine</p>
              <p className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{formattedTime}</p>
              <p className="text-emerald-600 font-extrabold text-xs">{formattedClock}</p>
            </div>

            <nav className="space-y-1 text-xs font-bold">
              {userRole === 'investor' ? (
                <>
                  <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                    <span className="material-symbols-outlined text-base">monitoring</span> Dashboard Kinerja
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                    <span className="material-symbols-outlined text-base">dashboard</span> Dashboard
                  </Link>
                  <Link to="/transactions" className={getLinkClass('/transactions')}>
                    <span className="material-symbols-outlined text-base">receipt_long</span> Jurnal Transaksi
                  </Link>
                  
                  {['superadmin', 'admin', 'manager'].includes(userRole!) && (
                      <Link to="/payroll" className={getLinkClass('/payroll')}>
                        <span className="material-symbols-outlined text-base">payments</span> Payroll Karyawan
                      </Link>
                  )}
                  
                  {userRole === 'superadmin' && (
                    <Link to="/user-approvals" className={getLinkClass('/user-approvals')}>
                      <span className="material-symbols-outlined text-base">manage_accounts</span> Persetujuan User
                    </Link>
                  )}

                  {['superadmin', 'admin', 'manager'].includes(userRole!) && (
                      <Link to="/budgets" className={getLinkClass('/budgets')}>
                        <span className="material-symbols-outlined text-base">account_balance_wallet</span> Manajemen Anggaran
                      </Link>
                  )}

                  {['superadmin', 'admin', 'manager'].includes(userRole!) && (
                      <Link to="/reports" className={getLinkClass('/reports')}>
                        <span className="material-symbols-outlined text-base">query_stats</span> Laporan Keuangan
                      </Link>
                  )}

                  {['superadmin', 'admin', 'manager', 'staff'].includes(userRole!) && (
                      <>
                      <Link to="/receivables" className={getLinkClass('/receivables')}>
                        <span className="material-symbols-outlined text-base">request_quote</span> Manajemen Piutang
                      </Link>
                      <Link to="/payables" className={getLinkClass('/payables')}>
                        <span className="material-symbols-outlined text-base">local_shipping</span> Manajemen Utang (AP)
                      </Link>
                      </>
                  )}

                  {['superadmin', 'admin', 'manager'].includes(userRole!) && (
                      <Link to="/taxes" className={getLinkClass('/taxes')}>
                        <span className="material-symbols-outlined text-base">account_balance</span> Kalkulator Pajak
                      </Link>
                  )}
                  
                  {userRole === 'superadmin' && (
                    <Link to="/audit-trail" className={getLinkClass('/audit-trail')}>
                      <span className="material-symbols-outlined text-base">history_toggle_off</span> Audit Trail Logs
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="space-y-3">
            {/* Theme Toggle in Sidebar */}
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`w-full py-2 bg-transparent hover:bg-emerald-500/10 hover:text-emerald-500 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}
            >
              <span className="material-symbols-outlined text-base">{isDark ? 'light_mode' : 'dark_mode'}</span>
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button 
              onClick={handleLogout} 
              className={`w-full py-2 border rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-zinc-950 border-zinc-850 hover:bg-red-950/20 hover:text-red-400' : 'bg-white border-zinc-250 hover:bg-red-50 hover:text-red-700'}`}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Content Panel with Live System Status Indicators & AI Chatbot */}
        <main className="flex-grow p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col space-y-6 print:p-0 print:m-0 print:block">
          {/* Universal Print Letterhead */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-emerald-700 pb-6 mb-8 w-full">
            <img src="/logo.png" alt="Logo PT Expro Gio Nusantara" className="h-16 w-auto object-contain" />
            <div className="text-right text-black">
              <h1 className="text-xl font-black uppercase tracking-widest text-emerald-800">PT Expro Gio Nusantara</h1>
              <p className="text-xs font-bold">FinCorp Enterprise Suite - Industry 5.0 Workspace</p>
              <p className="text-xs">Gedung Expro Tower Lt. 12, Jakarta Selatan, 12920</p>
            </div>
          </div>

          {/* Corporate Intelligence Ticker */}
          <div className={`flex items-center gap-3 p-2 px-4 rounded-lg border text-[9px] font-mono shadow-sm overflow-hidden whitespace-nowrap print:hidden ${
            isDark ? 'bg-[#0a0a0c] border-[#1b2b24] text-zinc-400' : 'bg-white border-[#d8eae0] text-zinc-600'
          }`}>
            <span className={`flex items-center gap-1 font-bold ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>
              <span className="material-symbols-outlined text-[12px] animate-pulse">radar</span> SYS_INTEL
            </span>
            <span className="text-zinc-600 mx-1">|</span>
            <div className="flex-grow overflow-hidden relative flex items-center">
              <div className="animate-marquee inline-block flex items-center gap-8">
                <span>[MARKET] USD/IDR 15,420 <span className="text-emerald-500">▲ +0.12%</span></span>
                <span>[CORP] Proyeksi Q3 Revenue <span className="text-emerald-500">▲ +14.2%</span></span>
                <span>[MEP] Node Kelistrikan Jakarta: <span className="text-emerald-500">OPTIMAL</span></span>
                <span>[HR] Index Kepuasan Karyawan <span className="text-emerald-500">92.4%</span></span>
                <span>[MARKET] USD/IDR 15,420 <span className="text-emerald-500">▲ +0.12%</span></span>
                <span>[CORP] Proyeksi Q3 Revenue <span className="text-emerald-500">▲ +14.2%</span></span>
              </div>
            </div>
          </div>

          {/* Top Bar Header */}
          <div className={`flex flex-col md:flex-row md:justify-between md:items-center border-b pb-4 gap-4 print:hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div>
              <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">PT Expro Gio Nusantara</h2>
              <span className={`text-[10px] mt-1 block ${isDark ? 'text-zinc-400' : 'text-zinc-650'}`}>FinCorp Enterprise Suite - Industry 5.0 Workspace</span>
            </div>
            
            {/* Live Indicators */}
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold">
              <span className={`px-3 py-1 border rounded-full flex items-center gap-1.5 shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Database H2: Terhubung
              </span>
              <span className={`px-3 py-1 border rounded-full flex items-center gap-1.5 shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 text-amber-400' : 'bg-amber-50 border-amber-250 text-amber-700'}`}>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                Keycloak SSO: Simulasi Offline
              </span>
              <span className={`px-3 py-1 border rounded-full flex items-center gap-1.5 shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Payroll Worker: Go Active
              </span>
            </div>
          </div>
          
          <div className="flex-grow">
            {children}
          </div>
          
          {/* GIO AI Cognitive Chatbot */}
          <AiAssistant isDark={isDark} />
        </main>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage theme={theme} setTheme={setTheme} />} />
        <Route path="/login" element={<LoginPortal theme={theme} handleMockLogin={handleMockLogin} />} />
        
        <Route path="/dashboard" element={
          <LayoutWrapper>
            <Dashboard theme={theme} />
          </LayoutWrapper>
        } />
        
        <Route path="/transactions" element={
          <GuardedRoute allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
            <LayoutWrapper>
              <Transactions theme={theme} userRole={userRole} />
            </LayoutWrapper>
          </GuardedRoute>
        } />
        
        <Route path="/payroll" element={
          <GuardedRoute allowedRoles={['superadmin', 'admin', 'manager']}>
            <LayoutWrapper>
              <Payroll theme={theme} userRole={userRole} />
            </LayoutWrapper>
          </GuardedRoute>
        } />
        
        <Route path="/user-approvals" element={
          <GuardedRoute allowedRoles={['superadmin']}>
            <LayoutWrapper>
              <UserApprovals theme={theme} />
            </LayoutWrapper>
          </GuardedRoute>
        } />
        
        <Route path="/audit-trail" element={
          <GuardedRoute allowedRoles={['superadmin']}>
            <LayoutWrapper>
              <AuditTrail theme={theme} />
            </LayoutWrapper>
          </GuardedRoute>
        } />

        <Route path="/403" element={<AccessDenied />} />
        <Route path="/budgets" element={
          <GuardedRoute allowedRoles={['superadmin', 'manager']}>
            <LayoutWrapper>
              <BudgetingDashboard theme={theme} />
            </LayoutWrapper>
          </GuardedRoute>
        } />
        
        <Route path="/reports" element={
          <GuardedRoute allowedRoles={['superadmin', 'admin', 'manager']}>
            <LayoutWrapper>
              <FinancialReportGenerator theme={theme} userRole={userRole} />
            </LayoutWrapper>
          </GuardedRoute>
        } />
        
        <Route path="/receivables" element={
          <GuardedRoute allowedRoles={['superadmin', 'admin', 'staff']}>
            <LayoutWrapper>
              <AccountsReceivable theme={theme} />
            </LayoutWrapper>
          </GuardedRoute>
        } />
        
        <Route path="/payables" element={
          <GuardedRoute allowedRoles={['superadmin', 'admin', 'staff']}>
            <LayoutWrapper>
              <AccountsPayable theme={theme} />
            </LayoutWrapper>
          </GuardedRoute>
        } />
        
        <Route path="/taxes" element={
          <GuardedRoute allowedRoles={['superadmin', 'admin', 'manager']}>
            <LayoutWrapper>
              <TaxDashboard theme={theme} />
            </LayoutWrapper>
          </GuardedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <AIAssistantUI />
    </Router>
  );
};

// ==========================================
// 🛡️ ACCESS DENIED COMPONENT
// ==========================================
const AccessDenied: React.FC = () => {
  const theme = localStorage.getItem('theme_mode') || 'dark';
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center justify-center min-h-screen p-6 text-center ${
      isDark ? 'bg-[#070708] text-zinc-100' : 'bg-zinc-50 text-zinc-800'
    }`}>
      <div className={`max-w-md border p-8 rounded-xl shadow-2xl space-y-4 ${
        isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <span className="material-symbols-outlined text-red-500 text-5xl">gavel</span>
        <h2 className={`font-extrabold text-lg ${isDark ? 'text-white' : 'text-zinc-900'}`}>Akses Ditolak (403)</h2>
        <p className="text-xs text-zinc-500">Anda tidak memiliki wewenang keamanan untuk melihat halaman operasional ini.</p>
        <Link 
          to="/dashboard" 
          className={`inline-block px-4 py-2 border rounded-lg text-xs font-bold transition-all ${
            isDark 
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-900 hover:text-white' 
              : 'bg-zinc-950 border-zinc-950 text-white hover:bg-zinc-900'
          }`}
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
};

export default function AppWrapper() {
  const isDark = (localStorage.getItem('theme_mode') as ThemeMode) === 'dark' || true;
  return (
    <ToastProvider isDark={isDark}>
      <App />
    </ToastProvider>
  );
}
