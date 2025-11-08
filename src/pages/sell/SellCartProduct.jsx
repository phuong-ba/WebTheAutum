import { ReceiptXIcon } from "@phosphor-icons/react";
import { Col, Form, Input, Row, Select, message } from "antd";
import Search from "antd/es/input/Search";
import { TrashIcon } from "lucide-react";
import { tangSoLuong, fetchChiTietSanPham, giamSoLuong } from "@/services/chiTietSanPhamService";
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

  useEffect(() => {
    dispatch(fetchChiTietSanPham());
  }, [dispatch]);

  const loadCartFromBill = () => {
    if (selectedBillId) {
      const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
      const currentBill = bills.find(bill => bill.id === selectedBillId);
      if (currentBill) {
        const cart = currentBill.cart || [];
        setCartProducts(cart);
        setFilteredCartProducts(cart);
      } else {
        setCartProducts([]);
        setFilteredCartProducts([]);
      }
    } else {
      setCartProducts([]);
      setFilteredCartProducts([]);
    }
  };

  useEffect(() => {
    loadCartFromBill();
  }, [selectedBillId]);

  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartFromBill();
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => {
    window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [selectedBillId]);

  

  const filterCartProducts = () => {
    let result = [...cartProducts];

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase().trim();
      result = result.filter(product => {
        const searchFields = [
          product.name?.toLowerCase() || '',
          product.color?.toLowerCase() || '',
          product.size?.toLowerCase() || '',
          product.weight?.toLowerCase() || '',
          (product.unitPrice || "").toString(),
          (product.totalPrice || "").toString(),
          (product.quantity || "").toString()
        ];
        return searchFields.some(field => field.includes(keyword));
      });
    }

    if (categoryFilter !== "all") {
      result = result.filter(product => product.color === categoryFilter);
    }

    if (priceFilter !== "all") {
      switch (priceFilter) {
        case "under100k":
          result = result.filter(product => product.unitPrice < 100000);
          break;
        case "100k-500k":
          result = result.filter(product => product.unitPrice >= 100000 && product.unitPrice <= 500000);
          break;
        case "500k-1M":
          result = result.filter(product => product.unitPrice > 500000 && product.unitPrice <= 1000000);
          break;
        case "over1M":
          result = result.filter(product => product.unitPrice > 1000000);
          break;
      }
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "price_asc": return a.unitPrice - b.unitPrice;
        case "price_desc": return b.unitPrice - a.unitPrice;
        case "quantity_asc": return a.quantity - b.quantity;
        case "quantity_desc": return b.quantity - a.quantity;
        case "total_asc": return a.totalPrice - b.totalPrice;
        case "total_desc": return b.totalPrice - a.totalPrice;
        default: return 0;
      }
    });

    setFilteredCartProducts(result);
  };

  useEffect(() => {
    filterCartProducts();
  }, [cartProducts, searchKeyword, categoryFilter, priceFilter, sortBy]);

  const getUniqueColors = () => {
    const colors = cartProducts.map(product => product.color).filter(Boolean);
    return [...new Set(colors)];
  };

  const updateCartPrices = () => {
    if (!productList || productList.length === 0) return;

    const updatedCart = cartProducts.map(cartItem => {
      const currentProduct = productList.find(p => p.id === cartItem.id);
      if (currentProduct) {
        const latestUnitPrice = currentProduct.giaSauGiam ?? currentProduct.giaBan ?? 0;
        return {
          ...cartItem,
          unitPrice: latestUnitPrice,
          totalPrice: cartItem.quantity * latestUnitPrice
        };
      }
      return cartItem;
    });

    setCartProducts(updatedCart);
    saveCartToBill(updatedCart);
  };

  useEffect(() => {
    if (cartProducts.length > 0 && productList.length > 0 && selectedBillId) {
      updateCartPrices();
    }
  }, [productList]);

  const saveCartToBill = (cart) => {
    if (!selectedBillId) return;

    const bills = JSON.parse(localStorage.getItem("pendingBills")) || [];
    const updatedBills = bills.map(bill => {
      if (bill.id === selectedBillId) {
        const totalAmount = cart.reduce((sum, product) => sum + product.totalPrice, 0);
        return {
          ...bill,
          cart,
          productCount: cart.length,
          totalAmount,
          updatedAt: new Date().toISOString()
        };
      }
      return bill;
    });

    localStorage.setItem("pendingBills", JSON.stringify(updatedBills));
    setCartProducts(cart);

    window.dispatchEvent(new Event("billsUpdated"));
  };

 const handleDeleteProduct = async (productId) => {
  if (!selectedBillId) return;

  const productToDelete = cartProducts.find(p => p.id === productId);
  if (!productToDelete) return;

  try {
    await dispatch(tangSoLuong({ id: productId, soLuong: productToDelete.quantity })).unwrap();

    await dispatch(fetchChiTietSanPham());

    const newCart = cartProducts.filter(p => p.id !== productId);
    saveCartToBill(newCart);

    messageApi.success("Đã xóa sản phẩm khỏi giỏ hàng và hoàn trả số lượng tồn kho!");
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error(error);
    messageApi.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng!");
  }
};

  const handleDecreaseQuantity = async (id) => {
    const product = cartProducts.find(p => p.id === id);
    if (!product) return;
    if (product.quantity <= 1) return;

    try {
      await dispatch(tangSoLuong({ id, soLuong: 1 })).unwrap();

      const updated = cartProducts.map(p => {
        if (p.id === id) {
          const newQty = p.quantity - 1;
          return {
            ...p,
            quantity: newQty,
            totalPrice: newQty * p.unitPrice
          };
        }
        return p;
      });

      saveCartToBill(updated);
      dispatch(fetchChiTietSanPham());
      messageApi.success("Đã giảm số lượng sản phẩm!");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi giảm số lượng sản phẩm!");
    }
  };

  const handleIncreaseQuantity = async (id) => {
    const product = cartProducts.find(p => p.id === id);
    if (!product) return;

    const currentProduct = productList.find(p => p.id === id);
    if (currentProduct && currentProduct.soLuongTon <= 0) {
      messageApi.warning("Sản phẩm đã hết hàng!");
      return;
    }

    try {
      await dispatch(giamSoLuong({ id, soLuong: 1 })).unwrap();

      const updated = cartProducts.map(p => {
        if (p.id === id) {
          const newQty = p.quantity + 1;
          return {
            ...p,
            quantity: newQty,
            totalPrice: newQty * p.unitPrice
          };
        }
        return p;
      });

      saveCartToBill(updated);
      dispatch(fetchChiTietSanPham());
      messageApi.success("Đã tăng số lượng sản phẩm!");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi khi tăng số lượng sản phẩm!");
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
        <div className="p-4 font-bold text-2xl bg-amber-600 opacity-75 rounded-t-lg text-white">
          {selectedBillId ? "Sản phẩm trong giỏ hàng" : "Chọn hóa đơn để thêm sản phẩm"}
        </div>

        <div className="">
          <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-300">
            <div className="flex justify-between gap-3">
              <Search 
                placeholder="Tìm theo tên, màu, size, trọng lượng, giá..." 
                onSearch={value => setSearchKeyword(value)}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="min-w-[160px]"
                placeholder="Màu sắc"
                disabled={cartProducts.length === 0}
              >
                <Option value="all">Tất cả màu</Option>
                {getUniqueColors().map(color => (
                  <Option key={color} value={color}>{color}</Option>
                ))}
              </Select>
              
              <Select
                value={priceFilter}
                onChange={setPriceFilter}
                className="min-w-[160px]"
                placeholder="Khoảng giá"
                disabled={cartProducts.length === 0}
              >
                <Option value="all">Tất cả giá</Option>
                <Option value="under100k">Dưới 100.000₫</Option>
                <Option value="100k-500k">100.000₫ - 500.000₫</Option>
                <Option value="500k-1M">500.000₫ - 1.000.000₫</Option>
                <Option value="over1M">Trên 1.000.000₫</Option>
              </Select>

              {(searchKeyword || categoryFilter !== "all" || priceFilter !== "all" || sortBy !== "default") && (
                <button
                  onClick={clearFilters}
                  className="text-xs bg-gray-500 text-white rounded px-3 py-1 font-semibold hover:bg-gray-600"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {!selectedBillId ? (
            <div className="flex flex-col gap-3 items-center justify-center p-8 text-gray-500">
              <div className="p-4 rounded-full bg-amber-600">
                <ReceiptXIcon size={48} className="text-white" />
              </div>
              <div className="text-lg font-semibold">
                Vui lòng chọn hoặc tạo hóa đơn để thêm sản phẩm
              </div>
            </div>
          ) : filteredCartProducts.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center p-8 text-gray-500">
              <div className="p-4 rounded-full bg-amber-600">
                <ReceiptXIcon size={48} className="text-white" />
              </div>
              <div className="text-lg font-semibold">
                {cartProducts.length === 0 ? "Chưa có sản phẩm nào trong giỏ hàng" : "Không tìm thấy sản phẩm phù hợp"}
              </div>
              {cartProducts.length > 0 && (
                <div className="text-sm">
                  Thử thay đổi điều kiện lọc
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col shadow overflow-hidden gap-4 p-4">
              {filteredCartProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center px-8 py-3 rounded-tl-4xl rounded-br-4xl"
                >
                  <div className="flex-2 flex items-center gap-35">
                    <div className="font-bold">{index + 1}</div>
                    <div className="max-w-[100px] max-h-[120px] object-cover rounded-xl flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="rounded-xl w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full border-2 min-w-[120px] min-h-[160px] border-dashed border-gray-400 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                  
                    <div className="flex flex-col gap-2">
                      <div className="font-bold text-lg">{product.name}</div>
                      <div className="flex gap-2">
                        <div className="text-xs bg-amber-600 text-white rounded px-4 font-semibold">
                          {product.color}
                        </div>
                        <div className="text-xs bg-amber-600 text-white rounded px-4 font-semibold">
                          {product.size}
                        </div>
                      </div>
                       <div className="flex gap-1 text-sm items-center">
                      <div>Trọng lượng:</div>
                      <div className="border rounded border-amber-600 px-3 py-1 text-sm font-bold cursor-pointer">
                        {product.weight ?? "Không có"}
                      </div>
                    </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          Số lượng:{" "}
                          {/* <span className="font-bold">{product.quantity}</span> */}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecreaseQuantity(product.id)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={product.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="font-bold text-sm">{product.quantity}</span>
                          <button
                            onClick={() => handleIncreaseQuantity(product.id)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-red-600 opacity-80 font-bold text-lg">
                        {product.totalPrice.toLocaleString()} VND
                      </div>
                      <div className="text-gray-400 font-semibold text-sm">
                        Đơn giá: <span>{product.unitPrice.toLocaleString()} VND</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.quantity} × {product.unitPrice.toLocaleString()}₫
                      </div>
                    </div>
                    <div
                      className="border border-red-700 p-2 rounded cursor-pointer"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <TrashIcon
                        size={16}
                        weight="bold"
                        className="text-red-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}