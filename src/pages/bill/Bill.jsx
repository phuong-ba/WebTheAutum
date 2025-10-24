import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import hoaDonApi from '../../api/HoaDonAPI';
import nhanVienApi from '../../api/NhanVienAPI';
import chiTietSanPhamApi from '../../api/ChiTietSanPhamAPI';
import { toast } from 'react-toastify';
import { Table, Tag, Space, message, Modal, Button } from "antd";

// ==================== UTILITY FUNCTIONS ====================
const formatMoney = (value) => {
  if (!value && value !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const getStatusInfo = (status) => {
  switch (status) {
    case 0:
      return {
        label: '⏳ Chờ xác nhận',
        color: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20'
      };
    case 1:
      return {
        label: '💳 Chờ giao hàng',
        color: 'bg-blue-100 text-blue-700 ring-blue-600/20'
      };
    case 2:
      return {
        label: '🚚 Đang vận chuyển',
        color: 'bg-green-100 text-green-700 ring-green-600/20'
      };
    case 3:
      return {
        label: '✅ Đã thanh toán',
        color: 'bg-red-100 text-red-700 ring-red-600/20'
      };
    case 4:
      return {
        label: '❌ Đã hủy',
        color: 'bg-red-100 text-red-700 ring-red-600/20'
      };
    default:
      return {
        label: '❓ Không xác định',
        color: 'bg-gray-100 text-gray-700 ring-gray-600/20'
      };
  }
};





const StatusDropdown = ({ currentStatus, onStatusChange, onClose }) => {
  const dropdownRef = useRef(null);

  const statusOptions = [
    { value: 0, label: '⏳ Chờ xác nhận', color: 'hover:bg-yellow-50' },
    { value: 1, label: '💳 Chờ giao hàng', color: 'hover:bg-blue-50' },
    { value: 2, label: '🚚 Đang vận chuyển', color: 'hover:bg-blue-50' },
    { value: 3, label: '✅ Đã thanh toán', color: 'hover:bg-green-50' },
    { value: 4, label: '❌ Đã hủy', color: 'hover:bg-red-50' }
  ];
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
    >
      {statusOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            onStatusChange(option.value);
            onClose();
          }}
          className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${option.color} ${currentStatus === option.value ? 'bg-gray-100' : ''
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// ==================== FILTER COMPONENT ====================
const InvoiceFilter = ({ onSearch, onReset, onFilterChange }) => {
  const [searchParams, setSearchParams] = useState({
    maHoaDon: '',
    tenKhachHang: '',
    tenNhanVien: ''
  });

  const [filterParams, setFilterParams] = useState({
    trangThai: '',
    ngayTao: '',
    priceRange: ''
  });

  const handleSearch = () => {
    onSearch({ ...searchParams, ...filterParams });
  };

  const handleReset = () => {
    setSearchParams({ maHoaDon: '', tenKhachHang: '', tenNhanVien: '' });
    setFilterParams({ trangThai: '', ngayTao: '', priceRange: '' });
    onReset();
  };

  const handleLocalFilterChange = (field, value) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
    onFilterChange(field, value);
  };

  return (
    <div className="relative w-full bg-orange-50 rounded-xl p-4 mb-4 shadow-lg border border-orange-100">
      <div className="relative z-10 flex items-center gap-3 mb-5 pb-4 border-b border-orange-200">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-100 text-xl shadow-md">
          🔍
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tìm kiếm và lọc dữ liệu</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={searchParams.maHoaDon}
            onChange={(e) => setSearchParams({ ...searchParams, maHoaDon: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập mã hóa đơn..."
            className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
          />
          <input
            value={searchParams.tenKhachHang}
            onChange={(e) => setSearchParams({ ...searchParams, tenKhachHang: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập tên khách hàng..."
            className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
          />
          <input
            value={searchParams.tenNhanVien}
            onChange={(e) => setSearchParams({ ...searchParams, tenNhanVien: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nhập tên nhân viên..."
            className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"

          />
          {/* ⭐ THAY loaiHoaDon thành priceRange */}
          <select
            value={filterParams.priceRange}
            onChange={(e) => handleLocalFilterChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"


          >
            <option value="">Lọc theo tổng tiền</option>
            <option value="under100">💰 Dưới 100K</option>
            <option value="100to500">💵 100K - 500K</option>
            <option value="500to1m">💴 500K - 1 Triệu</option>
            <option value="over1m">💶 Trên 1 Triệu</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <input
            type="date"
            value={filterParams.ngayTao}
            onChange={(e) => handleLocalFilterChange('ngayTao', e.target.value)}
            className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
          />
          {/* <select
            value={filterParams.hinhThucThanhToan}
            onChange={(e) => handleLocalFilterChange('hinhThucThanhToan', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium transition-all hover:border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none"
          >
            <option value="">Tất cả hình thức</option>
            <option value="Tiền mặt">💵 Tiền mặt</option>
            <option value="Chuyển khoản">🏦 Chuyển khoản</option>
            <option value="Ví điện tử">📱 Ví điện tử</option>
            <option value="Thanh toán khi nhận hàng">📦 COD</option>
          </select> */}

          <select
            value={filterParams.trangThai}
            onChange={(e) => handleLocalFilterChange('trangThai', e.target.value)}
            className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium transition-all hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">⏳ Chờ xác nhận</option>
            <option value="1">💳 Chờ giao hàng</option>
            <option value="2">🚚 Đang vận chuyển</option>
            <option value="3">✅ Đã thanh toán</option>
            <option value="4">❌ Đã hủy</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-100 text-orange-700 rounded-lg font-semibold text-sm hover:bg-orange-200 transition-all"
            >
              <span>↻</span>
              <span>Nhập lại</span>
            </button>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-all"
            >
              <span>🔍</span>
              <span>Tìm kiếm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== TABLE COMPONENT ====================
const InvoiceTable = ({ invoices, selectedInvoices, isAllSelected, onToggleSelectAll, onToggleInvoice, onViewDetail, onStatusChange }) => {
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  const handleStatusClick = (e, invoiceId) => {
    e.stopPropagation();
    setEditingInvoiceId(invoiceId);
  };


  const handleStatusChange = async (invoiceId, newStatus) => {
    const oldInvoices = [...invoices];
    onStatusChange(invoiceId, newStatus);
    setEditingInvoiceId(null);
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, trangThai: newStatus }
          : inv
      )
    );
    console.log(1);

    try {
      await hoaDonApi.updateStatus(invoiceId, newStatus);
      toast.success(`✅ Cập nhật trạng thái thành công!`);
    } catch (err) {
      console.error('❌ Lỗi cập nhật:', err);
      toast.error('❌ Không thể cập nhật trạng thái!');
    }
  };




  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full min-w-[750px] bg-white">
        <thead className="bg-orange-50 border-b border-orange-200">
          <tr>
            <th className="px-2 py-3 text-left">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              />
            </th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">STT</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Mã HĐ</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên khách hàng</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nhân viên</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trạng thái</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Dịch vụ</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hình thức TT</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Ngày tạo</th>
            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tổng tiền</th>
            <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((invoice, index) => {
            const statusInfo = getStatusInfo(invoice.trangThai);
            return (
              <tr key={invoice.id} className="hover:bg-orange-50/30 transition-colors">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => onToggleInvoice(invoice.id)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 cursor-pointer"
                  />
                </td>
                <td className="px-2 py-2 text-sm font-medium text-gray-700">{index + 1}</td>
                <td className="px-2 py-2 text-sm font-semibold text-gray-900">{invoice.maHoaDon || invoice.id}</td>
                <td className="px-2 py-2 text-sm text-gray-700">{invoice.khachHang?.hoTen || '—'}</td>
                <td className="px-2 py-2 text-sm text-gray-700">{invoice.nhanVien?.hoTen || '—'}</td>
                <td className="px-2 py-2 relative">
                  <button
                    onClick={(e) => handleStatusClick(e, invoice.id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${statusInfo.color} cursor-pointer hover:opacity-80 transition-opacity`}
                    title="Click để thay đổi trạng thái"
                  >
                    {statusInfo.label}
                  </button>
                  {editingInvoiceId === invoice.id && (
                    <StatusDropdown
                      currentStatus={invoice.trangThai}
                      onStatusChange={(newStatus) => handleStatusChange(invoice.id, newStatus)}
                      onClose={() => setEditingInvoiceId(null)}
                    />
                  )}
                </td>
                <td className="px-2 py-2 text-sm text-gray-700">
                  {invoice.loaiHoaDon ? 'Tại quầy' : 'Online'}
                </td>
                <td className="px-2 py-2 text-sm text-gray-700">
                  {invoice.hinhThucThanhToan || '—'}
                </td>
                <td className="px-2 py-2 text-sm text-gray-600">{formatDate(invoice.ngayTao)}</td>
                <td className="px-2 py-2 text-sm font-semibold text-orange-600">{formatMoney(invoice.tongTien)}</td>

                <td className="px-2 py-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onViewDetail(invoice.id)}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      title="Xem chi tiết"
                    >
                      👁️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {invoices.length === 0 && (
            <tr>
              <td colSpan="11" className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-5xl opacity-20">📋</span>
                  <p className="text-gray-500 font-medium">Không có dữ liệu</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ==================== PAGINATION COMPONENT ====================
const InvoicePagination = ({ currentPage, totalPages, totalItems, onPageChange }) => {
  return (
    <div className="flex items-center justify-center mt-4 gap-1 flex-wrap">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        ‹
      </button>
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i + 1}
          onClick={() => onPageChange(i + 1)}
          className={`px-3 py-2 rounded-lg text-sm transition-all ${currentPage === i + 1
            ? 'bg-blue-500 text-white font-semibold'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        ›
      </button>
      <span className="ml-3 text-sm text-gray-600">Tổng: {totalItems} hóa đơn</span>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function InvoiceManager() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({});

  const isAllSelected = useMemo(() =>
    selectedInvoices.length === invoices.length && invoices.length > 0,
    [selectedInvoices, invoices]
  );

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (page = 0, size = 5) => {
    try {
      setLoading(true);
      setError(null);
      const response = await hoaDonApi.getAllHoaDon(page, size);
      setInvoices(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalItems(response.data.totalElements || 0);
    } catch (err) {
      console.error('❌ Lỗi tải hóa đơn:', err);
      setError('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (params) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setCurrentFilters(params);
      const response = await hoaDonApi.searchAndFilter({ ...params, page: 0, size: 5 });
      setInvoices(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalItems(response.data.totalElements || 0);
    } catch (err) {
      console.error('❌ Lỗi tìm kiếm:', err);
      setError('Không thể tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (field, value) => {
    const newFilters = { ...currentFilters, [field]: value };
    setCurrentFilters(newFilters);
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      const response = await hoaDonApi.searchAndFilter({ ...newFilters, page: 0, size: 5 });
      console.log('Response từ API:', response.data.content);
      setInvoices(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalItems(response.data.totalElements || 0);
    } catch (err) {
      console.error('❌ Lỗi tìm kiếm:', err);
      setError('Không thể tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setCurrentFilters({});
    setCurrentPage(1);
    await handleSearch({});
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      if (!invoices || invoices.length === 0) {
        toast.warn('⚠️ Không có dữ liệu để xuất!');
        return;
      }

      const response = await hoaDonApi.exportExcel();

      if (!response.data || response.data.size === 0) {
        toast.warn('⚠️ Server không trả về dữ liệu!');
        return;
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HoaDon_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success('✅ Xuất Excel thành công!');
    } catch (err) {
      console.error('❌ Chi tiết lỗi:', err);
      console.error('❌ Response:', err.response);

      let errorMessage = 'Không thể xuất file Excel!';

      if (err.response) {
        if (err.response.status === 500) {
          errorMessage = 'Lỗi server (500). Kiểm tra backend log!';
        } else if (err.response.data) {
          errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Không nhận được phản hồi từ server!';
      } else {
        errorMessage = err.message;
      }

      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        toast.warn('⚠️ Không có hóa đơn để in!');
        return;
      }
      setLoading(true);
      const invoiceIds = invoices.map(inv => inv.id);
      const response = await hoaDonApi.printInvoices(invoiceIds);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('❌ Lỗi in:', err);
      toast.error(`❌ Không thể in: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (invoiceId) => {
    navigate(`/DetailHoaDon/${invoiceId}`);
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(inv => inv.id));
    }
  };

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    if (Object.keys(currentFilters).length > 0) {
      await handleSearch({ ...currentFilters, page: page - 1, size: 5 });
    } else {
      await fetchInvoices(page - 1, 5);
    }
  };


  const handleStatusChange = async (invoiceId, newStatus) => {
    const oldInvoices = [...invoices];
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, trangThai: newStatus }
          : inv
      )
    );

    try {
      await hoaDonApi.updateStatus(invoiceId, newStatus);

      const statusNames = ['Chờ xác nhận', 'Chờ giao hàng', 'Đang vận chuyển', 'Đã thanh toán', 'Đã hủy'];
      console.log(`✅ Đã lưu vào database: ${statusNames[newStatus]}`);
      toast.success(`✅ Cập nhật trạng thái thành công!`);

    } catch (err) {
      console.error('❌ Lỗi cập nhật:', err);
      setInvoices(oldInvoices);

      toast.error('❌ Không thể cập nhật trạng thái! Vui lòng thử lại.');
    }
  };





  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Quản lý hóa đơn</h2>
        <p className="text-gray-600 text-sm">Quản lý và theo dõi tất cả hóa đơn trong hệ thống</p>
      </div>

      {/* Filter */}
      <InvoiceFilter
        onSearch={handleSearch}
        onReset={handleReset}
        onFilterChange={handleFilterChange}
      />

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-all"
        >
          <span className="text-base">📥</span>
          Xuất dữ liệu
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-all"
        >
          <span className="text-base">🖨️</span>
          In danh sách
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      {!loading && !error && (
        <InvoiceTable
          invoices={invoices}
          selectedInvoices={selectedInvoices}
          isAllSelected={isAllSelected}
          onToggleSelectAll={toggleSelectAll}
          onToggleInvoice={toggleInvoiceSelection}
          onViewDetail={handleViewDetail}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 0 && (
        <InvoicePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

