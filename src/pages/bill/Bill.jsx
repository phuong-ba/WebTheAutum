import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Space, Button, message } from 'antd';
import { ExportOutlined, PrinterOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import hoaDonApi from '../../api/HoaDonAPI';
import BillSearchFilter from './BillSearchFilter';
import BillTable from './BillTable';

export default function InvoiceManager() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // ✅ Lấy thông tin nhân viên đang đăng nhập
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const nhanVienId = currentUser?.id;

  // Filter states
  const [searchParams, setSearchParams] = useState({
    searchText: ''
  });

  const [filterParams, setFilterParams] = useState({
    trangThai: undefined,
    ngayTao: null,
    loaiHoaDon: [],
    hinhThucThanhToan: undefined
  });

  const [currentFilters, setCurrentFilters] = useState({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (page = 0, size = 5) => {
    try {
      setLoading(true);
      const response = await hoaDonApi.getAllHoaDon(page, size);
      setInvoices(response.data.content || []);
      setTotalItems(response.data.totalElements || 0);
    } catch (err) {
      message.error('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (page = 0, size = pageSize) => {
    const hasSearchValue =
      searchParams.searchText.trim() !== '' ||
      filterParams.trangThai !== undefined ||
      filterParams.ngayTao !== null ||
      (filterParams.loaiHoaDonList && filterParams.loaiHoaDonList.length > 0) ||
      filterParams.hinhThucThanhToan !== undefined;

    if (!hasSearchValue) {
      toast.warning('⚠️ Vui lòng nhập hoặc chọn ít nhất một điều kiện tìm kiếm!');
      return;
    }

    const params = {
      ...searchParams,
      ...filterParams,
      ngayTao: filterParams.ngayTao ? filterParams.ngayTao.format('YYYY-MM-DD') : null
    };

    try {
      setLoading(true);
      setCurrentPage(1);
      setCurrentFilters(params);
      const response = await hoaDonApi.searchAndFilter({
        ...params,
        page: 0,
        size: pageSize
      });
      setInvoices(response.data.content || []);
      setTotalItems(response.data.totalElements || 0);
    } catch (err) {
      message.error('Không thể tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchParams({ searchText: '' });
    setFilterParams({
      trangThai: undefined,
      ngayTao: null,
      loaiHoaDon: [],
      hinhThucThanhToan: undefined
    });
    setCurrentFilters({});
    setCurrentPage(1);
    fetchInvoices(0, pageSize);
  };

  const handleExport = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        toast.warning('⚠️ Không có dữ liệu để xuất!');
        return;
      }
      const loadingToastId = toast.loading('⏳ Đang xuất file Excel...');
      const response = await hoaDonApi.exportExcel();
      const blobData = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: response.headers['content-type'] });

      if (!blobData || blobData.size === 0) {
        toast.update(loadingToastId, {
          render: '❌ Server không trả về dữ liệu hợp lệ!',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      const url = window.URL.createObjectURL(blobData);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HoaDon_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.update(loadingToastId, {
        render: '✅ Xuất Excel thành công!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('❌ Không thể xuất file Excel!');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        toast.warning('⚠️ Không có hóa đơn để in!');
        return;
      }
      const loadingToast = toast.loading('⏳ Đang tạo file PDF...');
      setLoading(true);

      const invoiceIds = invoices.map(inv => inv.id);
      const response = await hoaDonApi.printInvoices(invoiceIds);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      toast.update(loadingToast, {
        render: `✅ Đã in ${invoices.length} hóa đơn thành công!`,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });

    } catch (err) {
      console.error(err);
      toast.error('❌ Không thể in danh sách!');
    } finally {
      setLoading(false);
    }
  };

  // ❌ XÓA HÀM CŨ: handleStatusChange
  // const handleStatusChange = async (invoiceId, newStatus) => { ... }

  // ✅ HÀM MỚI: Cập nhật trạng thái + nhân viên cùng lúc
  const handleUpdateWithStaff = async (invoiceId, newStatus) => {
    if (!nhanVienId) {
      message.error('Vui lòng đăng nhập để cập nhật đơn hàng');
      return;
    }

    const oldInvoices = [...invoices];
    
    // Cập nhật UI ngay lập tức
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            trangThai: newStatus,
            nhanVien: {
              id: nhanVienId,
              hoTen: currentUser.hoTen
            }
          };
        }
        return inv;
      })
    );

    try {
      // Gọi API xác nhận (có cập nhật nhân viên)
      await hoaDonApi.xacNhanDonHang(invoiceId, nhanVienId);
      
      // Sau đó cập nhật trạng thái (nếu khác 1)
      if (newStatus !== 1) {
        await hoaDonApi.updateStatus(invoiceId, newStatus);
      }
      
      message.success('Cập nhật trạng thái và nhân viên thành công!');
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
      setInvoices(oldInvoices);
      message.error('Không thể cập nhật!');
    }
  };

  const handleServiceChange = async (invoiceId, newService) => {
    const oldInvoices = [...invoices];
    setInvoices(prev =>
      prev.map(inv => inv.id === invoiceId ? { ...inv, loaiHoaDon: newService } : inv)
    );

    try {
      await hoaDonApi.updateService(invoiceId, newService);
      message.success('Cập nhật dịch vụ thành công!');
    } catch (err) {
      setInvoices(oldInvoices);
      message.error('Không thể cập nhật dịch vụ!');
    }
  };

  // HÀM XÁC NHẬN ĐƠN HÀNG (giữ lại cho nút riêng nếu cần)
  const handleXacNhanDonHang = async (hoaDonId) => {
    if (!nhanVienId) {
      message.error('Vui lòng đăng nhập để xác nhận đơn hàng');
      throw new Error('Không có thông tin nhân viên');
    }

    try {
      await hoaDonApi.xacNhanDonHang(hoaDonId, nhanVienId);

      setInvoices(prev =>
        prev.map(inv => {
          if (inv.id === hoaDonId) {
            return {
              ...inv,
              trangThai: 1,
              nhanVien: {
                id: nhanVienId,
                hoTen: currentUser.hoTen
              }
            };
          }
          return inv;
        })
      );

      message.success('Xác nhận đơn hàng thành công!');
    } catch (error) {
      message.error('Không thể xác nhận đơn hàng: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  const handleTableChange = (pagination) => {
    const page = pagination.current - 1;
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (Object.keys(currentFilters).length > 0) {
      handleSearch(page, pagination.pageSize);
    } else {
      fetchInvoices(page, pagination.pageSize);
    }
  };

  const handleViewDetail = (invoiceId) => {
    navigate(`/admin/detail-bill/${invoiceId}`);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
        <div className="font-bold text-4xl text-[#E67E22]">
          Quản lý hóa đơn
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <BillSearchFilter
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* ACTION BUTTONS */}
      <div style={{
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: '#ff8c42',
        borderRadius: '4px 4px 0 0'
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          margin: 0,
          color: '#fff'
        }}>
          Danh sách hóa đơn ({totalItems} hóa đơn)
        </h3>

        <Space>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
            className="!bg-white !border-white !text-[#ff8c42] font-medium hover:!bg-amber-800 hover:!text-white"
          >
            Xuất Excel
          </Button>

          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            className="!bg-white !border-white !text-[#ff8c42] font-medium hover:!bg-amber-800 hover:!text-white"
          >
            In danh sách
          </Button>
        </Space>
      </div>

      {/* TABLE */}
      <Card bodyStyle={{ padding: 0 }}>
        <BillTable
          invoices={invoices}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onTableChange={handleTableChange}
          onUpdateWithStaff={handleUpdateWithStaff} 
          onServiceChange={handleServiceChange}
          onViewDetail={handleViewDetail}
          onXacNhanDonHang={handleXacNhanDonHang}
        />
      </Card>
    </div>
  );
}