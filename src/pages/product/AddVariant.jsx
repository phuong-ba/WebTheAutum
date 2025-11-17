import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Select,
  Button,
  message,
  Card,
  Tag,
  Descriptions,
  Modal,
  Image,
  Progress,
  Row,
  Col,
  InputNumber,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import baseUrl from "@/api/instance";
import CloudinaryUpload from "./CloudinaryUpload";

export default function AddVariant() {
  const { idSanPham } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [dropdownData, setDropdownData] = useState({
    mauSacs: [],
    kichThuocs: [],
  });

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [createdVariants, setCreatedVariants] = useState([]);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [uploadedImages, setUploadedImages] = useState({});
  const [uploading, setUploading] = useState(false);
  const [variantForm] = Form.useForm();

  const fetchProductInfo = async () => {
    try {
      const response = await baseUrl.get(`/san-pham/${idSanPham}/detail`);
      if (response.data.success) {
        setProductInfo(response.data.data);
      }
    } catch (error) {
      message.error("Lỗi tải thông tin sản phẩm");
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [mauSacRes, kichThuocRes] = await Promise.all([
        baseUrl.get("mau-sac/playlist"),
        baseUrl.get("kich-thuoc/playlist"),
      ]);

      setDropdownData({
        mauSacs: mauSacRes.data?.data || [],
        kichThuocs: kichThuocRes.data?.data || [],
      });
    } catch (error) {
      message.error("Lỗi tải danh sách thuộc tính");
    }
  };

  const checkExistingVariants = (idMauSacs, idKichThuoc) => {
    if (!productInfo?.chiTietSanPhams) return [];

    const existing = productInfo.chiTietSanPhams;
    return idMauSacs.filter((mauId) =>
      existing.some(
        (v) => v.idMauSac === mauId && v.idKichThuoc === idKichThuoc
      )
    );
  };

  const handleSubmit = async (values) => {
    const duplicateVariants = checkExistingVariants(
      values.idMauSacs,
      values.idKichThuoc
    );
    if (duplicateVariants.length > 0) {
      const duplicateNames = duplicateVariants
        .map((id) => dropdownData.mauSacs.find((m) => m.id === id)?.tenMauSac)
        .filter(Boolean);

      Modal.confirm({
        title: "Biến thể đã tồn tại",
        content: `Các màu sau đã có biến thể với kích thước này: ${duplicateNames.join(
          ", "
        )}. Bạn có muốn tiếp tục tạo các màu còn lại không?`,
        okText: "Tiếp tục",
        cancelText: "Hủy",
        onOk: () => {
          const filteredMauSacs = values.idMauSacs.filter(
            (id) => !duplicateVariants.includes(id)
          );
          if (filteredMauSacs.length === 0) {
            message.error("Tất cả màu đã tồn tại với kích thước này");
            return;
          }
          createVariants({ ...values, idMauSacs: filteredMauSacs });
        },
      });
      return;
    }

    createVariants(values);
  };

  const createVariants = async (values) => {
    setLoading(true);
    try {
      const requestData = {
        idSanPham: parseInt(idSanPham),
        idMauSacs: values.idMauSacs,
        idKichThuoc: values.idKichThuoc,
      };


      const response = await baseUrl.post(
        "/chi-tiet-san-pham/tao-bien-the-cho-san-pham",
        requestData
      );


      if (response.data.success) {
        const newVariants = response.data.data || [];
        setCreatedVariants(newVariants);

        if (newVariants.length > 0) {
          variantForm.resetFields();
          setUploadModalVisible(true);
          setCurrentVariantIndex(0);
          message.success(
            `Đã tạo ${newVariants.length} biến thể mới thành công!`
          );
        } else {
          message.success("Tạo biến thể thành công!");
          navigate(`/admin/detail-product/${idSanPham}`);
        }
      } else {
        throw new Error(response.data.message || "Lỗi không xác định");
      }
    } catch (error) {
      console.error("❌ Lỗi tạo biến thể:", error);
      const errorMsg = error.response?.data?.message || "Lỗi khi tạo biến thể";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariantInfo = async (variantId, values) => {
    try {

      const updateData = {};

      if (values.donGia !== undefined && values.donGia !== null) {
        updateData.donGia = values.donGia;
      }

      if (values.soLuong !== undefined && values.soLuong !== null) {
        updateData.soLuong = values.soLuong;
      }

      if (
        values.moTa !== undefined &&
        values.moTa !== null &&
        values.moTa.trim() !== ""
      ) {
        updateData.moTa = values.moTa;
      }

      if (updateData.donGia !== undefined) {
        await baseUrl.patch(`/chi-tiet-san-pham/${variantId}/gia`, {
          donGia: updateData.donGia,
        });
      }

      if (updateData.soLuong !== undefined) {
        await baseUrl.patch(`/chi-tiet-san-pham/${variantId}/so-luong`, {
          soLuong: updateData.soLuong,
        });
      }

      if (updateData.moTa !== undefined) {
        await baseUrl.patch(`/chi-tiet-san-pham/${variantId}/mo-ta`, {
          moTa: updateData.moTa,
        });
      }

      return true;
    } catch (error) {
      console.error("❌ Lỗi cập nhật biến thể:", error);
      throw new Error(
        error.response?.data?.message || "Lỗi khi cập nhật thông tin biến thể"
      );
    }
  };

  const handleUploadAndUpdate = async (
    variantId,
    uploadedImage,
    formValues
  ) => {
    setUploading(true);
    try {
      if (uploadedImage) {
        console.log(
          "📤 Upload ảnh cho biến thể:",
          variantId,
          uploadedImage.url
        );
        const uploadResponse = await baseUrl.post(`/anh/${variantId}/single`, {
          imageUrl: uploadedImage.url,
        });

        if (
          !uploadResponse.data ||
          !(uploadResponse.data.status === "200" || uploadResponse.data.success)
        ) {
          throw new Error("Upload ảnh thất bại");
        }

        setUploadedImages((prev) => ({
          ...prev,
          [variantId]: {
            url: uploadedImage.url,
            id: uploadResponse.data.data?.id,
          },
        }));
      }

      if (
        formValues &&
        (formValues.donGia !== undefined || formValues.soLuong !== undefined)
      ) {
        await handleUpdateVariantInfo(variantId, formValues);
      }

      message.success("Đã cập nhật biến thể thành công!");

      if (currentVariantIndex < createdVariants.length - 1) {
        setTimeout(() => {
          setCurrentVariantIndex(currentVariantIndex + 1);
          variantForm.resetFields();
          setUploading(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setUploadModalVisible(false);
          setUploading(false);
          message.info("Đã hoàn thành tất cả biến thể!");
          navigate(`/admin/detail-product/${idSanPham}`);
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Lỗi xử lý biến thể:", error);
      message.error(error.message || "Lỗi khi xử lý biến thể");
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    try {
      const values = await variantForm.validateFields();
      const currentVariant = createdVariants[currentVariantIndex];
      await handleUploadAndUpdate(currentVariant.id, null, values);
    } catch (error) {
      console.error("❌ Lỗi validate form:", error);
    }
  };

  const handleUploadSuccess = async (uploadedImage) => {
    const currentVariant = createdVariants[currentVariantIndex];
    const values = variantForm.getFieldsValue();
    await handleUploadAndUpdate(currentVariant.id, uploadedImage, values);
  };

  const handleSkipUpload = () => {
    if (currentVariantIndex < createdVariants.length - 1) {
      setCurrentVariantIndex(currentVariantIndex + 1);
      variantForm.resetFields();
    } else {
      setUploadModalVisible(false);
      message.info("Đã bỏ qua tất cả biến thể");
      navigate(`/admin/detail-product/${idSanPham}`);
    }
  };

  const handleSkipAll = () => {
    setUploadModalVisible(false);
    message.info("Đã bỏ qua tất cả biến thể");
    navigate(`/admin/detail-product/${idSanPham}`);
  };

  useEffect(() => {
    fetchProductInfo();
    fetchDropdownData();
  }, [idSanPham]);

  const currentVariant = createdVariants[currentVariantIndex];
  const uploadProgress =
    createdVariants.length > 0
      ? Math.round(((currentVariantIndex + 1) / createdVariants.length) * 100)
      : 0;

  if (!productInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Đang tải thông tin sản phẩm...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
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
          <span
            className="cursor-pointer hover:text-[#E67E22]"
            onClick={() => navigate(`/admin/detail-product/${idSanPham}`)}
          >
            Chi tiết sản phẩm
          </span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Thêm biến thể mới</span>
        </div>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/admin/detail-product/${idSanPham}`)}
        >
          Quay lại
        </Button>
      </div>

      <Card className="mb-6 shadow">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#E67E22] mb-4">
            📦 THÔNG TIN SẢN PHẨM
          </h3>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Tên sản phẩm" span={2}>
              <span className="font-bold">{productInfo.tenSanPham}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Mã sản phẩm">
              <Tag color="orange">{productInfo.maSanPham}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hãng">
              {productInfo.tenNhaSanXuat}
            </Descriptions.Item>
            <Descriptions.Item label="Xuất xứ">
              {productInfo.tenXuatXu}
            </Descriptions.Item>
            <Descriptions.Item label="Chất liệu">
              {productInfo.tenChatLieu}
            </Descriptions.Item>
            <Descriptions.Item label="Cổ áo">
              {productInfo.tenCoAo}
            </Descriptions.Item>
            <Descriptions.Item label="Tay áo">
              {productInfo.tenTayAo}
            </Descriptions.Item>
            <Descriptions.Item label="Số biến thể hiện tại">
              <Tag color="blue">
                {productInfo.chiTietSanPhams?.length || 0} biến thể
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Card>

      <Card className="shadow">
        <div className="bg-[#E67E22] text-white px-6 py-3 -m-6 mb-6">
          <h2 className="text-lg font-bold">
            <PlusOutlined className="mr-2" />
            THÊM BIẾN THỂ MỚI
          </h2>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="idMauSacs"
            label={<span className="font-bold">Chọn màu sắc muốn thêm</span>}
            rules={[
              { required: true, message: "Vui lòng chọn ít nhất 1 màu sắc" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn các màu sắc cần tạo biến thể"
              size="large"
              showSearch
              optionFilterProp="children"
              maxTagCount="responsive"
            >
              {dropdownData.mauSacs.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.tenMauSac}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="idKichThuoc"
            label={<span className="font-bold">Kích thước</span>}
            rules={[{ required: true, message: "Vui lòng chọn kích thước" }]}
          >
            <Select
              placeholder="Chọn kích thước"
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {dropdownData.kichThuocs.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.tenKichThuoc}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item shouldUpdate>
            {() => {
              const colorCount = form.getFieldValue("idMauSacs")?.length || 0;
              const selectedSize = form.getFieldValue("idKichThuoc");

              if (colorCount > 0 && selectedSize) {
                const duplicates = checkExistingVariants(
                  form.getFieldValue("idMauSacs"),
                  selectedSize
                );
                const newVariantsCount = colorCount - duplicates.length;

                return (
                  <div
                    className={`border rounded-lg p-4 ${
                      duplicates.length > 0
                        ? "bg-orange-50 border-orange-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        duplicates.length > 0
                          ? "text-orange-700"
                          : "text-blue-700"
                      }`}
                    >
                      {duplicates.length > 0 ? (
                        <>
                           Có {duplicates.length} màu đã tồn tại. Sẽ tạo{" "}
                          <span>
                            {newVariantsCount}
                          </span>{" "}
                          biến thể mới
                        </>
                      ) : (
                        <>
                           Sẽ tạo{" "}
                          <span>
                            {colorCount}
                          </span>{" "}
                          biến thể mới
                        </>
                      )}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              size="large"
              onClick={() => navigate(`/admin/detail-product/${idSanPham}`)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="default"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<PlusOutlined />}
              className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 text-white font-medium"
            >
              {loading ? "Đang tạo..." : "Tạo biến thể"}
            </Button>
          </div>
        </Form>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UploadOutlined />
            <span>
              THÔNG TIN BIẾN THỂ {currentVariantIndex + 1}/
              {createdVariants.length}
            </span>
          </div>
        }
        open={uploadModalVisible}
        onCancel={handleSkipAll}
        footer={[
          <Button key="skip-all" onClick={handleSkipAll}>
            Bỏ qua tất cả
          </Button>,
          <Button key="skip" onClick={handleSkipUpload}>
            Bỏ qua biến thể này
          </Button>,
          <Button
            key="continue"
            onClick={handleContinue}
            loading={uploading}
            icon={<CheckCircleOutlined />}
          >
            Tiếp tục
          </Button>,
        ]}
        width={800}
        closable={false}
        maskClosable={false}
      >
        {currentVariant && (
          <div className="p-4">
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">
                  Tiến trình: {currentVariantIndex + 1}/{createdVariants.length}
                </span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <Progress percent={uploadProgress} status="active" />
            </div>

            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2">
                    <strong className="text-[#E67E22]">
                      Biến thể hiện tại:
                    </strong>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Tag color="blue">{currentVariant.tenMauSac}</Tag>
                      <span className="text-sm text-[#E67E22] ml-2">
                        Màu sắc
                      </span>
                    </div>
                    <div>
                      <Tag color="green">{currentVariant.tenKichThuoc}</Tag>
                      <span className="text-sm text-[#E67E22] ml-2">
                        Kích thước
                      </span>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-2">
                    <strong className="text-[#E67E22]">Mã biến thể:</strong>
                  </div>
                  <div className="font-mono text-[#E67E22] bg-white p-2 rounded border">
                    {currentVariant.maVach || "Đang tạo..."}
                  </div>
                </Col>
              </Row>
            </div>

            <Form form={variantForm} layout="vertical" className="mb-6">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="donGia"
                    label={
                      <span className="font-medium">
                        <DollarOutlined className="mr-2" />
                        Đơn giá (VNĐ)
                      </span>
                    }
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        message: "Giá không được âm",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Nhập đơn giá"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      addonAfter="₫"
                      size="large"
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="soLuong"
                    label={
                      <span className="font-medium">
                        <NumberOutlined className="mr-2" />
                        Số lượng
                      </span>
                    }
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        message: "Số lượng không được âm",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Nhập số lượng"
                      min={0}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="moTa" label="Mô tả biến thể (tuỳ chọn)">
                <Input.TextArea
                  placeholder="Nhập mô tả cho biến thể này..."
                  rows={2}
                />
              </Form.Item>
            </Form>

            <div className="text-center mb-4">
              {uploadedImages[currentVariant.id] ? (
                <div className="space-y-4">
                  <Image
                    src={uploadedImages[currentVariant.id].url}
                    width={250}
                    height={250}
                    style={{
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "2px solid #52c41a",
                    }}
                    preview={{ mask: <EyeOutlined /> }}
                  />
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircleOutlined />
                    <span className="font-medium">
                      Đã upload ảnh thành công!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      📷 Upload ảnh cho biến thể (Tuỳ chọn)
                    </h4>
                    <CloudinaryUpload
                      onUploadSuccess={handleUploadSuccess}
                      maxFiles={1}
                    />
                  </div>
                  {uploading && (
                    <div className="text-blue-600">
                      <span>Đang xử lý...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 text-center bg-gray-50 p-3 rounded">
              <p>
                 Bạn có thể nhập giá, số lượng và upload ảnh ngay bây giờ,
                hoặc cập nhật sau trong trang chi tiết
              </p>
              <p>
                 Nhấn 'Tiếp tục' để lưu thông tin và chuyển sang biến thể tiếp
                theo
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
