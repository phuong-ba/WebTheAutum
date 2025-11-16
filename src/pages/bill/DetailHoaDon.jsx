import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Timeline,
  Spin,
  Divider,
  Row,
  Col,
  Typography,
  Empty,
  Modal,
  Input,
  Form,
  Select,
  message,
  InputNumber,
} from "antd";
import {
  EditOutlined,
  PrinterOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import hoaDonApi from "../../api/HoaDonAPI";
import { fetchNhanVien } from "@/services/nhanVienService";
import { fetchPhuongThuc } from "@/services/phuongThucThanhToanService";
import BillOrderInformation from "./BillOrderInformation";
import BillInvoiceStatus from "./BillInvoiceStatus";
import BillInvoiceHistory from "./BillInvoiceHistory";
import { FloppyDiskIcon, XCircleIcon, XIcon } from "@phosphor-icons/react";
import BillProduct from "./BillProduct";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [formErrors, setFormErrors] = useState({});
  const [nhanVienList, setNhanVienList] = useState([]);
  const [phuongThucList, setPhuongThucList] = useState([]);
  const [tempStatus, setTempStatus] = useState(0);
  const [tempLoaiHoaDon, setTempLoaiHoaDon] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [showBillProduct, setShowBillProduct] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState({});
  const [tinhList, setTinhList] = useState([]);
  const [localQuanList, setLocalQuanList] = useState([]);
  const [addressForm] = Form.useForm();
  const handleTempStatusChange = (newStatus) => {
    setTempStatus(newStatus);
  };

  const handleLoaiHoaDonChange = (newLoaiHoaDon) => {
    setTempLoaiHoaDon(newLoaiHoaDon);
  };
  const handleTinhChange = async (idTinh) => {
    addressForm.setFieldsValue({ quan: null });

    if (quanMap[idTinh]) {
      setLocalQuanList(quanMap[idTinh]);
      return quanMap[idTinh];
    }

    try {
      const res = await diaChiApi.getQuanByTinh(idTinh);
      setQuanMap((prev) => ({ ...prev, [idTinh]: res }));
      setLocalQuanList(res);
      return res;
    } catch (err) {
      console.error("Lỗi load quận/huyện:", err);
      messageApi.error("Không thể tải danh sách quận/huyện");
      throw err;
    }
  };
  const handleEditToggle = () => {
    setIsEditing(true);
    setTempStatus(invoice?.trangThai || 0);
    setTempLoaiHoaDon(invoice?.loaiHoaDon || false);

    editForm.setFieldsValue({
      hoTenKhachHang: invoice.tenKhachHang,
      sdtKhachHang: invoice.sdtKhachHang,
      emailKhachHang: invoice.emailKhachHang,
      diaChiKhachHang: invoice.diaChiKhachHang,
      ghiChu: invoice.ghiChu,
      trangThai: invoice.trangThai,
      loaiHoaDon: invoice.loaiHoaDon,
      hinhThucThanhToan: invoice.hinhThucThanhToan,
      tenNhanVien: invoice.tenNhanVien,
      idNhanVien: invoice.idNhanVien,
      idPhuongThucThanhToan: invoice.idPhuongThucThanhToan,
    });
  };

  const validationRules = {
    hoTenKhachHang: [
      { required: true, message: "Vui lòng nhập tên khách hàng!" },
      { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
      { max: 100, message: "Tên không được quá 100 ký tự!" },
      {
        pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
        message: "Tên chỉ được chứa chữ cái và khoảng trắng!",
      },
    ],
    sdtKhachHang: [
      { required: true, message: "Vui lòng nhập số điện thoại!" },
      {
        pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
        message: "Số điện thoại không hợp lệ (VD: 0912345678)!",
      },
    ],
    emailKhachHang: [{ type: "email", message: "Email không hợp lệ!" }],
    diaChiKhachHang: [
      { required: true, message: "Vui lòng nhập địa chỉ!" },
      { min: 10, message: "Địa chỉ phải có ít nhất 10 ký tự!" },
      { max: 200, message: "Địa chỉ không được quá 200 ký tự!" },
    ],
    tenNhanVien: [
      { max: 100, message: "Tên nhân viên không được quá 100 ký tự!" },
    ],
    ghiChu: [{ max: 500, message: "Ghi chú không được quá 500 ký tự!" }],
    trangThai: [{ required: true, message: "Vui lòng chọn trạng thái!" }],
    hinhThucThanhToan: [
      { required: true, message: "Vui lòng chọn hình thức thanh toán!" },
    ],
    idNhanVien: [{ required: true, message: "Vui lòng chọn nhân viên!" }],
    idPhuongThucThanhToan: [
      { required: true, message: "Vui lòng chọn phương thức thanh toán!" },
    ],
  };

  const handleSave = async () => {
    try {
      const values = await editForm.validateFields();

      await hoaDonApi.updateHoaDon(id, {
        ...values,
        trangThai: tempStatus,
        loaiHoaDon: tempLoaiHoaDon,
      });

      message.success("✅ Cập nhật thành công!");
      setIsEditing(false);
      setFormErrors({});
      fetchInvoiceDetail();
    } catch (err) {
      if (err.errorFields) {
        message.error("❌ Vui lòng kiểm tra lại thông tin!");
      } else {
        message.error(
          "❌ Lưu thất bại! " + (err.response?.data?.message || "")
        );
      }
    }
  };
  const openAddressModal = async () => {
    if (!invoice?.khachHangId) {
      messageApi.warning("Không có thông tin khách hàng!");
      return;
    }

    try {
      // Giả sử bạn có API lấy danh sách địa chỉ khách hàng
      // Nếu không có → dùng dữ liệu từ invoice hoặc gọi API
      const addresses = invoice.allAddresses || [];

      if (addresses.length === 0) {
        messageApi.info("Khách hàng chưa có địa chỉ nào.");
        return;
      }

      const tinhIds = [
        ...new Set(
          addresses
            .map((addr) => addr.tinhThanhId || addr.id_tinh || addr.idTinh)
            .filter(Boolean)
        ),
      ];

      const newQuanMap = { ...quanMap };
      await Promise.all(
        tinhIds.map(async (idTinh) => {
          if (!newQuanMap[idTinh]) {
            try {
              const res = await diaChiApi.getQuanByTinh(idTinh);
              newQuanMap[idTinh] = res;
            } catch (err) {
              console.error(`Lỗi load quận cho tỉnh ${idTinh}:`, err);
              newQuanMap[idTinh] = [];
            }
          }
        })
      );

      setQuanMap(newQuanMap);

      const normalized = addresses.map((addr) => {
        const idTinh = addr.tinhThanhId || addr.id_tinh || addr.idTinh;
        const idQuan = addr.quanHuyenId || addr.id_quan || addr.idQuan;

        const tinh = tinhList.find((t) => t.id === idTinh);
        const quanList = newQuanMap[idTinh] || [];
        const quan = quanList.find((q) => q.id === idQuan);

        return {
          ...addr,
          tinhTen: addr.tenTinh || tinh?.tenTinh || "Không xác định",
          quanTen: addr.tenQuan || quan?.tenQuan || "Không xác định",
          diaChiCuThe: addr.dia_chi_cu_the || addr.diaChiCuThe || "",
        };
      });

      setCustomerAddresses(normalized);
      setAddressModalVisible(true);
    } catch (err) {
      console.error("Lỗi tải địa chỉ:", err);
      messageApi.error("Không thể tải danh sách địa chỉ");
    }
  };
  const handleSelectAddress = async (record) => {
    const idTinh =
      record.tinhThanhId || record.id_tinh || record.idTinh || record.thanhPho;
    const idQuan =
      record.quanHuyenId || record.id_quan || record.idQuan || record.quan;
    const diaChiCuThe = record.dia_chi_cu_the || record.diaChiCuThe || "";

    try {
      if (idTinh && !quanMap[idTinh]) {
        const res = await diaChiApi.getQuanByTinh(idTinh);
        setQuanMap((prev) => ({ ...prev, [idTinh]: res }));
      }

      const fullAddress = `${diaChiCuThe}, ${record.quanTen}, ${record.tinhTen}`;

      // Cập nhật form nếu đang edit
      if (isEditing) {
        editForm.setFieldsValue({
          diaChiKhachHang: fullAddress,
        });
      }

      // Cập nhật invoice để hiển thị
      setInvoice((prev) => ({
        ...prev,
        diaChiKhachHang: fullAddress,
      }));

      messageApi.success("Đã chọn địa chỉ thành công!");
    } catch (err) {
      console.error("Lỗi khi chọn địa chỉ:", err);
      messageApi.error("Không thể cập nhật địa chỉ");
    } finally {
      setAddressModalVisible(false);
    }
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormErrors({});
    setTempStatus(invoice?.trangThai || 0);
    setTempLoaiHoaDon(invoice?.loaiHoaDon || false);
    editForm.resetFields();
  };

  useEffect(() => {
    fetchInvoiceDetail();
    fetchLichSuHoaDon();
    checkCanEdit();
    fetchAllNhanVien();
    getAllPhuongThucThanhToan();
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
      console.log("📦 Full response:", response);
      console.log("📦 Response data:", response.data);
      console.log("📦 Response data.data:", response.data?.data);

      let invoiceData = response.data?.data || response.data;

      console.log("✅ Invoice data sau khi parse:", invoiceData);
      console.log(
        "🔍 Tất cả keys trong invoiceData:",
        Object.keys(invoiceData || {})
      );

      console.log("🔍 Các field quan trọng:");
      console.log("  - id:", invoiceData?.id);
      console.log("  - maHoaDon:", invoiceData?.maHoaDon);
      console.log("  - trangThai:", invoiceData?.trangThai);
      console.log("  - loaiHoaDon:", invoiceData?.loaiHoaDon);

      if (!invoiceData || !invoiceData.id) {
        throw new Error("Dữ liệu hóa đơn không hợp lệ");
      }

      setInvoice(invoiceData);
      setTempStatus(invoiceData.trangThai || 0);
      setTempLoaiHoaDon(invoiceData.loaiHoaDon || false);
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

  const fetchAllNhanVien = async () => {
    try {
      const res = await fetchNhanVien();
      console.log("👥 Danh sách nhân viên:", res.data);
      setNhanVienList(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải nhân viên:", err);
    }
  };

  const getAllPhuongThucThanhToan = async () => {
    try {
      const res = await fetchPhuongThuc();
      console.log("💳 Danh sách phương thức:", res.data);
      setPhuongThucList(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải phương thức:", err);
    }
  };

  const handlePrint = () => {
    if (!invoice) return;

    const printArea = document.querySelector(".print-area");
    const clone = printArea.cloneNode(true);

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

    const printContent = clone;
    printContent.style.zoom = "0.9";
    printContent.style.transform = "scale(0.9)";
    printContent.style.transformOrigin = "top left";
    printContent.style.width = "calc(100% / 0.9)";

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

    body, .print-area {
      font-size: 14px !important;
      line-height: 1.6 !important;
    }

    h1, h2, h3, .ant-card-head-title {
      font-weight: bold !important;
      color: #333 !important;
    }

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

  const handleSendEmail = () => {
    if (!invoice) return;

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
      2: { label: "Đang giao hàng", color: "cyan" },
      3: { label: "Đã hoàn thành", color: "success" },
      4: { label: "Đã hủy", color: "error" },
    };
    const config = statusMap[status] || {
      label: "Không xác định",
      color: "default",
    };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getTimelineIcon = (hanhDong) => {
    if (hanhDong?.includes("Tạo")) return "📝";
    if (hanhDong?.includes("Cập nhật")) return "✏️";
    if (hanhDong?.includes("Xác nhận")) return "✅";
    if (hanhDong?.includes("Hủy")) return "❌";
    if (hanhDong?.includes("Giao")) return "🚚";
    return "📋";
  };

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
      render: (value, record) => {
        // Dùng state để lưu tạm số lượng khi chỉnh sửa
        const currentQuantity = editingQuantities[record.id] ?? value;

        return isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDecreaseQuantity(record.id)}
              className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={currentQuantity <= 1}
            >
              -
            </button>

            <InputNumber
              min={1}
              max={1000}
              value={currentQuantity}
              onChange={(val) => handleQuantityChange(record.id, val)}
              onBlur={() => handleApplyQuantity(record.id)}
              onPressEnter={(e) => handleQuantityKeyPress(e, record.id)}
              style={{
                width: 40,
                textAlign: "center",
              }}
              className="no-spinner"
              size="small"
            />

            <button
              onClick={() => handleIncreaseQuantity(record.id)}
              className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
        ) : (
          <span>{value}</span>
        );
      },
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

  if (!invoice) return null;

  return (
    <div
      style={{ padding: 24, backgroundColor: "#f5f5f5", minHeight: "100vh" }}
      className="detail-hoadon"
    >
      <div style={{ margin: "0 auto" }} className="print-area">
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
                CHI TIẾT ĐƠN HÀNG
              </Title>
              <Text type="secondary">Mã đơn hàng: {invoice.maHoaDon}</Text>
            </div>
            <Space>
              {isEditing ? (
                <Space>
                  <div
                    className="flex gap-1 items-center cursor-pointer select-none text-center py-2 px-6 rounded-lg bg-[#E67E22] font-bold text-sm text-white hover:bg-cyan-800 active:bg-cyan-800 shadow transition-colors"
                    onClick={handleSave}
                  >
                    <FloppyDiskIcon size={20} weight="fill" /> Lưu
                  </div>
                  <div
                    className="flex gap-1 items-center cursor-pointer select-none  text-center py-2 px-6 rounded-lg bg-[#777676] font-bold text-sm text-white   hover:bg-red-600 active:bg-rose-900 border  active:border-[#808080] shadow transition-colors"
                    onClick={handleCancelEdit}
                  >
                    <XCircleIcon size={20} weight="fill" /> Hủy
                  </div>
                </Space>
              ) : canEdit ? (
                <div
                  onClick={handleEditToggle}
                  className="font-bold text-sm py-2 px-4 min-w-[120px] cursor-pointer select-none text-center rounded-md bg-[#E67E22] text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
                >
                  Chỉnh sửa
                </div>
              ) : (
                <Button icon={<LockOutlined />} disabled>
                  Không thể sửa
                </Button>
              )}

              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                In đơn hàng
              </Button>
              <Button icon={<MailOutlined />} onClick={handleSendEmail}>
                Gửi email
              </Button>
            </Space>
          </div>
        </Card>

        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <BillInvoiceStatus
                invoiceId={id}
                currentStatus={invoice?.trangThai}
                invoiceData={invoice}
                isEditing={isEditing}
                tempStatus={tempStatus}
                tempLoaiHoaDon={tempLoaiHoaDon}
                onTempStatusChange={handleTempStatusChange}
                onLoaiHoaDonChange={handleLoaiHoaDonChange}
                onStatusChange={(newStatus) => {
                  setInvoice((prev) =>
                    prev ? { ...prev, trangThai: newStatus } : null
                  );
                  fetchInvoiceDetail();
                }}
              />

              <Row
                gutter={16}
                style={{ marginBottom: 16 }}
                className="customer-payment-row"
              >
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <div className="flex justify-between items-center">
                        <div>
                          <UserOutlined /> Thông tin khách hàng
                        </div>
                        {isEditing && (
                          <div
                            className="cursor-pointer select-none text-center py-2 px-6 rounded-lg bg-[#E67E22] font-bold text-sm text-white hover:bg-amber-600 active:bg-cyan-800 shadow transition-colors"
                            onClick={openAddressModal}
                          >
                            Chọn địa chỉ
                          </div>
                        )}
                      </div>
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
                        {isEditing ? (
                          <Form.Item
                            name="hoTenKhachHang"
                            rules={validationRules.hoTenKhachHang}
                            style={{ marginBottom: 0, marginTop: 4 }}
                          >
                            <Input placeholder="Nhập tên khách hàng..." />
                          </Form.Item>
                        ) : (
                          <div>
                            <Text strong>{invoice.tenKhachHang}</Text>
                          </div>
                        )}
                      </div>

                      <div>
                        <Text type="secondary">Email:</Text>
                        {isEditing ? (
                          <Form.Item
                            name="emailKhachHang"
                            rules={validationRules.emailKhachHang}
                            style={{ marginBottom: 0, marginTop: 4 }}
                          >
                            <Input placeholder="email@example.com" />
                          </Form.Item>
                        ) : (
                          <div>
                            <Text strong>{invoice.emailKhachHang}</Text>
                          </div>
                        )}
                      </div>

                      <div>
                        <Text type="secondary">Số điện thoại:</Text>
                        {isEditing ? (
                          <Form.Item
                            name="sdtKhachHang"
                            rules={validationRules.sdtKhachHang}
                            style={{ marginBottom: 0, marginTop: 4 }}
                          >
                            <Input placeholder="0912345678" />
                          </Form.Item>
                        ) : (
                          <div>
                            <Text strong>{invoice.sdtKhachHang}</Text>
                          </div>
                        )}
                      </div>

                      <Row gutter={16} wrap>
                        <Col flex="1">
                          <Form.Item
                            name="thanhPho"
                            label="Tỉnh/Thành phố"
                            rules={[
                              { required: true, message: "Chọn tỉnh/thành!" },
                            ]}
                          >
                            <Select
                              placeholder="Chọn tỉnh/thành"
                              onChange={handleTinhChange}
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                option.children
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            >
                              {tinhList.map((t) => (
                                <Select.Option key={t.id} value={t.id}>
                                  {t.tenTinh}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col flex="1">
                          <Form.Item
                            name="quan"
                            label="Quận/Huyện"
                            rules={[
                              { required: true, message: "Chọn quận/huyện!" },
                            ]}
                          >
                            <Select
                              placeholder="Chọn quận/huyện"
                              disabled={!localQuanList.length}
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                option.children
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            >
                              {localQuanList.map((q) => (
                                <Select.Option key={q.id} value={q.id}>
                                  {q.tenQuan}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        name="diaChiCuThe"
                        label="Số nhà, đường"
                        rules={[{ required: true, message: "Nhập địa chỉ" }]}
                      >
                        <Input placeholder="Nhập địa chỉ cụ thể" />
                      </Form.Item>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <BillOrderInformation />
                </Col>
              </Row>

              <Card
                title={
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <ShoppingOutlined /> Danh sách sản phẩm chọn
                      </div>
                      {isEditing && (
                        <div
                          onClick={() => setShowBillProduct((prev) => !prev)}
                          className="cursor-pointer select-none text-center py-2 px-6 rounded-lg bg-[#E67E22] font-bold text-xs  text-white hover:bg-amber-600 active:bg-cyan-800 shadow"
                        >
                          Thêm sản phẩm
                        </div>
                      )}
                    </div>
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

              {showBillProduct && (
                <div style={{ marginBottom: 16 }}>
                  <BillProduct />
                </div>
              )}

              <Card title="Ghi chú của khách" style={{ marginBottom: 16 }}>
                <div>
                  <Text type="secondary">Ghi chú:</Text>
                  {isEditing ? (
                    <Form.Item
                      name="ghiChu"
                      rules={validationRules.ghiChu}
                      style={{ marginBottom: 0, marginTop: 4 }}
                    >
                      <Input.TextArea rows={3} placeholder="Nhập ghi chú..." />
                    </Form.Item>
                  ) : (
                    <div>
                      <Text>{invoice.ghiChu || "Không có ghi chú"}</Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
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
                              Người thực hiện:{" "}
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
                        dot: "",
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
              <BillInvoiceHistory />
            </Col>
          </Row>
        </Form>
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
              <Button type="primary" htmlType="submit" loading={sendingEmail}>
                Gửi email
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {addressModalVisible && (
        <Modal
          title={
            <span className="text-xl font-bold">Chọn địa chỉ giao hàng</span>
          }
          open={addressModalVisible}
          onCancel={() => setAddressModalVisible(false)}
          footer={null}
          width={800}
        >
          <Table
            dataSource={customerAddresses}
            rowKey={(record) =>
              record.id ||
              `${record.tinhThanhId}-${record.quanHuyenId}-${record.diaChiCuThe}`
            }
            pagination={false}
            onRow={(record) => ({
              onClick: () => handleSelectAddress(record),
              className: "cursor-pointer hover:bg-blue-50",
            })}
            columns={[
              {
                title: <strong>Tên địa chỉ</strong>,
                dataIndex: "tenDiaChi",
                key: "tenDiaChi",
                render: (text) => (
                  <span className="font-medium">{text || "—"}</span>
                ),
              },
              {
                title: <strong>Tỉnh/Thành phố</strong>,
                dataIndex: "tinhTen",
                key: "tinhTen",
                width: "30%",
              },
              {
                title: <strong>Quận/Huyện</strong>,
                dataIndex: "quanTen",
                key: "quanTen",
                width: "30%",
              },
              {
                title: <strong>Số nhà, đường</strong>,
                dataIndex: "diaChiCuThe",
                key: "diaChiCuThe",
                render: (text) => text || "—",
              },
            ]}
          />
          {customerAddresses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Khách hàng chưa có địa chỉ nào được lưu.
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default DetailHoaDon;
