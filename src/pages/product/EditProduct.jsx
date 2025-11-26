import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Spin,
  Card,
  Collapse,
  InputNumber,
  Tag,
  Modal,
  Divider,
  Upload,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import baseUrl from "@/api/instance";

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [variants, setVariants] = useState([]);
  const [modifiedVariants, setModifiedVariants] = useState({});
  const [imageModal, setImageModal] = useState({
    visible: false,
    variantId: null,
    images: [],
  });

  const [dropdownData, setDropdownData] = useState({
    nhaSanXuats: [],
    chatLieus: [],
    kieuDangs: [],
    xuatXus: [],
    coAos: [],
    tayAos: [],
    kichThuocs: [],
    mauSacs: [],
  });

  // Cloudinary config - Sử dụng config từ component của bạn
  const CLOUD_NAME = "dyg1zkr10";
  const UPLOAD_PRESET = "yaemiko-upload";

  const fetchDropdownData = async () => {
    try {
      const [
        nhaSanXuatsRes,
        chatLieusRes,
        kieuDangsRes,
        xuatXusRes,
        coAosRes,
        tayAosRes,
        kichThuocsRes,
        mauSacsRes,
      ] = await Promise.all([
        baseUrl.get("nha-san-xuat/playlist"),
        baseUrl.get("chat-lieu/playlist"),
        baseUrl.get("kieu-dang/playlist"),
        baseUrl.get("xuat-xu/playlist"),
        baseUrl.get("co-ao/playlist"),
        baseUrl.get("tay-ao/playlist"),
        baseUrl.get("kich-thuoc/playlist"),
        baseUrl.get("mau-sac/playlist"),
      ]);

      setDropdownData({
        nhaSanXuats: nhaSanXuatsRes.data?.data || nhaSanXuatsRes.data || [],
        chatLieus: chatLieusRes.data?.data || chatLieusRes.data || [],
        kieuDangs: kieuDangsRes.data?.data || kieuDangsRes.data || [],
        xuatXus: xuatXusRes.data?.data || xuatXusRes.data || [],
        coAos: coAosRes.data?.data || coAosRes.data || [],
        tayAos: tayAosRes.data?.data || tayAosRes.data || [],
        kichThuocs: kichThuocsRes.data?.data || kichThuocsRes.data || [],
        mauSacs: mauSacsRes.data?.data || mauSacsRes.data || [],
      });
    } catch (error) {
      console.error("💥 Lỗi tải dropdown data:", error);
      message.error("Lỗi khi tải dữ liệu dropdown");
    }
  };

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const response = await baseUrl.get(`/san-pham/${id}/detail`);

      if (response.data.success) {
        const data = response.data.data;
        setProductData(data);
        setVariants(data.chiTietSanPhams || []);

        form.setFieldsValue({
          tenSanPham: data.tenSanPham,
          trongLuong: data.trongLuong,
          trangThai: data.trangThai,
        });
      } else {
        message.error(response.data.message || "Lỗi khi tải dữ liệu");
        navigate(-1);
      }
    } catch (error) {
      console.error("❌ Lỗi API:", error);
      message.error("Lỗi khi tải chi tiết sản phẩm");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchVariantImages = async (variantId) => {
    try {
      const response = await baseUrl.get(`/anh/bien-the/${variantId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("❌ Lỗi lấy ảnh:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchProductDetail();
  }, [id]);

  useEffect(() => {
    if (productData && dropdownData.nhaSanXuats.length > 0) {
      const nhaSanXuat = dropdownData.nhaSanXuats.find(
        (item) => item.tenNhaSanXuat === productData.tenNhaSanXuat
      );
      const xuatXu = dropdownData.xuatXus.find(
        (item) => item.tenXuatXu === productData.tenXuatXu
      );
      const chatLieu = dropdownData.chatLieus.find(
        (item) => item.tenChatLieu === productData.tenChatLieu
      );
      const kieuDang = dropdownData.kieuDangs.find(
        (item) => item.tenKieuDang === productData.tenKieuDang
      );
      const coAo = dropdownData.coAos.find(
        (item) => item.tenCoAo === productData.tenCoAo
      );
      const tayAo = dropdownData.tayAos.find(
        (item) => item.tenTayAo === productData.tenTayAo
      );

      form.setFieldsValue({
        idNhaSanXuat: nhaSanXuat?.id,
        idXuatXu: xuatXu?.id,
        idChatLieu: chatLieu?.id,
        idKieuDang: kieuDang?.id,
        idCoAo: coAo?.id,
        idTayAo: tayAo?.id,
      });
    }
  }, [productData, dropdownData]);

  const handleVariantChange = (variantId, field, value) => {
    setModifiedVariants((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }));
  };

  const getVariantValue = (variant, field) => {
    if (modifiedVariants[variant.id]?.[field] !== undefined) {
      return modifiedVariants[variant.id][field];
    }
    return variant[field];
  };

  const handleDeleteVariant = (variantId) => {
    Modal.confirm({
      title: "Xác nhận xóa biến thể",
      content: "Bạn có chắc chắn muốn xóa biến thể này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const response = await baseUrl.delete(
            `/chi-tiet-san-pham/${variantId}`
          );
          if (response.data.success) {
            message.success("Xóa biến thể thành công");
            setVariants((prev) => prev.filter((v) => v.id !== variantId));
            setModifiedVariants((prev) => {
              const newModified = { ...prev };
              delete newModified[variantId];
              return newModified;
            });
          } else {
            message.error(response.data.message || "Xóa biến thể thất bại");
          }
        } catch (error) {
          console.error("❌ Lỗi xóa biến thể:", error);
          message.error("Lỗi khi xóa biến thể");
        }
      },
    });
  };

  const handleImageUpload = async (variantId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      // Upload lên Cloudinary
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error(
          `Cloudinary upload failed: ${cloudinaryResponse.status}`
        );
      }

      const cloudinaryData = await cloudinaryResponse.json();

      if (cloudinaryData.secure_url) {
        // Lưu URL vào database
        const response = await baseUrl.post(`/anh/${variantId}/single`, {
          imageUrl: cloudinaryData.secure_url,
        });

        if (response.data) {
          message.success("Thêm ảnh thành công");
          // Refresh danh sách ảnh
          const updatedImages = await fetchVariantImages(variantId);
          setVariants((prev) =>
            prev.map((v) =>
              v.id === variantId ? { ...v, anhs: updatedImages } : v
            )
          );

          // Cập nhật modal nếu đang mở
          if (imageModal.variantId === variantId) {
            setImageModal((prev) => ({
              ...prev,
              images: updatedImages,
            }));
          }
        }
      } else {
        throw new Error("Upload ảnh thất bại - không nhận được URL");
      }
    } catch (error) {
      console.error("❌ Lỗi upload ảnh:", error);
      message.error("Lỗi khi upload ảnh: " + error.message);
    }
  };

  const handleDeleteImage = async (variantId, imageId) => {
    Modal.confirm({
      title: "Xác nhận xóa ảnh",
      content: "Bạn có chắc chắn muốn xóa ảnh này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await baseUrl.delete(`/anh/${imageId}`);
          message.success("Xóa ảnh thành công");

          // Refresh danh sách ảnh
          const updatedImages = await fetchVariantImages(variantId);
          setVariants((prev) =>
            prev.map((v) =>
              v.id === variantId ? { ...v, anhs: updatedImages } : v
            )
          );

          // Cập nhật modal nếu đang mở
          if (imageModal.variantId === variantId) {
            setImageModal((prev) => ({
              ...prev,
              images: updatedImages,
            }));
          }
        } catch (error) {
          console.error("❌ Lỗi xóa ảnh:", error);
          message.error("Lỗi khi xóa ảnh");
        }
      },
    });
  };

  const showImageModal = async (variantId) => {
    const images = await fetchVariantImages(variantId);
    setImageModal({
      visible: true,
      variantId,
      images,
    });
  };

  const onFinish = async (values) => {
    setSubmitLoading(true);
    try {
      const productResponse = await baseUrl.put(`/san-pham/${id}`, values);

      if (!productResponse.data.success) {
        throw new Error(
          productResponse.data.message || "Cập nhật sản phẩm thất bại"
        );
      }

      const variantUpdates = Object.entries(modifiedVariants).map(
        async ([variantId, changes]) => {
          const variant = variants.find((v) => v.id === parseInt(variantId));
          if (!variant) return;

          const currentSizeId = dropdownData.kichThuocs.find(
            (k) => k.tenKichThuoc === variant.tenKichThuoc
          )?.id;
          const currentColorId = dropdownData.mauSacs.find(
            (m) => m.tenMauSac === variant.tenMauSac
          )?.id;

          const updateData = {
            idKichThuoc:
              changes.idKichThuoc !== undefined
                ? Number(changes.idKichThuoc)
                : Number(currentSizeId),
            idMauSac:
              changes.idMauSac !== undefined
                ? Number(changes.idMauSac)
                : Number(currentColorId),
            giaBan:
              changes.giaBan !== undefined
                ? Number(changes.giaBan)
                : Number(variant.giaBan),
            soLuongTon:
              changes.soLuongTon !== undefined
                ? Number(changes.soLuongTon)
                : Number(variant.soLuongTon),
            maVach:
              changes.maVach !== undefined
                ? changes.maVach
                : variant.maVach || "",
            moTa:
              changes.moTa !== undefined ? changes.moTa : variant.moTa || "",
            trangThai:
              changes.trangThai !== undefined
                ? Boolean(changes.trangThai)
                : Boolean(variant.trangThai),
          };

          if (!updateData.idKichThuoc || !updateData.idMauSac) {
            throw new Error(
              `Biến thể ${variantId}: Thiếu kích thước hoặc màu sắc`
            );
          }
          if (updateData.giaBan <= 0) {
            throw new Error(`Biến thể ${variantId}: Giá bán phải lớn hơn 0`);
          }
          if (updateData.soLuongTon < 0) {
            throw new Error(`Biến thể ${variantId}: Số lượng không được âm`);
          }

          console.log(`📤 Cập nhật variant ${variantId}:`, updateData);

          const response = await baseUrl.put(
            `/chi-tiet-san-pham/${variantId}`,
            updateData
          );

          if (!response.data.success) {
            throw new Error(
              response.data.message || `Cập nhật biến thể ${variantId} thất bại`
            );
          }

          return response;
        }
      );

      await Promise.all(variantUpdates);

      message.success("Cập nhật sản phẩm và biến thể thành công!");

      setModifiedVariants({});

      setTimeout(() => {
        navigate(`/admin/detail-product/${id}`);
      }, 1000);
    } catch (error) {
      console.error("❌ Lỗi update:", error);
      console.error("📋 Chi tiết lỗi:", error.response?.data);

      const errorMsg =
        error.response?.data?.message || error.message || "Lỗi khi cập nhật";
      message.error(errorMsg);

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.entries(errors).forEach(([field, msg]) => {
          message.error(`${field}: ${msg}`);
        });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-400 mb-4">📦</div>
          <p className="text-gray-600">Không tìm thấy sản phẩm</p>
          <Button type="primary" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeftOutlined /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white flex flex-col gap-3 px-4 py-[20px] rounded-lg shadow overflow-hidden mb-6">
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
          <span className="text-gray-900 font-medium">
            Sửa sản phẩm: {productData.tenSanPham}
          </span>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Card className="shadow-md mb-6">
          <div className="bg-[#E67E22] text-white px-6 py-3 -mx-6 -mt-6 mb-6">
            <div className="font-bold text-2xl text-white">
              📝 Thông tin sản phẩm chính
            </div>
            <p className="text-sm mt-1 text-white/90">
              Mã sản phẩm: {productData.maSanPham}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="tenSanPham"
              label="Tên sản phẩm"
              rules={[
                { required: true, message: "Vui lòng nhập tên sản phẩm" },
                { max: 200, message: "Tên sản phẩm tối đa 200 ký tự" },
              ]}
            >
              <Input placeholder="Nhập tên sản phẩm" size="large" />
            </Form.Item>

            <Form.Item
              name="idNhaSanXuat"
              label="Nhà sản xuất"
              rules={[
                { required: true, message: "Vui lòng chọn nhà sản xuất" },
              ]}
            >
              <Select
                placeholder="Chọn nhà sản xuất"
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {dropdownData.nhaSanXuats.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.tenNhaSanXuat}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="idXuatXu"
              label="Xuất xứ"
              rules={[{ required: true, message: "Vui lòng chọn xuất xứ" }]}
            >
              <Select
                placeholder="Chọn xuất xứ"
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {dropdownData.xuatXus.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.tenXuatXu}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="idChatLieu"
              label="Chất liệu"
              rules={[{ required: true, message: "Vui lòng chọn chất liệu" }]}
            >
              <Select
                placeholder="Chọn chất liệu"
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {dropdownData.chatLieus.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.tenChatLieu}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="idKieuDang"
              label="Kiểu dáng"
              rules={[{ required: true, message: "Vui lòng chọn kiểu dáng" }]}
            >
              <Select
                placeholder="Chọn kiểu dáng"
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {dropdownData.kieuDangs.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.tenKieuDang}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="idCoAo"
              label="Cổ áo"
              rules={[{ required: true, message: "Vui lòng chọn cổ áo" }]}
            >
              <Select
                placeholder="Chọn cổ áo"
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {dropdownData.coAos.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.tenCoAo}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="idTayAo"
              label="Tay áo"
              rules={[{ required: true, message: "Vui lòng chọn tay áo" }]}
            >
              <Select
                placeholder="Chọn tay áo"
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {dropdownData.tayAos.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.tenTayAo}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="trongLuong"
              label="Trọng lượng"
              rules={[{ max: 50, message: "Trọng lượng tối đa 50 ký tự" }]}
            >
              <Input placeholder="VD: 200g" size="large" />
            </Form.Item>

            <Form.Item
              name="trangThai"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái" size="large">
                <Option value={true}>Đang hoạt động</Option>
                <Option value={false}>Ngừng hoạt động</Option>
              </Select>
            </Form.Item>
          </div>
        </Card>

        <Card className="shadow-md mb-6">
          <div className="bg-[#E67E22] text-white px-6 py-3 -mx-6 -mt-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-2xl text-white">
                  🎨 Danh sách biến thể sản phẩm
                </div>
                <p className="text-sm mt-1 text-white/90">
                  Tổng cộng: {variants.length} biến thể
                </p>
              </div>
            </div>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có biến thể nào</p>
            </div>
          ) : (
            <Collapse accordion className="variant-collapse">
              {variants.map((variant, index) => (
                <Panel
                  key={variant.id}
                  header={
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-700">
                          #{index + 1}
                        </span>
                        <Tag color="blue">{variant.tenKichThuoc}</Tag>
                        <Tag color="volcano">{variant.tenMauSac}</Tag>
                        <span className="text-[#E67E22] font-bold">
                          {formatPrice(getVariantValue(variant, "giaBan"))}
                        </span>
                        <span className="text-gray-600">
                          SL: {getVariantValue(variant, "soLuongTon")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            showImageModal(variant.id);
                          }}
                        >
                          Quản lý ảnh
                        </Button>
                        <Tag
                          color={
                            getVariantValue(variant, "trangThai")
                              ? "green"
                              : "red"
                          }
                        >
                          {getVariantValue(variant, "trangThai")
                            ? "Hoạt động"
                            : "Ngừng"}
                        </Tag>
                      </div>
                    </div>
                  }
                  extra={
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVariant(variant.id);
                      }}
                    >
                      Xóa
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kích thước
                      </label>
                      <Select
                        value={
                          getVariantValue(variant, "idKichThuoc") ||
                          dropdownData.kichThuocs.find(
                            (k) => k.tenKichThuoc === variant.tenKichThuoc
                          )?.id
                        }
                        onChange={(value) =>
                          handleVariantChange(variant.id, "idKichThuoc", value)
                        }
                        className="w-full"
                        size="large"
                      >
                        {dropdownData.kichThuocs.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.tenKichThuoc}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Màu sắc
                      </label>
                      <Select
                        value={
                          getVariantValue(variant, "idMauSac") ||
                          dropdownData.mauSacs.find(
                            (m) => m.tenMauSac === variant.tenMauSac
                          )?.id
                        }
                        onChange={(value) =>
                          handleVariantChange(variant.id, "idMauSac", value)
                        }
                        className="w-full"
                        size="large"
                      >
                        {dropdownData.mauSacs.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.tenMauSac}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá bán (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <InputNumber
                        value={getVariantValue(variant, "giaBan")}
                        onChange={(value) =>
                          handleVariantChange(variant.id, "giaBan", value)
                        }
                        className="w-full"
                        size="large"
                        min={0}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng tồn <span className="text-red-500">*</span>
                      </label>
                      <InputNumber
                        value={getVariantValue(variant, "soLuongTon")}
                        onChange={(value) =>
                          handleVariantChange(variant.id, "soLuongTon", value)
                        }
                        className="w-full"
                        size="large"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã vạch
                      </label>
                      <Input
                        value={getVariantValue(variant, "maVach")}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.id,
                            "maVach",
                            e.target.value
                          )
                        }
                        size="large"
                        placeholder="Nhập mã vạch"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <Select
                        value={getVariantValue(variant, "trangThai")}
                        onChange={(value) =>
                          handleVariantChange(variant.id, "trangThai", value)
                        }
                        className="w-full"
                        size="large"
                      >
                        <Option value={true}>Hoạt động</Option>
                        <Option value={false}>Ngừng hoạt động</Option>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <TextArea
                        value={getVariantValue(variant, "moTa")}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.id,
                            "moTa",
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="Nhập mô tả biến thể"
                        maxLength={500}
                        showCount
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white hover:border-[#E67E22] transition-all duration-300">
                        {variant.anhs && variant.anhs.length > 0 ? (
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {variant.anhs.map((anh) => (
                              <div
                                key={anh.id}
                                className="relative group aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#E67E22] transition-all duration-300 shadow-sm hover:shadow-md"
                              >
                                <Image
                                  src={anh.duongDanAnh}
                                  alt="Ảnh biến thể"
                                  className="w-full h-full object-cover"
                                  preview={{
                                    mask: (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <EyeOutlined style={{ fontSize: 16 }} />
                                        <span className="text-[10px]">Xem</span>
                                        <Button
                                          type="link"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            showImageModal(variant.id);
                                          }}
                                        >
                                          Quản lý ảnh
                                        </Button>
                                      </div>
                                    ),
                                  }}
                                />

                                <Button
                                  type="primary"
                                  danger
                                  size="small"
                                  icon={
                                    <DeleteOutlined style={{ fontSize: 12 }} />
                                  }
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-75"
                                  onClick={() =>
                                    handleDeleteImage(variant.id, anh.id)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <div className="text-4xl mb-2">📸</div>
                            <p className="text-sm font-medium text-gray-500">
                              Chưa có ảnh nào
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Nhấn "Thêm ảnh" để tải lên
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </Collapse>
          )}
        </Card>

        <Modal
          title={
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-[#E67E22]/10 flex items-center justify-center">
                <EyeOutlined className="text-[#E67E22] text-xl" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-800">
                  Quản lý ảnh biến thể
                </div>
              </div>
            </div>
          }
          open={imageModal.visible}
          onCancel={() =>
            setImageModal({ visible: false, variantId: null, images: [] })
          }
          footer={null}
          width={900}
          bodyStyle={{ padding: "24px" }}
        >
          <div className="mb-6">
            {imageModal.images.length > 0 ? (
              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {imageModal.images.map((anh, index) => (
                    <div
                      key={anh.id}
                      className="relative group aspect-square overflow-hidden rounded-xl border-2 border-gray-200 hover:border-[#E67E22] transition-all duration-300 shadow-md hover:shadow-xl"
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                          #{index + 1}
                        </span>
                      </div>

                      <Image
                        src={anh.duongDanAnh}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-full object-cover"
                        preview={{
                          mask: (
                            <div className="flex flex-col items-center gap-1">
                              <EyeOutlined style={{ fontSize: 24 }} />
                              <span className="text-sm font-medium">
                                Xem chi tiết
                              </span>
                            </div>
                          ),
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                      <Button
                        type="primary"
                        danger
                        size="middle"
                        icon={<DeleteOutlined />}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                        onClick={() =>
                          handleDeleteImage(imageModal.variantId, anh.id)
                        }
                      >
                        Xóa
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-7xl mb-4">🖼️</div>
                <p className="text-lg font-semibold text-gray-600 mb-2">
                  Chưa có ảnh nào
                </p>
                <p className="text-sm text-gray-400">
                  Nhấn nút bên dưới để thêm ảnh mới cho biến thể này
                </p>
              </div>
            )}
          </div>

          <Divider style={{ margin: "20px 0" }} />

          <div className="flex justify-between items-center pt-2">
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error("Ảnh phải nhỏ hơn 5MB!");
                  return false;
                }
                handleImageUpload(imageModal.variantId, file);
                return false;
              }}
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="middle"
                style={{
                  backgroundColor: "#E67E22",
                  borderColor: "#E67E22",
                }}
              >
                Thêm ảnh mới
              </Button>
            </Upload>
          </div>
        </Modal>

        <div className="flex justify-end gap-4 mt-4">
          <Button size="large" onClick={() => navigate(-1)}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitLoading}
            icon={<SaveOutlined />}
            style={{ backgroundColor: "#E67E22", borderColor: "#E67E22" }}
          >
            Lưu tất cả thay đổi
          </Button>
        </div>
      </Form>

      <style jsx>{`
        .variant-collapse .ant-collapse-header {
          background: #f9fafb !important;
          border-radius: 8px !important;
          margin-bottom: 8px;
        }
        .variant-collapse .ant-collapse-content {
          border-radius: 0 0 8px 8px;
        }
      `}</style>
    </div>
  );
}
