import React, { useState, useEffect } from "react";
import { Table, Pagination, Button, message, Image, Tag, Spin } from "antd";
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import baseUrl from "@/api/instance";
import { PlusOutlined } from "@ant-design/icons";
import { Modal, Form, Select } from "antd";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const pageSize = 10;
  const [addVariantModal, setAddVariantModal] = useState(false);
  const [addVariantForm] = Form.useForm();
  const [dropdownData, setDropdownData] = useState({
    mauSacs: [],
    kichThuocs: [],
  });

  console.log("📦 Product ID từ URL:", id);

  const fetchProductDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      console.log("🔄 Đang tải chi tiết sản phẩm...");

      const response = await baseUrl.get(`/san-pham/${id}/detail`);

      if (response.data.success) {
        console.log("✅ Data từ API:", response.data.data);
        setProductData(response.data.data);
        message.success("Tải chi tiết sản phẩm thành công");
      } else {
        message.error(response.data.message || "Lỗi khi tải dữ liệu");
      }
    } catch (error) {
      console.error("❌ Lỗi API:", error);
      message.error("Lỗi khi tải chi tiết sản phẩm");
    } finally {
      setLoading(false);
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

  const handleAddNewVariant = async (values) => {
    try {
      const requestData = {
        idSanPham: productData.id,
        idMauSacs: values.idMauSacs,
        idKichThuoc: values.idKichThuoc,
      };

      const response = await baseUrl.post(
        "/chi-tiet-san-pham/tao-bien-the-cho-san-pham",
        requestData
      );

      if (response.data.success) {
        message.success("Thêm biến thể thành công!");
        setAddVariantModal(false);
        addVariantForm.resetFields();
        fetchProductDetail();
      }
    } catch (error) {
      message.error("Lỗi khi thêm biến thể");
    }
  };

  useEffect(() => {
    fetchProductDetail();
    fetchDropdownData();
  }, [id]);

  const productColumns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      width: 80,
      align: "center",
      render: (_, __, index) => (
        <div className="flex items-center justify-center">
          <span>01</span>
        </div>
      ),
    },
    {
      title: "TÊN SẢN PHẨM",
      dataIndex: "tenSanPham",
      key: "tenSanPham",
      align: "center",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "HÃNG",
      dataIndex: "tenNhaSanXuat",
      key: "tenNhaSanXuat",
      align: "center",
    },
    {
      title: "XUẤT XỨ",
      dataIndex: "tenXuatXu",
      key: "tenXuatXu",
      align: "center",
    },
    {
      title: "CHẤT LIỆU",
      dataIndex: "tenChatLieu",
      key: "tenChatLieu",
      align: "center",
    },
    {
      title: "TRỌNG LƯỢNG",
      dataIndex: "trongLuong",
      key: "trongLuong",
      align: "center",
    },
    {
      title: "KIỂU DÁNG",
      dataIndex: "tenKieuDang",
      key: "tenKieuDang",
      align: "center",
    },
    {
      title: "CỔ ÁO",
      dataIndex: "tenCoAo",
      key: "tenCoAo",
      align: "center",
    },
    {
      title: "TAY ÁO",
      dataIndex: "tenTayAo",
      key: "tenTayAo",
      align: "center",
    },
    {
      title: "MÔ TẢ",
      dataIndex: "moTa",
      key: "moTa",
      align: "center",
      render: (text) => (
        <span className="text-gray-600 text-sm">{text || "Chưa có mô tả"}</span>
      ),
    },
  ];

  const variantColumns = [
    {
      title: "STT",
      key: "stt",
      width: 80,
      align: "center",
      render: (_, __, index) => (
        <div className="flex items-center justify-center">
          <span>{String(index + 1).padStart(2, "0")}</span>
        </div>
      ),
    },
    {
      title: "ẢNH",
      key: "image",
      width: 150,
      align: "center",
      render: (_, record) => {
        const imageUrl = record.anhs?.[0]?.duongDanAnh;

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
            }}
          >
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  width={120}
                  height={120}
                  style={{
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                  preview={{
                    mask: <EyeOutlined />,
                  }}
                />
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded"
                style={{ width: 120, height: 120 }}
              >
                <span className="text-gray-400 text-sm">No Image</span>
                <span className="text-gray-500 text-xs">
                  ({record.tenMauSac})
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "TÊN SẢN PHẨM",
      dataIndex: "tenSanPham",
      key: "tenSanPham",
      align: "center",
      render: (text, record) => (
        <span className="font-medium">{productData?.tenSanPham || text}</span>
      ),
    },
    {
      title: "KÍCH THƯỚC",
      dataIndex: "tenKichThuoc",
      key: "tenKichThuoc",
      align: "center",
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: "MÀU SẮC",
      dataIndex: "tenMauSac",
      key: "tenMauSac",
      align: "center",
      render: (text) => <Tag color="volcano">{text}</Tag>,
    },
    {
      title: "GIÁ CẢ",
      dataIndex: "giaBan",
      key: "giaBan",
      align: "center",
      render: (price) => (
        <span className="text-[#E67E22] font-bold text-lg">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(price || 0)}
        </span>
      ),
    },
    {
      title: "SỐ LƯỢNG",
      dataIndex: "soLuongTon",
      key: "soLuongTon",
      align: "center",
      render: (quantity) => (
        <span
          className={`font-bold ${
            quantity > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {quantity}
        </span>
      ),
    },
    {
      title: "MÃ VẠCH",
      dataIndex: "maVach",
      key: "maVach",
      align: "center",
      render: (maVach) => (
        <div className="text-center">
          <div className="font-mono text-xs bg-gray-100 p-1 rounded border">
            {maVach}
          </div>
          <div className="text-xs text-gray-500 mt-1">QR Code</div>
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Hoạt động" : "Ngừng hoạt động"}
        </Tag>
      ),
    },
  ];

  const productDataSource = productData
    ? [
        {
          key: "1",
          tenSanPham: productData.tenSanPham,
          tenNhaSanXuat: productData.tenNhaSanXuat,
          tenXuatXu: productData.tenXuatXu,
          tenChatLieu: productData.tenChatLieu,
          tenKieuDang: productData.tenKieuDang,
          tenCoAo: productData.tenCoAo,
          tenTayAo: productData.tenTayAo,
          trongLuong: productData.trongLuong,
          moTa: productData.chiTietSanPhams?.[0]?.moTa || "Chưa có mô tả",
        },
      ]
    : [];

  const variantDataSource =
    productData?.chiTietSanPhams?.map((variant, index) => ({
      key: variant.id,
      ...variant,
      stt: index + 1,
    })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="Đang tải chi tiết sản phẩm..." />
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
          <span
            className="cursor-pointer hover:text-[#E67E22]"
            onClick={() => navigate("/")}
          >
            Trang chủ
          </span>
          <span className="mx-2">/</span>
          <span
            className="cursor-pointer hover:text-[#E67E22]"
            onClick={() => navigate(-1)}
          >
            Quản lý sản phẩm
          </span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">
            Chi tiết sản phẩm: {productData.tenSanPham}
          </span>
        </div>

        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-3">
          <h2 className="text-lg font-bold">Thông tin sản phẩm chính</h2>
        </div>
        <Table
          columns={productColumns}
          dataSource={productDataSource}
          pagination={false}
          bordered
          size="middle"
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#E67E22] text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">
            Danh sách biến thể sản phẩm ({variantDataSource.length} biến thể)
          </h2>
          <div className="text-white">
            Mã sản phẩm: <Tag color="orange">{productData.maSanPham}</Tag>
          </div>
          <Button
            icon={<PlusOutlined />}
            onClick={() => navigate(`/add-variant/${productData.id}`)}
            className="bg-white text-[#E67E22] border-white hover:bg-gray-100"
          >
            Thêm biến thể mới
          </Button>
        </div>
        <Table
          columns={variantColumns}
          dataSource={variantDataSource}
          pagination={false}
          bordered
          size="middle"
          loading={loading}
          locale={{
            emptyText: "Không có biến thể nào",
          }}
        />

        {variantDataSource.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t">
            <span className="text-sm text-gray-600">
              Hiển thị 1 - {variantDataSource.length} trong số{" "}
              {variantDataSource.length} biến thể
            </span>
            <Pagination
              current={currentPage}
              total={variantDataSource.length}
              pageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
