import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { EXPRO_LOGO_BASE64 } from "./logoBase64";

export const addDocumentHeader = (doc: jsPDF, title: string) => {
  // Logo
  doc.addImage(EXPRO_LOGO_BASE64, 'PNG', 14, 15, 18, 18);
  
  // Header Text
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text("PT Expro Gio Nusantara Tbk", 40, 23);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("FinCorp Enterprise Suite - Industry 5.0", 40, 29);
  doc.text("Gedung Expro Tower Lt. 12, Jakarta Selatan", 40, 34);

  // Line separator
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(14, 40, 196, 40);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(title, 14, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 62);
};

export const generateDocumentPDF = (title: string, data: any[], columns: string[], fileName: string) => {
  const doc = new jsPDF();
  
  addDocumentHeader(doc, title);

  // Table Data
  const tableData = data.map(item => Object.values(item) as any[]);

  autoTable(doc, {
    startY: 70,
    head: [columns],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen Rahasia Perusahaan`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Return as Blob URL for safer embedding in iframe
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
};

export const generateTransactionJournalPDF = (transactions: any[]) => {
  const doc = new jsPDF();
  
  addDocumentHeader(doc, "Jurnal Kas Finansial");

  // Table Data
  let totalIncome = 0;
  let totalExpense = 0;

  const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  const tableData = transactions.map(t => {
    const isIncome = t.type === 'income' || t.type === 'revenue' || t.category === 'Pemasukan';
    const amount = Number(t.amount);
    
    if (isIncome) totalIncome += amount;
    else totalExpense += amount;

    return [
      t.transactionId || t.id || '-',
      t.transactionDate || t.date || '-',
      (t.category || t.type || '').toUpperCase(),
      t.description || '-',
      formatRupiah(amount),
      (t.status || '').toUpperCase()
    ];
  });

  // Calculate Net
  const netTotal = totalIncome - totalExpense;

  autoTable(doc, {
    startY: 70,
    head: [['ID Transaksi', 'Tanggal', 'Kategori', 'Deskripsi', 'Jumlah', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      4: { halign: 'right' } // Jumlah rata kanan
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  
  doc.text(`Total Pemasukan: ${formatRupiah(totalIncome)}`, 14, finalY);
  doc.text(`Total Pengeluaran: ${formatRupiah(totalExpense)}`, 14, finalY + 7);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Kas Bersih: ${formatRupiah(netTotal)}`, 14, finalY + 15);
  doc.setFont('helvetica', 'normal');

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen Rahasia Perusahaan`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Trigger download
  const dateStr = new Date().toISOString().substring(0, 10);
  doc.save(`Jurnal_Transaksi_${dateStr}.pdf`);
};
export const generatePayslipPDF = (pay: any) => {
  const doc = new jsPDF();
  addDocumentHeader(doc, "Slip Gaji Karyawan");

  const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  // Info Karyawan
  doc.setFontSize(11);
  doc.setTextColor(50);
  // Fallback mappings
  const empName = pay.employeeName || pay.employee || 'Budi Santoso';
  const period = pay.period || '-';
  const status = pay.status || '-';
  const netSalary = Number(pay.netSalary) || Number(pay.amount) || 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text("Nama          : " + empName, 14, 82);
  doc.text("Periode        : " + period, 14, 88);
  doc.text("Status         : " + status, 14, 94);

  // Line separator
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(14, 105, 196, 105);

  // Total Take Home Pay
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text('Take Home Pay (Gaji Bersih)', 14, 115);
  doc.text(formatRupiah(netSalary), 196, 115, { align: 'right' });

  // Footer / Notes
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'italic');
  doc.text('Catatan: Slip gaji ini digenerate secara otomatis oleh sistem FinCorp Enterprise Suite.', 14, 130);
  doc.text('Dokumen ini sah dan tidak memerlukan tanda tangan basah.', 14, 135);

  // Footer page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen Rahasia Karyawan`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Trigger download
  const cleanName = (pay.employeeName || pay.employee || 'Karyawan').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = (pay.period || 'Bulan_Ini').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Slip_Gaji_${cleanName}_${cleanPeriod}.pdf`);
};

export const generateReceivablesPDF = (invoices: any[]) => {
  const doc = new jsPDF();
  addDocumentHeader(doc, "Daftar Piutang (Account Receivables)");

  let totalReceivable = 0;

  const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  const tableData = invoices.map((inv, index) => {
    const amount = Number(inv.amount) || 0;
    totalReceivable += amount;

    return [
      inv.invoice_number || '-',
      inv.client || '-',
      inv.due_date || '-',
      formatRupiah(amount),
      (inv.status || '-').toUpperCase()
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['No. Invoice', 'Klien/Debitur', 'Tanggal Jatuh Tempo', 'Jumlah Piutang', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      3: { halign: 'right' } // Jumlah Piutang rata kanan
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`Total Piutang: ${formatRupiah(totalReceivable)}`, 14, finalY);
  doc.setFont('helvetica', 'normal');

  // Footer page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen Rahasia Perusahaan`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Trigger download
  const dateStr = new Date().toISOString().substring(0, 10);
  doc.save(`Daftar_Piutang_${dateStr}.pdf`);
};

export const generatePayablesPDF = (payables: any[]) => {
  const doc = new jsPDF();
  addDocumentHeader(doc, "Daftar Utang (Account Payables)");

  let totalPayable = 0;

  const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  const tableData = payables.map((inv, index) => {
    const amount = Number(inv.amount) || 0;
    totalPayable += amount;

    return [
      inv.invoice_number || '-',
      inv.vendor || '-',
      inv.due_date || '-',
      formatRupiah(amount),
      (inv.status || '-').toUpperCase()
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['No. Tagihan', 'Klien/Vendor', 'Tanggal Jatuh Tempo', 'Jumlah Utang', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      3: { halign: 'right' } // Jumlah Utang rata kanan
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`Total Utang: ${formatRupiah(totalPayable)}`, 14, finalY);
  doc.setFont('helvetica', 'normal');

  // Footer page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen Rahasia Perusahaan`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Trigger download
  const dateStr = new Date().toISOString().substring(0, 10);
  doc.save(`Daftar_Utang_${dateStr}.pdf`);
};

export const generateReportPDF = (report: any) => {
  const doc = new jsPDF();
  addDocumentHeader(doc, "Laporan Keuangan Konsolidasi (Laba Rugi)");

  const formatRupiah = (val: number) => {
    return 'Rp ' + (Number(val) || 0).toLocaleString('id-ID');
  };

  const revenue = Number(report.revenue) || 0;
  const expenses = Number(report.expenses) || 0;
  const netProfit = Number(report.netProfit) || 0;
  const ebitda = Number(report.ebitda) || 0;
  const assetGrowth = Number(report.assetGrowth) || 0;

  const tableData = [
    ['Pendapatan Bruto (Revenue)', formatRupiah(revenue)],
    ['Total Pengeluaran (Expenses)', formatRupiah(expenses)],
    ['Laba Bersih (Net Profit)', formatRupiah(netProfit)],
    ['EBITDA', formatRupiah(ebitda)],
    ['Pertumbuhan Aset', assetGrowth + '%']
  ];

  autoTable(doc, {
    startY: 70,
    head: [['Deskripsi', 'Nilai']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: {
      1: { halign: 'right' }
    },
    didParseCell: (data) => {
      // Bold the Net Profit row
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Footer page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Halaman ${i} dari ${pageCount} - Dokumen Rahasia Perusahaan`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Trigger download
  const dateStr = new Date().toISOString().substring(0, 10);
  doc.save(`Laporan_Keuangan_${dateStr}.pdf`);
};
