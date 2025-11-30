export function exportToCSV(filename, rows, columns) {
  // Build CSV header
  const header = columns.map((c) => c.label).join(",");
  const csvRows = [header];

  rows.forEach((row) => {
    const values = columns.map((c) => {
      let val = typeof c.key === 'function' ? c.key(row) : row[c.key];
      if (val === undefined || val === null) return "";
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      if (val.indexOf(',') >= 0 || val.indexOf('\n') >= 0) {
        val = `"${val}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob(["\ufeff", csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function exportToExcel(filename, rows, columns, options = {}) {
  const {
    title = 'Báo cáo dữ liệu',
    sheetName = 'Sheet1',
    brandColor = '#2563eb',
    headerBgColor = '#1e40af',
    evenRowColor = '#f9fafb',
    oddRowColor = '#ffffff'
  } = options;

  // Build HTML table with beautiful styling
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Excel.Sheet">
      <meta name="Generator" content="Microsoft Excel 15">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:Print>
                  <x:ValidPrinterInfo/>
                  <x:HorizontalResolution>600</x:HorizontalResolution>
                  <x:VerticalResolution>600</x:VerticalResolution>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        @page {
          margin: 0.75in;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          background-color: #ffffff;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          padding: 20px;
          background: linear-gradient(135deg, ${brandColor} 0%, ${headerBgColor} 100%);
          color: white;
          border-radius: 8px;
        }
        
        .report-header h1 {
          margin: 0;
          font-size: 24pt;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .report-header .subtitle {
          margin-top: 8px;
          font-size: 11pt;
          opacity: 0.95;
          font-weight: 400;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          background-color: white;
        }
        
        .data-table thead {
          background: linear-gradient(to bottom, ${headerBgColor} 0%, ${brandColor} 100%);
          color: white;
        }
        
        .data-table thead th {
          padding: 14px 12px;
          text-align: left;
          font-weight: 700;
          font-size: 11pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255,255,255,0.2);
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        
        .data-table tbody tr {
          transition: background-color 0.2s;
        }
        
        .data-table tbody tr:nth-child(even) {
          background-color: ${evenRowColor};
        }
        
        .data-table tbody tr:nth-child(odd) {
          background-color: ${oddRowColor};
        }
        
        .data-table tbody tr:hover {
          background-color: #e0f2fe;
        }
        
        .data-table tbody td {
          padding: 12px;
          border: 1px solid #e5e7eb;
          font-size: 10pt;
          color: #374151;
        }
        
        .data-table tbody td:first-child {
          font-weight: 600;
          color: ${brandColor};
        }
        
        .footer {
          margin-top: 25px;
          padding: 15px;
          text-align: center;
          font-size: 9pt;
          color: #6b7280;
          border-top: 2px solid ${brandColor};
          background-color: #f9fafb;
        }
        
        .stats-row {
          background-color: #fef3c7 !important;
          font-weight: 700;
        }
        
        .stats-row td {
          border-top: 2px solid ${brandColor} !important;
          color: #92400e !important;
        }
        
        /* Number formatting */
        .number {
          text-align: right;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }
        
        /* Status badges */
        .status-active {
          color: #059669;
          font-weight: 600;
        }
        
        .status-inactive {
          color: #dc2626;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${title}</h1>
        <div class="subtitle">Ngày xuất: ${new Date().toLocaleDateString('vi-VN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            ${columns.map(c => `<th>${c.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  // Add data rows
  rows.forEach((row, index) => {
    html += '<tr>';
    columns.forEach(col => {
      let val = typeof col.key === 'function' ? col.key(row) : row[col.key];
      if (val === undefined || val === null) val = "";
      if (typeof val === 'object') val = JSON.stringify(val);
      
      // Apply special formatting
      let className = '';
      if (typeof val === 'number' || !isNaN(val)) {
        className = 'number';
      }
      
      html += `<td class="${className}">${val}</td>`;
    });
    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
      
      <div class="footer">
        <strong>Tổng số bản ghi:</strong> ${rows.length} | 
        <strong>Được tạo bởi:</strong> Hệ thống xuất dữ liệu
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob(["\ufeff", html], { 
    type: 'application/vnd.ms-excel;charset=utf-8' 
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export function exportToWord(filename, htmlContent, options = {}) {
  const {
    title = 'Tài liệu',
    author = 'Hệ thống',
    brandColor = '#2563eb'
  } = options;

  const styledHtml = `
    <!doctype html>
    <html xmlns:w="urn:schemas-microsoft-com:office:word">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1f2937;
          background: white;
        }
        
        h1, h2, h3 {
          color: ${brandColor};
          margin-top: 24px;
          margin-bottom: 12px;
          font-weight: 700;
        }
        
        h1 {
          font-size: 24pt;
          text-align: center;
          border-bottom: 3px solid ${brandColor};
          padding-bottom: 12px;
        }
        
        h2 {
          font-size: 18pt;
          border-left: 4px solid ${brandColor};
          padding-left: 12px;
        }
        
        h3 {
          font-size: 14pt;
        }
        
        p {
          margin: 12px 0;
          text-align: justify;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        th {
          background-color: ${brandColor};
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 700;
        }
        
        td {
          padding: 10px;
          border: 1px solid #d1d5db;
        }
        
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .document-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          border: 2px solid ${brandColor};
          background: linear-gradient(to bottom, #ffffff, #f0f9ff);
        }
        
        .document-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid ${brandColor};
          text-align: center;
          font-size: 10pt;
          color: #6b7280;
        }
        
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-around;
        }
        
        .signature-box {
          text-align: center;
          width: 200px;
        }
        
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 60px;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="document-header">
        <h1>${title}</h1>
        <p><strong>Ngày:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        <p><strong>Người tạo:</strong> ${author}</p>
      </div>
      
      ${htmlContent}
      
      <div class="document-footer">
        <p>Tài liệu này được tạo tự động từ hệ thống</p>
        <p><em>Ngày xuất: ${new Date().toLocaleString('vi-VN')}</em></p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", styledHtml], { 
    type: 'application/msword;charset=utf-8' 
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename.endsWith('.doc') ? filename : `${filename}.doc`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

// Example usage:
/*
const sampleData = [
  { id: 1, name: 'Nguyễn Văn A', email: 'nva@example.com', salary: 15000000, status: 'Active' },
  { id: 2, name: 'Trần Thị B', email: 'ttb@example.com', salary: 18000000, status: 'Active' },
  { id: 3, name: 'Lê Văn C', email: 'lvc@example.com', salary: 12000000, status: 'Inactive' }
];

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Họ và tên' },
  { key: 'email', label: 'Email' },
  { key: 'salary', label: 'Lương (VNĐ)' },
  { key: 'status', label: 'Trạng thái' }
];

// Export to beautiful Excel
exportToExcel('bao-cao-nhan-vien.xls', sampleData, columns, {
  title: 'BÁO CÁO DANH SÁCH NHÂN VIÊN',
  sheetName: 'Nhân viên',
  brandColor: '#059669',
  headerBgColor: '#047857'
});

// Export to styled Word document
const wordContent = `
  <h2>Giới thiệu</h2>
  <p>Đây là báo cáo tổng hợp về tình hình nhân sự trong quý vừa qua.</p>
  
  <h2>Thống kê</h2>
  <table>
    <thead>
      <tr>
        <th>Chỉ số</th>
        <th>Giá trị</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tổng nhân viên</td>
        <td>150</td>
      </tr>
      <tr>
        <td>Nhân viên mới</td>
        <td>12</td>
      </tr>
    </tbody>
  </table>
`;

exportToWord('bao-cao.doc', wordContent, {
  title: 'BÁO CÁO NHÂN SỰ QUÝ 4/2024',
  author: 'Phòng Nhân sự',
  brandColor: '#dc2626'
});
*/