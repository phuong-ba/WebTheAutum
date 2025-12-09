import {
  DownOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  message,
  Tag,
  Button,
  Alert,
} from "antd";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductDetail from "./productDetail/ProductDetail";
import baseUrl from "@/api/instance";

const { Option } = Select;

const MODAL_TITLES = {
  nhaSanXuat: "hãng",
  xuatXu: "xuất xứ",
  chatLieu: "chất liệu",
  kieuDang: "kiểu dáng",
  coAo: "cổ áo",
  tayAo: "tay áo",
  kichThuoc: "kích thước",
  mauSac: "màu sắc",
};

const API_ENDPOINTS = {
  nhaSanXuat: "/nha-san-xuat/add",
  xuatXu: "/xuat-xu/add",
  chatLieu: "/chat-lieu/add",
  kieuDang: "/kieu-dang/add",
  coAo: "/co-ao/add",
  tayAo: "/tay-ao/add",
  kichThuoc: "/kich-thuoc/add",
  mauSac: "/mau-sac/add",
};

const PAYLOAD_MAPPINGS = {
  nhaSanXuat: (ten, ma) => ({
    tenNhaSanXuat: ten,
    maNhaSanXuat: ma,
  }),
  xuatXu: (ten, ma) => ({
    tenXuatXu: ten,
    maXuatXu: ma,
  }),
  chatLieu: (ten, ma) => ({
    tenChatLieu: ten,
    maChatLieu: ma,
  }),
  kieuDang: (ten, ma) => ({
    tenKieuDang: ten,
    maKieuDang: ma,
  }),
  coAo: (ten, ma) => ({
    tenCoAo: ten,
    maCoAo: ma,
  }),
  tayAo: (ten, ma) => ({
    tenTayAo: ten,
    maTayAo: ma,
  }),
  kichThuoc: (ten, ma) => ({
    tenKichThuoc: ten,
    maKichThuoc: ma,
  }),
  mauSac: (ten, ma) => ({
    tenMauSac: ten,
    maMauSac: ma,
  }),
};

export default function AddProduct() {
  const [form] = Form.useForm();
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bienTheList, setBienTheList] = useState([]);
  const [loadingTaoSanPham, setLoadingTaoSanPham] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contentMessNew] = message.useMessage();
  const [dropdownData, setDropdownData] = useState({
    nhaSanXuats: [],
    xuatXus: [],
    chatLieus: [],
    kieuDangs: [],
    coAos: [],
    tayAos: [],
    kichThuocs: [],
    mauSacs: [],
  });

  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const endpoints = [
        "nha-san-xuat/playlist",
        "xuat-xu/playlist",
        "chat-lieu/playlist",
        "kieu-dang/playlist",
        "co-ao/playlist",
        "tay-ao/playlist",
        "kich-thuoc/playlist",
        "mau-sac/playlist",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) => baseUrl.get(endpoint))
      );

      setDropdownData({
        nhaSanXuats: responses[0].data?.data || [],
        xuatXus: responses[1].data?.data || [],
        chatLieus: responses[2].data?.data || [],
        kieuDangs: responses[3].data?.data || [],
        coAos: responses[4].data?.data || [],
        tayAos: responses[5].data?.data || [],
        kichThuocs: responses[6].data?.data || [],
        mauSacs: responses[7].data?.data || [],
      });
    } catch (error) {
      console.error("💥 Lỗi tải dropdown data:", error);
      messageApi.error("Lỗi tải danh sách thuộc tính");
    } finally {
      setLoading(false);
    }
  };

  const previewBienTheAPI = async (requestData) => {
    try {
      const response = await baseUrl.post(
        "/chi-tiet-san-pham/preview-bien-the",
        requestData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi preview biến thể"
      );
    }
  };

  const createBienTheAPI = async (requestData) => {
    try {
      const response = await baseUrl.post(
        "/chi-tiet-san-pham/tao-bien-the",
        requestData
      );

      if (response.data && typeof response.data === "object") {
        return response.data;
      } else {
        throw new Error("Response không hợp lệ từ server");
      }
    } catch (error) {
      console.error("❌ Lỗi API createBienThe:", error);

      if (error.response) {
        const serverError = error.response.data;
        throw new Error(
          serverError.message || serverError.error || "Lỗi server"
        );
      } else if (error.request) {
        throw new Error("Không thể kết nối đến server");
      } else {
        throw new Error(error.message || "Lỗi không xác định");
      }
    }
  };

  const getModalTitle = () => MODAL_TITLES[modalType] || "thuộc tính";

  const getTenThuocTinh = (type, id) => {
    const dataMap = {
      mauSac: dropdownData.mauSacs,
      kichThuoc: dropdownData.kichThuocs,
      coAo: dropdownData.coAos,
      tayAo: dropdownData.tayAos,
      nhaSanXuat: dropdownData.nhaSanXuats,
      xuatXu: dropdownData.xuatXus,
      chatLieu: dropdownData.chatLieus,
      kieuDang: dropdownData.kieuDangs,
    };

    const data = dataMap[type];
    const item = data?.find((item) => item.id === id);
    return item
      ? item.tenMauSac ||
          item.tenKichThuoc ||
          item.tenCoAo ||
          item.tenTayAo ||
          item.tenNhaSanXuat ||
          item.tenXuatXu ||
          item.tenChatLieu ||
          item.tenKieuDang
      : "";
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setOpenModal(true);
  };

  const handleAddNew = async (values) => {
    try {
      if (!values.ten?.trim()) {
        messageApi.error(`Vui lòng nhập tên ${getModalTitle()}`);
        return;
      }

      if (!values.ma?.trim()) {
        messageApi.error(`Vui lòng nhập mã ${getModalTitle()}`);
        return;
      }

      const ten = values.ten.trim();
      const ma = values.ma.trim().toUpperCase();

      const endpoint = API_ENDPOINTS[modalType];
      if (!endpoint) {
        messageApi.error("Không tìm thấy endpoint API");
        return;
      }

      const payloadBuilder = PAYLOAD_MAPPINGS[modalType];
      if (!payloadBuilder) {
        messageApi.error("Không tìm thấy mapping payload");
        return;
      }

      const payload = payloadBuilder(ten, ma);

      const response = await baseUrl.post(endpoint, payload);

      if (response.data) {
        messageApi.success(`Thêm mới ${getModalTitle()} "${ten}" thành công`);
        await fetchDropdownData();
        setOpenModal(false);
      } else {
        messageApi.error("Thêm mới thất bại");
      }
    } catch (error) {
      console.error(`💥 Lỗi khi thêm mới ${modalType}:`, error);
      handleApiError(error, getModalTitle());
    }
  };

  const handleApiError = (error, modalTitle) => {
    if (error.response?.data) {
      const errorData = error.response.data;

      if (errorData.message?.includes("UNIQUE KEY constraint")) {
        messageApi.error(
          `Mã hoặc tên ${modalTitle} đã tồn tại. Vui lòng chọn giá trị khác.`
        );
      } else if (errorData.errors) {
        Object.values(errorData.errors).forEach((errMsg) => {
          messageApi.error(errMsg);
        });
      } else if (errorData.message) {
        messageApi.error(errorData.message);
      } else {
        messageApi.error("Lỗi server không xác định");
      }
    } else {
      messageApi.error("Lỗi kết nối đến server");
    }
  };

  const validateForm = (formValues) => {
    const errors = {};

    if (!formValues.tenSanPham?.trim()) {
      errors.tenSanPham = "Vui lòng nhập tên sản phẩm";
    } else if (formValues.tenSanPham.trim().length < 2) {
      errors.tenSanPham = "Tên sản phẩm phải có ít nhất 2 ký tự";
    }

    if (!formValues.idNhaSanXuat) {
      errors.idNhaSanXuat = "Vui lòng chọn hãng sản xuất";
    }

    if (!formValues.idXuatXu) {
      errors.idXuatXu = "Vui lòng chọn xuất xứ";
    }

    if (!formValues.idChatLieu) {
      errors.idChatLieu = "Vui lòng chọn chất liệu";
    }

    if (!formValues.idKieuDang) {
      errors.idKieuDang = "Vui lòng chọn kiểu dáng";
    }

    if (!formValues.idCoAo) {
      errors.idCoAo = "Vui lòng chọn cổ áo";
    }

    if (!formValues.idTayAo) {
      errors.idTayAo = "Vui lòng chọn tay áo";
    }

    if (!formValues.trongLuong?.trim()) {
      errors.trongLuong = "Vui lòng nhập trọng lượng";
    }

    if (!formValues.idMauSacs?.length) {
      errors.idMauSacs = "Vui lòng chọn ít nhất một màu sắc";
    } else if (formValues.idMauSacs.length > 10) {
      errors.idMauSacs = "Chỉ có thể chọn tối đa 10 màu sắc";
    }

    if (!formValues.idKichThuoc) {
      errors.idKichThuoc = "Vui lòng chọn kích thước";
    }

    return errors;
  };

  const handleTaoBienThe = async () => {
    try {
      // Reset lỗi cũ
      setFormErrors({});

      // Lấy giá trị form
      const formValues = form.getFieldsValue();

      // Validate manual
      const errors = validateForm(formValues);

      if (Object.keys(errors).length > 0) {
        // Lưu lỗi vào state
        setFormErrors(errors);
        // Hiển thị thông báo lỗi
        setShowValidationErrors(true);

        // Scroll tới field đầu tiên có lỗi
        const firstErrorField = Object.keys(errors)[0];
        const element = document.querySelector(
          `[data-field="${firstErrorField}"]`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        messageApi.error(
          "Vui lòng kiểm tra lại thông tin form trước khi tạo biến thể"
        );
        return;
      }

      // Nếu không có lỗi, ẩn thông báo lỗi và tiếp tục tạo biến thể
      setShowValidationErrors(false);
      setLoadingTaoSanPham(true);

      const requestData = {
        tenSanPham: formValues.tenSanPham,
        idNhaSanXuat: formValues.idNhaSanXuat,
        idXuatXu: formValues.idXuatXu,
        idChatLieu: formValues.idChatLieu,
        idKieuDang: formValues.idKieuDang,
        idCoAo: formValues.idCoAo,
        idTayAo: formValues.idTayAo,
        idMauSacs: formValues.idMauSacs,
        idKichThuoc: formValues.idKichThuoc,
        trongLuong: formValues.trongLuong,
      };

      const previewResponse = await previewBienTheAPI(requestData);

      if (previewResponse.success && previewResponse.data) {
        setConfirmModalData({
          ...previewResponse.data,
          formData: requestData,
          isPreview: true,
        });
        setConfirmModalOpen(true);
      } else {
        messageApi.error(previewResponse.message || "Lỗi khi preview biến thể");
      }
    } catch (error) {
      console.error("❌ Lỗi preview:", error);
      messageApi.error(error.message || "Lỗi khi preview biến thể");
    } finally {
      setLoadingTaoSanPham(false);
    }
  };

  const handleConfirmCreateProduct = async () => {
    if (!confirmModalData) return;

    setLoadingTaoSanPham(true);
    try {
      if (confirmModalData.isPreview) {
        const createResponse = await createBienTheAPI(
          confirmModalData.formData
        );

        if (createResponse.success && Array.isArray(createResponse.data)) {
          const enhancedBienTheData = createResponse.data.map(
            (bienThe, index) => {
              const formValues = confirmModalData.formData;
              const tenMauSac =
                bienThe.tenMauSac ||
                getTenThuocTinh("mauSac", bienThe.idMauSac);
              return {
                ...bienThe,
                tenSanPham: formValues.tenSanPham,
                tenCoAo: getTenThuocTinh("coAo", formValues.idCoAo),
                tenTayAo: getTenThuocTinh("tayAo", formValues.idTayAo),
                tenKichThuoc: getTenThuocTinh(
                  "kichThuoc",
                  formValues.idKichThuoc
                ),
                trongLuong: formValues.trongLuong,
                tenMauSac: tenMauSac,
                soLuong: bienThe.soLuongTon || 0,
                donGia: bienThe.giaBan || 0,
                moTa: bienThe.moTa || "",
              };
            }
          );

          setBienTheList(enhancedBienTheData);
          messageApi.success(
            `✅ Đã tạo ${enhancedBienTheData.length} biến thể thành công!`
          );
          setConfirmModalOpen(false);
          setConfirmModalData(null);
        } else {
          const errorMessage =
            createResponse.message || "Lỗi không xác định khi tạo biến thể";
          if (createResponse.errors) {
            Object.values(createResponse.errors).forEach((errMsg) => {
              messageApi.error(errMsg);
            });
          } else {
            messageApi.error(errorMessage);
          }
          throw new Error(errorMessage);
        }
      } else {
        // Khi tạo sản phẩm thành công từ ProductDetail
        messageApi.success(
          `✅ Đã tạo thành công sản phẩm với ${confirmModalData.totalVariants} biến thể!`
        );

        // Chuyển về trang quản lý sản phẩm
        messageApi.success(
          "Sản phẩm đã được tạo thành công! Đang chuyển về trang quản lý sản phẩm..."
        );

        setTimeout(() => {
          navigate("/admin/product");
        }, 1500);

        resetAllToInitialState();
        setConfirmModalOpen(false);
        setConfirmModalData(null);
      }
    } catch (error) {
      console.error("💥 Lỗi khi xác nhận:", error);
      handleCreateProductError(error);
    } finally {
      setLoadingTaoSanPham(false);
    }
  };

  const handleCreateProductError = (error) => {
    if (error.message.includes("rollback-only")) {
      messageApi.error(
        "Lỗi transaction: Dữ liệu không hợp lệ hoặc bị trùng lặp. Vui lòng kiểm tra lại thông tin."
      );
    } else if (error.message.includes("UNIQUE")) {
      messageApi.error(
        "Lỗi: Mã sản phẩm hoặc thông tin đã tồn tại trong hệ thống."
      );
    } else if (error.response?.status === 400) {
      messageApi.error("Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.");
    } else {
      messageApi.error(error.message || "Lỗi khi xác nhận tạo sản phẩm");
    }
  };

  const resetAllToInitialState = () => {
    form.resetFields();
    setBienTheList([]);
    setLoadingTaoSanPham(false);
    setOpenModal(false);
    setConfirmModalOpen(false);
    setConfirmModalData(null);
    setFormErrors({});
    setShowValidationErrors(false);
    messageApi.success("Đã reset toàn bộ dữ liệu");
  };

  const handleShowConfirmModal = (modalData) => {
    setConfirmModalData({
      ...modalData,
      navigate: navigate,
    });
    setConfirmModalOpen(true);
  };

  const FormValidationSummary = () => {
    if (!showValidationErrors || Object.keys(formErrors).length === 0)
      return null;

    return (
      <Alert
        message="Vui lòng sửa các lỗi sau trước khi tạo biến thể:"
        description={
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {Object.entries(formErrors).map(([field, message]) => (
              <li key={field} style={{ marginBottom: "4px" }}>
                {message}
              </li>
            ))}
          </ul>
        }
        type="error"
        showIcon
        style={{ marginBottom: "16px" }}
      />
    );
  };

  const FieldError = ({ error }) => {
    if (!error) return null;

    return (
      <div
        style={{
          color: "#ff4d4f",
          fontSize: "12px",
          marginTop: "4px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <WarningOutlined style={{ fontSize: "12px" }} />
        {error}
      </div>
    );
  };

  // Xóa lỗi của field khi người dùng bắt đầu sửa
  const handleFieldChange = (fieldName) => {
    if (formErrors[fieldName]) {
      const newErrors = { ...formErrors };
      delete newErrors[fieldName];
      setFormErrors(newErrors);
    }
  };

  const tagRender = (props) => {
    const { label, closable, onClose } = props;
    return (
      <Tag
        color="blue"
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  const renderDropdownSuffix = (type) => (
    <>
      <DownOutlined style={{ fontSize: 10, color: "#1C274C" }} />
      <PlusOutlined
        className="border rounded-full p-1"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleOpenModal(type);
        }}
        style={{ fontSize: 10, color: "#1C274C", cursor: "pointer" }}
      />
    </>
  );

  const ConfirmCreateProductModal = () => {
    if (!confirmModalData) return null;

    const isPreview = confirmModalData.isPreview;
    const formData = confirmModalData.formData;

    const getDisplayValue = (type, id) => {
      if (!id) return "Chưa chọn";
      return getTenThuocTinh(type, id);
    };

    const renderMauSacs = () => {
      if (!formData?.idMauSacs || formData.idMauSacs.length === 0) {
        return "Chưa chọn";
      }
      return formData.idMauSacs
        .map((id) => getDisplayValue("mauSac", id))
        .join(", ");
    };

    return (
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircleOutlined
              style={{ fontSize: "24px", color: "#52c41a" }}
            />
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>
              {isPreview ? "XÁC NHẬN TẠO BIẾN THỂ" : "XÁC NHẬN TẠO SẢN PHẨM"}
            </span>
          </div>
        }
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setConfirmModalOpen(false)}
            size="large"
            className="border-gray-300 text-gray-600 hover:border-gray-400"
          >
            Hủy bỏ
          </Button>,
          <Button
            key="confirm"
            onClick={handleConfirmCreateProduct}
            size="large"
            className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 text-white font-medium"
            loading={loadingTaoSanPham}
          >
            {isPreview ? "Tạo biến thể" : "Xác nhận tạo sản phẩm"}
          </Button>,
        ]}
        width={700}
        centered
      >
        <ConfirmModalContent
          isPreview={isPreview}
          formData={formData}
          confirmModalData={confirmModalData}
          getDisplayValue={getDisplayValue}
          renderMauSacs={renderMauSacs}
        />
      </Modal>
    );
  };

  const ConfirmModalContent = ({
    isPreview,
    formData,
    confirmModalData,
    getDisplayValue,
    renderMauSacs,
  }) => {
    if (isPreview) {
      return (
        <PreviewModalContent
          formData={formData}
          confirmModalData={confirmModalData}
          getDisplayValue={getDisplayValue}
          renderMauSacs={renderMauSacs}
        />
      );
    }

    return <FinalConfirmModalContent confirmModalData={confirmModalData} />;
  };

  const PreviewModalContent = ({
    formData,
    confirmModalData,
    getDisplayValue,
    renderMauSacs,
  }) => (
    <div style={{ padding: "20px 0" }}>
      <p
        style={{
          fontSize: "15px",
          marginBottom: "20px",
          color: "#595959",
          textAlign: "center",
        }}
      >
        Bạn sắp tạo{" "}
        <strong style={{ color: "#E67E22" }}>
          {confirmModalData.totalVariants}
        </strong>{" "}
        biến thể
      </p>
      <ImportantNote isPreview={true} />
    </div>
  );

  const FinalConfirmModalContent = ({ confirmModalData }) => (
    <div style={{ padding: "20px 0" }}>
      <p style={{ fontSize: "15px", marginBottom: "20px", color: "#595959" }}>
        Bạn đang chuẩn bị tạo sản phẩm chính thức với các thông tin sau:
      </p>

      <SummaryStats
        totalVariants={confirmModalData.totalVariants}
        totalQuantity={confirmModalData.totalQuantity}
        totalValue={confirmModalData.totalValue}
      />

      <ImportantNote isPreview={false} />
    </div>
  );

  const SummaryStats = ({ totalVariants, totalQuantity, totalValue }) => (
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "15px",
          textAlign: "center",
        }}
      >
        <Stat value={totalVariants} label="Tổng biến thể" large />
        <Stat value={totalQuantity} label="Tổng số lượng" large />
        <Stat
          value={new Intl.NumberFormat("vi-VN").format(totalValue) + "₫"}
          label="Giá trị tồn kho"
        />
      </div>
    </div>
  );

  const ImportantNote = ({ isPreview }) => (
    <div
      style={{
        background: "#fff7e6",
        border: "2px solid #ffd591",
        borderLeft: "5px solid #fa8c16",
        padding: "15px",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: "bold",
          color: "#d46b08",
          marginBottom: "8px",
        }}
      ></div>
      <ul
        style={{
          margin: 0,
          paddingLeft: "20px",
          color: "#8c8c8c",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        <li>
          {isPreview
            ? "Biến thể sẽ được tạo với số lượng = 0 và giá = 0 mặc định"
            : "Sản phẩm sẽ được lưu vào hệ thống chính thức"}
        </li>
        <li>Bạn có thể cập nhật số lượng và giá sau khi tạo</li>
        <li>Thao tác này không thể hoàn tác</li>
        {isPreview && <li>Mỗi biến thể sẽ có mã vạch tự động sinh</li>}
      </ul>
    </div>
  );

  const SectionHeader = ({ title, color }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "12px",
        padding: "8px 12px",
        background: color,
        borderRadius: "6px",
        color: "white",
      }}
    >
      <span style={{ fontWeight: "bold", fontSize: "14px" }}>{title}</span>
    </div>
  );

  const Field = ({ label, value, highlight, success, error, warning }) => {
    let style = {};
    if (highlight) style = { color: "#E67E22", fontWeight: "500" };
    if (success) style = { color: "#28a745", fontWeight: "500" };
    if (error) style = { color: "#dc3545" };
    if (warning) style = { color: "#fd7e14", fontWeight: "500" };

    return (
      <div style={{ marginBottom: "8px" }}>
        <div style={{ marginBottom: "8px" }}>
          <strong style={{ color: "#495057" }}>{label}</strong>
        </div>
        <div style={style}>{value}</div>
      </div>
    );
  };

  const Stat = ({ value, label, large = false }) => (
    <div>
      <div
        style={{
          fontSize: large ? "32px" : "28px",
          fontWeight: "bold",
          marginBottom: "5px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: large ? "13px" : "12px", opacity: 0.9 }}>
        {label}
      </div>
    </div>
  );

  const ProductName = ({ value }) => (
    <div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: "bold",
          marginBottom: "5px",
          lineHeight: "1.3",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", opacity: 0.9 }}>Tên sản phẩm</div>
    </div>
  );

  const renderProductInfo = () => (
    <>
      <Row gutter={16} wrap>
        <Col span={9}>
          <Form.Item
            name="tenSanPham"
            label="Tên sản phẩm"
            // KHÔNG có rules ở đây
            validateStatus={formErrors.tenSanPham ? "error" : ""}
            help={
              formErrors.tenSanPham ? (
                <FieldError error={formErrors.tenSanPham} />
              ) : null
            }
          >
            <Input
              placeholder="Nhập tên sản phẩm"
              size="middle"
              data-field="tenSanPham"
              onChange={() => handleFieldChange("tenSanPham")}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]} wrap>
        {[
          { name: "idNhaSanXuat", label: "Hãng", type: "nhaSanXuat", span: 6 },
          { name: "idXuatXu", label: "Xuất xứ", type: "xuatXu", span: 6 },
          { name: "idChatLieu", label: "Chất liệu", type: "chatLieu", span: 6 },
          { name: "idKieuDang", label: "Kiểu dáng", type: "kieuDang", span: 6 },
        ].map((field, index) => (
          <Col xs={24} sm={12} md={field.span} key={index}>
            <Form.Item
              name={field.name}
              label={field.label}
              // KHÔNG có rules ở đây
              validateStatus={formErrors[field.name] ? "error" : ""}
              help={
                formErrors[field.name] ? (
                  <FieldError error={formErrors[field.name]} />
                ) : null
              }
            >
              <Select
                placeholder={`Chọn ${field.label.toLowerCase()}`}
                loading={loading}
                showSearch
                optionFilterProp="children"
                suffixIcon={renderDropdownSuffix(field.type)}
                size="middle"
                data-field={field.name}
                onChange={() => handleFieldChange(field.name)}
              >
                {dropdownData[`${field.type}s`]?.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {
                      item[
                        `ten${
                          field.type.charAt(0).toUpperCase() +
                          field.type.slice(1)
                        }`
                      ]
                    }
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} wrap>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="idCoAo"
            label="Cổ áo"
            // KHÔNG có rules ở đây
            validateStatus={formErrors.idCoAo ? "error" : ""}
            help={
              formErrors.idCoAo ? (
                <FieldError error={formErrors.idCoAo} />
              ) : null
            }
          >
            <Select
              placeholder="Chọn cổ áo"
              loading={loading}
              showSearch
              optionFilterProp="children"
              suffixIcon={renderDropdownSuffix("coAo")}
              size="middle"
              data-field="idCoAo"
              onChange={() => handleFieldChange("idCoAo")}
            >
              {dropdownData.coAos?.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.tenCoAo}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="idTayAo"
            label="Tay áo"
            // KHÔNG có rules ở đây
            validateStatus={formErrors.idTayAo ? "error" : ""}
            help={
              formErrors.idTayAo ? (
                <FieldError error={formErrors.idTayAo} />
              ) : null
            }
          >
            <Select
              placeholder="Chọn tay áo"
              loading={loading}
              showSearch
              optionFilterProp="children"
              suffixIcon={renderDropdownSuffix("tayAo")}
              size="middle"
              data-field="idTayAo"
              onChange={() => handleFieldChange("idTayAo")}
            >
              {dropdownData.tayAos?.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.tenTayAo}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="trongLuong"
            label="Trọng lượng"
            // KHÔNG có rules ở đây
            validateStatus={formErrors.trongLuong ? "error" : ""}
            help={
              formErrors.trongLuong ? (
                <FieldError error={formErrors.trongLuong} />
              ) : null
            }
          >
            <Input
              placeholder="Nhập trọng lượng (VD: 200g, 0.5kg)"
              suffix={<span className="text-gray-400 text-xs">g/kg</span>}
              size="middle"
              data-field="trongLuong"
              onChange={() => handleFieldChange("trongLuong")}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const renderVariantInfo = () => (
    <Row gutter={[16, 16]} wrap>
      <Col xs={24} sm={12} md={12}>
        <Form.Item
          name="idMauSacs"
          label="Màu sắc"
          // KHÔNG có rules ở đây
          validateStatus={formErrors.idMauSacs ? "error" : ""}
          help={
            formErrors.idMauSacs ? (
              <FieldError error={formErrors.idMauSacs} />
            ) : null
          }
        >
          <Select
            mode="multiple"
            placeholder="Chọn màu sắc"
            loading={loading}
            showSearch
            tagRender={tagRender}
            suffixIcon={renderDropdownSuffix("mauSac")}
            optionFilterProp="children"
            size="middle"
            data-field="idMauSacs"
            onChange={() => handleFieldChange("idMauSacs")}
          >
            {dropdownData.mauSacs?.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.tenMauSac}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={12}>
        <Form.Item
          name="idKichThuoc"
          label="Kích thước"
          // KHÔNG có rules ở đây
          validateStatus={formErrors.idKichThuoc ? "error" : ""}
          help={
            formErrors.idKichThuoc ? (
              <FieldError error={formErrors.idKichThuoc} />
            ) : null
          }
        >
          <Select
            placeholder="Chọn kích thước"
            loading={loading}
            showSearch
            suffixIcon={renderDropdownSuffix("kichThuoc")}
            optionFilterProp="children"
            size="middle"
            data-field="idKichThuoc"
            onChange={() => handleFieldChange("idKichThuoc")}
          >
            {dropdownData.kichThuocs?.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.tenKichThuoc}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );

  useEffect(() => {
    fetchDropdownData();
  }, []);

  return (
    <>
      {contentMessNew}
      <div className=" bg-gray-50 p-6">
        <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden">
          <div className="font-bold text-4xl text-[#E67E22]">
            Quản lý sản phẩm
          </div>
          <div className="text-sm text-gray-600">
            <span
              className="cursor-pointer hover:text-[#E67E22]"
              onClick={() => navigate("/")}
            >
              Trang chủ
            </span>
            <span className="mx-2">/</span>
            <span
              className="cursor-pointer hover:text-[#E67E22]"
              onClick={() => navigate("/admin/product")}
            >
              Quản lý sản phẩm
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Thêm sản phẩm</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden mt-6">
          <div className="bg-[#E67E22] text-white px-6 py-3">
            <div className="font-bold text-2xl text-white">
              Thêm sản phẩm mới
            </div>
          </div>

          <div className="p-6">
            <SectionHeaderUI title="Thông tin sản phẩm" />

            <FormValidationSummary />

            <Form form={form} layout="vertical" autoComplete="off">
              {renderProductInfo()}

              <div className="border-t border-gray-200 mt-6 pt-6">
                <SectionHeaderUI
                  title="Thông tin biến thể"
                  subtitle="Chọn màu sắc để tạo biến thể"
                />
                {renderVariantInfo()}

                <VariantCounter form={form} />
              </div>
            </Form>
          </div>
        </div>

        <AddAttributeModal
          open={openModal}
          onCancel={() => setOpenModal(false)}
          modalType={modalType}
          getModalTitle={getModalTitle}
          onFinish={handleAddNew}
        />

        <ConfirmCreateProductModal />

        <ActionButtons
          onReset={resetAllToInitialState}
          onTaoBienThe={handleTaoBienThe}
          loading={loadingTaoSanPham}
        />

        <ProductDetail
          bienTheList={bienTheList}
          loading={loadingTaoSanPham}
          onResetCallback={resetAllToInitialState}
          onShowConfirmModal={handleShowConfirmModal}
        />
      </div>
    </>
  );
}

const SectionHeaderUI = ({ title, subtitle }) => (
  <div className="border-b border-amber-400 mb-6 pb-3">
    <p className="font-bold text-[#E67E22] text-[16px]">{title}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const VariantCounter = ({ form }) => (
  <Form.Item shouldUpdate>
    {() => {
      const formValues = form.getFieldsValue();
      const colorCount = formValues.idMauSacs?.length || 0;
      const totalCombinations = colorCount;

      return totalCombinations > 0 ? (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 font-medium">
            Sẽ tạo <span className="font-bold">{totalCombinations}</span> biến
            thể
            {colorCount > 1 ? ` theo ${colorCount} màu sắc` : ""}
          </p>
        </div>
      ) : null;
    }}
  </Form.Item>
);

const AddAttributeModal = ({
  open,
  onCancel,
  modalType,
  getModalTitle,
  onFinish,
}) => (
  <Modal
    title={`Thêm mới ${getModalTitle()}`}
    open={open}
    onCancel={onCancel}
    footer={null}
    width={500}
  >
    <Form onFinish={onFinish} layout="vertical" className="mt-4">
      <Form.Item
        name="ten"
        label={`Tên ${getModalTitle()}`}
        rules={[
          {
            required: true,
            message: `Vui lòng nhập tên ${getModalTitle()}`,
          },
          {
            min: 2,
            message: `Tên ${getModalTitle()} phải có ít nhất 2 ký tự`,
          },
        ]}
      >
        <Input placeholder={`Nhập tên ${getModalTitle()}`} size="middle" />
      </Form.Item>
      <Form.Item
        name="ma"
        label={`Mã ${getModalTitle()}`}
        rules={[
          {
            required: true,
            message: `Vui lòng nhập mã ${getModalTitle()}`,
          },
          {
            min: 2,
            message: `Mã ${getModalTitle()} phải có ít nhất 2 ký tự`,
          },
          {
            pattern: /^[A-Z0-9]+$/,
            message: "Mã chỉ được chứa chữ cái in hoa và số",
          },
        ]}
      >
        <Input
          placeholder={`Nhập mã ${getModalTitle()}`}
          style={{ textTransform: "uppercase" }}
          onInput={(e) => {
            e.target.value = e.target.value.toUpperCase();
          }}
          size="middle"
        />
      </Form.Item>
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="default"
          onClick={onCancel}
          size="middle"
          className="border-gray-300 text-gray-600 hover:border-gray-400"
        >
          Hủy
        </Button>
        <Button
          type="default"
          htmlType="submit"
          size="middle"
          className="bg-[#E67E22] border-[#E67E22] hover:bg-[#d35400] hover:border-[#d35400] text-white"
        >
          Thêm mới
        </Button>
      </div>
    </Form>
  </Modal>
);

const ActionButtons = ({ onReset, onTaoBienThe, loading }) => (
  <div className="flex justify-end gap-3 mb-6">
    <Button
      type="default"
      icon={<ReloadOutlined />}
      onClick={onReset}
      size="middle"
      className="border-gray-300 text-gray-600 hover:border-gray-400"
    >
      Nhập lại
    </Button>
    <Button
      type="default"
      onClick={onTaoBienThe}
      size="middle"
      className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 text-white font-medium"
      loading={loading}
    >
      Tạo biến thể
    </Button>
  </div>
);
