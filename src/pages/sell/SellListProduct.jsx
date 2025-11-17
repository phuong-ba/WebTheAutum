import {
  fetchChiTietSanPham,
  giamSoLuong,
} from "@/services/chiTietSanPhamService";
import { ClipboardTextIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { Table, Space, message, Input, Select } from "antd";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const { Search } = Input;
const { Option } = Select;

export default function SellListProduct({ selectedBillId }) {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chiTietSanPham);
  const [messageApi, contextHolder] = message.useMessage();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  const filteredData = data?.filter((product) => product.soLuongTon > 0) || [];

  const handleAddToCart = async (product) => {
    console.log("Đã thêm sản phẩm ID thực tế (ChiTietSanPham):", product.id);

    if (!selectedBillId) {
      messageApi.warning(
        "Vui lòng chọn hoặc tạo hóa đơn trước khi thêm sản phẩm!"
      );
      return;
    }

    try {
      if (product.soLuongTon <= 0) {
        messageApi.warning("Sản phẩm đã hết hàng!");
        return;
      }

      // Giảm tồn kho
      await dispatch(giamSoLuong({ id: product.id, soLuong: 1 })).unwrap();

      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find((bill) => bill.id === selectedBillId);

      if (!currentBill) {
        messageApi.error("Không tìm thấy hóa đơn!");
        return;
      }

      const cart = currentBill.cart || [];

      // Tìm theo idChiTietSanPham để tránh nhầm lẫn
      const index = cart.findIndex((p) => p.idChiTietSanPham === product.id);

      const unitPrice = product.giaSauGiam ?? product.giaBan ?? 0;
      const originalPrice = product.giaBan ?? 0;
      const hasDiscount =
        product.giaSauGiam && product.giaSauGiam < product.giaBan;

      let updatedCart;

      if (index !== -1) {
        // Đã có trong giỏ → tăng số lượng
        updatedCart = cart.map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * unitPrice,
              }
            : item
        );
      } else {
        // Chưa có → thêm mới
        updatedCart = [
          ...cart,
          {
            idChiTietSanPham: product.id, // ĐÚNG – ID thực tế của chi tiết sản phẩm
            name: product.tenSanPham,
            color: product.tenMauSac,
            size: product.tenKichThuoc,
            weight: product.tenTrongLuong,
            quantity: 1,
            unitPrice: unitPrice,
            originalPrice: originalPrice,
            totalPrice: unitPrice,
            hasDiscount: hasDiscount,
            imageUrl: product.anhs?.[0]?.duongDanAnh || "",
          },
        ];
      }

      // Cập nhật lại bill trong localStorage
      const updatedBills = bills.map((bill) => {
        if (bill.id === selectedBillId) {
          const totalAmount = updatedCart.reduce(
            (sum, p) => sum + p.totalPrice,
            0
          );
          return {
            ...bill,
            cart: updatedCart,
            productCount: updatedCart.length,
            totalAmount,
            updatedAt: new Date().toISOString(),
          };
        }
        return bill;
      });

      localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
      window.dispatchEvent(new Event("cartUpdated"));

      messageApi.success(
        hasDiscount
          ? "Đã thêm sản phẩm vào hóa đơn với giá khuyến mãi!"
          : "Đã thêm sản phẩm vào hóa đơn!"
      );

      // Refresh danh sách để cập nhật tồn kho
      dispatch(fetchChiTietSanPham());
    } catch (error) {
      console.error(error);
      messageApi.error("Thêm sản phẩm thất bại!");
    }
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 60,
      align: "center",
    },
    {
      title: "Ảnh",
      dataIndex: "anhs",
      render: (anhs) =>
        anhs?.[0]?.duongDanAnh ? (
          <img
            src={anhs[0].duongDanAnh}
            alt="Ảnh"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 6,
            }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              background: "#f3f4f6",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="text-xs">Không ảnh</span>
          </div>
        ),
    },
    { title: "Tên sản phẩm", dataIndex: "tenSanPham" },
    { title: "Màu sắc", dataIndex: "tenMauSac" },
    { title: "Kích thước", dataIndex: "tenKichThuoc" },
    { title: "Trọng lượng", dataIndex: "tenTrongLuong" },
    { title: "Tồn kho", dataIndex: "soLuongTon" },
    {
      title: "Giá bán",
      render: (record) => {
        const currentPrice = record.giaSauGiam ?? record.giaBan ?? 0;
        const hasDiscount =
          record.giaSauGiam && record.giaSauGiam < record.giaBan;

        return (
          <div className="flex flex-col">
            <div className={`font-bold ${hasDiscount ? "text-red-600" : ""}`}>
              {currentPrice.toLocaleString()}₫
            </div>
            {hasDiscount && (
              <div className="text-xs text-gray-500 line-through">
                {record.giaBan.toLocaleString()}₫
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space>
          <a onClick={() => handleAddToCart(record)}>
            <div className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-2 px-4 rounded cursor-pointer shadow flex items-center justify-center">
              <ShoppingCartIcon size={20} />
            </div>
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 text-2xl font-bold bg-amber-600 text-white rounded-t-lg flex gap-2 items-center opacity-90">
          <ClipboardTextIcon size={32} />
          Danh sách sản phẩm
        </div>

        <div className="p-4">
          <div className="flex justify-end mb-4">
            <Search
              placeholder="Tìm tên, màu, size, giá..."
              allowClear
              onSearch={(v) => setSearchKeyword(v)}
              onChange={(e) => setSearchKeyword(e.target.value)}
              value={searchKeyword}
              style={{ width: 300 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
            }}
          />
        </div>
      </div>
    </>
  );
}
