import {
  DownOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
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
} from "antd";
import React, { useState, useEffect } from "react";
import ProductDetail from "./productDetail/ProductDetail";
import baseUrl from "@/api/instance";

const { Option } = Select;

export default function AddProduct() {
  const [form] = Form.useForm();
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
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
  const [loading, setLoading] = useState(false);
  const [bienTheList, setBienTheList] = useState([]);
  const [loadingTaoSanPham, setLoadingTaoSanPham] = useState(false);

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
      message.error("Lỗi tải danh sách thuộc tính");
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

  const handleOpenModal = (type) => {
    setModalType(type);
    setOpenModal(true);
  };

  const handleAddNew = async (values) => {
    try {
      console.log(`🎯 Bắt đầu thêm mới ${modalType}:`, values);

      if (!values.ten || !values.ten.trim()) {
        message.error(`Vui lòng nhập tên ${getModalTitle()}`);
        return;
      }

      if (!values.ma || !values.ma.trim()) {
        message.error(`Vui lòng nhập mã ${getModalTitle()}`);
        return;
      }

      const ten = values.ten.trim();
      const ma = values.ma.trim().toUpperCase();

      console.log(`📝 Dữ liệu đã chuẩn hóa:`, { ten, ma, modalType });

      const apiEndpoints = {
        nhaSanXuat: "/nha-san-xuat/add",
        xuatXu: "/xuat-xu/add",
        chatLieu: "/chat-lieu/add",
        kieuDang: "/kieu-dang/add",
        coAo: "/co-ao/add",
        tayAo: "/tay-ao/add",
        kichThuoc: "/kich-thuoc/add",
        mauSac: "/mau-sac/add",
      };

      const endpoint = apiEndpoints[modalType];
      if (!endpoint) {
        message.error("Không tìm thấy endpoint API");
        return;
      }

      console.log(`🔗 Endpoint: ${endpoint}`);

      const payloadMappings = {
        nhaSanXuat: {
          tenNhaSanXuat: ten,
          maNhaSanXuat: ma,
        },
        xuatXu: {
          tenXuatXu: ten,
          maXuatXu: ma,
        },
        chatLieu: {
          tenChatLieu: ten,
          maChatLieu: ma,
        },
        kieuDang: {
          tenKieuDang: ten,
          maKieuDang: ma,
        },
        coAo: {
          tenCoAo: ten,
          maCoAo: ma,
        },
        tayAo: {
          tenTayAo: ten,
          maTayAo: ma,
        },
        kichThuoc: {
          tenKichThuoc: ten,
          maKichThuoc: ma,
        },
        mauSac: {
          tenMauSac: ten,
          maMauSac: ma,
        },
      };

      const payload = payloadMappings[modalType];

      if (!payload) {
        message.error("Không tìm thấy mapping payload");
        return;
      }

      console.log("📦 Payload gửi đi:", payload);

      const response = await baseUrl.post(endpoint, payload);

      console.log("✅ Response từ server:", response.data);

      if (response.data) {
        message.success(`Thêm mới ${getModalTitle()} "${ten}" thành công`);
        await fetchDropdownData();
        setOpenModal(false);
      } else {
        message.error("Thêm mới thất bại");
      }
    } catch (error) {
      console.error(`💥 Lỗi khi thêm mới ${modalType}:`, error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (
          errorData.message &&
          errorData.message.includes("UNIQUE KEY constraint")
        ) {
          message.error(
            `Mã hoặc tên ${getModalTitle()} đã tồn tại. Vui lòng chọn giá trị khác.`
          );
        } else if (errorData.errors) {
          Object.values(errorData.errors).forEach((errMsg) => {
            message.error(errMsg);
          });
        } else if (errorData.message) {
          message.error(errorData.message);
        } else {
          message.error("Lỗi server không xác định");
        }
      } else {
        message.error("Lỗi kết nối đến server");
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

  const handleTaoBienThe = async () => {
    try {
      const formValues = await form.validateFields();

      const requiredFields = [
        "tenSanPham",
        "idNhaSanXuat",
        "idXuatXu",
        "idChatLieu",
        "idKieuDang",
        "idCoAo",
        "idTayAo",
        "trongLuong",
        "idKichThuoc",
      ];
      const requiredVariantFields = ["idMauSacs"];

      const missingMainFields = requiredFields.filter(
        (field) => !formValues[field]
      );
      const missingVariantFields = requiredVariantFields.filter(
        (field) => !formValues[field]?.length
      );

      if (missingMainFields.length) {
        message.error("Vui lòng điền đầy đủ thông tin sản phẩm");
        return;
      }

      if (missingVariantFields.length) {
        message.error("Vui lòng chọn ít nhất một màu sắc");
        return;
      }

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

      console.log(
        "🔍 Gọi API preview với data:",
        JSON.stringify(requestData, null, 2)
      );

      const previewResponse = await previewBienTheAPI(requestData);

      if (previewResponse.success && previewResponse.data) {
        console.log("✅ Preview thành công:", previewResponse.data);

        setConfirmModalData({
          ...previewResponse.data,
          formData: requestData,
          isPreview: true,
        });
        setConfirmModalOpen(true);
      } else {
        message.error(previewResponse.message || "Lỗi khi preview biến thể");
      }
    } catch (error) {
      console.error("❌ Lỗi preview:", error);
      message.error(error.message || "Lỗi khi preview biến thể");
    } finally {
      setLoadingTaoSanPham(false);
    }
  };

  const resetAllToInitialState = () => {
    form.resetFields();
    setBienTheList([]);
    setLoadingTaoSanPham(false);
    setOpenModal(false);
    setConfirmModalOpen(false);
    setConfirmModalData(null);
    message.success("Đã reset toàn bộ dữ liệu");
  };

  const handleShowConfirmModal = (modalData) => {
    setConfirmModalData(modalData);
    setConfirmModalOpen(true);
  };

  const handleConfirmCreateProduct = async () => {
    if (!confirmModalData) return;
  
    setLoadingTaoSanPham(true);
    try {
      if (confirmModalData.isPreview) {
        console.log(
          "🎯 Gọi API create thật với data:",
          confirmModalData.formData
        );
  
        const createResponse = await createBienTheAPI(
          confirmModalData.formData
        );
  
        if (createResponse.success && Array.isArray(createResponse.data)) {
          console.log("✅ Create thành công:", createResponse.data);
  
          const enhancedBienTheData = createResponse.data.map(
            (bienThe, index) => {
              const formValues = confirmModalData.formData;
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
                tenMauSac: getTenThuocTinh("mauSac", bienThe.idMauSac),
                soLuong: bienThe.soLuongTon || 0,
                donGia: bienThe.giaBan || 0,
                moTa: bienThe.moTa || "",
              };
            }
          );
  
          setBienTheList(enhancedBienTheData);

          message.success(
            `✅ Đã tạo ${enhancedBienTheData.length} biến thể thành công!`
          );
  
          setConfirmModalOpen(false);
          setConfirmModalData(null);
        } else {
          const errorMessage =
            createResponse.message || "Lỗi không xác định khi tạo biến thể";
  
          if (createResponse.errors) {
            Object.values(createResponse.errors).forEach((errMsg) => {
              message.error(errMsg);
            });
          } else {
            message.error(errorMessage);
          }
  
          throw new Error(errorMessage);
        }
      } else {
        console.log("🎯 Tạo sản phẩm thành công với các biến thể:", confirmModalData.variantsData);
        
        message.success(`✅ Đã tạo thành công sản phẩm với ${confirmModalData.totalVariants} biến thể!`);
        
        resetAllToInitialState();
        
        setConfirmModalOpen(false);
        setConfirmModalData(null);
      }
      
    } catch (error) {
      console.error("💥 Lỗi khi xác nhận:", error);
  
      if (error.message.includes("rollback-only")) {
        message.error(
          "Lỗi transaction: Dữ liệu không hợp lệ hoặc bị trùng lặp. Vui lòng kiểm tra lại thông tin."
        );
      } else if (error.message.includes("UNIQUE")) {
        message.error(
          "Lỗi: Mã sản phẩm hoặc thông tin đã tồn tại trong hệ thống."
        );
      } else if (error.response?.status === 400) {
        message.error("Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.");
      } else {
        message.error(error.message || "Lỗi khi xác nhận tạo sản phẩm");
      }
      
    } finally {
      setLoadingTaoSanPham(false);
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
      return formData.idMauSacs.map(id => getDisplayValue("mauSac", id)).join(", ");
    };
  
    return (
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircleOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
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
        <div style={{ padding: "20px 0" }}>
          {isPreview ? (
            <>
              <p style={{ 
                fontSize: "15px", 
                marginBottom: "20px", 
                color: "#595959",
                textAlign: "center"
              }}>
                Bạn sắp tạo <strong style={{ color: "#E67E22" }}>{confirmModalData.totalVariants}</strong> biến thể
              </p>
  
              <div style={{ marginBottom: "20px" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "12px",
                  padding: "8px 12px",
                  background: "#E67E22",
                  borderRadius: "6px",
                  color: "white"
                }}>
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>📦 THÔNG TIN SẢN PHẨM CHÍNH</span>
                </div>
                <div style={{ 
                  background: "#f8f9fa", 
                  padding: "16px", 
                  borderRadius: "8px",
                  border: "1px solid #e9ecef"
                }}>
                  <Row gutter={[16, 12]}>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Tên sản phẩm:</strong>
                      </div>
                      <div style={{ color: "#E67E22", fontWeight: "500" }}>
                        {formData?.tenSanPham || "Chưa có"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Mã sản phẩm:</strong>
                      </div>
                      <div style={{ color: "#28a745", fontWeight: "500" }}>
                        {confirmModalData.maSanPham || "Sẽ được tạo tự động"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Hãng:</strong>
                      </div>
                      <div>{getDisplayValue("nhaSanXuat", formData?.idNhaSanXuat)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Xuất xứ:</strong>
                      </div>
                      <div>{getDisplayValue("xuatXu", formData?.idXuatXu)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Chất liệu:</strong>
                      </div>
                      <div>{getDisplayValue("chatLieu", formData?.idChatLieu)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Kiểu dáng:</strong>
                      </div>
                      <div>{getDisplayValue("kieuDang", formData?.idKieuDang)}</div>
                    </Col>
                  </Row>
                </div>
              </div>
  
              <div style={{ marginBottom: "20px" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "12px",
                  padding: "8px 12px",
                  background: "#28a745",
                  borderRadius: "6px",
                  color: "white"
                }}>
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>🎨 THÔNG TIN BIẾN THỂ</span>
                </div>
                <div style={{ 
                  background: "#f6ffed", 
                  border: "1px solid #b7eb8f", 
                  padding: "16px", 
                  borderRadius: "8px" 
                }}>
                  <Row gutter={[16, 12]}>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Màu sắc:</strong>
                      </div>
                      <div style={{ color: "#dc3545" }}>
                        {renderMauSacs()}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Kích thước:</strong>
                      </div>
                      <div>{getDisplayValue("kichThuoc", formData?.idKichThuoc)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Trọng lượng:</strong>
                      </div>
                      <div style={{ color: "#fd7e14", fontWeight: "500" }}>
                        {formData?.trongLuong || "Chưa nhập"}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Cổ áo:</strong>
                      </div>
                      <div>{getDisplayValue("coAo", formData?.idCoAo)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Tay áo:</strong>
                      </div>
                      <div>{getDisplayValue("tayAo", formData?.idTayAo)}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ color: "#495057" }}>Số biến thể:</strong>
                      </div>
                      <div>
                        <Tag color="blue" style={{ fontSize: "14px", padding: "4px 8px" }}>
                          {confirmModalData.totalVariants} biến thể
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
  
              <div style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                textAlign: "center",
                marginBottom: "20px"
              }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>
                  📊 TÓM TẮT TỔNG QUAN
                </div>
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "5px" }}>
                      {confirmModalData.totalVariants}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.9 }}>Tổng biến thể</div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "5px" }}>
                      {formData?.idMauSacs?.length || 0}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.9 }}>Màu sắc</div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px", lineHeight: "1.3" }}>
                      {formData?.tenSanPham || "Chưa có tên"}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.9 }}>Tên sản phẩm</div>
                  </Col>
                </Row>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: "15px", marginBottom: "20px", color: "#595959" }}>
                Bạn đang chuẩn bị tạo sản phẩm chính thức với các thông tin sau:
              </p>
  
              <div style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
                color: "white",
              }}>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr 1fr", 
                  gap: "15px", 
                  textAlign: "center" 
                }}>
                  <div>
                    <div style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "5px" }}>
                      {confirmModalData.totalVariants}
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.9 }}>Tổng biến thể</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "5px" }}>
                      {confirmModalData.totalQuantity}
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.9 }}>Tổng số lượng</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "5px" }}>
                      {new Intl.NumberFormat("vi-VN").format(confirmModalData.totalValue)}₫
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.9 }}>Giá trị tồn kho</div>
                  </div>
                </div>
              </div>
            </>
          )}
  
          <div style={{
            background: "#fff7e6",
            border: "2px solid #ffd591",
            borderLeft: "5px solid #fa8c16",
            padding: "15px",
            borderRadius: "8px",
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              fontWeight: "bold", 
              color: "#d46b08", 
              marginBottom: "8px" 
            }}>
              <span style={{ marginRight: "8px" }}>⚠️</span>
              LƯU Ý QUAN TRỌNG
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: "20px",
              color: "#8c8c8c",
              fontSize: "13px",
              lineHeight: "1.6",
            }}>
              <li>
                {isPreview
                  ? "Biến thể sẽ được tạo với số lượng = 0 và giá = 0 mặc định"
                  : "Sản phẩm sẽ được lưu vào hệ thống chính thức"}
              </li>
              <li>Bạn có thể cập nhật số lượng và giá sau khi tạo</li>
              <li>Thao tác này không thể hoàn tác</li>
              {isPreview && (
                <li>Mỗi biến thể sẽ có mã vạch tự động sinh</li>
              )}
            </ul>
          </div>
        </div>
      </Modal>
    );
  };

  const renderProductInfo = () => (
    <>
      <Row gutter={16} wrap>
        <Col span={12}>
          <Form.Item
            name="tenSanPham"
            label="Tên sản phẩm"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên sản phẩm",
              },
            ]}
          >
            <Input placeholder="Nhập tên sản phẩm" size="middle" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]} wrap>
        {[
          {
            name: "idNhaSanXuat",
            label: "Hãng",
            placeholder: "Chọn hãng",
            type: "nhaSanXuat",
            span: 6,
          },
          {
            name: "idXuatXu",
            label: "Xuất xứ",
            placeholder: "Chọn xuất xứ",
            type: "xuatXu",
            span: 6,
          },
          {
            name: "idChatLieu",
            label: "Chất liệu",
            placeholder: "Chọn chất liệu",
            type: "chatLieu",
            span: 6,
          },
          {
            name: "idKieuDang",
            label: "Kiểu dáng",
            placeholder: "Chọn kiểu dáng",
            type: "kieuDang",
            span: 6,
          },
        ].map((field, index) => (
          <Col xs={24} sm={12} md={field.span} key={index}>
            <Form.Item
              name={field.name}
              label={field.label}
              rules={[
                {
                  required: true,
                  message: `Vui lòng ${field.placeholder.toLowerCase()}`,
                },
              ]}
            >
              <Select
                placeholder={field.placeholder}
                loading={loading}
                showSearch
                optionFilterProp="children"
                suffixIcon={renderDropdownSuffix(field.type)}
                size="middle"
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
            rules={[
              {
                required: true,
                message: "Vui lòng chọn cổ áo",
              },
            ]}
          >
            <Select
              placeholder="Chọn cổ áo"
              loading={loading}
              showSearch
              optionFilterProp="children"
              suffixIcon={renderDropdownSuffix("coAo")}
              size="middle"
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
            rules={[
              {
                required: true,
                message: "Vui lòng chọn tay áo",
              },
            ]}
          >
            <Select
              placeholder="Chọn tay áo"
              loading={loading}
              showSearch
              optionFilterProp="children"
              suffixIcon={renderDropdownSuffix("tayAo")}
              size="middle"
            >
              {dropdownData.tayAos?.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.tenTayAo}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const renderVariantInfo = () => (
    <Row gutter={[16, 16]} wrap>
      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="idMauSacs"
          label="Màu sắc"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn màu sắc",
            },
          ]}
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
          >
            {dropdownData.mauSacs?.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.tenMauSac}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="idKichThuoc"
          label="Kích thước"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn kích thước",
            },
          ]}
        >
          <Select
            placeholder="Chọn kích thước"
            loading={loading}
            showSearch
            suffixIcon={renderDropdownSuffix("kichThuoc")}
            optionFilterProp="children"
            size="middle"
          >
            {dropdownData.kichThuocs?.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.tenKichThuoc}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="trongLuong"
          label="Trọng lượng"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập trọng lượng",
            },
          ]}
        >
          <Input
            placeholder="Nhập trọng lượng (VD: 200g, 0.5kg)"
            suffix={<span className="text-gray-400 text-xs">g/kg</span>}
            size="middle"
          />
        </Form.Item>
      </Col>
    </Row>
  );

  useEffect(() => {
    fetchDropdownData();
  }, []);

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-3">
          <h2 className="text-lg font-bold">Thêm sản phẩm mới</h2>
        </div>

        <div className="p-6">
          <div className="border-b border-amber-400 mb-6 pb-3">
            <p className="font-bold text-[#E67E22] text-[16px]">
              Thông tin sản phẩm
            </p>
          </div>

          <Form form={form} layout="vertical" autoComplete="off">
            {renderProductInfo()}

            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="border-b border-amber-400 mb-6 pb-3">
                <p className="font-bold text-[#E67E22] text-[16px]">
                  Thông tin biến thể
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Chọn màu sắc để tạo biến thể
                </p>
              </div>
              {renderVariantInfo()}

              <Form.Item shouldUpdate>
                {() => {
                  const formValues = form.getFieldsValue();
                  const colorCount = formValues.idMauSacs?.length || 0;
                  const totalCombinations = colorCount;

                  return totalCombinations > 0 ? (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 font-medium">
                        Sẽ tạo{" "}
                        <span className="font-bold">{totalCombinations}</span>{" "}
                        biến thể
                        {colorCount > 1 ? ` theo ${colorCount} màu sắc` : ""}
                      </p>
                    </div>
                  ) : null;
                }}
              </Form.Item>
            </div>
          </Form>
        </div>
      </div>

      <Modal
        title={`Thêm mới ${getModalTitle()}`}
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleAddNew} layout="vertical" className="mt-4">
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
              onClick={() => setOpenModal(false)}
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

      <ConfirmCreateProductModal />

      <div className="flex justify-end gap-3 mb-6">
        <Button
          type="default"
          icon={<ReloadOutlined />}
          onClick={resetAllToInitialState}
          size="middle"
          className="border-gray-300 text-gray-600 hover:border-gray-400"
        >
          Nhập lại
        </Button>
        <Button
          type="default"
          onClick={handleTaoBienThe}
          size="middle"
          className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 text-white font-medium"
          loading={loadingTaoSanPham}
        >
          Tạo biến thể
        </Button>
      </div>

      <ProductDetail
        bienTheList={bienTheList}
        loading={loadingTaoSanPham}
        onResetCallback={resetAllToInitialState}
        onShowConfirmModal={handleShowConfirmModal}
      />
    </>
  );
}
