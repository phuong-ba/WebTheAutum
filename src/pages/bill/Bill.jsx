import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Card,
  Dropdown,
  Menu,
  Modal,
  message,
  Checkbox
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  ExportOutlined, 
  PrinterOutlined,
  EyeOutlined,
  DownOutlined
} from '@ant-design/icons';
import hoaDonApi from '../../api/HoaDonAPI';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const { Option } = Select;

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

const getStatusConfig = (status) => {
  const configs = {
    0: { label: 'Chờ xác nhận', color: 'warning' },
    1: { label: 'Chờ giao hàng', color: 'processing' },
    2: { label: 'Đang vận chuyển', color: 'cyan' },
    3: { label: 'Đã thanh toán', color: 'success' },
    4: { label: 'Đã hủy', color: 'error' }
  };
  return configs[status] || { label: 'Không xác định', color: 'default' };
};

// ==================== MAIN COMPONENT ====================
export default function InvoiceManager() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Filter states
  const [searchParams, setSearchParams] = useState({
    searchText: ''
  });

  const [filterParams, setFilterParams] = useState({
    trangThai: undefined,
    ngayTao: null,
    loaiHoaDon: undefined,
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

  const handleSearch = async () => {
  const hasSearchValue =
    searchParams.searchText.trim() !== '' ||
    filterParams.trangThai !== undefined ||
    filterParams.ngayTao !== null ||
    filterParams.loaiHoaDon !== undefined ||
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
    setFilterParams({ trangThai: undefined, ngayTao: null, loaiHoaDon: undefined, hinhThucThanhToan: undefined });
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

  const handleStatusChange = async (invoiceId, newStatus) => {
    const oldInvoices = [...invoices];
    setInvoices(prev =>
      prev.map(inv => inv.id === invoiceId ? { ...inv, trangThai: newStatus } : inv)
    );

    try {
      await hoaDonApi.updateStatus(invoiceId, newStatus);
      message.success('Cập nhật trạng thái thành công!');
    } catch (err) {
      setInvoices(oldInvoices);
      message.error('Không thể cập nhật trạng thái!');
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

  const handleTableChange = (pagination) => {
    const page = pagination.current - 1;
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (Object.keys(currentFilters).length > 0) {
      handleSearch();
    } else {
      fetchInvoices(page, pagination.pageSize);
    }
  };


// ✅ Hàm xử lý click vào trạng thái
const handleEditTrangThai = (record) => {
  Modal.confirm({
    title: "Xác nhận sửa trạng thái",
    content: `Bạn có muốn sửa trạng thái của hóa đơn #${record.maHoaDon} không?`,
    okText: "Có",
    cancelText: "Không",
    onOk: async () => {
      try {
        // 🔧 Gọi API cập nhật trạng thái ở đây
        await hoaDonApi.updateTrangThai(record.id, { trangThai: "Đã xử lý" });

        toast.success("✅ Cập nhật trạng thái thành công!");
        fetchInvoices(); // load lại danh sách
      } catch (err) {
        console.error(err);
        toast.error("❌ Lỗi khi cập nhật trạng thái!");
      }
    },
  });
};

// ✅ Hàm xử lý click vào dịch vụ
const handleEditDichVu = (record) => {
  Modal.confirm({
    title: "Xác nhận sửa dịch vụ",
    content: `Bạn có muốn sửa dịch vụ của hóa đơn #${record.maHoaDon} không?`,
    okText: "Có",
    cancelText: "Không",
    onOk: async () => {
      try {
        // 🔧 Gọi API cập nhật dịch vụ ở đây
        await hoaDonApi.updateDichVu(record.id, { dichVu: "Giao tận nơi" });

        toast.success("✅ Cập nhật dịch vụ thành công!");
        fetchInvoices(); // load lại danh sách
      } catch (err) {
        console.error(err);
        toast.error("❌ Lỗi khi cập nhật dịch vụ!");
      }
    },
  });
};



  // Status dropdown menu
  const getStatusMenu = (record) => (
    <Menu onClick={({ key }) => handleStatusChange(record.id, parseInt(key))}>
      <Menu.Item key="0">⏳ Chờ xác nhận</Menu.Item>
      <Menu.Item key="1">💳 Chờ giao hàng</Menu.Item>
      <Menu.Item key="2">🚚 Đang vận chuyển</Menu.Item>
      <Menu.Item key="3">✅ Đã thanh toán</Menu.Item>
      <Menu.Item key="4">❌ Đã hủy</Menu.Item>
    </Menu>
  );

  // Table columns
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
      title: 'Mã HĐ',
      dataIndex: 'maHoaDon',
      key: 'maHoaDon',
      width: 120,
      render: (text, record) => text || record.id
    },
    {
      title: 'Tên khách hàng',
      key: 'tenKhachHang',
      render: (_, record) => record.khachHang?.hoTen || '—'
    },
    {
      title: 'Nhân viên',
      key: 'tenNhanVien',
      render: (_, record) => record.nhanVien?.hoTen || '—'
    },
    {
      title: 'Trạng thái',
      key: 'trangThai',
      width: 160,
      render: (_, record) => {
        const config = getStatusConfig(record.trangThai);
        return (
          <Dropdown overlay={getStatusMenu(record)} trigger={['click']}>
            <Tag color={config.color} style={{ cursor: 'pointer' }}    onClick={() => handleEditTrangThai(record)}>
              {config.label} <DownOutlined style={{ fontSize: 10 }} />
            </Tag>
          </Dropdown>
        );
      }
    },
    {
      title: 'Dịch vụ',
      key: 'loaiHoaDon',
      width: 100,
      render: (_, record) => {
        const serviceMenu = (
          <Menu onClick={({ key }) => handleServiceChange(record.id, key === 'true')}>
            <Menu.Item key="true">🏪 Tại quầy</Menu.Item>
            <Menu.Item key="false">💻 Online</Menu.Item>
          </Menu>
        );
        
        const serviceText = record.loaiHoaDon ? '🏪 Tại quầy' : '💻 Online';
        
        return (
          <Dropdown overlay={serviceMenu} trigger={['click']}>
            <Tag style={{ cursor: 'pointer', padding: '4px 8px' }}  >
              {serviceText} <DownOutlined style={{ fontSize: 10 }} />
            </Tag>
          </Dropdown>
        );
      }
    },
    {
      title: 'Hình thức TT',
      dataIndex: 'hinhThucThanhToan',
      key: 'hinhThucThanhToan',
      render: (text) => text || '—'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'ngayTao',
      key: 'ngayTao',
      render: (date) => formatDate(date)
    },
   {
  title: 'Tổng tiền',
  key: 'tongTien',
  render: (_, record) => {
    const tongTienSauGiam = record.tongTienSauGiam ?? record.tongTien;
    const phiShip = record.loaiHoaDon ? 0 : (record.phiVanChuyen || 0); // nếu tại quầy thì 0
    const tongCong = tongTienSauGiam + phiShip;
    return (
      <span style={{ color: '#ff6b35', fontWeight: 600 }}>
        {formatMoney(tongCong)}
      </span>
    );
  }
},

    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/DetailHoaDon/${record.id}`)}
        />
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Quản lý hóa đơn</h2>
        <p style={{ color: '#666', margin: '4px 0 0 0' }}>
          Quản lý và theo dõi tất cả hóa đơn trong hệ thống
        </p>
      </div>

      {/* Search & Filter Card */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            🔍 Tìm kiếm và lọc dữ liệu
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
            <Input
              placeholder="Nhập mã HĐ, tên khách hàng hoặc tên nhân viên..."
              value={searchParams.searchText}
              onChange={(e) => setSearchParams({ ...searchParams, searchText: e.target.value })}
              onPressEnter={handleSearch}
            />
            <Select
              placeholder="Lọc theo dịch vụ"
              value={filterParams.loaiHoaDon}
              onChange={(value) => setFilterParams({ ...filterParams, loaiHoaDon: value })}
              allowClear
            >
              <Option value={true}>🏪 Tại quầy</Option>
              <Option value={false}>💻 Online</Option>
            </Select>
            <Select
              placeholder="Lọc theo hình thức thanh toán"
              value={filterParams.hinhThucThanhToan}
              onChange={(value) => setFilterParams({ ...filterParams, hinhThucThanhToan: value })}
              allowClear
            >
              <Option value="tiền mặt">💵 Tiền mặt</Option>
              <Option value="chuyển khoản">🏦 Chuyển khoản</Option>
              <Option value="thẻ">💳 Thẻ</Option>
            </Select>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <DatePicker
              placeholder="Chọn ngày tạo"
              value={filterParams.ngayTao}
              onChange={(date) => setFilterParams({ ...filterParams, ngayTao: date })}
              style={{ flex: '1 1 200px' }}
            />
            <Select
              placeholder="Lọc theo trạng thái"
              value={filterParams.trangThai}
              onChange={(value) => setFilterParams({ ...filterParams, trangThai: value })}
              style={{ flex: '1 1 200px' }}
              allowClear
            >
              <Option value={0}>⏳ Chờ xác nhận</Option>
              <Option value={1}>💳 Chờ giao hàng</Option>
              <Option value={2}>🚚 Đang vận chuyển</Option>
              <Option value={3}>✅ Đã thanh toán</Option>
              <Option value={4}>❌ Đã hủy</Option>
            </Select>
            
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Nhập lại
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                Tìm kiếm
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <Space style={{ marginBottom: 16 }}>
        <Button 
          icon={<ExportOutlined />} 
          onClick={handleExport}
          style={{ borderColor: '#ff6b35', color: '#ff6b35' }}
        >
          Xuất dữ liệu
        </Button>
        <Button 
          icon={<PrinterOutlined />} 
          onClick={handlePrint}
          type="primary"
        >
          In danh sách
        </Button>
      </Space>

      {/* Table */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={invoices}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          showTotal: (total) => `Tổng: ${total} hóa đơn`,
          pageSizeOptions: ['5', '10', '20', '50']
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}