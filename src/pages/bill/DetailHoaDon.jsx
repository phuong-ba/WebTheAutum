import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  Timeline,
  Spin,
  Alert,
  Divider,
  Row,
  Col,
  Typography,
  Empty
} from 'antd';
import {
  EditOutlined,
  PrinterOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  ShoppingOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import hoaDonApi from '../../api/HoaDonAPI';

const { Title, Text } = Typography;

const DetailHoaDon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [lichSuHoaDon, setLichSuHoaDon] = useState([]);

  useEffect(() => {
    fetchInvoiceDetail();
    fetchLichSuHoaDon();
    checkCanEdit();
  }, [id]);

  useEffect(() => {
    if (location.state?.refreshData) {
      console.log('🔄 Refreshing data...');
      fetchInvoiceDetail();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.refreshData]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 Đang gọi API với ID:', id);

      const response = await hoaDonApi.getDetail(id);
      console.log('📦 Full invoice:', response.data);

      const invoiceData = response.data?.data || response.data;

      console.log('✅ Invoice data sau khi parse:', invoiceData);

      if (!invoiceData || !invoiceData.id) {
        throw new Error('Dữ liệu hóa đơn không hợp lệ');
      }

      setInvoice(invoiceData);
      setError(null);
    } catch (err) {
      console.error('❌ Lỗi tải chi tiết hóa đơn:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error message:', err.message);
      setError('Không thể tải thông tin hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const checkCanEdit = async () => {
    try {
      const res = await hoaDonApi.canEdit(id);
      setCanEdit(res.data?.canEdit || false);
    } catch (error) {
      console.error('Error checking edit permission:', error);
      setCanEdit(false);
    }
  };

  const fetchLichSuHoaDon = async () => {
    try {
      const response = await hoaDonApi.getLichSu(id);
      console.log('📜 Lịch sử:', response.data);
      setLichSuHoaDon(response.data || []);
    } catch (err) {
      console.error('❌ Lỗi tải lịch sử:', err);
      setLichSuHoaDon([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    navigate(`/bill/edit/${id}`);
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      0: { label: 'Chờ xác nhận', color: 'warning' },
      1: { label: 'Chờ giao hàng', color: 'processing' },
      2: { label: 'Đang vận chuyển', color: 'cyan' },
      3: { label: 'Đã thanh toán', color: 'success' },
      4: { label: 'Đã hủy', color: 'error' }
    };
    const config = statusMap[status] || { label: 'Không xác định', color: 'default' };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getTimelineIcon = (hanhDong) => {
    if (hanhDong?.includes('Tạo')) return '📝';
    if (hanhDong?.includes('Cập nhật')) return '✏️';
    if (hanhDong?.includes('Xác nhận')) return '✅';
    if (hanhDong?.includes('Hủy')) return '❌';
    if (hanhDong?.includes('Giao')) return '🚚';
    return '📋';
  };

  // Columns cho bảng sản phẩm
  const productColumns = [
  {
    title: 'Sản phẩm',
    key: 'product',
    render: (_, record) => (
      <Space align="start">
        {/* Hiển thị ảnh đầu tiên trong anhUrls */}
        <img
          src={
            record.anhUrls && record.anhUrls.length > 0
              ? record.anhUrls[0]
              : 'https://res.cloudinary.com/dzkmm8yop/image/upload/v1761673563/ao-thun-basic-trang-1.jpg_cca2kl.avif'
          }
          alt={record.tenSanPham}
          style={{
            width: 60,
            height: 60,
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid #f0f0f0'
          }}
        />

        <div>
          <div style={{ fontWeight: 500 }}>{record.tenSanPham}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <span>Màu: {record.mauSac || '—'}</span> | <span>Size: {record.kichThuoc || '—'}</span>
          </Text>
        </div>
      </Space>
    )
  },
  {
    title: 'Giá bán',
    dataIndex: 'giaBan',
    key: 'giaBan',
    render: (value) => value.toLocaleString('vi-VN') + ' ₫'
  },
  {
    title: 'Số lượng',
    dataIndex: 'soLuong',
    key: 'soLuong'
  },
  {
    title: 'Thành tiền',
    dataIndex: 'thanhTien',
    key: 'thanhTien',
    render: (value) => value.toLocaleString('vi-VN') + ' ₫'
  }
];




  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Đang tải thông tin hóa đơn...</Text>
        </Space>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <Empty
            description={
              <Space direction="vertical" align="center">
                <Text type="danger" strong style={{ fontSize: 16 }}>{error}</Text>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(-1)}
                >
                  Quay lại
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }} className="detail-hoadon">
     <div style={{ maxWidth: 1400, margin: '0 auto' }} className="print-area">
        {/* Header */}
        <Card className="no-print" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>Chi tiết đơn hàng</Title>
              <Text type="secondary">Mã đơn hàng: {invoice.maHoaDon}</Text>
            </div>
            <Space>
              {canEdit ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Button
                  icon={<LockOutlined />}
                  disabled
                >
                  Không thể sửa
                </Button>
              )}
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                In đơn hàng
              </Button>
              <Button
                icon={<MailOutlined />}
                onClick={() => {/* Thêm logic gửi email */ }}
              >
                Gửi email
              </Button>
            </Space>
          </div>
        </Card>

        <Row gutter={16}>
          {/* Cột trái */}
          <Col xs={24} lg={16}>
            {/* Trạng thái đơn hàng */}
            <Card title="Trạng thái đơn hàng" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text>Trạng thái:</Text>
                {getStatusTag(invoice.trangThai)}
              </div>
            </Card>

            {/* Thông tin khách hàng và Thanh toán - CÙNG HÀNG */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              {/* Thông tin khách hàng */}
              <Col xs={24} md={12}>
                <Card title={<><UserOutlined /> Thông tin khách hàng</>} style={{ height: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text type="secondary">Tên khách hàng:</Text>
                      <div><Text strong>{invoice.tenKhachHang}</Text></div>
                    </div>
                    {invoice.emailKhachHang && invoice.emailKhachHang !== 'N/A' && (
                      <div>
                        <Text type="secondary">Email:</Text>
                        <div><Text>{invoice.emailKhachHang}</Text></div>
                      </div>
                    )}
                    <div>
                      <Text type="secondary"><PhoneOutlined /> Số điện thoại:</Text>
                      <div><Text>{invoice.sdtKhachHang || 'N/A'}</Text></div>
                    </div>
                    {invoice.diaChiKhachHang && (
                      <div>
                        <Text type="secondary"><EnvironmentOutlined /> Địa chỉ giao hàng:</Text>
                        <div><Text>{invoice.diaChiKhachHang}</Text></div>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>

              {/* Thông tin thanh toán */}
              <Col xs={24} md={12}>
                <Card title={<><DollarOutlined /> Thông tin thanh toán</>} style={{ height: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text type="secondary">Nhân viên phục vụ:</Text>
                      <div><Text strong>{invoice.tenNhanVien || 'N/A'}</Text></div>
                    </div>
                    <div>
                      <Text type="secondary">Phương thức thanh toán:</Text>
                      <div>
                        <Text>
                          {invoice.hinhThucThanhToan === '0'
                            ? 'Thanh toán khi nhận hàng (COD)'
                            : invoice.hinhThucThanhToan === '1'
                              ? 'Chuyển khoản'
                              : 'N/A'}
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>


            {/* Danh sách sản phẩm */}
            <Card title={<><ShoppingOutlined /> Danh sách sản phẩm</>} style={{ marginBottom: 16 }}>
              {invoice.chiTietSanPhams && invoice.chiTietSanPhams.length > 0 ? (
                <Table
                  columns={productColumns}
                  dataSource={invoice.chiTietSanPhams}
                  rowKey="id"
                  pagination={false}
                />
              ) : (
                <Empty description="Không có sản phẩm" />
              )}
            </Card>

            {/* Ghi chú */}
            <Card title="Ghi chú của khách" style={{ marginBottom: 16 }}>
              <Text type="secondary">{invoice.ghiChu || 'N/A'}</Text>
            </Card>
          </Col>

          {/* Cột phải */}
          <Col xs={24} lg={8}>
            {/* Tóm tắt đơn hàng */}
            <Card title="Tóm tắt đơn hàng" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Tạm tính:</Text>
                  <Text strong>{formatMoney(invoice.tongTien)}</Text>
                </div>

                {/* Chỉ hiển thị phí vận chuyển nếu KHÔNG phải tại quầy */}
                {!invoice.loaiHoaDon && invoice.phiVanChuyen > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Phí vận chuyển:</Text>
                    <Text strong>{formatMoney(invoice.phiVanChuyen)}</Text>
                  </div>
                )}

                {/* Giảm giá */}
                {invoice.tongTienSauGiam && invoice.tongTienSauGiam !== invoice.tongTien && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
                    <Text type="danger">Giảm giá:</Text>
                    <Text type="danger" strong>
                      -{formatMoney(invoice.tongTien - invoice.tongTienSauGiam)}
                    </Text>
                  </div>
                )}

                <Divider style={{ margin: '8px 0' }} />

                {/* Tổng cộng: nếu là tại quầy thì không cộng phí ship */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
                  <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                    {formatMoney(
                      (invoice.tongTienSauGiam ?? invoice.tongTien) +
                      (!invoice.loaiHoaDon ? (invoice.phiVanChuyen || 0) : 0)
                    )}
                  </Text>
                </div>
              </Space>
            </Card>



            {/* Lịch sử đơn hàng */}
            <Card title={<><ClockCircleOutlined /> Lịch sử đơn hàng</>} className="history-section">
              {lichSuHoaDon && lichSuHoaDon.length > 0 ? (
                <Timeline
                  items={lichSuHoaDon.map((item, index) => ({
                    dot: <span style={{ fontSize: 18 }}>{getTimelineIcon(item.hanhDong)}</span>,
                    color: index === 0 ? 'green' : 'gray',
                    children: (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text strong>{item.hanhDong}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDate(item.ngayCapNhat)}
                          </Text>
                        </div>
                        {item.moTa && (
                          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                            {item.moTa}
                          </Text>
                        )}
                        {item.nguoiThucHien && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            👤 Người thực hiện: <Text strong style={{ fontSize: 12 }}>{item.nguoiThucHien}</Text>
                          </Text>
                        )}
                      </div>
                    )
                  }))}
                />
              ) : (
                <Timeline
                  items={[
                    {
                      dot: '📅',
                      children: (
                        <Space>
                          <Text type="secondary">{formatDate(invoice.ngayTao)}</Text>
                          <Text>Đơn hàng được tạo thành công</Text>
                        </Space>
                      )
                    }
                  ]}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Print styles */}
    <style>{`
  @media print {
    /* Ẩn toàn bộ layout khung ngoài */
    header, footer, nav, aside,
    .ant-layout-sider,
    .ant-layout-header,
    .ant-menu,
    .ant-menu-root,
    .ant-layout-footer,
    .ant-layout-sider-children,
    .ant-layout .ant-menu-inline,
    .ant-layout .ant-menu-vertical,
    .no-print,
    .history-section,
    button {
      display: none !important;
    }

    /* Ẩn thanh sidebar bên trái của bạn */
    .ant-layout-sider {
      display: none !important;
    }

    /* Ẩn vùng header cố định trên */
    .ant-layout-header {
      display: none !important;
    }

    /* Chỉ hiển thị phần chi tiết đơn hàng */
    .print-area {
      display: block !important;
      width: 100% !important;
    }

    body, html {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    @page {
      margin: 10mm;
    }
  }
`}</style>


    </div>
  );
};

export default DetailHoaDon;