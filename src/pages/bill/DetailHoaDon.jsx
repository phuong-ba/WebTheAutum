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
  Alert,
  Statistic,
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import hoaDonApi from "../../api/HoaDonAPI";
import { fetchNhanVien } from "@/services/nhanVienService";
import { fetchPhuongThuc } from "@/services/phuongThucThanhToanService";
import BillOrderInformation from "./BillOrderInformation";
import BillInvoiceStatus from "./BillInvoiceStatus";
import BillInvoiceHistory from "./BillInvoiceHistory";
import { diaChiApi } from "/src/api/diaChiApi";
import BillBreadcrumb from "./BillBreadcrumb";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const HoanTienModal = ({ visible, onCancel, onSuccess, hoaDonId, invoice }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [kiemTraLoading, setKiemTraLoading] = useState(false);
  const [lyDoMau, setLyDoMau] = useState([]);
  const [dieuKien, setDieuKien] = useState(null);
  const [lichSuHoanTien, setLichSuHoanTien] = useState([]);
  const [showLichSu, setShowLichSu] = useState(false);
  const [nhanVienId] = useState(localStorage.getItem("userId") || 1);

  // Load lý do mẫu
  useEffect(() => {
    if (visible) {
      loadLyDoMau();
      loadLichSuHoanTien();
    }
  }, [visible, hoaDonId]);

  // Kiểm tra điều kiện khi mở modal
  useEffect(() => {
    if (visible && hoaDonId) {
      kiemTraDieuKienHoanTien();
    }
  }, [visible, hoaDonId]);

  const loadLyDoMau = async () => {
    try {
      const response = await hoaDonApi.getLyDoHoanTienMau();
      setLyDoMau(response.data.data || []);
    } catch (error) {
      console.error("Lỗi tải lý do mẫu:", error);
      message.error("Không thể tải danh sách lý do mẫu");
    }
  };

  const loadLichSuHoanTien = async () => {
    try {
      const response = await hoaDonApi.getLichSuHoanTien(hoaDonId);
      setLichSuHoanTien(response.data.lichSuHoanTien || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử hoàn tiền:", error);
    }
  };

  const kiemTraDieuKienHoanTien = async () => {
    try {
      setKiemTraLoading(true);
      const response = await hoaDonApi.kiemTraHoanTien(hoaDonId);

      if (response.data.success) {
        setDieuKien(response.data);

        // Set giá trị mặc định cho form
        if (response.data.coTheHoanTien && response.data.hoaDon) {
          form.setFieldsValue({
            lyDoHoanTien: null,
            soTienHoan: response.data.soTienCoTheHoan,
            ghiChuBoSung: "",
            idNhanVienThucHien: parseInt(nhanVienId),
          });
        }
      } else {
        message.error(
          response.data.message || "Không thể kiểm tra điều kiện hoàn tiền"
        );
      }
    } catch (error) {
      console.error("Lỗi kiểm tra điều kiện:", error);
      message.error("Lỗi khi kiểm tra điều kiện hoàn tiền");
    } finally {
      setKiemTraLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const requestData = {
        lyDoHoanTien: values.lyDoHoanTien,
        soTienHoan: values.soTienHoan,
        ghiChuBoSung: values.ghiChuBoSung,
        idNhanVienThucHien: parseInt(values.idNhanVienThucHien),
      };

      const response = await hoaDonApi.hoanTienHoaDon(hoaDonId, requestData);

      if (response.data.success) {
        message.success(response.data.message || "Hoàn tiền thành công!");

        // Reset form
        form.resetFields();

        // Gọi callback thành công
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Đóng modal
        onCancel();
      } else {
        message.error(response.data.message || "Hoàn tiền thất bại!");
      }
    } catch (error) {
      console.error("Lỗi hoàn tiền:", error);
      message.error(
        error.response?.data?.message || "Lỗi khi thực hiện hoàn tiền"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDieuKien(null);
    setShowLichSu(false);
    onCancel();
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
    return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
  };

  const columnsLichSu = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, record, index) => index + 1,
    },
    {
      title: "Ngày hoàn tiền",
      dataIndex: "ngayThanhToan",
      key: "ngayThanhToan",
      render: (date) => formatDate(date),
    },
    {
      title: "Số tiền",
      dataIndex: "soTien",
      key: "soTien",
      align: "right",
      render: (amount) => (
        <Text strong style={{ color: "#ff4d4f" }}>
          {formatMoney(amount)}
        </Text>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "lyDo",
      key: "lyDo",
      render: (lyDo, record) =>
        lyDo ||
        record.ghiChu?.replace("[HOÀN TIỀN] ", "")?.split(" - ")[0] ||
        "—",
    },
    {
      title: "Phương thức",
      dataIndex: ["phuongThucThanhToan", "ten"],
      key: "phuongThuc",
      render: (ten, record) =>
        ten || record.phuongThucThanhToan?.tenPhuongThucThanhToan || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      render: (status) => (
        <Tag color={status ? "success" : "default"}>
          {status ? "Thành công" : "Đang xử lý"}
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: "#faad14" }} />
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
            Hoàn Tiền Hóa Đơn
          </span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
      centered
    >
      {!dieuKien ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <ReloadOutlined
            spin
            style={{ fontSize: "40px", color: "#1890ff", marginBottom: "20px" }}
          />
          <Text type="secondary">Đang kiểm tra điều kiện hoàn tiền...</Text>
        </div>
      ) : !dieuKien.coTheHoanTien ? (
        <Alert
          message="KHÔNG THỂ HOÀN TIỀN"
          description={
            <div style={{ marginTop: "10px" }}>
              <Text>{dieuKien.lyDoKhongTheHoanTien}</Text>
              {dieuKien.hoaDon && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "4px",
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Mã hóa đơn:</Text>
                      <div>{dieuKien.hoaDon.maHoaDon}</div>
                    </Col>
                    <Col span={12}>
                      <Text strong>Trạng thái:</Text>
                      <div>{dieuKien.hoaDon.trangThaiText}</div>
                    </Col>
                  </Row>
                  {dieuKien.soNgayTruocKhiHoanTien > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <Text strong>Thời gian từ thanh toán:</Text>
                      <div>{dieuKien.soNgayTruocKhiHoanTien} ngày</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      ) : (
        <>
          {/* Thông tin hóa đơn */}
          <Card size="small" style={{ marginBottom: "20px" }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Mã hóa đơn"
                  value={dieuKien.hoaDon.maHoaDon}
                  valueStyle={{ fontSize: "16px", fontWeight: "bold" }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tổng tiền"
                  value={formatMoney(dieuKien.hoaDon.tongTienSauGiam)}
                  valueStyle={{
                    color: "#ff4d4f",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Trạng thái"
                  value={dieuKien.hoaDon.trangThaiText}
                  valueStyle={{ color: "#52c41a", fontSize: "16px" }}
                />
              </Col>
            </Row>
            {dieuKien.thoiGianConLai !== undefined && (
              <Alert
                message={`Thời gian còn lại để hoàn tiền: ${dieuKien.thoiGianConLai} ngày`}
                type="info"
                showIcon
                style={{ marginTop: "10px" }}
              />
            )}
          </Card>

          {/* Lịch sử hoàn tiền (nếu có) */}
          {lichSuHoanTien.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <Button
                type="link"
                icon={<HistoryOutlined />}
                onClick={() => setShowLichSu(!showLichSu)}
              >
                {showLichSu
                  ? "Ẩn lịch sử hoàn tiền"
                  : `Xem lịch sử hoàn tiền (${lichSuHoanTien.length})`}
              </Button>
              {showLichSu && (
                <Table
                  columns={columnsLichSu}
                  dataSource={lichSuHoanTien}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  style={{ marginTop: "10px" }}
                />
              )}
            </div>
          )}

          {/* Form hoàn tiền */}
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Lý do hoàn tiền"
              name="lyDoHoanTien"
              rules={[
                { required: true, message: "Vui lòng chọn lý do hoàn tiền!" },
              ]}
            >
              <Select
                placeholder="Chọn lý do hoàn tiền"
                showSearch
                optionFilterProp="children"
                options={lyDoMau.map((item) => ({
                  value: item.ten,
                  label: (
                    <div>
                      <div>{item.ten}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {item.moTa}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Số tiền hoàn"
              name="soTienHoan"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền hoàn!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value <= 0) {
                      return Promise.reject(
                        new Error("Số tiền phải lớn hơn 0!")
                      );
                    }
                    if (value > dieuKien.soTienCoTheHoan) {
                      return Promise.reject(
                        new Error(
                          `Không thể hoàn quá ${formatMoney(
                            dieuKien.soTienCoTheHoan
                          )}!`
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={dieuKien.soTienCoTheHoan}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                addonAfter="VND"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "4px",
                  }}
                >
                  <Text type="secondary">Số tiền có thể hoàn:</Text>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#52c41a",
                    }}
                  >
                    {formatMoney(dieuKien.soTienCoTheHoan)}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Nhân viên thực hiện"
                  name="idNhanVienThucHien"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập nhân viên thực hiện!",
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="Mã nhân viên"
                    defaultValue={parseInt(nhanVienId)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Ghi chú bổ sung" name="ghiChuBoSung">
              <TextArea
                rows={3}
                placeholder="Nhập ghi chú bổ sung (nếu có)..."
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={handleCancel}>
                  <CloseCircleOutlined /> Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Xác nhận hoàn tiền
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

// Main DetailHoaDon Component
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
  const [tempStatus, setTempStatus] = useState(0);
  const [tempLoaiHoaDon, setTempLoaiHoaDon] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [editingQuantities, setEditingQuantities] = useState({});
  const [tinhList, setTinhList] = useState([]);
  const [quanMap, setQuanMap] = useState({});
  const [localQuanList, setLocalQuanList] = useState([]);
  const [addressForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Hoàn tiền state
  const [hoanTienModalVisible, setHoanTienModalVisible] = useState(false);
  const [kiemTraHoanTienLoading, setKiemTraHoanTienLoading] = useState(false);
  const [kiemTraHoanTienResult, setKiemTraHoanTienResult] = useState(null);
  const [lichSuThanhToan, setLichSuThanhToan] = useState([]);

  const [canEditCustomerInfo, setCanEditCustomerInfo] = useState(false);
  const [canEditProducts, setCanEditProducts] = useState(false);
  const [tongTien, setTongTien] = useState(0);
  const [invoiceProducts, setInvoiceProducts] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [phuongThucList, setPhuongThucList] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const getProductKey = (product) => {
    return product.idChiTietSanPham;
  };

  useEffect(() => {
    return () => {
      setIsEditing(false);
      setCanEdit(false);
    };
  }, []);

  useEffect(() => {
    if (invoice) {
      checkEditPermissions(invoice.trangThai);
      setCanEdit(invoice.trangThai === 0);
    }
  }, [invoice]);

  const fetchLichSuThanhToan = async () => {
    try {
      const response = await hoaDonApi.getLichSuThanhToan(id);
      setLichSuThanhToan(response.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử thanh toán:", err);
      setLichSuThanhToan([]);
    }
  };

  const checkEditPermissions = (status) => {
    const editable = status === 0;

    setCanEdit(editable);
    setCanEditCustomerInfo(editable);
    setCanEditProducts(editable);

    if (!editable && isEditing) {
      setIsEditing(false);
      message.info("Đơn hàng đã chuyển trạng thái, không thể chỉnh sửa");
    }
  };

  useEffect(() => {
    if (invoice && !isEditing && invoice.chiTietSanPhams) {
      setInvoiceProducts(invoice.chiTietSanPhams);
      const initialQuantities = {};
      invoice.chiTietSanPhams.forEach((product) => {
        const key = getProductKey(product);
        initialQuantities[key] = product.soLuong;
      });
      setEditingQuantities(initialQuantities);
    }
  }, [invoice]);

  useEffect(() => {
    diaChiApi
      .getAllTinhThanh()
      .then(setTinhList)
      .catch((err) => {
        console.error("Lỗi load tỉnh/thành:", err);
        messageApi.error("Không thể tải danh sách tỉnh/thành");
      });
  }, [messageApi]);

  const handleTempStatusChange = (newStatus) => {
    setTempStatus(newStatus);
  };

  const handleLoaiHoaDonChange = (newLoaiHoaDon) => {
    setTempLoaiHoaDon(newLoaiHoaDon);
  };

  const handleTinhChange = async (idTinh) => {
    if (!idTinh) {
      setLocalQuanList([]);
      editForm.setFieldsValue({ quan: null });
      return;
    }

    editForm.setFieldsValue({ quan: null });

    if (quanMap[idTinh]) {
      setLocalQuanList(quanMap[idTinh]);
      return;
    }

    try {
      const res = await diaChiApi.getQuanByTinh(idTinh);
      setQuanMap((prev) => ({ ...prev, [idTinh]: res }));
      setLocalQuanList(res);
    } catch (err) {
      console.error("Lỗi load quận/huyện:", err);
      messageApi.error("Không thể tải danh sách quận/huyện");
    }
  };

  const handleEditToggle = () => {
    setIsEditing(true);
    setTempStatus(invoice?.trangThai || 0);
    setTempLoaiHoaDon(invoice?.loaiHoaDon || false);

    const kh = invoice.khachHang || {};

    const defaultAddress = kh.diaChi?.find((addr) => addr.trangThai === true);
    const fallbackAddress = defaultAddress || (kh.diaChi?.[0] ?? null);

    let currentAddress = invoice.diaChiKhachHang || "";
    let diaChiCuThe = "";
    let idTinh = null;
    let idQuan = null;

    if (fallbackAddress) {
      diaChiCuThe = fallbackAddress.diaChiCuThe || "";

      const tinhThanh = fallbackAddress.tinhThanh || {};
      const tenTinh = tinhThanh.tenTinh || "";
      idTinh =
        tinhThanh.id || fallbackAddress.tinhThanhId || fallbackAddress.idTinh;

      const quanHuyen = fallbackAddress.quanHuyen || {};
      const tenQuan = quanHuyen.tenQuan || "";
      idQuan =
        quanHuyen.id || fallbackAddress.quanHuyenId || fallbackAddress.idQuan;

      if (!currentAddress) {
        currentAddress = [diaChiCuThe, tenQuan, tenTinh]
          .filter(Boolean)
          .join(", ");
      }
    }

    editForm.setFieldsValue({
      hoTenKhachHang: kh.hoTen || invoice.tenKhachHang || "",
      sdtKhachHang: kh.sdt || invoice.sdtKhachHang || "",
      emailKhachHang: kh.email || invoice.emailKhachHang || "",
      ghiChu: invoice.ghiChu || "",

      diaChiCuThe: diaChiCuThe,
      thanhPho: idTinh,
      quan: idQuan,
      idDiaChi: fallbackAddress?.id || null,

      trangThai: invoice.trangThai,
      loaiHoaDon: invoice.loaiHoaDon,
      hinhThucThanhToan: invoice.hinhThucThanhToan,
      idNhanVien: invoice.idNhanVien,
      idPhuongThucThanhToan: invoice.idPhuongThucThanhToan,
    });

    if (idTinh) {
      handleTinhChange(idTinh).then(() => {
        editForm.setFieldsValue({ quan: idQuan });
      });
    }
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

      const tenTinh =
        values.thanhPho && tinhList.length > 0
          ? tinhList.find((t) => t.id === values.thanhPho)?.tenTinh || ""
          : "";
      const tenQuan =
        values.thanhPho && quanMap[values.thanhPho]
          ? quanMap[values.thanhPho].find((q) => q.id === values.quan)
              ?.tenQuan || ""
          : "";

      const fullAddress = [values.diaChiCuThe || "", tenQuan, tenTinh]
        .filter(Boolean)
        .join(", ")
        .trim();

      const requestData = {
        ...values,
        idDiaChi: values.idDiaChi ?? null,
        diaChiCuThe: values.diaChiCuThe ?? null,
        thanhPho: values.thanhPho ?? null,
        quan: values.quan ?? null,
        diaChiKhachHang: fullAddress || "Chưa có địa chỉ",

        trangThai: tempStatus,
        loaiHoaDon: tempLoaiHoaDon,
      };

      await hoaDonApi.updateHoaDon(id, requestData);

      message.success("Cập nhật hóa đơn thành công!");
      setIsEditing(false);

      setEditingQuantities({});
      fetchLichSuHoaDon();
      await fetchInvoiceDetail();
      await fetchLichSuThanhToan();
    } catch (err) {
      console.error("Lỗi khi lưu hóa đơn:", err);
      if (err.errorFields) {
        message.error("Vui lòng kiểm tra lại các trường thông tin!");
      } else {
        message.error(
          err.response?.data?.message || "Cập nhật hóa đơn thất bại!"
        );
      }
    }
  };

  const openAddressModal = () => {
    if (!invoice?.khachHang) {
      message.warning("Không có thông tin khách hàng!");
      return;
    }

    const diaChiList = invoice.khachHang.diaChi;
    if (!diaChiList || !Array.isArray(diaChiList) || diaChiList.length === 0) {
      message.info("Khách hàng chưa có địa chỉ nào được lưu.");
      return;
    }

    const addresses = diaChiList.map((addr) => ({
      ...addr,
      tinhTen: addr.tinhThanh || addr.tenTinh || "Không xác định",
      quanTen: addr.quanHuyen || addr.tenQuan || "Không xác định",
      diaChiCuThe: addr.diaChiCuThe || "",
      idTinh: addr.idTinh || addr.tinhThanhId,
      idQuan: addr.idQuan || addr.quanHuyenId,
    }));

    setCustomerAddresses(addresses);
    setAddressModalVisible(true);
  };

  const handleSelectAddress = async (record) => {
    if (!record) return;

    const idTinh = record.idTinh || record.tinhThanhId;
    const idQuan = record.idQuan || record.quanHuyenId;

    const fullAddress = [
      record.diaChiCuThe || "",
      record.quanTen || "",
      record.tinhTen || "",
    ]
      .filter(Boolean)
      .join(", ");

    editForm.setFieldsValue({
      diaChiCuThe: record.diaChiCuThe || "",
      thanhPho: idTinh,
      quan: idQuan,
      idDiaChi: record.id,
    });

    if (idTinh && idQuan) {
      if (!quanMap[idTinh]) {
        const fakeQuanList = [
          { id: idQuan, tenQuan: record.quanTen || "Quận/Huyện" },
        ];
        setQuanMap((prev) => ({ ...prev, [idTinh]: fakeQuanList }));
        setLocalQuanList(fakeQuanList);
      } else if (!quanMap[idTinh].some((q) => q.id === idQuan)) {
        setQuanMap((prev) => ({
          ...prev,
          [idTinh]: [...prev[idTinh], { id: idQuan, tenQuan: record.quanTen }],
        }));
        setLocalQuanList((prev) => [
          ...prev,
          { id: idQuan, tenQuan: record.quanTen },
        ]);
      } else {
        setLocalQuanList(quanMap[idTinh]);
      }
    }

    setInvoice((prev) => ({ ...prev, diaChiKhachHang: fullAddress }));
    message.success("Đã chọn địa chỉ giao hàng!");
    setAddressModalVisible(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingQuantities({});
    setFormErrors({});
    setTempStatus(invoice?.trangThai || 0);
    setTempLoaiHoaDon(invoice?.loaiHoaDon || false);

    editForm.resetFields();

    messageApi.info("Đã hủy thay đổi!");
  };

  // Hoàn tiền functions
  const kiemTraHoanTien = async () => {
    try {
      setKiemTraHoanTienLoading(true);
      const response = await hoaDonApi.kiemTraHoanTien(id);

      if (response.data.success) {
        setKiemTraHoanTienResult(response.data);

        // Nếu có thể hoàn tiền, hiển thị modal
        if (response.data.coTheHoanTien) {
          setHoanTienModalVisible(true);
        } else {
          // Hiển thị thông báo không thể hoàn tiền
          message.warning(
            response.data.lyDoKhongTheHoanTien ||
              "Không thể hoàn tiền cho hóa đơn này"
          );
        }
      } else {
        message.error(
          response.data.message || "Không thể kiểm tra điều kiện hoàn tiền"
        );
      }
    } catch (error) {
      console.error("Lỗi kiểm tra hoàn tiền:", error);
      message.error("Không thể kiểm tra điều kiện hoàn tiền");
    } finally {
      setKiemTraHoanTienLoading(false);
    }
  };

  const handleHoanTienSuccess = (responseData) => {
    // Refresh dữ liệu
    fetchInvoiceDetail();
    fetchLichSuHoaDon();
    fetchLichSuThanhToan();

    // Hiển thị thông báo
    message.success(
      `Đã hoàn tiền ${formatMoney(responseData.soTienHoan)} thành công!`
    );
  };

  const getChiTietSanPhamId = (product) => {
    return (
      product.idChiTietSanPham ||
      product.chiTietSanPham?.id ||
      product.idCTSP ||
      product.id
    );
  };

  useEffect(() => {
    fetchInvoiceDetail();
    fetchLichSuHoaDon();
    fetchLichSuThanhToan();
    checkCanEdit();
    fetchAllNhanVien();
    getAllPhuongThucThanhToan();
  }, [id]);

  useEffect(() => {
    if (location.state?.refreshData) {
      fetchInvoiceDetail();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.refreshData]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      const response = await hoaDonApi.getDetail(id);
      let invoiceData = response.data?.data || response.data;

      if (!invoiceData || !invoiceData.id) {
        throw new Error("Dữ liệu hóa đơn không hợp lệ");
      }

      setInvoice(invoiceData);
      setTempStatus(invoiceData.trangThai || 0);
      setTempLoaiHoaDon(invoiceData.loaiHoaDon || false);

      checkEditPermissions(invoiceData.trangThai || 0);

      setError(null);
    } catch (err) {
      console.error("❌ Lỗi tải chi tiết hóa đơn:", err);
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
      setLichSuHoaDon(response.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử:", err);
      setLichSuHoaDon([]);
    }
  };

  const fetchAllNhanVien = async () => {
    try {
      const res = await fetchNhanVien();
      setNhanVienList(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải nhân viên:", err);
    }
  };

  const getAllPhuongThucThanhToan = async () => {
    try {
      const res = await fetchPhuongThuc();
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
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, record, index) => index + 1,
    },
    {
      title: "Mã vạch",
      dataIndex: "maVach",
      key: "maVach",
      width: 120,
      render: (value) => value || "—",
    },
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
      title: "Giá gốc",
      key: "giaBan",
      width: 120,
      align: "right",
      render: (_, record) => {
        return (
          <div style={{ fontWeight: 500 }}>{formatMoney(record.giaBan)}</div>
        );
      },
    },
    {
      title: "Giá bán",
      key: "giaSauGiam",
      width: 120,
      align: "right",
      render: (_, record) => {
        return (
          <div style={{ fontWeight: 500 }}>
            {formatMoney(record.giaSauGiam)}
          </div>
        );
      },
    },
    {
      title: "Số lượng",
      dataIndex: "soLuong",
      key: "soLuong",
      width: 150,
      align: "center",
      render: (value) => value || "—",
    },
    {
      title: "Thành tiền",
      key: "thanhTien",
      width: 130,
      align: "right",
      render: (_, record) => {
        // Thành tiền = giá sau giảm × số lượng
        const finalPrice = record.giaSauGiam || record.giaBan;
        const total = finalPrice * record.soLuong;

        return (
          <div style={{ fontWeight: 600, color: "#1890ff" }}>
            {formatMoney(total)}
          </div>
        );
      },
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

  const finalTotal = {
    tongTienSanPham: invoice.tongTien || 0,
    phiVanChuyen: invoice.phiVanChuyen || 0,
    tienGiamGia: (() => {
      const hasDiscountInfo =
        invoice.giaTriGiamGia !== undefined && invoice.giaTriGiamGia !== null;

      if (!hasDiscountInfo) {
        console.log("💰 Không có thông tin giảm giá");
        return 0;
      }

      const tongTien = invoice.tongTien || 0;
      const phiVanChuyen = invoice.phiVanChuyen || 0;
      const tongTienTruocGiam = tongTien + phiVanChuyen;

      console.log("💰 Thông tin giảm giá:", {
        loaiGiamGia: invoice.loaiGiamGia,
        giaTriGiamGia: invoice.giaTriGiamGia,
        mucGiaGiamToiDa: invoice.mucGiaGiamToiDa,
        giaTriDonHangToiThieu: invoice.giaTriDonHangToiThieu,
        tongTienTruocGiam: tongTienTruocGiam,
      });

      if (
        invoice.giaTriDonHangToiThieu &&
        tongTienTruocGiam < invoice.giaTriDonHangToiThieu
      ) {
        console.log("❌ Đơn hàng không đạt giá trị tối thiểu");
        return 0;
      }

      let discount = 0;

      if (invoice.loaiGiamGia === true) {
        discount = invoice.giaTriGiamGia || 0;
        console.log("💰 Giảm giá cố định:", discount);
      } else {
        discount = (tongTienTruocGiam * invoice.giaTriGiamGia) / 100;
        console.log(
          "💰 Giảm giá phần trăm:",
          discount,
          `(${invoice.giaTriGiamGia}% của ${tongTienTruocGiam})`
        );
      }

      if (invoice.mucGiaGiamToiDa) {
        discount = Math.min(discount, invoice.mucGiaGiamToiDa);
        console.log("💰 Sau giảm tối đa:", discount);
      }

      discount = Math.min(discount, tongTienTruocGiam);
      console.log("💰 Tiền giảm giá cuối cùng:", discount);

      return discount;
    })(),
    tongTienCuoiCung: invoice.soTien || invoice.tongTienSauGiam || 0,
    phieuGiamGiaInfo:
      invoice.giaTriGiamGia !== undefined && invoice.giaTriGiamGia !== null
        ? {
            maPhieu: invoice.maGiamGia,
            tenPhieu: invoice.tenChuongTrinh,
            loaiGiamGia: invoice.loaiGiamGia,
            giaTriGiamGia: invoice.giaTriGiamGia,
            giamToiDa: invoice.mucGiaGiamToiDa,
            giaTriDonHangToiThieu: invoice.giaTriDonHangToiThieu,
          }
        : null,
  };

  return (
    <>
      {contextHolder}
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
                <div className="font-bold text-4xl text-[#E67E22]">
                  Chi tiết đơn hàng
                </div>
                <BillBreadcrumb />
                <Text type="secondary">Mã đơn hàng: {invoice?.maHoaDon}</Text>
              </div>
              <Space>
                {isEditing ? (
                  <Space>
                    <Button
                      type="primary"
                      onClick={handleSave}
                      icon={<CheckCircleOutlined />}
                    >
                      Lưu
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      icon={<CloseCircleOutlined />}
                    >
                      Hủy
                    </Button>
                  </Space>
                ) : canEdit && invoice?.trangThai === 0 ? (
                  <Button
                    type="primary"
                    onClick={handleEditToggle}
                    icon={<EditOutlined />}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Button icon={<LockOutlined />} disabled>
                    Không thể sửa
                  </Button>
                )}

                
                {invoice?.trangThai === 4 && (
                  <Button
                    icon={<DollarOutlined />}
                    onClick={kiemTraHoanTien}
                    loading={kiemTraHoanTienLoading}
                    style={{
                      backgroundColor: "#52c41a",
                      color: "white",
                      borderColor: "#52c41a",
                    }}
                  >
                    Hoàn tiền
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
                    fetchLichSuHoaDon();
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
                          {isEditing && canEditCustomerInfo && (
                            <Button
                              type="default"
                              size="small"
                              onClick={openAddressModal}
                            >
                              Chọn địa chỉ
                            </Button>
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
                          {isEditing && canEditCustomerInfo ? (
                            <Form.Item
                              name="hoTenKhachHang"
                              rules={validationRules.hoTenKhachHang}
                              style={{ marginBottom: 0, marginTop: 4 }}
                            >
                              <Input placeholder="Nhập tên khách hàng..." />
                            </Form.Item>
                          ) : (
                            <div>
                              <Text strong>
                                {invoice?.khachHang?.hoTen ||
                                  invoice?.tenKhachHang ||
                                  "Khách lẻ"}
                              </Text>
                            </div>
                          )}
                        </div>
                        {/* Email */}
                        <div>
                          <Text type="secondary">Email:</Text>
                          {isEditing && canEditCustomerInfo ? (
                            <Form.Item
                              name="emailKhachHang"
                              rules={validationRules.emailKhachHang}
                              style={{ marginBottom: 0, marginTop: 4 }}
                            >
                              <Input placeholder="email@example.com" />
                            </Form.Item>
                          ) : (
                            <div>
                              <Text strong>
                                {invoice?.khachHang?.email ||
                                  invoice?.emailKhachHang ||
                                  "—"}
                              </Text>
                            </div>
                          )}
                        </div>
                        {/* Số điện thoại */}
                        <div>
                          <Text type="secondary">Số điện thoại:</Text>
                          {isEditing && canEditCustomerInfo ? (
                            <Form.Item
                              name="sdtKhachHang"
                              rules={validationRules.sdtKhachHang}
                              style={{ marginBottom: 0, marginTop: 4 }}
                            >
                              <Input placeholder="0912345678" />
                            </Form.Item>
                          ) : (
                            <div>
                              <Text strong>
                                {invoice?.khachHang?.sdt ||
                                  invoice?.sdtKhachHang ||
                                  "—"}
                              </Text>
                            </div>
                          )}
                        </div>
                        <div>
                          <Text type="secondary">Địa chỉ giao hàng:</Text>
                          <Form.Item name="idDiaChi" noStyle>
                            <Input type="hidden" />
                          </Form.Item>
                          {isEditing && canEditCustomerInfo ? (
                            <>
                              <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                  <Form.Item
                                    name="thanhPho"
                                    label="Tỉnh/Thành phố"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Chọn tỉnh/thành!",
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="Chọn tỉnh/thành"
                                      onChange={handleTinhChange}
                                      showSearch
                                      optionFilterProp="children"
                                      filterOption={(input, option) =>
                                        (option?.children ?? "")
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
                                <Col span={12}>
                                  <Form.Item
                                    name="quan"
                                    label="Quận/Huyện"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Chọn quận/huyện!",
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="Chọn quận/huyện"
                                      disabled={!localQuanList.length}
                                      showSearch
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
                                rules={[
                                  {
                                    required: true,
                                    message: "Nhập địa chỉ cụ thể!",
                                  },
                                ]}
                              >
                                <Input placeholder="Nhập số nhà, tên đường..." />
                              </Form.Item>
                            </>
                          ) : (
                            <div style={{ marginTop: 8 }}>
                              <Text strong>
                                {(() => {
                                  if (invoice?.diaChiKhachHang) {
                                    return invoice.diaChiKhachHang;
                                  }

                                  const defaultAddress =
                                    invoice?.khachHang?.diaChi?.find(
                                      (addr) => addr.trangThai === true
                                    );

                                  if (defaultAddress) {
                                    const diaChiCuThe =
                                      defaultAddress.diaChiCuThe || "";
                                    const tenQuan =
                                      defaultAddress.quanHuyen?.tenQuan ||
                                      defaultAddress.tenQuan ||
                                      "";
                                    const tenTinh =
                                      defaultAddress.tinhThanh?.tenTinh ||
                                      defaultAddress.tenTinh ||
                                      "";

                                    return (
                                      [diaChiCuThe, tenQuan, tenTinh]
                                        .filter(Boolean)
                                        .join(", ") ||
                                      "Chưa có địa chỉ chi tiết"
                                    );
                                  }

                                  if (invoice?.khachHang?.diaChi?.length > 0) {
                                    return "Có địa chỉ nhưng chưa đặt mặc định";
                                  }

                                  return invoice?.tenKhachHang?.includes(
                                    "Khách lẻ"
                                  ) || !invoice?.khachHang
                                    ? "Khách lẻ – Nhận tại quầy"
                                    : "Chưa có địa chỉ giao hàng";
                                })()}
                              </Text>
                            </div>
                          )}
                        </div>
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
                          <ShoppingOutlined /> Danh sách sản phẩm
                        </div>
                      </div>
                    </>
                  }
                  style={{ marginBottom: 16 }}
                >
                  {invoiceProducts && invoiceProducts.length > 0 ? (
                    <Table
                      columns={productColumns}
                      dataSource={invoiceProducts}
                      rowKey={(record) => getProductKey(record)}
                      pagination={false}
                    />
                  ) : (
                    <Empty description="Không có sản phẩm" />
                  )}
                </Card>

                <Card title="Ghi chú của khách" style={{ marginBottom: 16 }}>
                  <div>
                    <Text type="secondary">Ghi chú:</Text>
                    {isEditing && canEditCustomerInfo ? (
                      <Form.Item
                        name="ghiChu"
                        rules={validationRules.ghiChu}
                        style={{ marginBottom: 0, marginTop: 4 }}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Nhập ghi chú..."
                        />
                      </Form.Item>
                    ) : (
                      <div>
                        <Text>{invoice?.ghiChu || "Không có ghi chú"}</Text>
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
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Tổng tiền hàng:</Text>
                      <Text strong>
                        {formatMoney(finalTotal.tongTienSanPham)}
                      </Text>
                    </div>

                    {finalTotal.phiVanChuyen > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>Phí vận chuyển:</Text>
                        <Text strong>
                          {formatMoney(finalTotal.phiVanChuyen)}
                        </Text>
                      </div>
                    )}

                    {finalTotal.tienGiamGia > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>Giảm giá:</Text>
                        <Text strong style={{ color: "#ff4d4f" }}>
                          -{formatMoney(finalTotal.tienGiamGia)}
                        </Text>
                      </div>
                    )}

                    <Divider style={{ margin: "12px 0" }} />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text strong style={{ fontSize: 18 }}>
                        Tổng thanh toán:
                      </Text>
                      <Text strong style={{ fontSize: 20, color: "#ff4d4f" }}>
                        {formatMoney(finalTotal.tongTienCuoiCung)}
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

        {/* Email Modal */}
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
              <Input
                placeholder="example@email.com"
                prefix={<MailOutlined />}
              />
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

        {/* Address Modal */}
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

        <HoanTienModal
          visible={hoanTienModalVisible}
          onCancel={() => setHoanTienModalVisible(false)}
          onSuccess={handleHoanTienSuccess}
          hoaDonId={id}
          invoice={invoice}
        />
      </div>
    </>
  );
};

export default DetailHoaDon;
