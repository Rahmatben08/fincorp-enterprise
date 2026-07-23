/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './services/api';
import { UserRole } from './types';
import { SuperadminPanel } from './Components/SuperadminPanel';
import { ManagerDashboard } from './Components/ManagerDashboard';
import { FinanceStaffDashboard } from './Components/FinanceStaffDashboard';
import { BudgetingDashboard } from './Components/BudgetingDashboard';
import UserApprovalsPanel from './components/UserApprovalsPanel';
import AuditTrailPanel from './components/AuditTrailPanel';
import { AdminKeuanganDashboard } from './Components/AdminKeuanganDashboard';
import { ReimbursementPanel } from './Components/ReimbursementPanel';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const formatCurrencyCompact = (value: any): string => {
  const num = Number(value) || 0;
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const SkeletonLoader: React.FC<{ isDark: boolean, rows?: number }> = ({ isDark, rows = 3 }) => {
  return (
    <div className="w-full space-y-4 animate-pulse p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`h-12 w-full rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
      ))}
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Dashboard Error Boundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Terjadi Kesalahan Render (Crash)</h1>
          <p className="text-zinc-500 mb-4">Sistem gagal merender antarmuka Dashboard. Silakan cek Console (F12) untuk detail error.</p>
          <pre className="text-left bg-zinc-900 text-red-400 p-4 rounded-xl text-xs overflow-auto max-w-2xl w-full border border-red-900">
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { generateDocumentPDF } from './utils/pdfGenerator';


export type ThemeMode = 'light' | 'dark';

import { generateTransactionJournalPDF, generatePayslipPDF, generateReceivablesPDF, generatePayablesPDF, generateReportPDF } from './utils/pdfGenerator';

export const printTransactionsPDF = (transactions: any[], theme: string) => {
  generateTransactionJournalPDF(transactions);
};

export const printPayslipPDF = (pay: any) => {
  generatePayslipPDF(pay);
};


declare global {
  interface Window {
    Chart: any;
  }
}

// ==========================================
// ðŸ“Š EXPORT & PRINT HELPERS
// ==========================================
const exportToExcel = (data: any[], filename: string, headersMap: { [key: string]: string }) => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }
  
  const keys = Object.keys(headersMap || {});
  const csvHeaders = keys.map(key => headersMap[key]).join(',');
  
  const csvRows = (Array.isArray(data) ? data : []).map(item => {
    return keys.map(key => {
      const val = item[key] !== undefined && item[key] !== null ? String(item[key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [csvHeaders, ...csvRows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// ðŸ  SAAS PROFESSIONAL LANDING PAGE (LIGHT/DARK)
// ==========================================
const PreviewPdfModal: React.FC<{ uri: string, title: string, onClose: () => void, isDark: boolean }> = ({ uri, title, onClose, isDark }) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in">
    <div className={`w-full h-[90vh] max-w-6xl rounded-2xl shadow-2xl flex flex-col border overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
      <div className={`flex justify-between items-center p-4 border-b ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'}`}>
        <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-red-500 font-bold text-3xl transition-colors">&times;</button>
      </div>
      <div className="flex-grow bg-zinc-500/20">
        <iframe src={uri} className="w-full h-full border-0" title={title} />
      </div>
    </div>
  </div>
);

interface LandingPageProps {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ theme, setTheme }) => {
  const [showRegModal, setShowRegModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [previewPdfUri, setPreviewPdfUri] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [division, setDivision] = useState('IT (Teknologi Informasi)');
  const [regSuccess, setRegSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const showToast = (msg: string, type: string) => { console.log(`[${type}] ${msg}`); alert(msg); };


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
      <header className={`border-b ${borderClass} ${headerBg} backdrop-blur-xl sticky top-0 z-40 transition-colors`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg text-lg ring-2 ring-emerald-500/20">E</div>
            <div className="flex flex-col">
              <h1 className={`font-black text-sm tracking-widest leading-none uppercase ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>PT EXPRO GIO NUSANTARA</h1>
              <span className="text-[9px] text-emerald-600 font-bold tracking-[0.2em] uppercase mt-1">Enterprise Portal</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold text-zinc-400">
            <a href="#tentang-kami" className={`hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>TENTANG KAMI</a>
            <a href="#tata-kelola" className={`hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>TATA KELOLA</a>
            <a href="#investor" className={`hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>HUBUNGAN INVESTOR</a>
            <a href="#media" className={`hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>MEDIA</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2.5 rounded-full border ${borderClass} hover:bg-emerald-500/10 hover:text-emerald-500 transition-all flex items-center justify-center hover:scale-105 active:scale-95`}
              title="Ganti Tema Visual"
            >
              <span className="material-symbols-outlined text-sm leading-none">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <Link to="/login" className={`px-6 py-2.5 rounded-full text-[10px] font-extrabold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${isDark ? 'bg-zinc-100 hover:bg-white text-zinc-950' : 'bg-zinc-900 hover:bg-black text-white'}`}>
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
              <p className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>EXPRO</p>
            </div>
            <div className="h-10 w-px bg-zinc-700/30"></div>
            <div className="space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Harga Saham</span>
              <p className={`text-2xl font-black truncate flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Rp 6.420 <span className="text-sm font-bold animate-pulse">â–² +1.24%</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>IHSG: 7.210 <span className="text-emerald-500">â–²</span></div>
            <div className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>USD/IDR: 15.420 <span className="text-red-500">â–¼</span></div>
          </div>
        </div>
      </section>

      {/* Financial Highlights */}
      <section id="investor" className={`py-20 border-t relative z-10 px-6 ${isDark ? 'border-zinc-800/50 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="space-y-2">
              <h3 className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Sorotan Keuangan 2025</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Ikhtisar kinerja finansial konsolidasian tahunan (Audited).</p>
            </div>
            <button onClick={() => setShowReportModal(true)} className={`px-4 py-2 text-xs font-bold border rounded-lg hover:border-emerald-500 transition-colors ${isDark ? 'border-zinc-800 text-emerald-400' : 'border-zinc-300 text-emerald-700'}`}>Lihat Laporan Penuh</button>
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
        <h3 className={`text-2xl font-black truncate mb-12 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Laporan & Publikasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`flex gap-6 p-6 rounded-xl border hover:border-emerald-500/50 transition-all cursor-pointer group ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className={`w-24 h-32 rounded flex-shrink-0 flex items-center justify-center border shadow-inner ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
              <span className="material-symbols-outlined text-4xl text-emerald-600">book</span>
            </div>
            <div className="space-y-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Publikasi 2025</span>
              <h4 className={`text-lg font-black group-hover:text-emerald-500 transition-colors ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Laporan Tahunan 2025</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Membangun Ketahanan Melalui Sinergi Bisnis dan Teknologi Berkelanjutan.</p>
              <button onClick={() => {
                showToast('Membuka Laporan Tahunan 2025...', 'info');
                const uri = generateDocumentPDF('Laporan Tahunan 2025', [
                  { bab: 'Bab 1', judul: 'Ikhtisar Kinerja', halaman: '1' },
                  { bab: 'Bab 2', judul: 'Laporan Manajemen', halaman: '12' },
                  { bab: 'Bab 3', judul: 'Tata Kelola Perusahaan', halaman: '45' },
                  { bab: 'Bab 4', judul: 'Laporan Keuangan', halaman: '78' }
                ], ['Bab', 'Judul / Bagian', 'Halaman'], 'Laporan_Tahunan_2025.pdf');
                setPreviewPdfTitle('Laporan Tahunan 2025');
                setPreviewPdfUri(uri as string);
              }} className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-500 transition-colors"><span className="material-symbols-outlined text-sm">download</span> Unduh PDF (14 MB)</button>
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
              <button onClick={() => {
                showToast('Membuka Laporan Keberlanjutan 2025...', 'info');
                const uri = generateDocumentPDF('Laporan Keberlanjutan 2025 (ESG Report)', [
                  { id: 'ESG-01', metric: 'Reduksi Emisi Karbon', value: '14,500 Ton CO2', status: 'Sesuai Target' },
                  { id: 'ESG-02', metric: 'Rasio Karyawan Perempuan', value: '35%', status: 'Meningkat' },
                  { id: 'ESG-03', metric: 'Skor GCG (Good Corporate Governance)', value: '92.5', status: 'Sangat Baik' }
                ], ['ID', 'Indikator ESG', 'Capaian', 'Status'], 'Laporan_Keberlanjutan_2025.pdf');
                setPreviewPdfTitle('Laporan Keberlanjutan 2025');
                setPreviewPdfUri(uri as string);
              }} className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-500 transition-colors"><span className="material-symbols-outlined text-sm">download</span> Unduh PDF (8 MB)</button>
            </div>
          </div>
        </div>
      </section>

      {/* Media & Press Releases */}
      <section id="media" className={`py-20 border-t relative z-10 px-6 ${isDark ? 'border-zinc-800/50 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50/50'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="space-y-2">
              <h3 className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Siaran Pers & Media</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Berita terbaru dan pembaruan strategis korporat.</p>
            </div>
            <button onClick={() => setShowNewsModal(true)} className={`px-4 py-2 text-xs font-bold border rounded-lg hover:border-emerald-500 transition-colors ${isDark ? 'border-zinc-800 text-emerald-400' : 'border-zinc-300 text-emerald-700'}`}>Lihat Semua Berita</button>
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
            <h3 className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Portofolio Bisnis Utama</h3>
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
            <h3 className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Portofolio Kepercayaan (Anchor Clients)</h3>
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
      {/* Media & Press Releases */}
      <section id="media" className={`py-20 border-t relative z-10 px-6 ${isDark ? 'border-zinc-800/50 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50/50'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div className="space-y-2">
              <h3 className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Siaran Pers & Media</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Berita terbaru dan pembaruan strategis korporat.</p>
            </div>
            <button onClick={() => setShowNewsModal(true)} className={`px-4 py-2 text-xs font-bold border rounded-lg hover:border-emerald-500 transition-colors ${isDark ? 'border-zinc-800 text-emerald-400' : 'border-zinc-300 text-emerald-700'}`}>Lihat Semua Berita</button>
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
            <h3 className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Portofolio Bisnis Utama</h3>
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
            <h3 className={`text-2xl font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Portofolio Kepercayaan (Anchor Clients)</h3>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl p-8 shadow-2xl space-y-6 border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <h3 className={`font-black text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>Laporan Penuh Keuangan & ESG</h3>
              <button onClick={() => setShowReportModal(false)} className="text-zinc-500 hover:text-zinc-300 font-bold text-2xl">&times;</button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className={`p-4 rounded-lg border ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <h4 className={`font-bold mb-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Pendapatan Konsolidasi</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-zinc-500 block text-xs">Q1 2025</span><span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Rp 5.2 T</span></div>
                  <div><span className="text-zinc-500 block text-xs">Q2 2025</span><span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Rp 6.1 T</span></div>
                  <div><span className="text-zinc-500 block text-xs">Q3 2025</span><span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Rp 6.4 T</span></div>
                  <div><span className="text-zinc-500 block text-xs">Q4 2025</span><span className={`font-bold text-emerald-500`}>Rp 6.8 T</span></div>
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <h4 className={`font-bold mb-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Pencapaian ESG</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex justify-between border-b border-zinc-800/50 pb-2"><span>Reduksi Karbon (Scope 1)</span><span className="font-bold text-emerald-500">14,500 Ton</span></li>
                  <li className="flex justify-between border-b border-zinc-800/50 pb-2"><span>Sertifikasi ISO 14001</span><span className="font-bold text-emerald-500">Tercapai 100%</span></li>
                  <li className="flex justify-between"><span>Gender Diversity in Leadership</span><span className="font-bold text-emerald-500">35%</span></li>
                </ul>
              </div>
              <p className="text-xs text-zinc-500 mt-4 italic">*Laporan lengkap tersedia dalam bentuk PDF yang dapat diunduh di dashboard Investor.</p>
            </div>
            <button onClick={() => setShowReportModal(false)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors">Tutup Laporan</button>
          </div>
        </div>
      )}

      {/* News Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl p-8 shadow-2xl space-y-6 border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <h3 className={`font-black text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>Indeks Berita & Siaran Pers</h3>
              <button onClick={() => setShowNewsModal(false)} className="text-zinc-500 hover:text-zinc-300 font-bold text-2xl">&times;</button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { date: '12 JUN 2026', title: 'Akuisisi Strategis Infrastruktur Cloud', desc: 'FinCorp Enterprise resmi mengakuisisi pusat data tier 4 untuk memperkuat pondasi digital.' },
                { date: '28 MEI 2026', title: 'RUPS Tahunan 2026 Menyepakati Dividen', desc: 'Rapat Umum Pemegang Saham menyepakati pembagian dividen Rp 200 per lembar saham.' },
                { date: '24 APR 2026', title: 'Penghargaan Green Energy Initiatives', desc: 'Rekayasa kelistrikan (MEP) ramah lingkungan memenangkan apresiasi skala internasional.' },
                { date: '05 MAR 2026', title: 'Ekspansi Layanan Sipil & Arsitektur', desc: 'PT Expro Gio Nusantara berekspansi ke wilayah Timur Indonesia untuk proyek strategis nasional.' },
                { date: '18 FEB 2026', title: 'Peluncuran FinCorp Enterprise Suite', desc: 'Platform ERP revolusioner diluncurkan untuk mempermudah tata kelola korporat modern.' }
              ].map((news, idx) => (
                <div key={idx} className={`p-4 rounded-lg border hover:border-emerald-500/50 transition-colors cursor-pointer ${isDark ? 'border-zinc-800 bg-zinc-950/30' : 'border-zinc-200 bg-zinc-50/50'}`}>
                  <span className="text-[10px] font-bold text-emerald-500">{news.date}</span>
                  <h4 className={`font-bold mt-1 text-sm ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{news.title}</h4>
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{news.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {previewPdfUri && <PreviewPdfModal uri={previewPdfUri} title={previewPdfTitle} isDark={isDark} onClose={() => setPreviewPdfUri(null)} />}
    </div>
  );
};
// ==========================================
// ðŸ”‘ MODERN SAAS GATEWAY LOGIN (LIGHT/DARK)
// ==========================================
interface LoginPortalProps {
  theme: ThemeMode;
  handleAuthSuccess: (role: UserRole, name: string) => void;
}

const RegisterForm: React.FC<{ theme: ThemeMode, role: 'employee' | 'investor' }> = ({ theme, role }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password_confirmation: '', custom_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#070708]' : 'bg-zinc-50';
  const cardClass = isDark ? 'bg-zinc-900/80 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-2xl';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.get('/sanctum/csrf-cookie', { baseURL: '' });
      const res = await api.post('/register/user', {
        ...formData,
        role
      });
      setSuccess('Registrasi berhasil. Akun Anda menunggu verifikasi Superadmin sebelum bisa digunakan.');
      setFormData({ name: '', email: '', password: '', password_confirmation: '', custom_id: '' });
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(Object.values(err.response.data.errors)[0] as string);
      } else {
        setError(err.response?.data?.message || 'Registrasi gagal.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 pt-24 font-sans ${bgClass} relative`}>
      <div className={`w-full max-w-md rounded-2xl relative z-10 p-8 ${cardClass} shadow-2xl backdrop-blur-md animate-fade-in`}>
        <div className="text-center mb-8">
          <h2 className={`font-black text-2xl mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Daftar {role === 'investor' ? 'Investor' : 'Karyawan'}</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Lengkapi profil Anda untuk mendaftar.</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 border border-red-500/50 text-xs p-3 rounded-xl mb-6">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs p-4 rounded-xl mb-6 font-bold">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nama Lengkap" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`} />
          <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`} />
          
          {role === 'investor' ? (
            <input type="text" placeholder="Nomor Identitas (KTP)" value={formData.custom_id} onChange={e => setFormData({...formData, custom_id: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`} />
          ) : (
            <input type="text" placeholder="Nomor Karyawan (Opsional)" value={formData.custom_id} onChange={e => setFormData({...formData, custom_id: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`} />
          )}

          <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`} />
          <input type="password" placeholder="Konfirmasi Password" required value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`} />
          
          <button type="submit" disabled={loading} className={`w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}>
             {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className={`mt-8 pt-6 border-t text-center text-xs ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
          <p>Sudah punya akun? <Link to="/login" className="text-emerald-500 font-bold hover:underline">Masuk &rarr;</Link></p>
        </div>
      </div>
    </div>
  );
};


const LoginGateway: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#070708]' : 'bg-zinc-50';
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 pt-24 font-sans ${bgClass} relative`}>
      <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-[100px] pointer-events-none animate-pulse ${isDark ? 'bg-emerald-900/10' : 'bg-emerald-500/10'}`}></div>
      <div className="w-full max-w-4xl relative z-10 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-[16px] bg-gradient-to-tr from-[#1A7D47] to-emerald-600 flex items-center justify-center font-bold text-white shadow-xl mx-auto text-2xl mb-6">E</div>
        <h2 className={`font-bold text-[28px] mb-2 tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>PT Expro Gio Nusantara</h2>
        <p className={`text-sm mb-12 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sistem Informasi Perusahaan Terpadu - Pilih Portal Akses</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/login/manajemen" className={`p-8 rounded-[20px] border transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-slate-800/50 border-slate-700/50 hover:shadow-lg hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] hover:border-blue-300'} flex flex-col items-center gap-4`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
               <span className="material-symbols-outlined text-3xl">corporate_fare</span>
             </div>
             <div>
               <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Manajemen</h3>
               <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Superadmin, Admin Keuangan, Manajer</p>
             </div>
          </Link>

          <Link to="/login/staf" className={`p-8 rounded-[20px] border transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-slate-800/50 border-slate-700/50 hover:shadow-lg hover:border-purple-500/50' : 'bg-white border-slate-200 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] hover:border-purple-300'} flex flex-col items-center gap-4`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-950/40 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
               <span className="material-symbols-outlined text-3xl">groups</span>
             </div>
             <div>
               <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Staf & Karyawan</h3>
               <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Finance Staff, Karyawan</p>
             </div>
          </Link>

          <Link to="/login/investor" className={`p-8 rounded-[20px] border transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-slate-800/50 border-slate-700/50 hover:shadow-lg hover:border-emerald-500/50' : 'bg-white border-slate-200 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] hover:border-emerald-300'} flex flex-col items-center gap-4`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
               <span className="material-symbols-outlined text-3xl">trending_up</span>
             </div>
             <div>
               <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Investor</h3>
               <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Akses Laporan RUPS & Kinerja</p>
             </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

const GenericLoginForm: React.FC<{ theme: ThemeMode, title: string, roleGroup: string[], linkText?: string, linkUrl?: string, handleAuthSuccess: any }> = ({ theme, title, roleGroup, linkText, linkUrl, handleAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#070708]' : 'bg-zinc-50';
  const cardClass = isDark ? 'bg-zinc-900/80 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-2xl';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.get('/sanctum/csrf-cookie', { baseURL: '' });
      const res = await api.post('/login', { email, password, intended_role_group: roleGroup }, { baseURL: '' });
      const userRes = await api.get('/api/user', { baseURL: '' });
      if (userRes.data) {
        handleAuthSuccess(userRes.data.role, userRes.data.name);
        navigate(res.data.redirect || '/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors?.email) {
        setError(err.response.data.errors.email[0]);
      } else {
        setError('Terjadi kesalahan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 pt-24 font-sans ${bgClass} relative`}>
      <div className={`w-full max-w-md rounded-2xl relative z-10 p-8 ${cardClass} shadow-2xl backdrop-blur-md animate-fade-in`}>
        <div className="mb-6">
          <Link to="/login" className={`flex items-center gap-2 text-xs font-bold transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>
            <span className="material-symbols-outlined text-sm">arrow_back</span> Kembali
          </Link>
        </div>
        <div className="text-center mb-8">
          <h2 className={`font-black text-2xl mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{title}</h2>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-4 py-3.5 rounded-[8px] border text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100 focus:border-primary-500 focus:ring-primary-500/20' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'}`} />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-4 py-3.5 rounded-[8px] border text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-100 focus:border-primary-500 focus:ring-primary-500/20' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'}`} />
          
          <button type="submit" disabled={loading} className={`w-full mt-4 bg-[#1A7D47] hover:bg-[#156a3b] text-white font-bold py-3.5 px-4 rounded-[8px] text-sm transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className={`mt-8 pt-6 border-t text-center text-xs ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
          {linkUrl ? (
            <Link to={linkUrl} className="text-emerald-500 font-bold hover:underline">{linkText}</Link>
          ) : (
            <p>Akun hanya bisa dibuat oleh Superadmin.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ðŸ“Š DASHBOARD & STAFF COGNITIVE CHARTS
// ==========================================
interface DashboardProps {
  theme: ThemeMode;
}

const InvestorPortal: React.FC<DashboardProps> = ({ theme }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [esgMetrics, setEsgMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showToast = (msg: string, type: string) => { console.log(`[${type}] ${msg}`); alert(msg); };
  const [previewPdfUri, setPreviewPdfUri] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-[#f8fafc] text-zinc-900 border-zinc-200';

  const getEsgBadgeStyle = (isLowerBetter: boolean, trend: string) => {
    if (trend === 'up') return isLowerBetter ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (trend === 'down') return isLowerBetter ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

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
      console.error("API error fetching investor data:", err);
    } finally {
        setLoading(false);
      }
    };
    fetchInvestorData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`p-6 border rounded-[16px] relative overflow-hidden ${isDark ? 'bg-[#0f1914] border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none -z-10 animate-pulse ${isDark ? 'bg-emerald-600/20' : 'bg-emerald-400/20'}`}></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h3 className={`text-lg font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Portal Investor & Stakeholder</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-700/70'}`}>Akses eksklusif data kinerja ESG, riwayat dividen, dan dokumen finansial tahunan PT Expro Gio Nusantara.</p>
          </div>
          <div className={`px-4 py-2 rounded-lg border text-center ${isDark ? 'bg-black/40 border-emerald-900/50 text-white' : 'bg-white/60 border-emerald-200 text-zinc-900'}`}>
            <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Nilai Saham (EXPRO)</p>
            <p className="text-xl font-black mt-0.5">Rp 6.420 <span className="text-xs text-emerald-500 animate-pulse">â–²</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`border rounded-[16px] p-6 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-4 border-zinc-500/20">
            <h4 className={`font-extrabold text-xs tracking-wider uppercase ${titleClass}`}>Metrik Keberlanjutan (ESG)</h4>
            <span className="material-symbols-outlined text-zinc-400 text-sm">eco</span>
          </div>
          {loading ? <p className="text-xs text-zinc-500">Memuat metrik...</p> : (
            <div className="space-y-4">
              {(Array.isArray(esgMetrics) ? esgMetrics : []).map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-emerald-500 text-[14px]">
                        {(m.metric || m.name || '').includes('Sosial') ? 'groups' : (m.metric || m.name || '').includes('Energi') ? 'bolt' : 'eco'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${titleClass}`}>{m.metric || m.name}</p>
                      <p className={`text-[10px] ${textClass}`}>{m.status || m.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${titleClass}`}>{m.value} <span className="text-[10px] font-normal text-zinc-500">{m.unit}</span></p>
                    <div className="mt-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-sm ${getEsgBadgeStyle(Boolean(m.is_lower_better), m.trend)}`}>
                        {m.trend === 'up' ? '▲ Meningkat' : m.trend === 'down' ? '▼ Menurun' : '■ Stabil'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`border rounded-[16px] p-6 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-4 border-zinc-500/20">
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
                  {(Array.isArray(documents) ? documents : []).map((doc, i) => (
                    <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                      <td className={`p-3 font-medium ${titleClass}`}>{doc.title}</td>
                      <td className={`p-3 ${textClass}`}>{doc.publishDate}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => {
                          showToast(`Membuka dokumen ${doc.title}...`, 'info');
                          const uri = generateDocumentPDF(doc.title, [
                            { field: 'ID Dokumen', val: `DOC-${Math.floor(Math.random() * 10000)}` },
                            { field: 'Tanggal Rilis', val: doc.publishDate },
                            { field: 'Status', val: 'Final / Verified' },
                            { field: 'Kategori', val: 'Publikasi Investor' }
                          ], ['Atribut', 'Keterangan'], `${doc.title.replace(/\s+/g, '_')}.pdf`);
                          setPreviewPdfTitle(doc.title);
                          setPreviewPdfUri(uri as string);
                        }} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded shadow-sm transition-colors text-[10px]">
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
      {previewPdfUri && <PreviewPdfModal uri={previewPdfUri} title={previewPdfTitle} isDark={isDark} onClose={() => setPreviewPdfUri(null)} />}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps & { userRole?: string }> = ({ theme, userRole: propRole }) => {
  const userRole = propRole || 'staff'; // Fallback
  
  // ALL hooks must be declared BEFORE any conditional return (React Rules of Hooks)
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_cash: 0 });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mgmtCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showRmbModal, setShowRmbModal] = useState(false);
  const [rmbForm, setRmbForm] = useState({ purpose: '', amount: '' });
  const [rmbLoading, setRmbLoading] = useState(false);

  const handleRmbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRmbLoading(true);
    try {
      await api.post('/reimbursements', {
        description: rmbForm.purpose,
        amount: Number(rmbForm.amount)
      });
      setShowRmbModal(false);
      setRmbForm({ purpose: '', amount: '' });
      fetchData(); // Refresh data
    } catch (err) {
      alert('Gagal mengajukan reimbursement');
    } finally {
      setRmbLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-[#f8fafc] text-zinc-900 border-zinc-200';

  const fetchData = async () => {
    try {
      if (userRole === 'employee') {
        const [payRes, rmbRes] = await Promise.all([
          api.get('/payroll/my').catch(() => ({ data: [] })),
          api.get('/reimbursements').catch(() => ({ data: [] }))
        ]);
        setPayrolls(payRes.data || []);
        setReimbursements(
          (rmbRes.data || []).map((r: any) => ({
            id: 'RMB-' + r.id,
            date: r.created_at ? new Date(r.created_at).toISOString().substring(0, 10) : '2026-07-18',
            purpose: r.description,
            amount: r.amount,
            status: r.status === 'pending' ? 'Diproses' : r.status === 'verified' ? 'Diverifikasi' : r.status === 'rejected' ? 'Ditolak' : 'Disetujui'
          }))
        );
        setTransactions([]);
        setSummary({ total_income: 0, total_expense: 0, net_cash: 0 });
        setInvoices([]);
        setPendingApprovals([]);
      } else if (userRole === 'finance_staff') {
        // FinanceStaffDashboard handles its own data fetching.
      } else {
        const [summaryRes, txRes, invRes, payRes, rmbRes] = await Promise.all([
          api.get('/transactions/summary').catch(() => ({ data: null })),
          api.get('/transactions').catch(() => ({ data: [] })),
          api.get('/invoices').catch(() => ({ data: [] })),
          api.get('/payroll').catch(() => ({ data: [] })),
          api.get('/reimbursements').catch(() => ({ data: [] }))
        ]);
        setTransactions(txRes.data || []);
        setSummary(summaryRes.data || { total_income: 0, total_expense: 0, net_cash: 0 });
        setInvoices(invRes.data || []);
        setPayrolls(payRes.data || []);
        setReimbursements(
          (rmbRes.data || []).map((r: any) => ({
            id: 'RMB-' + r.id,
            date: r.created_at ? new Date(r.created_at).toISOString().substring(0, 10) : '2026-07-18',
            purpose: r.description,
            amount: r.amount,
            status: r.status === 'pending' ? 'Diproses' : r.status === 'verified' ? 'Diverifikasi' : r.status === 'rejected' ? 'Ditolak' : 'Disetujui'
          }))
        );
        const pending = (txRes.data || [])
          .filter((t: any) => (t.status === 'pending' || t.status === 'verified') && t.type === 'expense' && Number(t.amount) >= 50000000)
          .map((t: any) => ({
            id: t.id,
            date: t.date || t.transactionDate,
            submitter: t.created_by || 'System',
            amount: t.amount,
            purpose: t.description,
            status: t.status
          }));
        setPendingApprovals(pending);
      }
    } catch (err) {
      console.warn('API error on Dashboard, akan menampilkan data kosong', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Route investors to their dedicated portal AFTER hooks are declared
  // (cannot do this before hooks due to React Rules of Hooks)
  if (userRole === 'investor') {
    return <InvestorPortal theme={theme} />;
  }

  // Initialize Charts using global Chart.js from CDN
  useEffect(() => {
    if (!loading && Chart) {
      let kpiChart: any = null;
      let mgmtChart: any = null;

      // Set Chart.js Defaults based on active Theme
      Chart.defaults.color = isDark ? '#71717a' : '#52525b';
      Chart.defaults.font.family = 'Inter, sans-serif';

      if (canvasRef.current && userRole === 'finance_staff') {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          kpiChart = new Chart(ctx, {
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
      
      (transactions || []).forEach(t => {
        if (t.status === 'Lunas' && t.transactionDate) {
          const date = new Date(t.transactionDate);
          const monthDiff = (new Date().getFullYear() - date.getFullYear()) * 12 + new Date().getMonth() - date.getMonth();
          if (monthDiff >= 0 && monthDiff < 6) {
            const index = 5 - monthDiff;
            if (t.type === 'income' || t.type === 'Pendapatan') {
              monthlyIncome[index] += t.amount / 1000000;
            } else if (t.type === 'expense') {
              monthlyExpense[index] += t.amount / 1000000;
            }
          }
        }
      });

      if (mgmtCanvasRef.current && userRole !== 'staff') {
        const mgmtCtx = mgmtCanvasRef.current.getContext('2d');
        if (mgmtCtx) {
          mgmtChart = new Chart(mgmtCtx, {
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
const formatRupiah = (val: any) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  if (loading) {
    return <SkeletonLoader isDark={isDark} rows={6} />;
  }

  // ==========================================
  // VIEW UNTUK PERAN: MANAGER PROYEK
  // ==========================================
  if (userRole === 'admin_keuangan') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Dashboard Admin Keuangan</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Ringkasan arus kas, persetujuan reimbursement, dan kontrol invoice.</p>
        </div>
        <AdminKeuanganDashboard isDark={isDark} theme={theme} transactions={transactions} invoices={invoices} refreshTransactions={fetchData} />
      </div>
    );
  }

  if (userRole === 'manajer') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Dashboard Manajemen Proyek</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Kendali budget proyek dan persetujuan pengeluaran.</p>
        </div>
        <ManagerDashboard isDark={isDark} theme={theme} transactions={transactions} refreshTransactions={fetchData} />
      </div>
    );
  }

  // ==========================================
  // VIEW UNTUK PERAN: FINANCE STAFF
  // ==========================================
  if (userRole === 'finance_staff') {
    return <FinanceStaffDashboard isDark={isDark} theme={theme} />;
  }

  // ==========================================
  // VIEW UNTUK PERAN: STAFF KARYAWAN
  // ==========================================
  if (userRole === 'employee') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Dashboard Karyawan</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Metrik pencapaian kinerja, slip gaji terbit, dan asisten AI finansial.</p>
        </div>

        {/* Staff Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-[16px] backdrop-blur-md transition-all hover:border-emerald-500/20 border ${isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm'}`}>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Take Home Pay Terakhir</p>
            <p className="text-2xl font-black truncate text-emerald-500 mt-2">{formatRupiah(payrolls[0]?.netSalary || 0)}</p>
            <span className="text-[9px] text-zinc-500 block mt-1">Periode: {payrolls[0]?.period || '-'}</span>
          </div>
          <div className={`p-6 rounded-[16px] backdrop-blur-md transition-all hover:border-blue-500/20 border ${cardClass}`}>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gaji Pokok</p>
            <p className="text-2xl font-black truncate text-blue-500 mt-2">{formatRupiah(payrolls[0]?.baseSalary || 0)}</p>
            <span className="text-[9px] text-zinc-500 block mt-1">Sesuai Kontrak Aktif</span>
          </div>
          <div className={`p-6 rounded-[16px] backdrop-blur-md transition-all hover:border-amber-500/20 border ${cardClass}`}>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Tunjangan & Bonus</p>
            <p className="text-2xl font-black truncate text-amber-500 mt-2">{formatRupiah((payrolls[0]?.allowance || 0) + (payrolls[0]?.bonus || 0))}</p>
            <span className="text-[9px] text-zinc-500 block mt-1">Tunjangan: {formatRupiah(payrolls[0]?.allowance || 0)}</span>
          </div>
        </div>

        {/* Payslips List Table */}
        <div className={`rounded-[16px] p-6 space-y-4 backdrop-blur-md border ${cardClass}`}>
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
                {(Array.isArray(payrolls) ? payrolls : []).map(pay => (
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
                {(reimbursements || []).length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-zinc-500 text-xs">Tidak ada pengajuan dana saat ini.</td></tr>
                ) : (Array.isArray(reimbursements) ? reimbursements : []).map(rmb => (
                  <tr key={rmb.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                    <td className={`p-3.5 font-mono font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{rmb.id}</td>
                    <td className="p-3.5 font-mono text-zinc-500">{rmb.date}</td>
                    <td className="p-3.5 font-bold">{rmb.purpose}</td>
                    <td className="p-3.5 font-black text-amber-500">{formatRupiah(rmb.amount)}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold border uppercase whitespace-nowrap inline-block ${
                        rmb.status === 'Disetujui' || rmb.status === 'Diverifikasi'
                          ? (isDark ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800/50' : 'bg-emerald-100 text-emerald-700 border-emerald-200')
                          : rmb.status === 'Ditolak'
                          ? (isDark ? 'bg-red-900/50 text-red-400 border-red-800/50' : 'bg-red-100 text-red-700 border-red-200')
                          : (isDark ? 'bg-amber-900/50 text-amber-400 border-amber-800/50' : 'bg-amber-100 text-amber-700 border-amber-200')
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

        {/* Tambah Reimbursement Button */}
        <div className="pt-2">
          <button
            onClick={() => setShowRmbModal(true)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200'}`}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Ajukan Reimbursement Baru
          </button>
        </div>
        {/* Modal Reimbursement */}
        {showRmbModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold mb-4 ${titleClass}`}>Ajukan Reimbursement Baru</h3>
              <form onSubmit={handleRmbSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${textClass}`}>Tujuan Pengajuan</label>
                  <input
                    type="text"
                    required
                    value={rmbForm.purpose}
                    onChange={e => setRmbForm({ ...rmbForm, purpose: e.target.value })}
                    className={`w-full p-2.5 rounded-lg text-sm border focus:ring-2 focus:outline-none transition-all ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:ring-blue-500/50' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-blue-500/20'}`}
                    placeholder="Contoh: Akomodasi Kunjungan Klien"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${textClass}`}>Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={rmbForm.amount}
                    onChange={e => setRmbForm({ ...rmbForm, amount: e.target.value })}
                    className={`w-full p-2.5 rounded-lg text-sm border focus:ring-2 focus:outline-none transition-all ${isDark ? 'bg-zinc-950/50 border-zinc-800 text-white focus:ring-blue-500/50' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-blue-500/20'}`}
                    placeholder="Contoh: 150000"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRmbModal(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={rmbLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {rmbLoading ? 'Memproses...' : 'Submit Pengajuan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW UNTUK PERAN: MANAGEMENT
  // ==========================================
  const revenue = (transactions || []).filter(t => t.type === 'income' || t.type === 'Pendapatan').reduce((sum, t) => sum + t.amount, 0);
  const expense = (transactions || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const cashFlow = revenue - expense;
  const unpaidInvoices = invoices.filter(i => i.status !== 'Lunas').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {userRole === 'superadmin' ? (
        <ErrorBoundary>
          <div>
            <h2 className={`text-lg font-black ${titleClass}`}>
              Dashboard Eksekutif (Superadmin)
            </h2>
            <p className={`text-xs mt-1 ${textClass}`}>
              Ringkasan eksekutif penuh: arus kas, laporan keuangan, dan kendali sistem.
            </p>
          </div>
          <SuperadminPanel isDark={isDark} theme={theme} />
        </ErrorBoundary>
      ) : (
        <>
          <div>
            <h2 className={`text-lg font-black ${titleClass}`}>
              {userRole === 'admin_keuangan' ? 'Dashboard Administrasi' : 'Dashboard Manajemen'}
            </h2>
            <p className={`text-xs mt-1 ${textClass}`}>
              {userRole === 'admin_keuangan' ? 'Kendali operasional harian: jurnal transaksi, payroll, dan data keuangan.' 
               : 'Ringkasan arus kas korporat, tagihan piutang, dan log pengeluaran proyek.'}
            </p>
          </div>

          {/* ReimbursementPanel for admins */}
          {['admin_keuangan', 'manajer'].includes(userRole as string) && <ReimbursementPanel isDark={isDark} theme={theme} userRole={userRole as string} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-3xl relative overflow-hidden transition-all border ${cardClass} hover:-translate-y-1 hover:shadow-xl`}>
          <div className="absolute -right-6 -top-6 text-emerald-500/10 dark:text-emerald-900/30">
             <span className="material-symbols-outlined text-9xl">trending_up</span>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Total Pendapatan</p>
          <p className={`text-4xl font-black mt-2 tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} title={formatRupiah(revenue)}>{formatCurrencyCompact(revenue)}</p>
        </div>
        <div className={`p-6 rounded-3xl relative overflow-hidden transition-all border ${cardClass} hover:-translate-y-1 hover:shadow-xl`}>
          <div className="absolute -right-6 -top-6 text-rose-500/10 dark:text-rose-900/30">
             <span className="material-symbols-outlined text-9xl">trending_down</span>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Total Pengeluaran</p>
          <p className={`text-4xl font-black mt-2 tracking-tight ${isDark ? 'text-rose-400' : 'text-rose-600'}`} title={formatRupiah(expense)}>{formatCurrencyCompact(expense)}</p>
        </div>
        <div className={`p-6 rounded-3xl relative overflow-hidden transition-all border ${isDark ? 'bg-gradient-to-br from-emerald-900/40 to-black border-emerald-900/50' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'} hover:-translate-y-1 hover:shadow-xl`}>
          <div className="absolute -right-6 -top-6 text-emerald-500/20 dark:text-emerald-400/10">
             <span className="material-symbols-outlined text-9xl">account_balance</span>
          </div>
          <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>Kas Bersih</p>
          <p className={`text-4xl font-black mt-2 tracking-tight ${
            cashFlow >= 0 
              ? (isDark ? 'text-white' : 'text-emerald-900') 
              : (isDark ? 'text-rose-400' : 'text-rose-600')
          }`} title={formatRupiah(cashFlow)}>{formatCurrencyCompact(cashFlow)}</p>
        </div>
        <div className={`p-6 rounded-3xl relative overflow-hidden transition-all border ${cardClass} hover:-translate-y-1 hover:shadow-xl`}>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tagihan (Piutang)</p>
          <p className={`text-3xl font-black mt-2 tracking-tight ${isDark ? 'text-blue-400' : 'text-blue-600'}`} title={formatRupiah(unpaidInvoices)}>{formatCurrencyCompact(unpaidInvoices)}</p>
        </div>
        <div className={`p-6 rounded-3xl relative overflow-hidden transition-all border ${cardClass} hover:-translate-y-1 hover:shadow-xl`}>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Kewajiban (Hutang)</p>
          <p className={`text-3xl font-black mt-2 tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-600'}`} title={formatRupiah(450000000)}>{formatCurrencyCompact(450000000)}</p>
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
              {(Array.isArray(invoices) ? invoices : []).map(inv => (
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

    {/* Tax Reminder Panel (Admin & Superadmin) */}
    {(userRole === 'admin_keuangan' || userRole === 'superadmin') && (
      <div className={`rounded-xl p-6 backdrop-blur-md border border-rose-500/30 ${cardClass}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-extrabold text-xs text-rose-500 flex items-center gap-2`}><span className="material-symbols-outlined text-sm">receipt_long</span> Pengingat Pajak Berjalan</h3>
        </div>
        <div className="space-y-3">
          <div className={`p-4 rounded-lg flex justify-between items-center border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
            <div>
              <p className={`text-xs font-bold ${titleClass}`}>PPN Keluaran Masa Juni 2026</p>
              <p className="text-[10px] text-zinc-500 mt-1">Jatuh Tempo: 15 Juli 2026</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-rose-500">{formatRupiah(125000000)}</p>
              <button className="text-[9px] mt-1 bg-emerald-500 text-white px-2 py-1 rounded font-bold hover:bg-emerald-600 transition-colors">Lapor & Bayar</button>
            </div>
          </div>
          <div className={`p-4 rounded-lg flex justify-between items-center border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
            <div>
              <p className={`text-xs font-bold ${titleClass}`}>PPh 21 Karyawan (Masa Juni)</p>
              <p className="text-[10px] text-zinc-500 mt-1">Jatuh Tempo: 10 Juli 2026</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-emerald-500">SUDAH LUNAS</p>
              <p className="text-[9px] mt-1 text-zinc-500 font-bold">NTPN: 4F2A9B8CE3</p>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Pending Approvals Table - only for superadmin and manager */}
      {(userRole === 'superadmin' || userRole === 'manajer' || userRole === 'admin_keuangan') && (
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
              {(pendingApprovals || []).length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-zinc-500 text-xs font-mono">âœ“ Tidak ada transaksi yang menunggu persetujuan saat ini.</td></tr>
              ) : (Array.isArray(pendingApprovals) ? pendingApprovals : []).map(req => (
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
      )}
        </>
      )}
    </div>
  );
};

// ==========================================
// ðŸ“ TRANSACTIONS COMPONENT (LIGHT/DARK)
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
  const showToast = (msg: string, type: string) => { console.log(`[${type}] ${msg}`); alert(msg); };
const handleAction = async (id: string, action: string, flag: boolean = true) => {
    try {
      let endpoint = `/transactions/${id}/${action}`;
      if (action === 'verify' || action === 'approve') {
        endpoint += `?${action}=${flag}`;
      }
      await api.post(endpoint);
      showToast(`Aksi ${action} berhasil diproses`, 'success');
      fetchTransactions();
    } catch (err) {
      showToast(`Gagal memproses aksi ${action}`, 'error');
    }
  };

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.03)] rounded-[16px]';
  const titleClass = isDark ? 'text-white' : 'text-slate-900';

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err: any) {
      console.error('Gagal memuat transaksi', err);
      showToast(err.response?.data?.message || 'Gagal memuat transaksi dari server.', 'error');
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
    
    let initialStatus = 'approved';
    if (type === 'Pengeluaran' && parseFloat(amount) >= 50000000 && userRole === 'finance_staff') {
      initialStatus = 'pending';
    }

    const payload = { 
      date: new Date().toISOString().split('T')[0],
      type: type === 'Pendapatan' || type === 'income' ? 'income' : 'expense', 
      category, 
      amount: parseFloat(amount), 
      description,
      status: initialStatus
    };

    try {
      await api.post('/transactions', payload);
      setAmount('');
      setDescription('');
      showToast('Transaksi berhasil dicatat.', 'success');
      fetchTransactions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal mencatat transaksi. Silakan coba lagi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };
const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  if (loading) return <SkeletonLoader isDark={isDark} rows={5} />;

  const showInputForm = ['admin_keuangan', 'staff', 'superadmin', 'manajer'].includes(userRole || 'staff');

  return (
    <div className={`grid grid-cols-1 gap-6 animate-fade-in ${showInputForm ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-5xl mx-auto'}`}>
      
      {/* Transaction List Table */}
      <div className={`${showInputForm ? 'lg:col-span-2' : ''} border p-6 space-y-6 backdrop-blur-md ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h3 className={`font-bold text-lg ${titleClass}`}>Jurnal Kas Finansial</h3>
            <span className="text-[11px] text-slate-500">Total: {transactions.length} Item</span>
            </div>
            <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-2 border rounded-[8px] ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="material-symbols-outlined text-[16px] text-slate-500">search</span>
              <input type="text" placeholder="Cari TX-ID..." className="bg-transparent text-xs w-28 outline-none placeholder-slate-500" disabled />
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
              className={`px-4 py-2 border rounded-[8px] font-medium text-xs flex items-center gap-1.5 transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">download</span> Ekspor Excel
            </button>
            <button 
              onClick={() => printTransactionsPDF(transactions, theme)} 
              className={`px-4 py-2 border rounded-[8px] font-medium text-xs flex items-center gap-1.5 transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">print</span> Cetak Jurnal
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className={`${isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-[#f8fafc] text-slate-500'} font-semibold border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <tr>
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Kategori</th>
                <th className="py-3 px-4 font-semibold">Jumlah</th>
                <th className="py-3 px-4 font-semibold">Deskripsi</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                {(userRole === 'manajer' || userRole === 'superadmin' || userRole === 'admin_keuangan') && <th className="py-3 px-4 font-semibold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-100'}`}>
              {(Array.isArray(transactions) ? transactions : []).map(tx => (
                <tr key={tx.transactionId} className={`transition-colors ${isDark ? 'hover:bg-slate-800/20 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                  <td className={`py-3 px-4 font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{tx.transactionId}</td>
                  <td className="py-3 px-4">
                    <span className="block font-medium">{tx.category}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`py-3 px-4 font-semibold whitespace-nowrap ${
                    tx.type === 'income' 
                      ? (isDark ? 'text-emerald-400' : 'text-emerald-600') 
                      : (isDark ? 'text-rose-400' : 'text-rose-600')
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div className="max-w-[200px] truncate" title={tx.description}>
                      {tx.description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize inline-flex items-center justify-center ${
                      tx.status === 'approved'
                          ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                      : tx.status === 'rejected'
                          ? (isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600')
                      : tx.status === 'verified'
                          ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')
                      : tx.status === 'pending'
                          ? (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600')
                      : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-x-2 text-right">
                    {tx.status === 'draft' && userRole === 'finance_staff' && (
                        <button onClick={() => handleAction((tx.id || tx.transactionId), 'submit')} className="px-3 py-1.5 bg-[#1A7D47] text-white rounded-[8px] text-[11px] hover:bg-[#156a3b] font-medium transition-all shadow-sm">Submit</button>
                    )}
                    {tx.status === 'pending' && userRole === 'admin_keuangan' && (
                        <>
                            <button onClick={() => handleAction((tx.id || tx.transactionId), 'verify', true)} className="px-3 py-1.5 bg-[#1A7D47] text-white rounded-[8px] text-[11px] hover:bg-[#156a3b] font-medium transition-all shadow-sm">Verify</button>
                            <button onClick={() => handleAction((tx.id || tx.transactionId), 'verify', false)} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-[8px] text-[11px] font-medium transition-all shadow-sm">Reject</button>
                        </>
                    )}
                    {tx.status === 'verified' && (userRole === 'manajer' || userRole === 'superadmin') && (
                        <>
                            <button onClick={() => handleAction((tx.id || tx.transactionId), 'approve', true)} className="px-3 py-1.5 bg-[#1A7D47] text-white rounded-[8px] text-[11px] hover:bg-[#156a3b] font-medium transition-all shadow-sm">Approve</button>
                            <button onClick={() => handleAction((tx.id || tx.transactionId), 'verify', false)} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-[8px] text-[11px] font-medium transition-all shadow-sm">Reject</button>
                        </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Form Panel */}
      {showInputForm && (
      <div className={`border p-6 space-y-5 h-fit backdrop-blur-md ${cardClass}`}>
        <h3 className={`font-bold text-lg ${titleClass}`}>Catat Transaksi</h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
          
          {formError && (
            <div className="bg-rose-50 text-rose-600 font-medium p-3 rounded-[8px] border border-rose-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span> {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-medium text-slate-600">Tipe Transaksi</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={`w-full px-3 py-2.5 border rounded-[8px] focus:border-[#1A7D47] focus:ring-2 focus:ring-[#1A7D47]/20 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <option value="Pendapatan">Pendapatan (+)</option>
              <option value="Pengeluaran">Pengeluaran (-)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-slate-600">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full px-3 py-2.5 border rounded-[8px] focus:border-[#1A7D47] focus:ring-2 focus:ring-[#1A7D47]/20 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <option value="Kontrak Proyek IT">Kontrak Proyek IT</option>
              <option value="Instalasi Elektrikal">Instalasi Elektrikal</option>
              <option value="Pembangunan / Sipil">Pembangunan / Sipil</option>
              <option value="Gaji &amp; Payroll">Gaji &amp; Payroll</option>
              <option value="Operasional Kantor">Operasional Kantor</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-slate-600">Jumlah (Rupiah)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 15000000" className={`w-full px-3 py-2.5 border rounded-[8px] focus:border-[#1A7D47] focus:ring-2 focus:ring-[#1A7D47]/20 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`} required />
            {type === 'Pengeluaran' && parseFloat(amount) >= 50000000 && userRole === 'finance_staff' && (
              <p className="text-[11px] text-amber-600 font-medium mt-1.5 flex items-center gap-1 bg-amber-50 p-2 rounded-[6px]">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Pengeluaran &ge; Rp 50jt butuh persetujuan Manajer.</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-slate-600">Deskripsi / Catatan</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Rincian pengeluaran/pendapatan..." className={`w-full px-3 py-2.5 border rounded-[8px] focus:border-[#1A7D47] focus:ring-2 focus:ring-[#1A7D47]/20 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`} required></textarea>
          </div>

          <button type="submit" disabled={submitting} className={`w-full py-2.5 rounded-[8px] font-medium transition-all shadow-sm ${
            isDark 
              ? 'bg-[#1A7D47] text-white hover:bg-[#156a3b]' 
              : 'bg-[#1A7D47] text-white hover:bg-[#156a3b]'
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
// ðŸ’µ PAYROLL COMPONENT (LIGHT/DARK)
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
  const [period, setPeriod] = useState('2026-07');

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-[#18181b]/50 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  const fetchData = async () => {
    try {
      const [empRes, payRes] = await Promise.all([api.get('/employees'), api.get('/payroll')]);
      setEmployees(empRes.data);
      setPayrolls(payRes.data);
    } catch (err: any) {
      console.error('Gagal memuat data payroll', err);
      showToast(err.response?.data?.message || 'Gagal memuat data payroll dari server.', 'error');
      setEmployees([]);
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string, type: string) => { console.log(`[${type}] ${msg}`); alert(msg); };

  const handleProcessPayroll = async () => {
    if (!period) return;
    setProcessing(true);
    try {
      const processed = (Array.isArray(employees) ? employees : []).map(emp => {
        const base = emp.baseSalary || 7500000;
        const allowance = emp.allowance || 1500000;
        const kpiPct = (emp.kpiAchieved || 90) / 100.0;
        const bonus = base * 0.15 * kpiPct;
        const gross = base + allowance + bonus;
        const tax = gross * 0.05;
        const bpjs = gross * 0.02;
        const net = gross - tax - bpjs;
        return {
          payrollId: `SL-${emp.id || emp.employeeId || Date.now() % 1000}-${Date.now() % 100000}`,
          employeeEmail: emp.email || `${(emp.name || emp.fullName || '').toLowerCase().replace(/\s/g, '.')}@exprogio.com`,
          employeeName: emp.fullName || emp.name || 'Unknown Employee',
          division: emp.division || emp.department || 'General',
          period,
          baseSalary: base,
          allowance,
          bonus,
          tax,
          bpjs,
          netSalary: net,
          releaseDate: new Date().toISOString().split('T')[0],
          status: 'paid'
        };
      });

      // Simpan setiap record payroll ke database via API
      await Promise.all(processed.map(p => api.post('/payroll', p)));
      showToast(`Gaji ${processed.length} karyawan periode ${period} berhasil diproses dan tersimpan ke database!`, 'success');
      fetchData();
    } catch (err: any) {
      console.error('Gagal memproses payroll', err);
      showToast(err.response?.data?.message || 'Gagal memproses payroll. Pastikan backend berjalan dan coba lagi.', 'error');
    } finally {
      setProcessing(false);
    }
  };
const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  if (loading) return <SkeletonLoader isDark={isDark} rows={4} />;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header and calculation trigger panel */}
      <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border p-6 rounded-xl backdrop-blur-md ${cardClass}`}>
        <div>
          <h3 className={`font-extrabold text-xs ${titleClass}`}>
            {(userRole === 'admin_keuangan' || userRole === 'superadmin') ? 'Pemrosesan Payroll Bulanan' : 'Laporan Eksekutif Payroll'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 mb-3">
            {userRole === 'admin_keuangan' 
              ? 'Lakukan kalkulasi slip gaji serentak menggunakan parameter pencapaian KPI bulanan.'
              : 'Tinjauan rekapitulasi data penggajian karyawan, capaian KPI, dan beban anggaran bulan ini.'}
            
          </p>
          <button onClick={() => window.print()} className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all print:hidden ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm'}`}>
            <span className="material-symbols-outlined text-[14px]">print</span> Cetak Rekap Gaji
          </button>
        </div>
        {(userRole === 'admin_keuangan' || userRole === 'superadmin') && (
          <div className="flex items-center gap-2 text-xs">
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className={`p-2.5 border rounded-lg focus:border-emerald-500 outline-none max-w-[150px] ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} />
            <button onClick={handleProcessPayroll} disabled={processing} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-lg">
              {processing ? 'Memproses...' : 'Kalkulasi Gaji'}
            </button>
          </div>
        )}
      </div>

      {/* Directory of Employees */}
      <div className={`border rounded-[16px] p-6 space-y-4 backdrop-blur-md ${cardClass}`}>
        <h4 className={`font-extrabold text-xs ${titleClass}`}>Direktori Gaji Karyawan Aktif</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b tracking-wider text-[9px] font-bold uppercase ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-zinc-600 border-zinc-200'}`}>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Nama</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Divisi</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Gaji Pokok</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Tunjangan</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">KPI Capaian</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {(Array.isArray(employees) ? employees : []).map(emp => (
                <tr key={emp.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className="p-3.5">
                    <span className={`block font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{emp.name || emp.fullName || 'Unknown Employee'}</span>
                    <span className="text-[10px] text-zinc-500">{emp.email || `${(emp.name || '').toLowerCase().replace(/\s/g, '.')}@exprogio.com`}</span>
                  </td>
                  <td className="p-3.5">{emp.department || emp.position || emp.division || 'General'}</td>
                  <td className="p-3.5 font-semibold text-zinc-400">{formatRupiah(emp.baseSalary || 7500000)}</td>
                  <td className="p-3.5 text-zinc-400">{formatRupiah(emp.allowance || 1500000)}</td>
                  <td className="p-3.5 font-bold text-emerald-400">{emp.kpiAchieved || 90}% / {emp.kpiTarget || 100}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslips Table */}
      <div className={`border rounded-[16px] p-6 space-y-4 backdrop-blur-md ${cardClass}`}>
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
              <tr className={`border-b tracking-wider text-[9px] font-bold uppercase ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-zinc-600 border-zinc-200'}`}>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">ID Slip</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Karyawan</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Periode</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Gaji Pokok</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Bonus KPI</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Gaji Bersih</th>
                <th className="p-3.5 bg-[#f8fafc] dark:bg-zinc-950/40">Status</th>
                <th className="p-3.5 text-right bg-[#f8fafc] dark:bg-zinc-950/40">Laporan</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {(Array.isArray(payrolls) ? payrolls : []).map(pay => (
                <tr key={pay.payrollId} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/20 text-zinc-300' : 'hover:bg-zinc-100/50 text-zinc-700'}`}>
                  <td className="p-3.5 font-mono font-bold text-zinc-400">{pay.payrollId}</td>
                  <td className="p-3.5">
                    <span className={`block font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{pay.employeeName}</span>
                    <span className="text-[10px] text-zinc-500">{pay.employeeEmail}</span>
                  </td>
                  <td className="p-3.5 font-bold">{pay.period}</td>
                  <td className="p-3.5">{formatRupiah(pay.baseSalary)}</td>
                  <td className="p-3.5 text-emerald-500 font-bold">{formatRupiah(pay.bonus)}</td>
                  <td className="p-3.5 font-black text-[#1A7D47]">{formatRupiah(pay.netSalary)}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-full uppercase tracking-wider shadow-sm">
                      {pay.status === 'paid' ? 'Paid' : pay.status || 'Paid'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button 
                      onClick={() => printPayslipPDF(pay)} 
                      className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850' 
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">print</span> Cetak Slip (PDF)
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
// ðŸ‘¥ USER APPROVALS COMPONENT (LIGHT/DARK)
// ==========================================


// ==========================================
// ðŸ›¡ï¸ AUDIT TRAIL LOGS COMPONENT (LIGHT/DARK)
// ==========================================


// ==========================================
// ðŸ¤– GIO AI COGNITIVE HUD (INDUSTRY 5.0)
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
    <div className="fixed bottom-6 right-6 z-40 font-sans shadow-2xl rounded-full opacity-50 hover:opacity-100 transition-opacity">
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
            {(Array.isArray(messages) ? messages : []).map((msg, i) => (
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
              {(Array.isArray(questions) ? questions : []).map((item, idx) => (
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
// ðŸ’¸ MANAJEMEN PIUTANG (ACCOUNTS RECEIVABLE)
// ==========================================
const AccountsReceivable: React.FC<{ theme: ThemeMode, userRole?: string | null }> = ({ theme, userRole }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-[#f8fafc] text-zinc-600 border-zinc-200';
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

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
const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0);


  const getAgingCategory = (dueDate: string, status: string) => {
    if (status === 'Lunas') return { label: 'Lunas', color: 'text-emerald-700 bg-emerald-100' };
    if (status === 'Menunggu') return { label: 'Menunggu', color: 'text-orange-700 bg-orange-100' };
    const diffTime = new Date().getTime() - new Date(dueDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { label: 'Belum Jatuh Tempo', color: 'text-blue-700 bg-blue-100' };
    if (diffDays <= 30) return { label: 'Jatuh Tempo', color: 'text-red-700 bg-red-100 font-bold' };
    return { label: `Jatuh Tempo (${diffDays} Hari)`, color: 'text-white bg-red-600 font-black' };
  };

  const showToast = (msg: string, type: string) => { console.log(`[${type}] ${msg}`); alert(msg); };

  const handleReminder = async (invoiceId: string, client: string) => {
    try {
      await api.post(`/invoices/${invoiceId}/reminder`);
      showToast(`Email Surat Peringatan (SP) Penagihan berhasil dikirim ke klien: ${client}`, 'success');
    } catch (err) {
      console.error('Gagal kirim penagihan', err);
      showToast(`Gagal mengirim penagihan ke ${client}. Silakan coba lagi.`, 'error');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.patch(`/invoices/${id}/mark-paid`);
      setSelectedInvoice(null);
      const res = await api.get('/invoices');
      setInvoices(res.data);
      showToast(`Faktur ${id} berhasil dilunasi!`, 'success');
    } catch (err) {
      console.error('Failed to mark invoice as paid', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className={`text-2xl font-black truncate tracking-tight ${titleClass}`}>Aging Schedule &amp; Piutang (AR)</h2>
          <p className={`text-sm mt-1 ${textClass}`}>Pemantauan umur piutang faktur (Invoice) dan penagihan klien.</p>
        </div>
        <button onClick={() => generateReceivablesPDF(invoices)} className="px-5 py-2.5 bg-[#1A7D47] text-white hover:bg-[#146337] rounded-[8px] font-medium text-[14px] flex items-center gap-2 transition-all duration-200">
          <span className="material-symbols-outlined text-[16px]">print</span>
          Cetak Daftar Piutang
        </button>
      </div>

      <div className={`border rounded-[16px] p-6 ${cardClass}`}>
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
                {(Array.isArray(invoices) ? invoices : []).map((inv, i) => {
                  const aging = getAgingCategory(inv.due_date, inv.status);
                  const isOverdue = new Date() > new Date(inv.due_date) && inv.status !== 'Lunas';
                  return (
                    <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                      <td className={`p-4 font-medium ${titleClass}`}>{inv.invoice_number}</td>
                      <td className={`p-4 ${textClass}`}>{inv.client}</td>
                      <td className={`p-4 ${textClass}`}>{inv.due_date}</td>
                      <td className={`p-4 font-bold ${titleClass}`}>{formatCurrency(inv.amount)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${aging.color}`}>
                          {aging.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => setSelectedInvoice({
                              id: inv.invoice_number,
                              vendor: inv.client,
                              amount: inv.amount,
                              dueDate: inv.due_date,
                              status: inv.status
                            })}
                            className={`px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-[8px] text-[12px] font-medium transition-colors ${isDark ? 'text-zinc-300 border-zinc-700 hover:bg-zinc-800' : 'text-slate-700'}`}
                          >
                            Lihat Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in transition-all duration-300">
          <div className={`w-full max-w-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden ${isDark ? 'bg-[#18181b] border border-zinc-800' : 'bg-white'}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h3 className={`font-semibold text-[18px] ${titleClass}`}>Detail Invoice Piutang</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-zinc-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">cancel</span>
              </button>
            </div>
            <div className={`p-6 space-y-6 ${textClass}`}>
              <div>
                <p className="text-[12px] uppercase font-medium tracking-wider">Nama Klien</p>
                <p className={`font-semibold text-lg mt-1 ${titleClass}`}>{selectedInvoice.vendor}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[12px] uppercase font-medium tracking-wider">Nomor Invoice</p>
                  <p className="font-medium mt-1">{selectedInvoice.id}</p>
                </div>
                <div>
                  <p className="text-[12px] uppercase font-medium tracking-wider">Status / Jatuh Tempo</p>
                  <p className="font-semibold text-red-600 mt-1">{selectedInvoice.dueDate}</p>
                </div>
              </div>
              <div>
                <p className="text-[12px] uppercase font-medium tracking-wider">Nominal Tagihan</p>
                <p className="font-bold text-[24px] text-red-600 mt-1">{formatCurrency(selectedInvoice.amount)}</p>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-4 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-[#f8fafc]'}`}>
               <button onClick={() => setSelectedInvoice(null)} className="px-5 py-2.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium rounded-[8px] transition-all duration-200 text-[14px]">
                 Tutup
               </button>
               {selectedInvoice.status !== 'Lunas' && userRole !== 'finance_staff' && (
                 <button onClick={() => handleMarkPaid(selectedInvoice.id)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-[8px] transition-all duration-200 text-[14px]">
                   Tandai Lunas
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ðŸ­ MANAJEMEN UTANG VENDOR (ACCOUNTS PAYABLE)
// ==========================================
const AccountsPayable: React.FC<{ theme: ThemeMode, userRole?: string | null }> = ({ theme, userRole }) => {
  const [payables, setPayables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-[#f8fafc] text-zinc-600 border-zinc-200';
  const [selectedPayable, setSelectedPayable] = useState<any | null>(null);

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

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0);

  const getAgingCategory = (dueDate: string, status: string) => {
    if (status === 'Lunas') return { label: 'Lunas', color: 'text-emerald-700 bg-emerald-100' };
    if (status === 'Menunggu Pembayaran') return { label: 'Menunggu', color: 'text-orange-700 bg-orange-100' };
    const diffTime = new Date().getTime() - new Date(dueDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { label: 'Aman', color: 'text-blue-700 bg-blue-100' };
    if (diffDays <= 15) return { label: `Jatuh Tempo`, color: 'text-red-700 bg-red-100 font-bold' };
    return { label: `Jatuh Tempo (${diffDays} Hari)`, color: 'text-white bg-red-600 font-black' };
  };

  const showToast = (msg: string, type: string) => { console.log(`[${type}] ${msg}`); alert(msg); };

  const handlePayment = async (vendorInvoiceId: number, vendorName: string) => {
    try {
      await api.put(`/payables/${vendorInvoiceId}/pay`);
      setSelectedPayable(null);
      // Refresh data
      const res = await api.get('/payables');
      setPayables(res.data);
      showToast(`Tagihan kepada ${vendorName} berhasil dilunasi!`, 'success');
    } catch (err) {
      console.error('Gagal melunasi tagihan vendor', err);
      showToast('Gagal memproses pembayaran. Silakan coba lagi.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className={`text-2xl font-black truncate tracking-tight ${titleClass}`}>Utang &amp; Tagihan Vendor (AP)</h2>
          <p className={`text-sm mt-1 ${textClass}`}>Pemantauan kewajiban pembayaran material proyek dan supplier.</p>
        </div>
        <button onClick={() => generatePayablesPDF(payables)} className="px-5 py-2.5 bg-[#1A7D47] text-white hover:bg-[#146337] rounded-[8px] font-medium text-[14px] flex items-center gap-2 transition-all duration-200">
          <span className="material-symbols-outlined text-[16px]">print</span>
          Cetak Daftar Utang
        </button>
      </div>

      <div className={`border rounded-[16px] p-6 ${cardClass}`}>
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
                {(Array.isArray(payables) ? payables : []).map((pay, i) => {
                  const aging = getAgingCategory(pay.due_date, pay.status);
                  const isOverdue = new Date() > new Date(pay.due_date) && pay.status !== 'Lunas';
                  return (
                    <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                      <td className={`p-4 font-medium ${titleClass}`}>{pay.invoice_number}</td>
                      <td className={`p-4 ${textClass}`}>{pay.vendor}</td>
                      <td className={`p-4 ${textClass}`}>{pay.due_date}</td>
                      <td className={`p-4 font-bold ${titleClass}`}>{formatCurrency(pay.amount)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${aging.color}`}>
                          {aging.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => setSelectedPayable({
                              id: pay.id,
                              invoiceNumber: pay.invoice_number,
                              vendor: pay.vendor,
                              amount: pay.amount,
                              dueDate: pay.due_date,
                              status: pay.status
                            })}
                            className={`px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-[8px] text-[12px] font-medium transition-colors ${isDark ? 'text-zinc-300 border-zinc-700 hover:bg-zinc-800' : 'text-slate-700'}`}
                          >
                            Lihat Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in transition-all duration-300">
          <div className={`w-full max-w-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden ${isDark ? 'bg-[#18181b] border border-zinc-800' : 'bg-white'}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h3 className={`font-semibold text-[18px] ${titleClass}`}>Detail Utang Vendor</h3>
              <button onClick={() => setSelectedPayable(null)} className="text-zinc-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">cancel</span>
              </button>
            </div>
            <div className={`p-6 space-y-6 ${textClass}`}>
              <div>
                <p className="text-[12px] uppercase font-medium tracking-wider">Nama Supplier / Vendor</p>
                <p className={`font-semibold text-lg mt-1 ${titleClass}`}>{selectedPayable.vendor}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[12px] uppercase font-medium tracking-wider">No. Referensi</p>
                  <p className="font-medium mt-1">{selectedPayable.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[12px] uppercase font-medium tracking-wider">Status / Jatuh Tempo</p>
                  <p className="font-semibold text-red-600 mt-1">{selectedPayable.dueDate}</p>
                </div>
              </div>
              <div>
                <p className="text-[12px] uppercase font-medium tracking-wider">Kewajiban Pembayaran</p>
                <p className="font-bold text-[24px] text-red-600 mt-1">{formatCurrency(selectedPayable.amount)}</p>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-4 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-[#f8fafc]'}`}>
               <button onClick={() => setSelectedPayable(null)} className="px-5 py-2.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium rounded-[8px] transition-all duration-200 text-[14px]">
                 Tutup
               </button>
               {selectedPayable.status !== 'Lunas' && userRole !== 'finance_staff' && (
                 <button onClick={() => handlePayment(selectedPayable.id, selectedPayable.vendor)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-[8px] transition-all duration-200 text-[14px]">
                   Tandai Lunas
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// âš–ï¸ KALKULATOR PAJAK OTOMATIS (TAX ENGINE)
// ==========================================
const TaxDashboard: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm';
  const textClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const titleClass = isDark ? 'text-white' : 'text-zinc-900';
  const tableHeaderClass = isDark ? 'bg-zinc-950/40 text-zinc-500 border-zinc-800' : 'bg-[#f8fafc] text-zinc-600 border-zinc-200';

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const [invRes, payRes] = await Promise.all([
          api.get('/invoices'),
          api.get('/payroll') // Admin fetches all payrolls
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

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-2xl font-black truncate tracking-tight ${titleClass}`}>Kalkulator Pajak (Tax Engine)</h2>
        <p className={`text-sm mt-1 ${textClass}`}>Estimasi Kewajiban PPN 11% &amp; Pemotongan PPh 21 Karyawan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PPN SECTION */}
        <div className={`border rounded-[16px] p-6 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-zinc-500/20">
            <h4 className={`font-extrabold text-[14px] uppercase tracking-wider ${titleClass}`}>PPN Keluaran (11%)</h4>
            <span className="material-symbols-outlined text-blue-600 text-[20px]">account_balance</span>
          </div>
          {loading ? <p className="text-zinc-500 animate-pulse">Memuat...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className={tableHeaderClass}>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">No. Invoice</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Dasar Pengenaan Pajak (DPP)</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">PPN 11%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-500/20">
                  {(Array.isArray(invoices) ? invoices : []).map((inv, i) => {
                    const dpp = inv.amount;
                    const ppn = dpp * 0.11;
                    return (
                      <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                        <td className={`p-4 font-medium ${titleClass}`}>{inv.invoice_number}</td>
                        <td className={`p-4 text-right ${textClass}`}>{formatCurrency(dpp)}</td>
                        <td className={`p-4 text-right font-bold text-blue-600`}>{formatCurrency(ppn)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PPh 21 SECTION */}
        <div className={`border rounded-[16px] p-6 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-zinc-500/20">
            <h4 className={`font-extrabold text-[14px] uppercase tracking-wider ${titleClass}`}>Pemotongan PPh 21</h4>
            <span className="material-symbols-outlined text-orange-600 text-[20px]">receipt_long</span>
          </div>
          {loading ? <p className="text-zinc-500 animate-pulse">Memuat...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className={tableHeaderClass}>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Karyawan</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Gaji Kotor</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Potongan PPh 21</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-500/20">
                  {(Array.isArray(payrolls) ? payrolls : []).map((pay, i) => {
                    const gross = pay.baseSalary + pay.allowance + pay.bonus;
                    return (
                      <tr key={i} className={`group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition-colors`}>
                        <td className={`p-4 font-medium ${titleClass}`}>{pay.employeeName}</td>
                        <td className={`p-4 text-right ${textClass}`}>{formatCurrency(gross)}</td>
                        <td className={`p-4 text-right font-bold text-orange-600`}>{formatCurrency(pay.tax)}</td>
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
// ðŸ“Š SYSTEM MANAJEMEN ANGGARAN (BUDGETING)

// ==========================================
// ðŸ“ˆ PEMBUAT LAPORAN KEUANGAN (GL / LABA RUGI)
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
      } catch (err: any) {
        console.error('Gagal memuat laporan laba rugi', err);
        setReport({ revenue: 0, expenses: 0, netProfit: 0, ebitda: 0, assetGrowth: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0);

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
          <h2 className={`text-2xl font-black truncate tracking-tight ${titleClass}`}>Dashboard Keuangan</h2>
          <p className={`text-sm mt-1 ${textClass}`}>Ringkasan Eksekutif & Tindak Lanjut</p>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 animate-pulse text-center py-12">Mengagregasi Data Keuangan...</p>
      ) : report ? (
        <>
          {/* Dashboard Summary View (Web Only) */}
          <div className="print:hidden space-y-6">
             {/* Cards for Revenue, Expense, Profit, EBITDA, Asset Growth */}
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                 <div className={`p-6 rounded-[16px] border ${cardClass} shadow-sm hover:border-emerald-500/50 transition-colors`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${textClass}`}>Total Pendapatan</p>
                         <span className="material-symbols-outlined text-emerald-500 text-lg">arrow_upward</span>
                     </div>
                     <p className="text-2xl font-black truncate text-emerald-500 mt-2" title={formatCurrency(report?.revenue || 0)}>{formatCurrencyCompact(report?.revenue || 0)}</p>
                 </div>
                 <div className={`p-6 rounded-[16px] border ${cardClass} shadow-sm hover:border-red-500/50 transition-colors`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${textClass}`}>Total Pengeluaran</p>
                         <span className="material-symbols-outlined text-red-500 text-lg">arrow_downward</span>
                     </div>
                     <p className="text-2xl font-black truncate text-red-500 mt-2" title={formatCurrency(report?.expenses || 0)}>{formatCurrencyCompact(report?.expenses || 0)}</p>
                 </div>
                 <div className={`p-6 rounded-[16px] border ${cardClass} shadow-sm hover:border-blue-500/50 transition-colors`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${textClass}`}>EBITDA</p>
                         <span className="material-symbols-outlined text-blue-500 text-lg">insights</span>
                     </div>
                     <p className="text-2xl font-black truncate text-blue-500 mt-2" title={formatCurrency(report?.ebitda || 0)}>{formatCurrencyCompact(report?.ebitda || 0)}</p>
                 </div>
                 <div className={`p-6 rounded-[16px] border ${cardClass} shadow-sm hover:border-emerald-500/50 transition-colors`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${textClass}`}>Pertumbuhan Aset</p>
                         <span className="material-symbols-outlined text-emerald-500 text-lg">trending_up</span>
                     </div>
                     <p className="text-2xl font-black truncate text-emerald-500 mt-2">{report?.assetGrowth || 0}%</p>
                 </div>
                 <div className={`p-6 rounded-[16px] border shadow-sm bg-gradient-to-br col-span-2 lg:col-span-1 ${isDark ? 'from-emerald-900/20 to-transparent border-emerald-900/50' : 'from-emerald-50 to-transparent border-emerald-200'}`}>
                     <div className="flex justify-between items-start">
                         <p className={`text-[10px] tracking-wider uppercase font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Laba Bersih</p>
                         <span className="material-symbols-outlined text-emerald-500 text-lg">account_balance</span>
                     </div>
                     <p className={`text-2xl font-black truncate ${isDark ? 'text-emerald-400' : 'text-emerald-700'} mt-2`} title={formatCurrency(report?.netProfit || 0)}>{formatCurrencyCompact(report?.netProfit || 0)}</p>
                 </div>
             </div>

             {/* Actionable List */}
             <div className={`border rounded-[16px] ${cardClass} overflow-hidden shadow-sm`}>
                <div className={`p-4 border-b ${borderClass} flex justify-between items-center ${isDark ? 'bg-zinc-900/50' : 'bg-[#f8fafc]'}`}>
                   <h3 className={`text-sm font-extrabold tracking-wide uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>Tindak Lanjut & Pelaporan</h3>
                </div>
                <div className="p-4 space-y-3">
                   <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[16px] border ${borderClass} hover:bg-black/5 transition-colors gap-4`}>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">analytics</span>
                         </div>
                         <div>
                             <p className={`font-black text-sm ${titleClass}`}>Laba Bersih Bulan Ini</p>
                             <p className={`text-xs mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                 {formatCurrency(report?.netProfit)} <span className="text-zinc-400 mx-1">â€¢</span> 
                                 {userRole === 'superadmin' || userRole === 'manajer' 
                                   ? (accApproved ? 'Disetujui oleh Direksi' : 'Menunggu Persetujuan Anda') 
                                   : (accApproved ? 'Disetujui oleh Direksi' : (accRequested ? 'Menunggu Persetujuan Direksi' : 'Membutuhkan ACC Direksi'))}
                             </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         {userRole === 'superadmin' || userRole === 'manajer' ? (
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
                         <button onClick={() => generateReportPDF(report)} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-2">
                             <span className="material-symbols-outlined text-[16px]">print</span> Cetak Dokumen
                         </button>
                      </div>
                   </div>
                   
                   <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-[16px] border ${borderClass} hover:bg-black/5 transition-colors gap-4`}>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">receipt_long</span>
                         </div>
                         <div>
                             <p className={`font-black text-sm ${titleClass}`}>Laporan Arus Kas Keluar</p>
                             <p className={`text-xs mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                 Beban Operasional IT <span className="text-zinc-400 mx-1">â€¢</span> {formatCurrency(350000000)}
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
                  {Object.entries(report?.revenueByCategory || {}).map(([cat, val]: any) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span>{cat}</span>
                      <span className="font-medium">{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-black border-t mt-3 pt-2 border-black">
                  <span>Total Pendapatan</span>
                  <span className="text-black">{formatCurrency(report?.totalRevenue)}</span>
                </div>
              </div>

              {/* PENGELUARAN */}
              <div className="mb-8">
                <h3 className="text-sm font-extrabold uppercase border-b border-black pb-2 mb-3">B. Beban / Pengeluaran (Expenses)</h3>
                <div className="space-y-2 pl-4">
                  {Object.entries(report?.expenseByCategory || {}).map(([cat, val]: any) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span>{cat}</span>
                      <span className="font-medium">{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-black border-t mt-3 pt-2 border-black">
                  <span>Total Beban Pokok &amp; Operasional</span>
                  <span className="text-black">({formatCurrency(report?.totalExpense)})</span>
                </div>
              </div>

              {/* LABA BERSIH */}
              <div className="flex justify-between items-center text-sm font-black border-t-2 mt-6 pt-4 border-black">
                <span className="uppercase tracking-wider">Laba / (Rugi) Bersih</span>
                <span className="text-xl">
                  {formatCurrency(report?.netProfit)}
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
// ðŸš€ MAIN APPLICATION ROOT (WITH ROUTING & SYSTEM GUARDS)
// ==========================================
const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'laravel' | 'loading'>('loading');
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
    const checkAuth = async () => {
      try {
        const res = await api.get('/api/user', { baseURL: '' });
        if (res.data) {
          setAuthenticated(true);
          setUserRole(res.data.role);
          setUserName(res.data.name);
          setAuthMode('laravel');
        }
      } catch (err) {
        setAuthenticated(false);
        setUserRole(null);
        setUserName('');
        setAuthMode('laravel');
      }
    };
    checkAuth();
  }, []);

  const handleAuthSuccess = (role: UserRole, name: string) => {
    setAuthenticated(true);
    setUserRole(role);
    setUserName(name);
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout', null, { baseURL: '' });
    } catch(e) {}
    setAuthenticated(false);
    setUserRole(null);
    setUserName('');
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
    return allowedRoles.includes((userRole as UserRole)) ? <>{children}</> : <Navigate to="/403" />;
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
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-sm text-xs ring-1 ring-emerald-500/20">E</div>
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-lg text-lg ring-2 ring-emerald-500/20">E</div>
              <div className="hidden md:block">
                <span className="text-[8px] text-emerald-600 tracking-widest font-bold uppercase mt-1 block">FINCORP SUITE</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border text-xs ${isDark ? 'bg-zinc-950/60 border-zinc-850' : 'bg-white border-zinc-200 shadow-sm'}`}>
              <p className={`font-extrabold text-[11px] truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{(userName || 'User')}</p>
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
                  {['superadmin', 'admin_keuangan', 'manajer', 'finance_staff'].includes((userRole as UserRole)) && (
                    <Link to="/transactions" className={getLinkClass('/transactions')}>
                      <span className="material-symbols-outlined text-base">receipt_long</span> Jurnal Transaksi
                    </Link>
                  )}
                  
                  {['superadmin', 'admin_keuangan', 'manajer'].includes((userRole as UserRole)) && (
                      <Link to="/payroll" className={getLinkClass('/payroll')}>
                        <span className="material-symbols-outlined text-base">payments</span> Payroll Karyawan
                      </Link>
                  )}
                  
                  {userRole === 'superadmin' && (
                    <Link to="/user-approvals" className={getLinkClass('/user-approvals')}>
                      <span className="material-symbols-outlined text-base">manage_accounts</span> Kelola User & Sistem
                    </Link>
                  )}

                  {['superadmin', 'admin_keuangan', 'manajer'].includes((userRole as UserRole)) && (
                      <Link to="/budgets" className={getLinkClass('/budgets')}>
                        <span className="material-symbols-outlined text-base">account_balance_wallet</span> Manajemen Anggaran
                      </Link>
                  )}

                  {['superadmin', 'admin_keuangan', 'manajer'].includes((userRole as UserRole)) && (
                      <Link to="/reports" className={getLinkClass('/reports')}>
                        <span className="material-symbols-outlined text-base">query_stats</span> Laporan Keuangan
                      </Link>
                  )}

                  {['superadmin', 'admin_keuangan', 'manajer', 'finance_staff'].includes((userRole as UserRole)) && (
                      <>
                      <Link to="/receivables" className={getLinkClass('/receivables')}>
                        <span className="material-symbols-outlined text-base">request_quote</span> Manajemen Piutang
                      </Link>
                      <Link to="/payables" className={getLinkClass('/payables')}>
                        <span className="material-symbols-outlined text-base">local_shipping</span> Manajemen Utang (AP)
                      </Link>
                      </>
                  )}

                  {['superadmin', 'admin_keuangan', 'manajer'].includes((userRole as UserRole)) && (
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
          <div className="hidden print:flex items-end justify-between border-b-4 border-emerald-700 pb-4 mb-8 w-full">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center font-black text-white shadow-lg text-3xl print:border-2 print:border-emerald-700">E</div>
              <div className="text-left text-black">
                <h1 className="text-2xl font-black truncate uppercase tracking-widest text-emerald-800 leading-none">PT Expro Gio Nusantara Tbk</h1>
                <p className="text-xs font-bold tracking-widest text-emerald-600 mt-1 uppercase">FinCorp Enterprise Suite - Industry 5.0</p>
              </div>
            </div>
            <div className="text-right text-black">
              <p className="text-[10px] font-bold">Gedung Expro Tower Lt. 12</p>
              <p className="text-[10px]">Jl. Jenderal Sudirman Kav. 52-53</p>
              <p className="text-[10px]">Jakarta Selatan, 12190, Indonesia</p>
              <p className="text-[10px] mt-1 text-emerald-700 font-bold">www.exprogionusantara.com</p>
            </div>
          </div>

          {/* Corporate Intelligence Ticker */}
          <div className={`flex items-center gap-3 p-3 px-5 rounded-xl border shadow-sm overflow-hidden whitespace-nowrap print:hidden transition-all ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-[#f8fafc] border-zinc-200 text-zinc-600'
          }`}>
            <span className={`flex items-center gap-1.5 font-semibold text-sm ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>
              <span className="material-symbols-outlined text-base">campaign</span> Pembaruan Terkini
            </span>
            <span className="text-zinc-400 mx-2">|</span>
            <div className="flex-grow overflow-hidden relative flex items-center text-sm">
              <div className="animate-marquee inline-block flex items-center gap-8">
                <span>Nilai Tukar USD/IDR 15.420 <span className="text-emerald-500 font-medium">▲ +0.12%</span></span>
                <span>Proyeksi Pendapatan Q3 <span className="text-emerald-500 font-medium">▲ +14.2%</span></span>
                <span>Sistem Kelistrikan Jakarta: <span className="text-emerald-500 font-medium">Optimal</span></span>
                <span>Indeks Kepuasan Karyawan <span className="text-emerald-500 font-medium">92.4%</span></span>
                <span>Nilai Tukar USD/IDR 15.420 <span className="text-emerald-500 font-medium">▲ +0.12%</span></span>
                <span>Proyeksi Pendapatan Q3 <span className="text-emerald-500 font-medium">▲ +14.2%</span></span>
              </div>
            </div>
          </div>

          {/* Top Bar Header */}
          <div className={`flex flex-col md:flex-row md:justify-between md:items-center border-b pb-5 gap-4 print:hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>PT Expro Gio Nusantara</h2>
              <span className={`text-sm mt-0.5 block ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Sistem Informasi Perusahaan Terpadu</span>
            </div>
            
            {/* Live Indicators */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
              <span className={`px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border ${isDark ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Sistem Terhubung
              </span>
              <span className={`px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border ${isDark ? 'bg-blue-950/30 border-blue-900/50 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Autentikasi Aktif
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
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={
            !authenticated ? <LoginGateway theme={theme} /> : <Navigate to="/dashboard" />
          } />
          <Route path="/login/manajemen" element={
            !authenticated ? <GenericLoginForm theme={theme} title="Portal Manajemen" roleGroup={['superadmin','admin_keuangan','manajer']} handleAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" />
          } />
          <Route path="/login/staf" element={
            !authenticated ? <GenericLoginForm theme={theme} title="Portal Staf & Karyawan" roleGroup={['finance_staff','employee']} linkText="Belum punya akun? Daftar sebagai Karyawan &rarr;" linkUrl="/register/employee" handleAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" />
          } />
          <Route path="/login/investor" element={
            !authenticated ? <GenericLoginForm theme={theme} title="Portal Investor" roleGroup={['investor']} linkText="Belum punya akun? Daftar sebagai Investor &rarr;" linkUrl="/register/investor" handleAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" />
          } />
          <Route path="/register/employee" element={
            !authenticated ? <RegisterForm theme={theme} role="employee" /> : <Navigate to="/dashboard" />
          } />
          <Route path="/register/investor" element={
            !authenticated ? <RegisterForm theme={theme} role="investor" /> : <Navigate to="/dashboard" />
          } />
                    <Route path="/dashboard" element={
            authenticated ? (
              <LayoutWrapper>
                <Dashboard theme={theme} userRole={userRole ?? undefined} />
              </LayoutWrapper>
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/transactions" element={
            <GuardedRoute allowedRoles={['superadmin', 'admin_keuangan', 'manajer', 'finance_staff']}>
              <LayoutWrapper>
                <Transactions theme={theme} userRole={userRole ?? undefined} />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="/payroll" element={
            <GuardedRoute allowedRoles={['superadmin', 'admin_keuangan', 'manajer']}>
              <LayoutWrapper>
                <Payroll theme={theme} userRole={userRole ?? undefined} />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="/user-approvals" element={
            <GuardedRoute allowedRoles={['superadmin']}>
              <LayoutWrapper>
                <UserApprovalsPanel />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="/audit-trail" element={
            <GuardedRoute allowedRoles={['superadmin']}>
              <LayoutWrapper>
                <AuditTrailPanel theme={theme} />
              </LayoutWrapper>
            </GuardedRoute>
          } />

          <Route path="/403" element={<AccessDenied />} />
          <Route path="/budgets" element={
            <GuardedRoute allowedRoles={['superadmin', 'admin_keuangan', 'manajer']}>
              <LayoutWrapper>
                <BudgetingDashboard isDark={isDark} />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="/reports" element={
            <GuardedRoute allowedRoles={['superadmin', 'admin_keuangan', 'manajer']}>
              <LayoutWrapper>
                <FinancialReportGenerator theme={theme} userRole={userRole} />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="/receivables" element={
            <GuardedRoute allowedRoles={['superadmin', 'admin_keuangan', 'manajer', 'finance_staff']}>
              <LayoutWrapper>
                <AccountsReceivable theme={theme} userRole={userRole} />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="/payables" element={
            <GuardedRoute allowedRoles={['superadmin', 'admin_keuangan', 'manajer', 'finance_staff']}>
              <LayoutWrapper>
                <AccountsPayable theme={theme} userRole={userRole} />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="/taxes" element={
            <GuardedRoute allowedRoles={['superadmin', 'admin_keuangan', 'manajer']}>
              <LayoutWrapper>
                <TaxDashboard theme={theme} />
              </LayoutWrapper>
            </GuardedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

// ==========================================
// ðŸ›¡ï¸ ACCESS DENIED COMPONENT
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
  const isDark = (localStorage.getItem('theme_mode') as ThemeMode) === 'dark';
  return (
    <App />
  );
}
