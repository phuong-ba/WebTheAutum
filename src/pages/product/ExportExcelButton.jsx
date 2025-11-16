import React from 'react';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportExcelButton = ({ data, fileName = 'danh-sach-san-pham', loading = false }) => {
  const exportToExcel = () => {
    try {
      const excelData = data.map((product, index) => ({
        'STT': index + 1,
        'Mã sản phẩm': product.maSanPham || '',
        'Tên sản phẩm': product.tenSanPham || '',
        'Hãng': product.tenNhaSanXuat || '',
        'Kiểu dáng': product.tenKieuDang || '',
        'Chất liệu': product.tenChatLieu || '',
        'Xuất xứ': product.tenXuatXu || '',
        'Số lượng': product.tongSoLuong || 0,
        'Giá thấp nhất': formatPriceForExcel(product.giaThapNhat),
        'Giá cao nhất': formatPriceForExcel(product.giaCaoNhat),
        'Trạng thái': product.trangThai ? 'Đang hoạt động' : 'Ngừng hoạt động',
        'Ngày tạo': formatDate(product.ngayTao),
        'Ngày sửa': formatDate(product.ngaySua),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      const columnWidths = [
        { wch: 5 },   
        { wch: 12 },  
        { wch: 30 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 10 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 },  
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách sản phẩm');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      saveAs(dataBlob, `${fileName}-${new Date().getTime()}.xlsx`);
      
    } catch (error) {
      console.error('❌ Lỗi xuất Excel:', error);
      throw new Error('Không thể xuất file Excel');
    }
  };

  const formatPriceForExcel = (price) => {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={exportToExcel}
      loading={loading}
      disabled={!data || data.length === 0}
      className="bg-green-600 hover:bg-green-700 border-green-600"
    >
      Xuất Excel
    </Button>
  );
};

export default ExportExcelButton;