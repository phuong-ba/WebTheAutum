import { fetchChiTietSanPham, giamSoLuong } from "@/services/chiTietSanPhamService";
import { ShoppingCartIcon } from "@phosphor-icons/react";
import { Table, Space, message, Input, Select } from "antd";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const { Search } = Input;

export default function SellListProduct({ selectedBillId }) {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chiTietSanPham);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  const handleAddToCart = async (product) => {
    if (!selectedBillId) {
      messageApi.warning("Vui lòng chọn hoặc tạo hóa đơn trước khi thêm sản phẩm!");
      return;
    }

    try {
      if (product.soLuongTon <= 0) {
        messageApi.warning("Sản phẩm đã hết hàng!");
        return;
      }

      await dispatch(giamSoLuong({ id: product.id, soLuong: 1 })).unwrap();

      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find(bill => bill.id === selectedBillId);
      
      if (!currentBill) {
        messageApi.error("Không tìm thấy hóa đơn!");
        return;
      }

      const cart = currentBill.cart || [];
      const index = cart.findIndex((p) => p.id === product.id);
      
      const unitPrice = product.giaSauGiam ?? product.giaBan ?? 0;
      const originalPrice = product.giaBan ?? 0;
      const hasDiscount = product.giaSauGiam && product.giaSauGiam < product.giaBan;

      let updatedCart;
      if (index !== -1) {
        updatedCart = cart.map((item, i) => 
          i === index ? {
            ...item,
            quantity: item.quantity + 1,
            unitPrice: unitPrice,
            originalPrice: originalPrice,
            hasDiscount: hasDiscount,
            totalPrice: (item.quantity + 1) * unitPrice,
          } : item
        );
      } else {
        updatedCart = [...cart, {
          id: product.id,
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
        }];
      }

      const updatedBills = bills.map(bill => {
        if (bill.id === selectedBillId) {
          const totalAmount = updatedCart.reduce((sum, product) => sum + product.totalPrice, 0);
          return {
            ...bill,
            cart: updatedCart,
            productCount: updatedCart.length,
            totalAmount: totalAmount,
            updatedAt: new Date().toISOString()
          };
        }
        return bill;
      });

      localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
      
      window.dispatchEvent(new Event("cartUpdated"));
      
      const successMessage = hasDiscount 
        ? "Đã thêm sản phẩm vào hóa đơn với giá khuyến mãi!"
        : "Đã thêm sản phẩm vào hóa đơn!";
      
      messageApi.success(successMessage);
      dispatch(fetchChiTietSanPham());
    } catch (error) {
      console.error(error);
      messageApi.error("Thêm sản phẩm thất bại!");
    }
  };

  const columns = [
    {
      title: "STT",
      render: (_, __, index) => index + 1,
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
            style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          <span>Không ảnh</span>
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
        const hasDiscount = record.giaSauGiam && record.giaSauGiam < record.giaBan;
        
        return (
          <div className="flex flex-col">
            <div className={`font-bold ${hasDiscount ? 'text-red-600' : ''}`}>
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
        <Space size="middle">
          <a onClick={() => handleAddToCart(record)}>
            <div className="bg-amber-500 py-2 px-4 rounded cursor-pointer select-none text-center font-bold text-white hover:bg-amber-600 active:bg-cyan-800 shadow">
              <ShoppingCartIcon size={20} color="#FFF" />
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
        <div className="p-4 text-2xl font-bold bg-amber-600 text-white rounded-t-lg">
          Danh sách sản phẩm
        </div>
        <div className="p-4">
          <Search placeholder="Tìm kiếm sản phẩm..." className="mb-3" />
          <Table columns={columns} dataSource={data} rowKey="id" pagination={{ pageSize: 5 }} />
        </div>
      </div>
    </>
  );
}