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
  const [colorFilter, setColorFilter] = useState([]);
  const [priceFilter, setPriceFilter] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  const filteredData = (data || [])
    .filter((product) => product.soLuongTon > 0 && product.trangThai === true)
    .filter((product) => {
      if (!searchKeyword.trim()) return true;

      const kw = searchKeyword.toLowerCase();

      return [
        product.tenSanPham,
        product.tenMauSac,
        product.tenKichThuoc,
        product.tenTrongLuong,
        product.maVach,
        product.giaBan?.toString(),
        product.giaSauGiam?.toString(),
      ]
        .join(" ")
        .toLowerCase()
        .includes(kw);
    })
    .filter((product) => {
      if (!colorFilter || colorFilter.length === 0) return true;
      return colorFilter.includes(product.tenMauSac);
    })
    .filter((product) => {
      if (!priceFilter) return true;

      const price = product.giaSauGiam || product.giaBan;

      switch (priceFilter) {
        case "duoi-200":
          return price < 200000;
        case "200-500":
          return price >= 200000 && price <= 500000;
        case "500-1000":
          return price > 500000 && price <= 1000000;
        case "tren-1000":
          return price > 1000000;
        default:
          return true;
      }
    });

  /* ================= THÊM VÀO GIỎ HÀNG ================= */
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

      // Lấy danh sách hóa đơn từ localStorage
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBillIndex = bills.findIndex(
        (bill) => bill.id === selectedBillId
      );

      if (currentBillIndex === -1) {
        // Nếu chưa có trong localStorage, tạo mới
        const newBill = {
          id: selectedBillId,
          cart: [],
          totalAmount: 0,
          productCount: 0,
        };

        // Thêm sản phẩm vào giỏ
        const unitPrice = product.giaSauGiam ?? product.giaBan ?? 0;
        const originalPrice = product.giaBan ?? 0;
        const hasDiscount =
          product.giaSauGiam && product.giaSauGiam < product.giaBan;

        newBill.cart.push({
          idChiTietSanPham: product.id,
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
          maVach: product.maVach || "",
        });

        newBill.totalAmount = unitPrice;
        newBill.productCount = 1;

        bills.push(newBill);
      } else {
        // Cập nhật hóa đơn có sẵn
        const currentBill = bills[currentBillIndex];
        const cart = currentBill.cart || [];
        const existingProductIndex = cart.findIndex(
          (p) => p.idChiTietSanPham === product.id
        );

        const unitPrice = product.giaSauGiam ?? product.giaBan ?? 0;
        const originalPrice = product.giaBan ?? 0;
        const hasDiscount =
          product.giaSauGiam && product.giaSauGiam < product.giaBan;

        let updatedCart;

        if (existingProductIndex !== -1) {
          // Tăng số lượng sản phẩm có sẵn
          updatedCart = cart.map((item, i) =>
            i === existingProductIndex
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  totalPrice: (item.quantity + 1) * item.unitPrice,
                }
              : item
          );
        } else {
          // Thêm sản phẩm mới
          updatedCart = [
            ...cart,
            {
              idChiTietSanPham: product.id,
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
              maVach: product.maVach || "",
            },
          ];
        }

        // Tính tổng tiền
        const totalAmount = updatedCart.reduce(
          (sum, p) => sum + p.totalPrice,
          0
        );

        // Cập nhật hóa đơn
        bills[currentBillIndex] = {
          ...currentBill,
          cart: updatedCart,
          productCount: updatedCart.length,
          totalAmount,
          updatedAt: new Date().toISOString(),
        };
      }

      // Lưu lại vào localStorage
      localStorage.setItem("pendingBills", JSON.stringify(bills));

      // Gửi sự kiện để các component khác cập nhật
      window.dispatchEvent(new Event("cartUpdated"));

      // Cập nhật danh sách sản phẩm
      dispatch(fetchChiTietSanPham());

      messageApi.success("Đã thêm sản phẩm vào giỏ hàng!");
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
      title: "Mã vạch",
      dataIndex: "maVach",
      key: "maVach",
      width: 120,
      render: (value) => value || "—",
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
        <div className="p-4 text-2xl font-bold bg-amber-600 text-white rounded-t-lg flex gap-2 opacity-90 items-center">
          <ClipboardTextIcon size={32} />
          Danh sách sản phẩm
        </div>

        <div className="p-4">
          <div className="flex gap-3 mb-4">
            <Search
              placeholder="Tìm tên, màu, size, giá..."
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 250 }}
            />

            <Select
              mode="multiple"
              placeholder="Lọc theo màu"
              value={colorFilter}
              onChange={setColorFilter}
              style={{ width: 200 }}
              allowClear
            >
              {[...new Set((data || []).map((p) => p.tenMauSac))].map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Lọc theo giá"
              value={priceFilter}
              onChange={setPriceFilter}
              style={{ width: 160 }}
              allowClear
            >
              <Option value="duoi-200">Dưới 200k</Option>
              <Option value="200-500">200k - 500k</Option>
              <Option value="500-1000">500k - 1tr</Option>
              <Option value="tren-1000">Trên 1tr</Option>
            </Select>
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
