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
import React, { useState, useEffect } from "react";
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

  // DÙNG idChiTietSanPham LÀM KEY DUY NHẤT
  const [editingQuantities, setEditingQuantities] = useState({});

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  const loadCartFromBill = () => {
    if (!selectedBillId) {
      setCartProducts([]);
      setFilteredCartProducts([]);
      setEditingQuantities({});
      return;
    }

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const currentBill = bills.find((bill) => bill.id === selectedBillId);

    if (currentBill && currentBill.cart) {
      setCartProducts(currentBill.cart);
      setFilteredCartProducts(currentBill.cart);

      const initialEditing = {};
      currentBill.cart.forEach((item) => {
        initialEditing[item.idChiTietSanPham] = item.quantity;
      });
      setEditingQuantities(initialEditing);
    } else {
      setCartProducts([]);
      setFilteredCartProducts([]);
      setEditingQuantities({});
    }
  };

  useEffect(() => {
    loadCartFromBill();
  }, [selectedBillId]);

  useEffect(() => {
    const handleCartUpdated = () => loadCartFromBill();
    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("billsUpdated", handleCartUpdated);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("billsUpdated", handleCartUpdated);
    };
  }, [selectedBillId]);

  // Lọc & sắp xếp
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

    // Sort
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

  // Cập nhật giá khi có khuyến mãi mới
  const updateCartPrices = () => {
    if (!productList?.length || !cartProducts.length) return;

    const updated = cartProducts.map((item) => {
      const fresh = productList.find((p) => p.id === item.idChiTietSanPham);
      if (fresh) {
        const newPrice = fresh.giaSauGiam ?? fresh.giaBan ?? 0;
        return {
          ...item,
          unitPrice: newPrice,
          totalPrice: item.quantity * newPrice,
        };
      }
      return item;
    });

    setCartProducts(updated);
    saveCartToBill(updated);
  };

  useEffect(() => {
    if (cartProducts.length > 0 && productList.length > 0) {
      updateCartPrices();
    }
  }, [productList]);

  const saveCartToBill = (cart) => {
    if (!selectedBillId) return;

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const updatedBills = bills.map((bill) =>
      bill.id === selectedBillId
        ? {
            ...bill,
            cart,
            productCount: cart.length,
            totalAmount: cart.reduce((sum, p) => sum + p.totalPrice, 0),
            updatedAt: new Date().toISOString(),
          }
        : bill
    );

    localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
    window.dispatchEvent(new Event("billsUpdated"));
  };

  // XÓA SẢN PHẨM
  const handleDeleteProduct = async (idChiTietSanPham) => {
    const product = cartProducts.find(
      (p) => p.idChiTietSanPham === idChiTietSanPham
    );
    if (!product) return;

    try {
      await dispatch(
        tangSoLuong({ id: idChiTietSanPham, soLuong: product.quantity })
      ).unwrap();
      await dispatch(fetchChiTietSanPham());

      const newCart = cartProducts.filter(
        (p) => p.idChiTietSanPham !== idChiTietSanPham
      );
      saveCartToBill(newCart);

      setEditingQuantities((prev) => {
        const copy = { ...prev };
        delete copy[idChiTietSanPham];
        return copy;
      });

      messageApi.success("Đã xóa sản phẩm và hoàn tồn kho!");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      messageApi.error("Lỗi xóa sản phẩm!");
    }
  };

  // TĂNG / GIẢM SỐ LƯỢNG
  const handleIncreaseQuantity = async (idChiTietSanPham) => {
    const item = cartProducts.find(
      (p) => p.idChiTietSanPham === idChiTietSanPham
    );
    const stockItem = productList.find((p) => p.id === idChiTietSanPham);
    if (stockItem && stockItem.soLuongTon <= 0) {
      messageApi.warning("Hết hàng!");
      return;
    }

    try {
      await dispatch(
        giamSoLuong({ id: idChiTietSanPham, soLuong: 1 })
      ).unwrap();

      const updated = cartProducts.map((p) =>
        p.idChiTietSanPham === idChiTietSanPham
          ? {
              ...p,
              quantity: p.quantity + 1,
              totalPrice: (p.quantity + 1) * p.unitPrice,
            }
          : p
      );
      saveCartToBill(updated);
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: item.quantity + 1,
      }));
      dispatch(fetchChiTietSanPham());
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      messageApi.error("Không thể tăng số lượng!");
    }
  };

  const handleDecreaseQuantity = async (idChiTietSanPham) => {
    const item = cartProducts.find(
      (p) => p.idChiTietSanPham === idChiTietSanPham
    );
    if (item.quantity <= 1) return;

    try {
      await dispatch(
        tangSoLuong({ id: idChiTietSanPham, soLuong: 1 })
      ).unwrap();

      const updated = cartProducts.map((p) =>
        p.idChiTietSanPham === idChiTietSanPham
          ? {
              ...p,
              quantity: p.quantity - 1,
              totalPrice: (p.quantity - 1) * p.unitPrice,
            }
          : p
      );
      saveCartToBill(updated);
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: item.quantity - 1,
      }));
      dispatch(fetchChiTietSanPham());
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      messageApi.error("Không thể giảm số lượng!");
    }
  };

  // THAY ĐỔI SỐ LƯỢNG BẰNG INPUT
  const handleQuantityChange = (idChiTietSanPham, value) => {
    if (!value || value < 1) return;
    setEditingQuantities((prev) => ({ ...prev, [idChiTietSanPham]: value }));
  };

  const handleApplyQuantity = async (idChiTietSanPham) => {
    const newQty = editingQuantities[idChiTietSanPham];
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
        await dispatch(
          giamSoLuong({ id: idChiTietSanPham, soLuong: diff })
        ).unwrap();
      } else {
        await dispatch(
          tangSoLuong({ id: idChiTietSanPham, soLuong: Math.abs(diff) })
        ).unwrap();
      }

      const updated = cartProducts.map((p) =>
        p.idChiTietSanPham === idChiTietSanPham
          ? { ...p, quantity: newQty, totalPrice: newQty * p.unitPrice }
          : p
      );

      saveCartToBill(updated);
      dispatch(fetchChiTietSanPham());
      messageApi.success(`Cập nhật số lượng: ${newQty}`);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      messageApi.error("Cập nhật thất bại!");
      setEditingQuantities((prev) => ({
        ...prev,
        [idChiTietSanPham]: item.quantity,
      }));
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
            ? "Sản phẩm trong giỏ hàng"
            : "Tạo hóa đơn để thêm sản phẩm"}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-300">
          <div className="flex gap-3">
            <Search
              placeholder="Tìm tên, màu, size, giá..."
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
            {(searchKeyword ||
              categoryFilter !== "all" ||
              priceFilter !== "all") && (
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
                key={product.idChiTietSanPham} // KEY DUY NHẤT
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
                    <div className="font-bold text-lg">{product.name}</div>
                    <div className="flex gap-2 my-1">
                      <span className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold">
                        {product.color}
                      </span>
                      <span className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold">
                        {product.size}
                      </span>
                      {product.weight && (
                        <span className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-bold">
                          {product.weight}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span>Số lượng:</span>
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
                            handleApplyQuantity(product.idChiTietSanPham)
                          }
                          style={{ width: 60 }}
                          className="text-center"
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
