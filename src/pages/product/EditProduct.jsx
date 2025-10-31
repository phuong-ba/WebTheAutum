import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, message, Spin, Card, Collapse, InputNumber, Tag, Modal, Divider } from "antd";
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
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

  const fetchDropdownData = async () => {
    try {
      console.log("🔄 Đang tải danh sách dropdown...");

      const [nhaSanXuatsRes, chatLieusRes, kieuDangsRes, xuatXusRes, coAosRes, tayAosRes, kichThuocsRes, mauSacsRes] =
        await Promise.all([
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

      console.log("✅ Đã tải dropdown data");
    } catch (error) {
      console.error("💥 Lỗi tải dropdown data:", error);
      message.error("Lỗi khi tải dữ liệu dropdown");
    }
  };

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      console.log("🔄 Đang tải chi tiết sản phẩm ID:", id);

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

        console.log("✅ Đã tải chi tiết sản phẩm với", data.chiTietSanPhams?.length || 0, "biến thể");
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

  useEffect(() => {
    fetchDropdownData();
    fetchProductDetail();
  }, [id]);

  useEffect(() => {
    if (productData && dropdownData.nhaSanXuats.length > 0) {
      const nhaSanXuat = dropdownData.nhaSanXuats.find(
        item => item.tenNhaSanXuat === productData.tenNhaSanXuat
      );
      const xuatXu = dropdownData.xuatXus.find(
        item => item.tenXuatXu === productData.tenXuatXu
      );
      const chatLieu = dropdownData.chatLieus.find(
        item => item.tenChatLieu === productData.tenChatLieu
      );
      const kieuDang = dropdownData.kieuDangs.find(
        item => item.tenKieuDang === productData.tenKieuDang
      );
      const coAo = dropdownData.coAos.find(
        item => item.tenCoAo === productData.tenCoAo
      );
      const tayAo = dropdownData.tayAos.find(
        item => item.tenTayAo === productData.tenTayAo
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
    setModifiedVariants(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value
      }
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
      title: 'Xác nhận xóa biến thể',
      content: 'Bạn có chắc chắn muốn xóa biến thể này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const response = await baseUrl.delete(`/chi-tiet-san-pham/${variantId}`);
          if (response.data.success) {
            message.success('Xóa biến thể thành công');
            setVariants(prev => prev.filter(v => v.id !== variantId));
            setModifiedVariants(prev => {
              const newModified = { ...prev };
              delete newModified[variantId];
              return newModified;
            });
          } else {
            message.error(response.data.message || 'Xóa biến thể thất bại');
          }
        } catch (error) {
          console.error('❌ Lỗi xóa biến thể:', error);
          message.error('Lỗi khi xóa biến thể');
        }
      }
    });
  };

  const onFinish = async (values) => {
    setSubmitLoading(true);
    try {
      console.log("📤 Bắt đầu lưu thay đổi...");

      const productResponse = await baseUrl.put(`/san-pham/${id}`, values);
      
      if (!productResponse.data.success) {
        throw new Error(productResponse.data.message || "Cập nhật sản phẩm thất bại");
      }

      console.log("✅ Đã cập nhật thông tin sản phẩm");

      const variantUpdates = Object.entries(modifiedVariants).map(async ([variantId, changes]) => {
        const variant = variants.find(v => v.id === parseInt(variantId));
        if (!variant) return;

        const kichThuoc = dropdownData.kichThuocs.find(
          item => item.tenKichThuoc === variant.tenKichThuoc
        );
        const mauSac = dropdownData.mauSacs.find(
          item => item.tenMauSac === variant.tenMauSac
        );

        const updateData = {
          idKichThuoc: changes.idKichThuoc || kichThuoc?.id,
          idMauSac: changes.idMauSac || mauSac?.id,
          giaBan: changes.giaBan !== undefined ? changes.giaBan : variant.giaBan,
          soLuongTon: changes.soLuongTon !== undefined ? changes.soLuongTon : variant.soLuongTon,
          maVach: changes.maVach !== undefined ? changes.maVach : variant.maVach,
          moTa: changes.moTa !== undefined ? changes.moTa : variant.moTa,
          trangThai: changes.trangThai !== undefined ? changes.trangThai : variant.trangThai,
        };

        const response = await baseUrl.put(`/chi-tiet-san-pham/${variantId}`, updateData);
        
        if (!response.data.success) {
          throw new Error(`Cập nhật biến thể ${variantId} thất bại`);
        }
        
        return response;
      });

      await Promise.all(variantUpdates);

      console.log("✅ Đã cập nhật tất cả biến thể");

      message.success("Cập nhật sản phẩm và biến thể thành công!");
      
      setTimeout(() => {
        navigate(`/detail-product/${id}`);
      }, 1000);

    } catch (error) {
      console.error("❌ Lỗi update:", error);
      const errorMsg = error.response?.data?.message || error.message || "Lỗi khi cập nhật";
      message.error(errorMsg);
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
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          <span className="cursor-pointer hover:text-[#E67E22]" onClick={() => navigate("/")}>
            Trang chủ
          </span>
          <span className="mx-2">/</span>
          <span className="cursor-pointer hover:text-[#E67E22]" onClick={() => navigate("/product")}>
            Quản lý sản phẩm
          </span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">
            Sửa sản phẩm: {productData.tenSanPham}
          </span>
        </div>

        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Card className="shadow-md mb-6">
          <div className="bg-[#E67E22] text-white px-6 py-3 -mx-6 -mt-6 mb-6">
            <h2 className="text-lg font-bold">📝 Thông tin sản phẩm chính</h2>
            <p className="text-sm mt-1 text-white/90">Mã sản phẩm: {productData.maSanPham}</p>
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
              rules={[{ required: true, message: "Vui lòng chọn nhà sản xuất" }]}
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
                <h2 className="text-lg font-bold">🎨 Danh sách biến thể sản phẩm</h2>
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
                          {formatPrice(getVariantValue(variant, 'giaBan'))}
                        </span>
                        <span className="text-gray-600">
                          SL: {getVariantValue(variant, 'soLuongTon')}
                        </span>
                      </div>
                      <Tag color={getVariantValue(variant, 'trangThai') ? "green" : "red"}>
                        {getVariantValue(variant, 'trangThai') ? "Hoạt động" : "Ngừng"}
                      </Tag>
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
                        value={getVariantValue(variant, 'idKichThuoc') || 
                               dropdownData.kichThuocs.find(k => k.tenKichThuoc === variant.tenKichThuoc)?.id}
                        onChange={(value) => handleVariantChange(variant.id, 'idKichThuoc', value)}
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
                        value={getVariantValue(variant, 'idMauSac') || 
                               dropdownData.mauSacs.find(m => m.tenMauSac === variant.tenMauSac)?.id}
                        onChange={(value) => handleVariantChange(variant.id, 'idMauSac', value)}
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
                        value={getVariantValue(variant, 'giaBan')}
                        onChange={(value) => handleVariantChange(variant.id, 'giaBan', value)}
                        className="w-full"
                        size="large"
                        min={0}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng tồn <span className="text-red-500">*</span>
                      </label>
                      <InputNumber
                        value={getVariantValue(variant, 'soLuongTon')}
                        onChange={(value) => handleVariantChange(variant.id, 'soLuongTon', value)}
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
                        value={getVariantValue(variant, 'maVach')}
                        onChange={(e) => handleVariantChange(variant.id, 'maVach', e.target.value)}
                        size="large"
                        placeholder="Nhập mã vạch"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <Select
                        value={getVariantValue(variant, 'trangThai')}
                        onChange={(value) => handleVariantChange(variant.id, 'trangThai', value)}
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
                        value={getVariantValue(variant, 'moTa')}
                        onChange={(e) => handleVariantChange(variant.id, 'moTa', e.target.value)}
                        rows={3}
                        placeholder="Nhập mô tả biến thể"
                        maxLength={500}
                        showCount
                      />
                    </div>

                    {variant.anhs && variant.anhs.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hình ảnh
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {variant.anhs.map((anh) => (
                            <img
                              key={anh.id}
                              src={anh.duongDanAnh}
                              alt="Variant"
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              ))}
            </Collapse>
          )}
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            size="large"
            onClick={() => navigate(-1)}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={submitLoading}
            icon={<SaveOutlined />}
            style={{ backgroundColor: '#E67E22', borderColor: '#E67E22' }}
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