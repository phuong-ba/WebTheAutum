// DetailHoaDon.js - Đã cập nhật
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
  Collapse,
  Progress,
  Tooltip,
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
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  InfoCircleOutlined,
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
import BillListProduct from "./BillListProduct";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

const HoanTienModal = ({ visible, onCancel, onSuccess, hoaDonId, invoice }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Tính số tiền tối đa có thể hoàn (dựa trên số tiền đã thanh toán)
  const maxHoanTien = invoice?.soTienThanhToan || 0;
  const daHoanTruoc = invoice?.tongTienHoan || 0;
  const conLaiCoTheHoan = maxHoanTien - daHoanTruoc;

  const onFinish = async (values) => {
    if (values.soTienHoan > conLaiCoTheHoan) {
      message.error(
        "Số tiền hoàn không được vượt quá số tiền còn lại có thể hoàn!"
      );
      return;
    }

    setLoading(true);
    try {
      const request = {
        soTienHoan: values.soTienHoan,
        lyDo: values.lyDo || "Khách hàng yêu cầu hoàn tiền",
        ghiChu: values.ghiChu,
        phuongThucHoanTien: values.phuongThucHoanTien || "CHUYEN_KHOAN",
      };

      const response = await hoaDonApi.hoanTienHoaDon(hoaDonId, request);

      if (response.data?.success) {
        message.success(
          response.data.message ||
            `Đã hoàn ${formatMoney(values.soTienHoan)} thành công!`
        );
        form.resetFields();
        onSuccess?.(response.data);
        onCancel?.();
      } else {
        message.error(response.data?.message || "Hoàn tiền thất bại!");
      }
    } catch (error) {
      console.error("Lỗi hoàn tiền:", error);
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể thực hiện hoàn tiền. Vui lòng thử lại!";
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: "#52c41a" }} />
          <Title level={4} style={{ margin: 0 }}>
            Hoàn tiền đơn hàng #{invoice?.maHoaDon}
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ padding: "16px 0" }}>
        {/* Thông tin tổng quan */}
        <Alert
          message={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Thông tin thanh toán hiện tại</Text>
              <div>
                <Text type="secondary">Tổng tiền đơn hàng:</Text>{" "}
                <Text strong>{formatMoney(invoice?.tongTienSauGiam)}</Text>
              </div>
              <div>
                <Text type="secondary">Đã thanh toán:</Text>{" "}
                <Text strong style={{ color: "#52c41a" }}>
                  {formatMoney(maxHoanTien)}
                </Text>
              </div>
              {daHoanTruoc > 0 && (
                <div>
                  <Text type="secondary">Đã hoàn trước đó:</Text>{" "}
                  <Text strong style={{ color: "#faad14" }}>
                    {formatMoney(daHoanTruoc)}
                  </Text>
                </div>
              )}
              <div>
                <Text type="secondary">Còn lại có thể hoàn:</Text>{" "}
                <Text strong style={{ color: "#1890ff", fontSize: 18 }}>
                  {formatMoney(conLaiCoTheHoan)}
                </Text>
              </div>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 20 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            soTienHoan: conLaiCoTheHoan,
            phuongThucHoanTien: "CHUYEN_KHOAN",
          }}
        >
          <Form.Item
            label="Số tiền hoàn lại (VNĐ)"
            name="soTienHoan"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền hoàn!" },
              {
                type: "number",
                min: 1000,
                message: "Số tiền hoàn phải lớn hơn 1.000 ₫",
              },
              {
                validator: (_, value) =>
                  value > conLaiCoTheHoan
                    ? Promise.reject(
                        new Error(
                          `Không được vượt quá ${formatMoney(conLaiCoTheHoan)}`
                        )
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              addonAfter="₫"
              min={1000}
              max={conLaiCoTheHoan}
              step={1000}
              precision={0}
            />
          </Form.Item>

          <Form.Item
            label="Phương thức hoàn tiền"
            name="phuongThucHoanTien"
            rules={[{ required: true, message: "Chọn phương thức hoàn tiền!" }]}
          >
            <Select placeholder="Chọn phương thức">
              <Select.Option value="CHUYEN_KHOAN">
                Chuyển khoản ngân hàng
              </Select.Option>
              <Select.Option value="TIEN_MAT">Tiền mặt</Select.Option>
              <Select.Option value="VI_DIEN_TU">Ví điện tử</Select.Option>
              <Select.Option value="KHAC">Khác</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Lý do hoàn tiền"
            name="lyDo"
            rules={[
              { required: true, message: "Vui lòng nhập lý do hoàn tiền!" },
            ]}
          >
            <Select placeholder="Chọn lý do phổ biến hoặc nhập trực tiếp">
              <Select.Option value="Khách hủy đơn">
                Khách hủy đơn hàng
              </Select.Option>
              <Select.Option value="Sản phẩm lỗi/hỏng">
                Sản phẩm lỗi, hỏng
              </Select.Option>
              <Select.Option value="Giao sai sản phẩm">
                Giao sai sản phẩm
              </Select.Option>
              <Select.Option value="Khách không nhận hàng">
                Khách không nhận hàng
              </Select.Option>
              <Select.Option value="Thay đổi ý kiến">
                Khách thay đổi ý kiến
              </Select.Option>
              <Select.Option value="Khác">Khác</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Ghi chú thêm (nếu có)" name="ghiChu">
            <TextArea
              rows={3}
              placeholder="Ghi chú chi tiết về việc hoàn tiền..."
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                loading={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md transition"
              >
                {loading ? "Đang xử lý..." : "Xác nhận hoàn tiền"}
              </button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

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
  const [tinhList, setTinhList] = useState([]);
  const [quanMap, setQuanMap] = useState({});
  const [localQuanList, setLocalQuanList] = useState([]);
  const [addressForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalCom, contextModal] = Modal.useModal();
  const [productModalVisible, setProductModalVisible] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [phiPhu, setPhiPhu] = useState(0);
  const [phiPhuMoi, setPhiPhuMoi] = useState(0);
  const [phiPhuDetails, setPhiPhuDetails] = useState([]);
  const [showPhiPhuDetails, setShowPhiPhuDetails] = useState(false);

  // Tính toán thông tin thanh toán
  const paymentSummary = {
    // Số tiền đã thanh toán (từ API)
    soTienThanhToan: invoice?.soTienThanhToan || 0,

    // Số tiền cần thanh toán (từ API)
    soTienCanThanhToan: invoice?.soTienCanThanhToan || 0,

    // Tổng tiền sau giảm giá (từ API)
    tongTienSauGiam: invoice?.tongTienSauGiam || 0,

    // Tính số tiền còn lại phải thanh toán
    soTienConLai: () => {
      const totalAfterDiscount = invoice?.tongTienSauGiam || 0;
      const paid = invoice?.soTienThanhToan || 0;
      return Math.max(0, totalAfterDiscount - paid);
    },

    // Tính phần trăm đã thanh toán
    phanTramDaThanhToan: () => {
      const totalAfterDiscount = invoice?.tongTienSauGiam || 0;
      const paid = invoice?.soTienThanhToan || 0;
      if (totalAfterDiscount <= 0) return 0;
      return (paid / totalAfterDiscount) * 100;
    },
  };

  const getProductKey = (product) => {
    return product.idChiTietSanPham || product.id || product.idCTSP;
  };

  const getChiTietSanPhamId = (product) => {
    return (
      product.idChiTietSanPham ||
      product.chiTietSanPham?.id ||
      product.idCTSP ||
      product.id
    );
  };

  const handleAddProductToInvoice = async (product) => {
    try {
      if (!isEditing || !canEditProducts) {
        message.warning("Vui lòng bật chế độ chỉnh sửa để thêm sản phẩm!");
        return;
      }

      // Kiểm tra số lượng tồn kho
      if (product.soLuongTon < 1) {
        message.error(`Sản phẩm "${product.tenSanPham}" đã hết hàng!`);
        return;
      }

      // Kiểm tra xem sản phẩm đã có trong hóa đơn chưa
      const existingProductIndex = invoiceProducts.findIndex(
        (item) => getChiTietSanPhamId(item) === product.idChiTietSanPham
      );

      let updatedProducts;

      if (existingProductIndex !== -1) {
        // Nếu đã có, kiểm tra số lượng
        const currentItem = invoiceProducts[existingProductIndex];
        const newQuantity = (currentItem.soLuong || 1) + 1;

        // Kiểm tra không vượt quá tồn kho
        if (newQuantity > product.soLuongTon) {
          message.error(`Số lượng vượt quá tồn kho (${product.soLuongTon})!`);
          return;
        }

        // Tăng số lượng
        updatedProducts = invoiceProducts.map((item, index) => {
          if (index === existingProductIndex) {
            const newQuantity = (item.soLuong || 1) + 1;
            const price = product.giaSauGiam || product.giaBan || 0;
            return {
              ...item,
              soLuong: newQuantity,
              thanhTien: newQuantity * price,
            };
          }
          return item;
        });
      } else {
        // Nếu chưa có, thêm mới
        const newProduct = {
          idChiTietSanPham: product.idChiTietSanPham,
          tenSanPham: product.tenSanPham || product.name,
          mauSac: product.mauSac || product.color,
          kichThuoc: product.kichThuoc || product.size,
          giaBan: product.giaBan || product.originalPrice,
          giaSauGiam: product.giaSauGiam || product.unitPrice,
          soLuong: 1,
          thanhTien: product.giaSauGiam || product.unitPrice || 0,
          maVach: product.maVach,
          anhUrls:
            product.anhUrls || (product.imageUrl ? [product.imageUrl] : []),
          soLuongTon: product.soLuongTon,
          isNew: true, // Đánh dấu sản phẩm mới thêm
        };
        updatedProducts = [...invoiceProducts, newProduct];
      }

      setInvoiceProducts(updatedProducts);

      // Tính phụ phí thêm sản phẩm (10,000 VND cho mỗi sản phẩm mới)
      if (existingProductIndex === -1) {
        const newPhiPhuSanPham = 10000;
        const updatedPhiPhuDetails = [...phiPhuDetails];

        // Kiểm tra xem đã có phụ phí thêm sản phẩm chưa
        const existingSanPhamPhi = updatedPhiPhuDetails.find(
          (detail) => detail.loai === "THEM_SAN_PHAM"
        );

        if (existingSanPhamPhi) {
          existingSanPhamPhi.soTien += newPhiPhuSanPham;
          existingSanPhamPhi.ghiChu = `Phụ phí thêm ${
            updatedProducts.filter((p) => p.isNew).length
          } sản phẩm mới`;
        } else {
          updatedPhiPhuDetails.push({
            loai: "THEM_SAN_PHAM",
            ten: "Phụ phí thêm sản phẩm",
            soTien: newPhiPhuSanPham,
            ghiChu: "Phụ phí thêm sản phẩm mới",
          });
        }

        setPhiPhuDetails(updatedPhiPhuDetails);
        setPhiPhu((prev) => prev + newPhiPhuSanPham);
      }

      // Cập nhật tổng tiền
      const newTotal = updatedProducts.reduce(
        (sum, item) => sum + (item.thanhTien || 0),
        0
      );
      setTongTien(newTotal);

      message.success("Đã thêm sản phẩm vào hóa đơn!");
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      message.error("Thêm sản phẩm thất bại!");
    }
  };

  // Hàm xóa sản phẩm khỏi hóa đơn
  const handleRemoveProduct = async (productId) => {
    if (!isEditing || !canEditProducts) {
      message.warning("Vui lòng bật chế độ chỉnh sửa để xóa sản phẩm!");
      return;
    }

    // Tìm sản phẩm để hiển thị tên trong confirm
    const productToDelete = invoiceProducts.find(
      (item) => getChiTietSanPhamId(item) === productId
    );
    const productName = productToDelete?.tenSanPham || "sản phẩm này";

    modalCom.confirm({
      title: "Xác nhận xóa sản phẩm",
      content: `Bạn có chắc chắn muốn xóa "${productName}" khỏi hóa đơn?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          // Kiểm tra xem sản phẩm có phải mới thêm không
          const isNewProduct = productToDelete?.isNew;

          // Gọi API xóa sản phẩm
          await hoaDonApi.xoaChiTietSanPham(id, productId);

          // Cập nhật local state
          const updatedProducts = invoiceProducts.filter(
            (item) => getChiTietSanPhamId(item) !== productId
          );

          setInvoiceProducts(updatedProducts);

          // Nếu là sản phẩm mới thêm, giảm phụ phí
          if (isNewProduct) {
            const phiPhuGiam = 10000;
            setPhiPhu((prev) => Math.max(0, prev - phiPhuGiam));

            // Cập nhật phiPhuDetails
            const updatedPhiPhuDetails = [...phiPhuDetails];
            const sanPhamPhiIndex = updatedPhiPhuDetails.findIndex(
              (detail) => detail.loai === "THEM_SAN_PHAM"
            );

            if (sanPhamPhiIndex !== -1) {
              updatedPhiPhuDetails[sanPhamPhiIndex].soTien -= phiPhuGiam;
              if (updatedPhiPhuDetails[sanPhamPhiIndex].soTien <= 0) {
                updatedPhiPhuDetails.splice(sanPhamPhiIndex, 1);
              }
            }
            setPhiPhuDetails(updatedPhiPhuDetails);
          }

          // Cập nhật tổng tiền
          const newTotal = updatedProducts.reduce(
            (sum, item) => sum + (item.thanhTien || 0),
            0
          );
          setTongTien(newTotal);

          message.success(`Đã xóa "${productName}" khỏi hóa đơn!`);

          // Nếu không còn sản phẩm nào
          if (updatedProducts.length === 0) {
            message.warning("Hóa đơn không còn sản phẩm nào!");
          }
        } catch (error) {
          console.error("❌ Lỗi khi xóa sản phẩm:", error);
          message.error(
            error.response?.data?.message || "Xóa sản phẩm thất bại!"
          );
        }
      },
    });
  };

  useEffect(() => {
    return () => {
      setIsEditing(false);
      setCanEdit(false);
    };
  }, []);

  useEffect(() => {
    if (invoice) {
      checkEditPermissions(invoice.trangThai, invoice.idPhuongThucThanhToan);
      setCanEdit(
        invoice.trangThai === 0 && invoice.idPhuongThucThanhToan !== 2
      );
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

  const checkEditPermissions = (status, idPhuongThucThanhToan) => {
    // Kiểm tra phương thức thanh toán
    const daThanhToanBangChuyenKhoan = idPhuongThucThanhToan === 2;

    // Chỉ cho phép chỉnh sửa khi:
    // - Trạng thái hóa đơn là 0 (Chờ xác nhận)
    // - VÀ phương thức thanh toán KHÔNG phải là chuyển khoản (id=2)
    const editable = status === 0 && !daThanhToanBangChuyenKhoan;

    setCanEdit(editable);
    setCanEditCustomerInfo(editable);
    setCanEditProducts(editable);

    if (!editable && isEditing) {
      setIsEditing(false);
      message.info(
        daThanhToanBangChuyenKhoan
          ? "Đơn hàng thanh toán bằng chuyển khoản, không thể chỉnh sửa"
          : "Đơn hàng đã chuyển trạng thái, không thể chỉnh sửa"
      );
    }
  };

  useEffect(() => {
    if (invoice && !isEditing && invoice.chiTietSanPhams) {
      setInvoiceProducts(invoice.chiTietSanPhams);

      // Tính tổng tiền
      const total = invoice.chiTietSanPhams.reduce(
        (sum, item) =>
          sum + (item.giaSauGiam || item.giaBan || 0) * (item.soLuong || 1),
        0
      );
      setTongTien(total);

      if (invoice.phiPhu) {
        setPhiPhu(invoice.phiPhu);
      }
      if (invoice.phiPhuMoi) {
        setPhiPhuMoi(invoice.phiPhuMoi);
      }

      if (invoice.phiPhuDetails) {
        setPhiPhuDetails(invoice.phiPhuDetails);
      }
    }
  }, [invoice, isEditing]);

  const tinhPhiPhuDoiDiaChi = (newAddress, oldAddress) => {
    if (!newAddress || !oldAddress) return 0;

    const isAddressChanged =
      newAddress.idTinh !== oldAddress.idTinh ||
      newAddress.idQuan !== oldAddress.idQuan ||
      newAddress.diaChiCuThe !== oldAddress.diaChiCuThe;

    if (isAddressChanged) {
      return 10000;
    }

    return 0;
  };

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
    if (invoice?.trangThaiThanhToan) {
      message.warning("Đơn hàng đã thanh toán, không thể chỉnh sửa!");
      return;
    }
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

  const handleSave = async () => {
    try {
      const values = await editForm.validateFields();

      setSaving(true);

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

      const chiTietSanPhams = invoiceProducts.map((product) => ({
        id: null, // Để backend biết đây là sản phẩm thêm mới
        idChiTietSanPham: getChiTietSanPhamId(product),
        soLuong: product.soLuong || 1,
        giaBan:
          product.giaSauGiam || product.giaBan || product.originalPrice || 0, // Chỉ gửi giaBan
        ghiChu: product.ghiChu || "",
        // KHÔNG gửi giaSauGiam nữa
      }));

      // Tính tổng tiền từ các sản phẩm
      const tongTienSanPham = invoiceProducts.reduce(
        (sum, item) => sum + (item.thanhTien || 0),
        0
      );

      // Chuẩn bị dữ liệu gửi lên server theo UpdateHoaDonRequest
      const requestData = {
        idKhachHang: invoice?.khachHang?.id || null,
        hoTenKhachHang: values.hoTenKhachHang || "",
        sdtKhachHang: values.sdtKhachHang || "",
        emailKhachHang: values.emailKhachHang || "",

        // Thông tin địa chỉ
        diaChiCuThe: values.diaChiCuThe || "",
        thanhPho: values.thanhPho || null,
        quan: values.quan || null,
        idDiaChi: values.idDiaChi || null,

        // Thông tin hóa đơn
        phiVanChuyen: invoice?.phiVanChuyen || 0,
        idPhieuGiamGia: invoice?.phieuGiamGia?.id || null,
        ghiChu: values.ghiChu || "",
        trangThai: tempStatus,
        loaiHoaDon: tempLoaiHoaDon,

        // Thông tin nhân viên và phương thức
        idNhanVien: values.idNhanVien || invoice?.nhanVien?.id || 1,
        idPhuongThucThanhToan:
          values.idPhuongThucThanhToan ||
          invoice?.idPhuongThucThanhToan ||
          null,

        // Danh sách sản phẩm
        chiTietSanPhams: chiTietSanPhams,

        // Thông tin tiền - quan trọng: thêm tongTien
        tongTien: tongTienSanPham, // THÊM TRƯỜNG NÀY
        phiVanChuyen: invoice?.phiVanChuyen || 0,
        phiPhu: phiPhu, // Phụ phí đã thanh toán
        phiPhuMoi: phiPhuMoi, // Phụ phí mới (chờ thanh toán)

        // Chi tiết phụ phí
        phiPhuDetails: phiPhuDetails,
      };

      console.log("📤 Gửi dữ liệu cập nhật hóa đơn:", requestData);

      // Gọi API cập nhật hóa đơn
      const response = await hoaDonApi.updateHoaDon(id, requestData);

      console.log("📥 Response từ server:", response.data);

      if (response.data && response.data.success) {
        message.success(
          response.data.message || "Cập nhật hóa đơn thành công!"
        );

        // Cập nhật local state từ response
        if (response.data.tongTienSanPham !== undefined) {
          setTongTien(response.data.tongTienSanPham);
        }

        if (response.data.phiPhu !== undefined) {
          setPhiPhu(response.data.phiPhu);
        }

        if (response.data.phiPhuMoi !== undefined) {
          setPhiPhuMoi(response.data.phiPhuMoi);
        }

        if (response.data.tongTienSauGiam !== undefined) {
          // Có thể cập nhật thêm state nếu cần
        }

        setIsEditing(false);

        // Refresh dữ liệu
        await fetchInvoiceDetail();
        fetchLichSuHoaDon();
        fetchLichSuThanhToan();

        // Reset state
        setFormErrors({});

        // Hiển thị thông báo chi tiết
        message.info(
          `Tổng tiền: ${formatMoney(
            response.data.tongTienSauGiam ||
              response.data.tongTienCanThanhToan ||
              0
          )}`
        );
      } else {
        message.error(response.data?.message || "Cập nhật hóa đơn thất bại!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi lưu hóa đơn:", err);

      if (err.response) {
        const errorData = err.response.data;
        console.error("❌ Server response:", errorData);

        if (errorData.message) {
          message.error(errorData.message);
        } else if (errorData.error) {
          message.error(errorData.error);
        }

        if (errorData.errors) {
          console.error("❌ Validation errors:", errorData.errors);
          setFormErrors(errorData.errors);
        }
      } else {
        message.error("Có lỗi xảy ra: " + err.message);
      }
    } finally {
      setSaving(false);
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

    // Kiểm tra và tính phụ phí đổi địa chỉ
    const oldAddress = invoice?.khachHang?.diaChi?.[0];
    if (
      oldAddress &&
      (idTinh !== oldAddress.tinhThanh?.id ||
        idQuan !== oldAddress.quanHuyen?.id)
    ) {
      const phiPhuDoiDiaChi = tinhPhiPhuDoiDiaChi(record, oldAddress);
      if (phiPhuDoiDiaChi > 0) {
        setPhiPhu((prev) => prev + phiPhuDoiDiaChi);
        setPhiPhuDetails((prev) => [
          ...prev,
          {
            loai: "DOI_DIA_CHI",
            ten: "Phụ phí đổi địa chỉ",
            soTien: phiPhuDoiDiaChi,
            ghiChu: "Phụ phí đổi địa chỉ giao hàng",
          },
        ]);
        message.info(
          `Đã áp dụng phụ phí đổi địa chỉ: ${formatMoney(phiPhuDoiDiaChi)}`
        );
      }
    }

    message.success("Đã chọn địa chỉ giao hàng!");
    setAddressModalVisible(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormErrors({});
    setTempStatus(invoice?.trangThai || 0);
    setTempLoaiHoaDon(invoice?.loaiHoaDon || false);

    // Khôi phục lại dữ liệu ban đầu
    if (invoice?.chiTietSanPhams) {
      setInvoiceProducts(invoice.chiTietSanPhams);
      const total = invoice.chiTietSanPhams.reduce(
        (sum, item) =>
          sum + (item.giaSauGiam || item.giaBan || 0) * (item.soLuong || 1),
        0
      );
      setTongTien(total);
    }

    // Khôi phục phụ phí ban đầu
    setPhiPhu(invoice?.phiPhu || 0);
    setPhiPhuMoi(invoice?.phiPhuMoi || 0);
    setPhiPhuDetails(invoice?.phiPhuDetails || []);

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

        if (response.data.coTheHoanTien) {
          setHoanTienModalVisible(true);
        } else {
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
    fetchInvoiceDetail();
    fetchLichSuHoaDon();
    fetchLichSuThanhToan();
    message.success(
      `Đã hoàn tiền ${formatMoney(responseData.soTienHoan)} thành công!`
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
      setInvoiceProducts(invoiceData.chiTietSanPhams || []);
      setTempStatus(invoiceData.trangThai || 0);
      setTempLoaiHoaDon(invoiceData.loaiHoaDon || false);
      checkEditPermissions(
        invoiceData.trangThai || 0,
        invoiceData.idPhuongThucThanhToan
      );
      const total = (invoiceData.chiTietSanPhams || []).reduce(
        (sum, item) =>
          sum + (item.giaSauGiam || item.giaBan || 0) * (item.soLuong || 1),
        0
      );
      setTongTien(total);
      setPhiPhu(invoiceData.phiPhu || 0);
      setPhiPhuMoi(invoiceData.phiPhuMoi || 0);
      setPhiPhuDetails(invoiceData.phiPhuDetails || []);

      checkEditPermissions(invoiceData.trangThai || 0);

      setError(null);
    } catch (err) {
      console.error("❌ Lỗi tải chi tiết hóa đơn:", err);
      setError("Không thể tải thông tin hóa đơn");

      if (err.response?.status === 404) {
        message.error("Không tìm thấy hóa đơn với ID: " + id);
        navigate("/hoa-don");
      }
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

  // DetailHoaDon.js - Phần code cho chức năng in hóa đơn

  const handlePrint = () => {
    // Tạo một cửa sổ mới để in
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      message.error("Không thể mở cửa sổ in. Vui lòng cho phép popup!");
      return;
    }

    // Lấy HTML của phần cần in (loại bỏ các phần tử có class "no-print")
    const printContent = document.querySelector(".print-area")?.innerHTML;

    if (!printContent) {
      message.error("Không tìm thấy nội dung để in!");
      printWindow.close();
      return;
    }

    // Tạo HTML cho hóa đơn in (loại bỏ trạng thái)
    const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn #${invoice?.maHoaDon || ""}</title>
    <style>
      /* Reset và font */
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
        background: #fff;
        line-height: 1.4;
        font-size: 14px;
        padding: 20px;
      }
      
      .no-print {
        display: none !important;
      }
      
      /* Ẩn tất cả các phần tử không cần thiết khi in */
      button, .ant-btn, .ant-space, .ant-card-actions, 
      .history-section, .customer-payment-row .ant-col:nth-child(2) {
        display: none !important;
      }
      
      /* Style cho hóa đơn in */
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        border: 2px solid #000;
        padding: 30px;
        position: relative;
      }
      
      /* Header hóa đơn */
      .invoice-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px double #000;
        padding-bottom: 20px;
      }
      
      .invoice-title {
        font-size: 28px;
        font-weight: 700;
        color: #E67E22;
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      
      .invoice-subtitle {
        font-size: 18px;
        font-weight: 500;
        color: #333;
        margin-bottom: 15px;
      }
      
      .invoice-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 20px;
      }
      
      .invoice-info-left, .invoice-info-right {
        flex: 1;
        min-width: 300px;
      }
      
      .info-box {
        background: #f8f9fa;
        padding: 15px;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        margin-bottom: 15px;
      }
      
      .info-title {
        font-weight: 600;
        color: #E67E22;
        margin-bottom: 8px;
        font-size: 16px;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 5px;
      }
      
      .info-row {
        display: flex;
        margin-bottom: 6px;
      }
      
      .info-label {
        min-width: 120px;
        font-weight: 500;
        color: #666;
      }
      
      .info-value {
        font-weight: 400;
        color: #333;
      }
      
      /* Bảng sản phẩm */
      .product-table {
        width: 100%;
        border-collapse: collapse;
        margin: 25px 0;
        border: 1px solid #dee2e6;
      }
      
      .product-table th {
        background: #E67E22;
        color: white;
        font-weight: 600;
        text-align: center;
        padding: 12px 8px;
        border: 1px solid #dee2e6;
      }
      
      .product-table td {
        padding: 10px 8px;
        border: 1px solid #dee2e6;
        vertical-align: top;
      }
      
      .product-table tr:nth-child(even) {
        background: #f8f9fa;
      }
      
      .product-table .text-right {
        text-align: right;
      }
      
      .product-table .text-center {
        text-align: center;
      }
      
      /* Tổng tiền */
      .total-section {
        margin-top: 30px;
        border-top: 2px solid #000;
        padding-top: 20px;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 5px 0;
      }
      
      .total-label {
        font-weight: 500;
        color: #666;
      }
      
      .total-value {
        font-weight: 600;
        color: #333;
      }
      
      .grand-total {
        font-size: 18px;
        font-weight: 700;
        color: #E67E22;
        border-top: 2px solid #000;
        padding-top: 10px;
        margin-top: 10px;
      }
      
      /* Chú thích và thông tin thêm */
      .notes-section {
        margin-top: 30px;
        padding: 15px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
      }
      
      .notes-title {
        font-weight: 600;
        color: #E67E22;
        margin-bottom: 10px;
      }
      
      /* Footer hóa đơn */
      .invoice-footer {
        margin-top: 40px;
        border-top: 1px solid #dee2e6;
        padding-top: 20px;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 20px;
      }
      
      .footer-section {
        text-align: center;
        flex: 1;
        min-width: 200px;
      }
      
      .footer-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #333;
      }
      
      .signature {
        margin-top: 40px;
        text-align: center;
      }
      
      .signature-line {
        width: 200px;
        border-top: 1px solid #000;
        margin: 0 auto;
        padding-top: 10px;
      }
      
      .signature-text {
        font-weight: 600;
        margin-top: 5px;
      }
      
      /* Utility classes */
      .text-bold {
        font-weight: 700;
      }
      
      .text-large {
        font-size: 16px;
      }
      
      .text-danger {
        color: #dc3545 !important;
      }
      
      .text-success {
        color: #28a745 !important;
      }
      
      .mb-3 {
        margin-bottom: 15px;
      }
      
      .mt-3 {
        margin-top: 15px;
      }
      
      /* Print-specific styles */
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
        
        .invoice-container {
          border: none;
          padding: 15px;
          max-width: 100%;
        }
        
        .no-print, button, .ant-btn, .ant-space, .ant-card-actions,
        .history-section, .customer-payment-row .ant-col:nth-child(2) {
          display: none !important;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        /* Đảm bảo không bị cắt khi in */
        .product-table {
          page-break-inside: avoid;
        }
        
        .total-section {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <!-- Header -->
      <div class="invoice-header">
        <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
        <div class="invoice-subtitle">Mã hóa đơn: <strong>${
          invoice?.maHoaDon || ""
        }</strong></div>
        <div>Ngày tạo: ${formatDate(invoice?.ngayTao)}</div>
      </div>
      
      <!-- Thông tin khách hàng và cửa hàng -->
      <div class="invoice-info">
        <div class="invoice-info-left">
          <div class="info-box">
            <div class="info-title">THÔNG TIN CỬA HÀNG</div>
            <div class="info-row">
              <div class="info-label">Tên cửa hàng:</div>
              <div class="info-value">The Autumn</div>
            </div>
            <div class="info-row">
              <div class="info-label">Địa chỉ:</div>
              <div class="info-value">123 Đường ABC, Quận XYZ,Hà Nội</div>
            </div>
            <div class="info-row">
              <div class="info-label">Số điện thoại:</div>
              <div class="info-value">(028) 1234 5678</div>
            </div>
            <div class="info-row">
              <div class="info-label">Email:</div>
              <div class="info-value">autumn@gmail.com</div>
            </div>
          </div>
        </div>
        
        <div class="invoice-info-right">
          <div class="info-box">
            <div class="info-title">THÔNG TIN KHÁCH HÀNG</div>
            <div class="info-row">
              <div class="info-label">Họ tên:</div>
              <div class="info-value">${
                invoice?.khachHang?.hoTen || invoice?.tenKhachHang || "Khách lẻ"
              }</div>
            </div>
            <div class="info-row">
              <div class="info-label">Số điện thoại:</div>
              <div class="info-value">${
                invoice?.khachHang?.sdt || invoice?.sdtKhachHang || "—"
              }</div>
            </div>
            <div class="info-row">
              <div class="info-label">Email:</div>
              <div class="info-value">${
                invoice?.khachHang?.email || invoice?.emailKhachHang || "—"
              }</div>
            </div>
            <div class="info-row">
              <div class="info-label">Địa chỉ:</div>
              <div class="info-value">${(() => {
                if (invoice?.diaChiKhachHang) return invoice.diaChiKhachHang;
                const defaultAddress = invoice?.khachHang?.diaChi?.find(
                  (addr) => addr.trangThai === true
                );
                if (defaultAddress) {
                  const diaChiCuThe = defaultAddress.diaChiCuThe || "";
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
                      .join(", ") || "—"
                  );
                }
                return invoice?.tenKhachHang?.includes("Khách lẻ") ||
                  !invoice?.khachHang
                  ? "Nhận tại quầy"
                  : "—";
              })()}</div>
            </div>
        
          </div>
        </div>
      </div>
      
      <!-- Bảng sản phẩm -->
      <table class="product-table">
        <thead>
          <tr>
            <th width="50">STT</th>
            <th width="300">Tên sản phẩm</th>
            <th width="80">Màu</th>
            <th width="80">Size</th>
            <th width="100">Đơn giá</th>
            <th width="80">Số lượng</th>
            <th width="120">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${
            invoiceProducts && invoiceProducts.length > 0
              ? invoiceProducts
                  .map(
                    (product, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${product.tenSanPham || "—"}</td>
                <td>${product.mauSac || "—"}</td>
                <td>${product.kichThuoc || "—"}</td>
                <td class="text-right">${formatMoney(
                  product.giaSauGiam || product.giaBan || 0
                )}</td>
                <td class="text-center">${product.soLuong || 1}</td>
                <td class="text-right text-bold">${formatMoney(
                  (product.giaSauGiam || product.giaBan || 0) *
                    (product.soLuong || 1)
                )}</td>
              </tr>
            `
                  )
                  .join("")
              : `<tr><td colspan="7" class="text-center">Không có sản phẩm</td></tr>`
          }
        </tbody>
      </table>
      
      <!-- Tổng tiền -->
      <div class="total-section">
        <div class="total-row">
          <div class="total-label">Tổng tiền hàng:</div>
          <div class="total-value">${formatMoney(
            finalTotal.tongTienSanPham
          )}</div>
        </div>
        
        ${
          finalTotal.phiVanChuyen > 0
            ? `
          <div class="total-row">
            <div class="total-label">Phí vận chuyển:</div>
            <div class="total-value">+ ${formatMoney(
              finalTotal.phiVanChuyen
            )}</div>
          </div>
        `
            : ""
        }
        
        ${
          finalTotal.tienGiamGia > 0
            ? `
          <div class="total-row">
            <div class="total-label">Giảm giá:</div>
            <div class="total-value text-danger">- ${formatMoney(
              finalTotal.tienGiamGia
            )}</div>
          </div>
        `
            : ""
        }
        
        <div class="total-row grand-total">
          <div class="total-label">TỔNG CỘNG:</div>
          <div class="total-value">${formatMoney(
            finalTotal.tongTienCuoiCung()
          )}</div>
        </div>
        
        ${
          paymentSummary.soTienThanhToan > 0
            ? `
          <div class="total-row">
            <div class="total-label">Đã thanh toán:</div>
            <div class="total-value text-success">${formatMoney(
              paymentSummary.soTienThanhToan
            )}</div>
          </div>
        `
            : ""
        }
        
        ${
          paymentSummary.soTienConLai() > 0
            ? `
          <div class="total-row">
            <div class="total-label">Còn lại:</div>
            <div class="total-value">${formatMoney(
              paymentSummary.soTienConLai()
            )}</div>
          </div>
        `
            : ""
        }
        
        ${
          paymentSummary.soTienConLai() <= 0 &&
          paymentSummary.soTienThanhToan > 0
            ? ``  : ""
        }
      </div>
      
      <!-- Chú thích -->
      ${
        invoice?.ghiChu
          ? `
        <div class="notes-section">
          <div class="notes-title">Ghi chú:</div>
          <div>${invoice.ghiChu}</div>
        </div>
      `
          : ""
      }
      <!-- Thông tin thêm -->
      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
        <p>Cảm ơn quý khách đã mua hàng! Hóa đơn này có giá trị như một phiếu bảo hành.</p>
        <p>Thời gian bảo hành: 6 tháng kể từ ngày mua. Đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.</p>
        <p>Mọi thắc mắc vui lòng liên hệ: (028) 1234 5678 - Hotline: 0909 123 456</p>
      </div>
    </div>
    
    <script>
      // Tự động in khi tải xong
      window.onload = function() {
        setTimeout(function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 100);
        }, 500);
      };
    </script>
  </body>
  </html>
  `;

    // Ghi nội dung HTML vào cửa sổ in
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    message.success("Đang mở hộp thoại in...");
  };

  const handleSendEmail = () => {
    // ... (giữ nguyên code send email)
  };

  const handleEmailSubmit = async (values) => {
    // ... (giữ nguyên code email submit)
  };

  const handleCancelEmail = () => {
    // ... (giữ nguyên code cancel email)
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

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const product = invoiceProducts.find(
      (item) => getChiTietSanPhamId(item) === productId
    );
    if (product && product.soLuongTon && newQuantity > product.soLuongTon) {
      message.error(`Số lượng vượt quá tồn kho (${product.soLuongTon})!`);
      return;
    }

    const updatedProducts = invoiceProducts.map((item) => {
      if (getChiTietSanPhamId(item) === productId) {
        const price = item.giaSauGiam || item.giaBan || 0;
        return {
          ...item,
          soLuong: newQuantity,
          thanhTien: newQuantity * price,
        };
      }
      return item;
    });

    setInvoiceProducts(updatedProducts);

    const newTotal = updatedProducts.reduce(
      (sum, item) => sum + (item.thanhTien || 0),
      0
    );
    setTongTien(newTotal);
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
              {record.soLuongTon !== undefined && (
                <span> | Tồn: {record.soLuongTon}</span>
              )}
              {record.isNew && (
                <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>
                  Mới
                </Tag>
              )}
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
      render: (_, record) => (
        <div style={{ fontWeight: 500 }}>{formatMoney(record.giaBan)}</div>
      ),
    },
    {
      title: "Giá bán",
      key: "giaSauGiam",
      width: 120,
      align: "right",
      render: (_, record) => (
        <div style={{ fontWeight: 500 }}>{formatMoney(record.giaSauGiam)}</div>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "soLuong",
      key: "soLuong",
      width: 150,
      align: "center",
      render: (value, record) => {
        if (isEditing && canEditProducts) {
          return (
            <Space>
              <Button
                size="small"
                icon={<MinusOutlined />}
                onClick={() =>
                  handleQuantityChange(getChiTietSanPhamId(record), value - 1)
                }
                disabled={value <= 1}
              />
              <InputNumber
                min={1}
                max={record.soLuongTon || 999}
                value={value}
                onChange={(newValue) =>
                  handleQuantityChange(getChiTietSanPhamId(record), newValue)
                }
                style={{ width: 60 }}
              />
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() =>
                  handleQuantityChange(getChiTietSanPhamId(record), value + 1)
                }
                disabled={value >= (record.soLuongTon || 999)}
              />
            </Space>
          );
        }
        return value || "—";
      },
    },
    {
      title: "Thành tiền",
      key: "thanhTien",
      width: 130,
      align: "right",
      render: (_, record) => {
        const finalPrice = record.giaSauGiam || record.giaBan;
        const total = finalPrice * record.soLuong;
        return (
          <div style={{ fontWeight: 600, color: "#1890ff" }}>
            {formatMoney(total)}
          </div>
        );
      },
    },
    ...(isEditing && canEditProducts
      ? [
          {
            title: "Thao tác",
            key: "actions",
            width: 100,
            align: "center",
            render: (_, record) => (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveProduct(getChiTietSanPhamId(record))}
              >
                Xóa
              </Button>
            ),
          },
        ]
      : []),
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
    tongTienSanPham: tongTien || invoice.tongTien || 0,
    phiVanChuyen: invoice.phiVanChuyen || 0,
    tienGiamGia: (() => {
      const hasDiscountInfo =
        invoice.giaTriGiamGia !== undefined && invoice.giaTriGiamGia !== null;

      if (!hasDiscountInfo) {
        return 0;
      }

      // Chỉ tính giảm giá dựa trên tổng tiền sản phẩm (KHÔNG bao gồm phí vận chuyển)
      const tongTienSanPham = tongTien || invoice.tongTien || 0;

      // Kiểm tra điều kiện tối thiểu của đơn hàng (nếu có)
      if (
        invoice.giaTriDonHangToiThieu &&
        tongTienSanPham < invoice.giaTriDonHangToiThieu
      ) {
        return 0;
      }

      let discount = 0;

      // Tính toán giảm giá dựa trên loại giảm giá
      if (invoice.loaiGiamGia === true) {
        // Giảm giá cố định (VNĐ)
        discount = invoice.giaTriGiamGia || 0;
      } else {
        // Giảm giá theo phần trăm (%)
        discount = (tongTienSanPham * invoice.giaTriGiamGia) / 100;
      }

      // Áp dụng mức giảm tối đa (nếu có)
      if (invoice.mucGiaGiamToiDa) {
        discount = Math.min(discount, invoice.mucGiaGiamToiDa);
      }

      // Đảm bảo giảm giá không vượt quá tổng tiền sản phẩm
      discount = Math.min(discount, tongTienSanPham);
      return discount;
    })(),

    tongTienCuoiCung: () => {
      // 1. Tính tiền sản phẩm
      const tongTienSanPham = tongTien || invoice.tongTien || 0;

      // 2. Áp dụng giảm giá (chỉ cho tiền sản phẩm)
      const discount = finalTotal.tienGiamGia;
      const tongTienSauGiam = tongTienSanPham - discount;

      // 3. Cộng các loại phí (vận chuyển, phụ phí)
      const tongTienCuoiCung =
        Math.max(0, tongTienSauGiam) + (invoice.phiVanChuyen || 0);

      return tongTienCuoiCung;
    },

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
      {contextModal}
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
                      loading={saving}
                      disabled={
                        !invoiceProducts || invoiceProducts.length === 0
                      }
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
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
                  <Tooltip
                    title={
                      invoice?.idPhuongThucThanhToan === 2
                        ? "Đơn hàng thanh toán bằng chuyển khoản, không thể chỉnh sửa"
                        : invoice?.trangThai !== 0
                        ? "Chỉ có thể chỉnh sửa đơn hàng ở trạng thái 'Chờ xác nhận'"
                        : "Không thể sửa"
                    }
                  >
                    <Button icon={<LockOutlined />} disabled>
                      {invoice?.idPhuongThucThanhToan === 2
                        ? "Đã thanh toán chuyển khoản"
                        : "Không thể sửa"}
                    </Button>
                  </Tooltip>
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
                {/* <Button icon={<MailOutlined />} onClick={handleSendEmail}>
                  Gửi email
                </Button> */}
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
                        {isEditing && canEditProducts && (
                          <div
                            className="border px-4 rounded cursor-pointer hover:bg-amber-400 active:bg-cyan-950 active:text-white"
                            onClick={() => setProductModalVisible(true)}
                          >
                            Thêm sản phẩm
                          </div>
                        )}
                      </div>
                    </>
                  }
                  style={{ marginBottom: 16 }}
                >
                  {invoiceProducts && invoiceProducts.length > 0 ? (
                    <Table
                      columns={productColumns}
                      dataSource={invoiceProducts}
                      rowKey={(record) => getChiTietSanPhamId(record)}
                      pagination={false}
                    />
                  ) : (
                    <Empty description="Không có sản phẩm" />
                  )}
                </Card>

                <Card title="Ghi chú" style={{ marginBottom: 16 }}>
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

                    {/* {(finalTotal.phiPhu > 0 || finalTotal.phiPhuMoi > 0) && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                        onClick={() => setShowPhiPhuDetails(!showPhiPhuDetails)}
                      >
                        <Space>
                          <Text>Phụ phí:</Text>
                          <InfoCircleOutlined style={{ color: "#1890ff" }} />
                        </Space>
                        <Text strong style={{ color: "#ff4d4f" }}>
                          +
                          {formatMoney(
                            finalTotal.phiPhu + finalTotal.phiPhuMoi
                          )}
                        </Text>
                      </div>
                    )} */}

                    {/* {showPhiPhuDetails && phiPhuDetails.length > 0 && (
                      <div
                        style={{
                          padding: "8px",
                          backgroundColor: "#f6ffed",
                          borderRadius: "4px",
                          marginTop: "4px",
                        }}
                      >
                        <Text strong>Chi tiết phụ phí:</Text>
                        {phiPhuDetails.map((detail, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginTop: "4px",
                              fontSize: "12px",
                            }}
                          >
                            <Text>{detail.ten}:</Text>
                            <Text>+{formatMoney(detail.soTien)}</Text>
                          </div>
                        ))}
                      </div>
                    )} */}

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

                    {/* PHẦN THÔNG TIN THANH TOÁN */}

                    {/* Tổng tiền sau giảm giá */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Tổng tiền sau giảm giá:</Text>
                      <Text strong>
                        {formatMoney(finalTotal.tongTienCuoiCung())}
                      </Text>
                    </div>

                    {/* Đã thanh toán */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text>Đã thanh toán:</Text>
                      <Text strong style={{ color: "#52c41a" }}>
                        {formatMoney(paymentSummary.soTienThanhToan)}
                      </Text>
                    </div>

                    {/* Thanh toán đủ hay chưa */}
                    {paymentSummary.soTienCanThanhToan === 0 ? (
                      <Alert
                        message="Đã thanh toán đủ"
                        type="success"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    ) : (
                      <Alert
                        message={`Còn phải thanh toán: ${formatMoney(
                          finalTotal.tongTienCuoiCung()
                        )}`}
                        type="warning"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}

                    {/* Phần trăm thanh toán */}
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text type="secondary">Tiến độ thanh toán:</Text>
                        <Text type="secondary">
                          {paymentSummary.phanTramDaThanhToan().toFixed(1)}%
                        </Text>
                      </div>
                      <Progress
                        percent={paymentSummary
                          .phanTramDaThanhToan()
                          .toFixed(1)}
                        status={
                          paymentSummary.phanTramDaThanhToan() >= 100
                            ? "success"
                            : paymentSummary.phanTramDaThanhToan() > 0
                            ? "active"
                            : "normal"
                        }
                      />
                    </div>

                    <Divider style={{ margin: "12px 0" }} />

                    {/* Tổng thanh toán cuối cùng */}
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
                        {formatMoney(finalTotal.tongTienCuoiCung())}
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

                {/* Truyền dữ liệu thanh toán vào BillInvoiceHistory */}
                <BillInvoiceHistory
                  paymentData={{
                    soTienThanhToan: paymentSummary.soTienThanhToan,
                    soTienCanThanhToan: paymentSummary.soTienCanThanhToan,
                    tongTienSauGiam: paymentSummary.tongTienSauGiam,
                    phiPhu: phiPhu,
                    phiVanChuyen: invoice?.phiVanChuyen || 0,
                  }}
                />
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

        {productModalVisible && (
          <Modal
            title={<span className="text-xl font-bold">Chọn sản phẩm</span>}
            open={productModalVisible}
            onCancel={() => setProductModalVisible(false)}
            footer={null}
            width={1200}
          >
            <BillListProduct
              selectedBillId={id}
              onAddProduct={handleAddProductToInvoice}
              isEditing={isEditing}
            />
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
