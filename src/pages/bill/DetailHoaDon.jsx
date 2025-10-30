import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
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
  Empty,
  Modal,
  Input,
  Form,
} from "antd";
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
  ClockCircleOutlined,
  FileAddOutlined,
  FormOutlined,
  TruckOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import hoaDonApi from "../../api/HoaDonAPI";
import BillBreadcrumb from "./BillBreadcrumb";
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
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailForm] = Form.useForm();

  useEffect(() => {
    fetchInvoiceDetail();
    fetchLichSuHoaDon();
    checkCanEdit();
  }, [id]);

  useEffect(() => {
    if (location.state?.refreshData) {
      console.log("🔄 Refreshing data...");
      fetchInvoiceDetail();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.refreshData]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      console.log("🔍 Đang gọi API với ID:", id);

      const response = await hoaDonApi.getDetail(id);
      console.log("📦 Full invoice:", response.data);

      const invoiceData = response.data?.data || response.data;

      console.log("✅ Invoice data sau khi parse:", invoiceData);

      if (!invoiceData || !invoiceData.id) {
        throw new Error("Dữ liệu hóa đơn không hợp lệ");
      }

      setInvoice(invoiceData);
      setError(null);
    } catch (err) {
      console.error("❌ Lỗi tải chi tiết hóa đơn:", err);
      console.error("❌ Error response:", err.response);
      console.error("❌ Error message:", err.message);
      setError("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const checkCanEdit = async () => {
    try {
      const res = await hoaDonApi.canEdit(id);
      setCanEdit(res.data?.canEdit || false);
    } catch (error) {
      console.error("Error checking edit permission:", error);
      setCanEdit(false);
    }
  };

  const fetchLichSuHoaDon = async () => {
    try {
      const response = await hoaDonApi.getLichSu(id);
      console.log("📜 Lịch sử:", response.data);
      setLichSuHoaDon(response.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử:", err);
      setLichSuHoaDon([]);
    }
  };

  const handlePrint = () => {
  const printArea = document.querySelector(".print-area");
  const clone = printArea.cloneNode(true);

  // ÉP 2 card nằm ngang (rất quan trọng)
  const row = clone.querySelector(".customer-payment-row");
  if (row) {
    row.style.display = "flex";
    row.style.flexDirection = "row";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "stretch";
    row.style.gap = "20px";
    row.style.marginBottom = "20px";

    row.querySelectorAll(".ant-col").forEach((col) => {
      col.style.flex = "1";
      col.style.maxWidth = "48%";
      col.style.width = "48%";
      col.style.boxSizing = "border-box";
      col.style.padding = "0 8px";
    });

    // Tăng kích thước card khi in
    row.querySelectorAll(".ant-card").forEach((card) => {
      card.style.border = "1px solid #ddd";
      card.style.boxShadow = "none";
      card.style.margin = "0";
      card.style.pageBreakInside = "avoid";
    });

    row.querySelectorAll(".ant-card-head").forEach((head) => {
      head.style.padding = "10px 12px";
      head.style.fontSize = "14px";
      head.style.fontWeight = "bold";
    });

    row.querySelectorAll(".ant-card-body").forEach((body) => {
      body.style.padding = "12px";
      body.style.fontSize = "13px";
    });
  }

  // TĂNG ZOOM TOÀN BỘ NỘI DUNG KHI IN
  const printContent = clone;
  printContent.style.zoom = "0.9"; // Tăng 30%
  printContent.style.transform = "scale(0.9)";
  printContent.style.transformOrigin = "top left";
  printContent.style.width = "calc(100% / 0.9)"; // Bù lại để không bị tràn

  const printWindow = window.open("", "_blank", "width=1000,height=600");

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hóa đơn #${invoice.maHoaDon}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif, Arial;
      padding: 15mm;
      background: white;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }

    /* Tăng kích thước chữ toàn bộ */
    body, .print-area {
      font-size: 14px !important;
      line-height: 1.6 !important;
    }

    h1, h2, h3, .ant-card-head-title {
      font-weight: bold !important;
      color: #333 !important;
    }

    /* Bảng sản phẩm */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #000;
      padding: 10px 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }

    /* Ẩn phần không cần in */
    .no-print,
    .ant-btn,
    .ant-breadcrumb,
    .ant-table-pagination,
    .ant-modal,
    .ant-modal-mask,
    .history-section {
      display: none !important;
    }

    /* Tóm tắt đơn hàng */
    .ant-card {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 16px;
    }

    /* Căn giữa tiêu đề */
    .ant-typography {
      margin: 0 !important;
    }

    @page {
      size: A4 portrait;
      margin: 10mm;
    }

    /* Tăng độ rõ nét */
    img {
      max-width: 70px !important;
      height: auto !important;
      image-rendering: -webkit-optimize-contrast;
    }
  </style>
</head>
<body>
  ${printContent.outerHTML}
</body>
</html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    }, 300);
  };
};


  const handleEdit = () => {
    navigate(`/admin/bill/edit/${id}`);
  };

  const handleSendEmail = () => {
    // Set email mặc định từ khách hàng
    emailForm.setFieldsValue({
      email: invoice.emailKhachHang || "",
      subject: `Hóa đơn #${invoice.maHoaDon}`,
      message: `Kính gửi ${invoice.tenKhachHang},\n\nCảm ơn quý khách đã mua hàng tại cửa hàng chúng tôi.\nĐính kèm là hóa đơn chi tiết cho đơn hàng #${invoice.maHoaDon}.\n\nTrân trọng,\nAutumn Store`,
    });
    setEmailModalVisible(true);
  };

  const handleEmailSubmit = async (values) => {
    try {
      setSendingEmail(true);

      // Gọi API gửi email
      const response = await hoaDonApi.sendEmail(id, {
        email: values.email,
        subject: values.subject,
        message: values.message,
      });

      message.success("✅ Đã gửi email thành công!");
      setEmailModalVisible(false);
      emailForm.resetFields();
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      message.error("❌ Không thể gửi email. Vui lòng thử lại!");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCancelEmail = () => {
    setEmailModalVisible(false);
    emailForm.resetFields();
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      0: { label: "Chờ xác nhận", color: "warning" },
      1: { label: "Chờ giao hàng", color: "processing" },
      2: { label: "Đang vận chuyển", color: "cyan" },
      3: { label: "Đã thanh toán", color: "success" },
      4: { label: "Đã hủy", color: "error" },
    };
    const config = statusMap[status] || {
      label: "Không xác định",
      color: "default",
    };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getTimelineIcon = (hanhDong) => {
    if (hanhDong?.includes("Tạo")) return <FileAddOutlined />;
    if (hanhDong?.includes("Cập nhật")) return <FormOutlined />;
    if (hanhDong?.includes("Xác nhận")) return <CheckCircleOutlined />;
    if (hanhDong?.includes("Hủy")) return <CloseCircleOutlined />;
    if (hanhDong?.includes("Giao")) return <TruckOutlined />;
    return <FileAddOutlined />;
  };

  // Columns cho bảng sản phẩm
  const productColumns = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, record) => (
        <Space align="start">
          {record.anhUrls && record.anhUrls.length > 0 ? (
            <img
              src={record.anhUrls[0]}
              alt={record.tenSanPham}
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
              }}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
                color: "#999",
                fontSize: 12,
                textAlign: "center",
                padding: 2,
              }}
            >
              Chưa có ảnh
            </div>
          )}

          <div>
            <div style={{ fontWeight: 500 }}>{record.tenSanPham}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <span>Màu: {record.mauSac || "—"}</span> |{" "}
              <span>Size: {record.kichThuoc || "—"}</span>
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Giá bán",
      dataIndex: "giaBan",
      key: "giaBan",
      render: (value) => value.toLocaleString("vi-VN") + " ₫",
    },
    {
      title: "Số lượng",
      dataIndex: "soLuong",
      key: "soLuong",
    },
    {
      title: "Thành tiền",
      dataIndex: "thanhTien",
      key: "thanhTien",
      render: (value) => value.toLocaleString("vi-VN") + " ₫",
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Đang tải thông tin hóa đơn...</Text>
        </Space>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Card style={{ maxWidth: 500, width: "100%" }}>
          <Empty
            description={
              <Space direction="vertical" align="center">
                <Text type="danger" strong style={{ fontSize: 16 }}>
                  {error}
                </Text>
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
  console.log(productColumns);
  if (!invoice) return null;

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
        <div className="font-bold text-4xl text-[#E67E22]">Quản lý hóa đơn</div>
        <BillBreadcrumb />
      </div>
      <div style={{ minHeight: "100vh" }} className="detail-hoadon">
        <div style={{ margin: "0 auto" }} className="print-area">
          {/* Header */}
          <Card className="no-print" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Chi tiết đơn hàng
                </Title>
                <Text type="secondary">Mã đơn hàng: {invoice.maHoaDon}</Text>
              </div>
              <div className="no-print">
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
                    <Button icon={<LockOutlined />} disabled>
                      Không thể sửa
                    </Button>
                  )}
                  <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                    In đơn hàng
                  </Button>
                  <Button
                    icon={<MailOutlined />}
                    onClick={handleSendEmail}
                    disabled={
                      !invoice.emailKhachHang ||
                      invoice.emailKhachHang === "N/A"
                    }
                  >
                    Gửi email
                  </Button>
                </Space>
              </div>
            </div>
          </Card>

          <Row gutter={16}>
            {/* Cột trái */}
            <Col xs={24} lg={16}>
              {/* Trạng thái đơn hàng */}
              <div className="no-print">
                <Card title="Trạng thái đơn hàng" style={{ marginBottom: 16 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Text>Trạng thái:</Text>
                    {getStatusTag(invoice.trangThai)}
                  </div>
                </Card>
              </div>

              <Row
                gutter={16}
                wrap={false}
                style={{ marginBottom: 16, display: "flex" }}
                className="customer-payment-row"
              >
                {/* Thông tin khách hàng */}
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <>
                        <UserOutlined /> Thông tin khách hàng
                      </>
                    }
                    style={{ height: "100%" }}
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <div>
                        <Text type="secondary">Tên khách hàng:</Text>
                        <div>
                          <Text strong>{invoice.tenKhachHang}</Text>
                        </div>
                      </div>
                      {invoice.emailKhachHang &&
                        invoice.emailKhachHang !== "N/A" && (
                          <div>
                            <Text type="secondary">Email:</Text>
                            <div>
                              <Text>{invoice.emailKhachHang}</Text>
                            </div>
                          </div>
                        )}
                      <div>
                        <Text type="secondary">
                          <PhoneOutlined /> Số điện thoại:
                        </Text>
                        <div>
                          <Text>{invoice.sdtKhachHang || "N/A"}</Text>
                        </div>
                      </div>
                      {invoice.diaChiKhachHang && (
                        <div>
                          <Text type="secondary">
                            <EnvironmentOutlined /> Địa chỉ giao hàng:
                          </Text>
                          <div>
                            <Text>{invoice.diaChiKhachHang}</Text>
                          </div>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={
                      <>
                        <DollarOutlined /> Thông tin thanh toán
                      </>
                    }
                    style={{ height: "100%" }}
                  >
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                      size="small"
                    >
                      <div>
                        <Text type="secondary">Nhân viên phục vụ:</Text>
                        <div>
                          <Text strong>{invoice.tenNhanVien || "N/A"}</Text>
                        </div>
                      </div>
                      <div>
                        <Text type="secondary">Phương thức thanh toán:</Text>
                        <div>
                          <Text>{invoice.hinhThucThanhToan || "N/A"}</Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>

              {/* Danh sách sản phẩm */}
              <Card
                title={
                  <>
                    <ShoppingOutlined /> Danh sách sản phẩm
                  </>
                }
                style={{ marginBottom: 16 }}
              >
                {invoice.chiTietSanPhams &&
                invoice.chiTietSanPhams.length > 0 ? (
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
                <Text type="secondary">{invoice.ghiChu || "N/A"}</Text>
              </Card>
            </Col>

            {/* Cột phải */}
            <Col xs={24} lg={8}>
              {/* Tóm tắt đơn hàng */}
              <Card title="Tóm tắt đơn hàng" style={{ marginBottom: 16 }}>
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="middle"
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Tạm tính:</Text>
                    <Text strong>{formatMoney(invoice.tongTien)}</Text>
                  </div>

                  {/* Chỉ hiển thị phí vận chuyển nếu KHÔNG phải tại quầy */}
                  {!invoice.loaiHoaDon && invoice.phiVanChuyen > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Phí vận chuyển:</Text>
                      <Text strong>{formatMoney(invoice.phiVanChuyen)}</Text>
                    </div>
                  )}

                  {/* Giảm giá */}
                  {invoice.tongTienSauGiam &&
                    invoice.tongTienSauGiam !== invoice.tongTien && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          color: "#ff4d4f",
                        }}
                      >
                        <Text type="danger">Giảm giá:</Text>
                        <Text type="danger" strong>
                          -
                          {formatMoney(
                            invoice.tongTien - invoice.tongTienSauGiam
                          )}
                        </Text>
                      </div>
                    )}

                  <Divider style={{ margin: "8px 0" }} />

                  {/* Tổng cộng: nếu là tại quầy thì không cộng phí ship */}
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text strong style={{ fontSize: 16 }}>
                      Tổng cộng:
                    </Text>
                    <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>
                      {formatMoney(
                        (invoice.tongTienSauGiam ?? invoice.tongTien) +
                          (!invoice.loaiHoaDon ? invoice.phiVanChuyen || 0 : 0)
                      )}
                    </Text>
                  </div>
                </Space>
              </Card>

              {/* Lịch sử đơn hàng */}
              <Card
                title={
                  <>
                    <ClockCircleOutlined /> Lịch sử đơn hàng
                  </>
                }
                className="history-section"
              >
                {lichSuHoaDon && lichSuHoaDon.length > 0 ? (
                  <Timeline
                    items={lichSuHoaDon.map((item, index) => ({
                      dot: (
                        <span style={{ fontSize: 18 }}>
                          {getTimelineIcon(item.hanhDong)}
                        </span>
                      ),
                      color: index === 0 ? "green" : "gray",
                      children: (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <Text strong>{item.hanhDong}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDate(item.ngayCapNhat)}
                            </Text>
                          </div>
                          {item.moTa && (
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 13,
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              {item.moTa}
                            </Text>
                          )}
                          {item.nguoiThucHien && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <UserOutlined /> Người thực hiện:{" "}
                              <Text strong style={{ fontSize: 12 }}>
                                {item.nguoiThucHien}
                              </Text>
                            </Text>
                          )}
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Timeline
                    items={[
                      {
                        dot: "📅",
                        children: (
                          <Space>
                            <Text type="secondary">
                              {formatDate(invoice.ngayTao)}
                            </Text>
                            <Text>Đơn hàng được tạo thành công</Text>
                          </Space>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      <Modal
        title={
          <Space>
            <MailOutlined /> Gửi hóa đơn qua email
          </Space>
        }
        open={emailModalVisible}
        onCancel={handleCancelEmail}
        footer={null}
        width={600}
      >
        <Form form={emailForm} layout="vertical" onFinish={handleEmailSubmit}>
          <Form.Item
            label="Email người nhận"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input placeholder="example@email.com" prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            label="Tiêu đề"
            name="subject"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Tiêu đề email" />
          </Form.Item>

          <Form.Item
            label="Nội dung"
            name="message"
            rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
          >
            <Input.TextArea rows={6} placeholder="Nội dung email..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancelEmail}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={sendingEmail}
                icon={<MailOutlined />}
              >
                Gửi email
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DetailHoaDon;
