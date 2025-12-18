import { BagIcon, ReceiptXIcon } from "@phosphor-icons/react";
import { message, InputNumber } from "antd";
import Search from "antd/es/input/Search";
import { Select } from "antd";
import { TrashIcon } from "lucide-react";
import {
  tangSoLuong,
  fetchChiTietSanPham,
  giamSoLuong,
} from "@/services/chiTietSanPhamService";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

const { Option } = Select;

export default function SellCartProduct({ selectedBillId }) {
  const dispatch = useDispatch();
  const { data: productList } = useSelector((state) => state.chiTietSanPham);
  const [cartProducts, setCartProducts] = useState([]);
  const [filteredCartProducts, setFilteredCartProducts] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const [editingQuantities, setEditingQuantities] = useState({});

  const inactiveProductsHandled = useRef(false);

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  /* ================= TẢI GIỎ HÀNG TỪ LOCALSTORAGE ================= */
  const loadCartFromLocalStorage = () => {
    if (!selectedBillId) {
      setCartProducts([]);
      setFilteredCartProducts([]);
      return;
    }

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const currentBill = bills.find((bill) => bill.id === selectedBillId);

    if (currentBill && currentBill.cart) {
      setCartProducts(currentBill.cart);
      setFilteredCartProducts(currentBill.cart);
    } else {
      setCartProducts([]);
      setFilteredCartProducts([]);
    }
  };

  useEffect(() => {
    loadCartFromLocalStorage();
  }, [selectedBillId]);

  /* ================= THEO DÕI THAY ĐỔI LOCALSTORAGE ================= */
  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartFromLocalStorage();
    };

    const handleStorageChange = (e) => {
      if (e.key === "pendingBills") {
        loadCartFromLocalStorage();
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [selectedBillId]);

  /* ================= LỌC VÀ SẮP XẾP ================= */
  const filterCartProducts = () => {
    let result = [...cartProducts];

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase().trim();
      result = result.filter((p) =>
        [
          p.name,
          p.color,
          p.size,
          p.weight,
          p.unitPrice?.toString(),
          p.totalPrice?.toString(),
          p.maVach || "",
          p.idChiTietSanPham?.toString() || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.color === categoryFilter);
    }

    if (priceFilter !== "all") {
      result = result.filter((p) => {
        switch (priceFilter) {
          case "under100k":
            return p.unitPrice < 100000;
          case "100k-500k":
            return p.unitPrice >= 100000 && p.unitPrice <= 500000;
          case "500k-1M":
            return p.unitPrice > 500000 && p.unitPrice <= 1000000;
          case "over1M":
            return p.unitPrice > 1000000;
          default:
            return true;
        }
      });
    }

    // Sắp xếp
    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return a.unitPrice - b.unitPrice;
        case "price_desc":
          return b.unitPrice - a.unitPrice;
        case "quantity_asc":
          return a.quantity - b.quantity;
        case "quantity_desc":
          return b.quantity - a.quantity;
        case "total_asc":
          return a.totalPrice - b.totalPrice;
        case "total_desc":
          return b.totalPrice - a.totalPrice;
        case "barcode_asc":
          return (a.maVach || "").localeCompare(b.maVach || "");
        case "barcode_desc":
          return (b.maVach || "").localeCompare(a.maVach || "");
        default:
          return 0;
      }
    });

    setFilteredCartProducts(result);
  };

  useEffect(() => {
    filterCartProducts();
  }, [cartProducts, searchKeyword, categoryFilter, priceFilter, sortBy]);

  const getUniqueColors = () => [
    ...new Set(cartProducts.map((p) => p.color).filter(Boolean)),
  ];

  /* ================= LƯU GIỎ HÀNG VÀO LOCALSTORAGE ================= */
  const saveCartToLocalStorage = (cart) => {
    if (!selectedBillId) return;

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const billIndex = bills.findIndex((bill) => bill.id === selectedBillId);

    if (billIndex === -1) {
      // Tạo hóa đơn mới trong localStorage
      bills.push({
        id: selectedBillId,
        cart: cart,
        productCount: cart.length,
        totalAmount: cart.reduce((sum, p) => sum + p.totalPrice, 0),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Cập nhật hóa đơn có sẵn
      bills[billIndex] = {
        ...bills[billIndex],
        cart,
        productCount: cart.length,
        totalAmount: cart.reduce((sum, p) => sum + p.totalPrice, 0),
        updatedAt: new Date().toISOString(),
      };
    }

    localStorage.setItem("pendingBills", JSON.stringify(bills));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  /* ================= XÓA SẢN PHẨM ================= */
  const handleDeleteProduct = async (idChiTietSanPham) => {
    const product = cartProducts.find(
      (p) => p.idChiTietSanPham === idChiTietSanPham
    );
    if (!product) return;

    try {
      // Hoàn tồn kho
      await dispatch(
        tangSoLuong({ id: idChiTietSanPham, soLuong: product.quantity })
      ).unwrap();

      // Xóa khỏi giỏ hàng
      const newCart = cartProducts.filter(
        (p) => p.idChiTietSanPham !== idChiTietSanPham
      );

      // Cập nhật state
      setCartProducts(newCart);
      saveCartToLocalStorage(newCart);

      // Xóa số lượng đang chỉnh sửa
      setEditingQuantities((prev) => {
        const copy = { ...prev };
        delete copy[idChiTietSanPham];
        return copy;
      });

      // Cập nhật danh sách sản phẩm
      dispatch(fetchChiTietSanPham());

      messageApi.success("Đã xóa sản phẩm và hoàn tồn kho!");
    } catch (err) {
      messageApi.error("Lỗi xóa sản phẩm!");
    }
  };

  /* ================= TĂNG/GIẢM SỐ LƯỢNG ================= */
  const handleIncreaseQuantity = async (idChiTietSanPham) => {
    const item = cartProducts.find(
      (p) => p.idChiTietSanPham === idChiTietSanPham
    );
    const stockItem = productList.find((p) => p.id === idChiTietSanPham);

    if (!item || !stockItem) return;

    if (stockItem.soLuongTon <= 0) {
      messageApi.warning("Hết hàng!");
      return;
    }

    try {
      // Giảm tồn kho
      await dispatch(
        giamSoLuong({ id: idChiTietSanPham, soLuong: 1 })
      ).unwrap();

      // Cập nhật giỏ hàng
      const updated = cartProducts.map((p) =>
        p.idChiTietSanPham === idChiTietSanPham
          ? {
              ...p,
              quantity: p.quantity + 1,
              totalPrice: (p.quantity + 1) * p.unitPrice,
            }
          : p
      );

      // Cập nhật state và localStorage
      setCartProducts(updated);
      saveCartToLocalStorage(updated);

      // Cập nhật số lượng đang chỉnh sửa
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: item.quantity + 1,
      }));

      // Cập nhật danh sách sản phẩm
      dispatch(fetchChiTietSanPham());

      messageApi.success("Đã tăng số lượng!");
    } catch (err) {
      messageApi.error("Không thể tăng số lượng!");
    }
  };

  const handleDecreaseQuantity = async (idChiTietSanPham) => {
    const item = cartProducts.find(
      (p) => p.idChiTietSanPham === idChiTietSanPham
    );
    if (!item || item.quantity <= 1) return;

    try {
      // Hoàn tồn kho
      await dispatch(
        tangSoLuong({ id: idChiTietSanPham, soLuong: 1 })
      ).unwrap();

      // Cập nhật giỏ hàng
      const updated = cartProducts.map((p) =>
        p.idChiTietSanPham === idChiTietSanPham
          ? {
              ...p,
              quantity: p.quantity - 1,
              totalPrice: (p.quantity - 1) * p.unitPrice,
            }
          : p
      );

      // Cập nhật state và localStorage
      setCartProducts(updated);
      saveCartToLocalStorage(updated);

      // Cập nhật số lượng đang chỉnh sửa
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: item.quantity - 1,
      }));

      // Cập nhật danh sách sản phẩm
      dispatch(fetchChiTietSanPham());

      messageApi.success("Đã giảm số lượng!");
    } catch (err) {
      messageApi.error("Không thể giảm số lượng!");
    }
  };

  /* ================= THAY ĐỔI SỐ LƯỢNG BẰNG INPUT ================= */
  const handleQuantityChange = (idChiTietSanPham, value) => {
    if (!value || value < 1) {
      const finalValue = 1;
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: finalValue,
      }));
      setTimeout(() => {
        handleApplyQuantity(idChiTietSanPham, finalValue);
      }, 0);
      return;
    }

    setEditingQuantities((prev) => ({ ...prev, [idChiTietSanPham]: value }));
  };

  const handleApplyQuantity = async (
    idChiTietSanPham,
    immediateValue = null
  ) => {
    const newQty =
      immediateValue !== null
        ? immediateValue
        : editingQuantities[idChiTietSanPham];

    const item = cartProducts.find(
      (p) => p.idChiTietSanPham === idChiTietSanPham
    );

    if (!item || newQty === item.quantity) return;

    const stockItem = productList.find((p) => p.id === idChiTietSanPham);
    if (stockItem && newQty > stockItem.soLuongTon + item.quantity) {
      messageApi.warning(`Chỉ còn ${stockItem.soLuongTon} sản phẩm trong kho!`);
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: item.quantity,
      }));
      return;
    }

    try {
      const diff = newQty - item.quantity;
      if (diff > 0) {
        // Giảm tồn kho
        await dispatch(
          giamSoLuong({ id: idChiTietSanPham, soLuong: diff })
        ).unwrap();
      } else {
        // Hoàn tồn kho
        await dispatch(
          tangSoLuong({ id: idChiTietSanPham, soLuong: Math.abs(diff) })
        ).unwrap();
      }

      // Cập nhật giỏ hàng
      const updated = cartProducts.map((p) =>
        p.idChiTietSanPham === idChiTietSanPham
          ? { ...p, quantity: newQty, totalPrice: newQty * p.unitPrice }
          : p
      );

      // Cập nhật state và localStorage
      setCartProducts(updated);
      saveCartToLocalStorage(updated);

      // Cập nhật danh sách sản phẩm
      dispatch(fetchChiTietSanPham());

      messageApi.success(`Cập nhật số lượng: ${newQty}`);
    } catch (err) {
      messageApi.error("Cập nhật thất bại!");
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: item.quantity,
      }));
    }
  };

  const handleInputNumberBlur = (idChiTietSanPham) => {
    const currentValue = editingQuantities[idChiTietSanPham];
    if (!currentValue || currentValue < 1) {
      handleQuantityChange(idChiTietSanPham, 1);
    } else {
      handleApplyQuantity(idChiTietSanPham);
    }
  };

  const clearFilters = () => {
    setSearchKeyword("");
    setCategoryFilter("all");
    setPriceFilter("all");
    setSortBy("default");
  };

  return (
    <>
      {contextHolder}
      <div className="shadow overflow-hidden rounded-lg min-h-[160px] bg-white">
        <div className="p-4 font-bold text-2xl bg-amber-600 opacity-75 rounded-t-lg text-white flex gap-2">
          <BagIcon size={32} />
          {selectedBillId
            ? `Sản phẩm trong giỏ hàng (${cartProducts.length} sản phẩm)`
            : "Tạo hóa đơn để thêm sản phẩm"}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-300">
          <div className="flex gap-3">
            <Search
              placeholder="Tìm tên, mã vạch, màu, size, giá..."
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={(v) => setSearchKeyword(v)}
              style={{ width: 250 }}
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="min-w-[160px]"
              disabled={!cartProducts.length}
            >
              <Option value="all">Tất cả màu</Option>
              {getUniqueColors().map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
            <Select
              value={priceFilter}
              onChange={setPriceFilter}
              className="min-w-[160px]"
              disabled={!cartProducts.length}
            >
              <Option value="all">Tất cả giá</Option>
              <Option value="under100k">Dưới 100.000₫</Option>
              <Option value="100k-500k">100.000₫ - 500.000₫</Option>
              <Option value="500k-1M">500.000₫ - 1.000.000₫</Option>
              <Option value="over1M">Trên 1.000.000₫</Option>
            </Select>
            <Select
              value={sortBy}
              onChange={setSortBy}
              className="min-w-[180px]"
              disabled={!cartProducts.length}
            >
              <Option value="default">Mặc định</Option>
              <Option value="name_asc">Tên A → Z</Option>
              <Option value="name_desc">Tên Z → A</Option>
              <Option value="barcode_asc">Mã vạch A → Z</Option>
              <Option value="barcode_desc">Mã vạch Z → A</Option>
              <Option value="price_asc">Giá thấp → cao</Option>
              <Option value="price_desc">Giá cao → thấp</Option>
              <Option value="quantity_asc">Số lượng ít → nhiều</Option>
              <Option value="quantity_desc">Số lượng nhiều → ít</Option>
              <Option value="total_asc">Thành tiền thấp → cao</Option>
              <Option value="total_desc">Thành tiền cao → thấp</Option>
            </Select>
            {(searchKeyword ||
              categoryFilter !== "all" ||
              priceFilter !== "all" ||
              sortBy !== "default") && (
              <button
                onClick={clearFilters}
                className="text-xs bg-gray-500 text-white rounded px-3 py-1 hover:bg-gray-600"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {!selectedBillId || filteredCartProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-gray-500">
            <div className="p-6 rounded-full bg-amber-600 mb-4">
              <ReceiptXIcon size={64} className="text-white" />
            </div>
            <div className="text-xl font-bold">
              {selectedBillId
                ? cartProducts.length === 0
                  ? "Giỏ hàng trống"
                  : "Không tìm thấy sản phẩm"
                : "Vui lòng chọn hoặc tạo hóa đơn mới"}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredCartProducts.map((product, idx) => (
              <div
                key={product.idChiTietSanPham}
                className="flex justify-between items-center bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-6 flex-1">
                  <span className="font-bold text-lg w-8">{idx + 1}</span>

                  <img
                    src={product.imageUrl || "/placeholder.jpg"}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-xl border"
                  />

                  <div className="flex-1">
                    <div className="font-bold text-lg mb-2">{product.name}</div>

                    <div className="flex gap-2 my-3">
                      {product.maVach && (
                        <span className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold">
                          {product.maVach}
                        </span>
                      )}

                      {product.color && (
                        <span className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold">
                          {product.color}
                        </span>
                      )}

                      {product.size && (
                        <span className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold">
                          {product.size}
                        </span>
                      )}

                      {product.weight && (
                        <span className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-bold">
                          {product.weight}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <span className="font-medium">Số lượng:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleDecreaseQuantity(product.idChiTietSanPham)
                          }
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                          disabled={product.quantity <= 1}
                        >
                          −
                        </button>

                        <InputNumber
                          min={1}
                          value={
                            editingQuantities[product.idChiTietSanPham] ??
                            product.quantity
                          }
                          onChange={(v) =>
                            handleQuantityChange(product.idChiTietSanPham, v)
                          }
                          onPressEnter={() =>
                            handleApplyQuantity(product.idChiTietSanPham)
                          }
                          onBlur={() =>
                            handleInputNumberBlur(product.idChiTietSanPham)
                          }
                          style={{ width: 60 }}
                          className="text-center"
                          parser={(value) => {
                            return value
                              ? parseInt(value.replace(/[^\d]/g, "")) || 1
                              : 1;
                          }}
                          formatter={(value) => {
                            return value ? `${value}` : "1";
                          }}
                        />

                        <button
                          onClick={() =>
                            handleIncreaseQuantity(product.idChiTietSanPham)
                          }
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">
                    {product.totalPrice.toLocaleString()}₫
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.quantity} × {product.unitPrice.toLocaleString()}₫
                  </div>
                  <button
                    onClick={() =>
                      handleDeleteProduct(product.idChiTietSanPham)
                    }
                    className="mt-3 p-2 rounded hover:bg-red-100 text-red-600"
                  >
                    <TrashIcon size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
