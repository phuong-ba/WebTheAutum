import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash, ArrowLeft, Info, Minus, Plus, ShoppingCart, Tag, Package, Check, X } from "@phosphor-icons/react";
import { toast } from 'react-toastify';

const formatCurrency = (amount) => {
  if (typeof amount !== "number") {
    return amount;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Danh sách voucher mẫu (có thể thay bằng API)
const VOUCHERS = [
  {
    code: "AUTUMN10",
    discount: 10, // phần trăm
    minOrder: 200000,
    description: "Giảm 10% cho đơn hàng từ 200k"
  },
  {
    code: "AUTUMN50K",
    discount: 50000, // số tiền cố định
    minOrder: 500000,
    description: "Giảm 50k cho đơn hàng từ 500k"
  },
  {
    code: "FREESHIP",
    discount: 0,
    freeShip: true,
    minOrder: 0,
    description: "Miễn phí vận chuyển"
  }
];

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const [editingItemId, setEditingItemId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
    
    // Load voucher đã áp dụng (nếu có)
    const savedVoucher = JSON.parse(localStorage.getItem("appliedVoucher") || "null");
    setAppliedVoucher(savedVoucher);
  }, []);

  const updateCart = (newCart) => {
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCartItems(newCart);
    
    // Trigger event để cập nhật header
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(id);
      return;
    }
    const newCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    updateCart(newCart);
  };

  const handleRemoveItem = (id) => {
    const newCart = cartItems.filter((item) => item.id !== id);
    updateCart(newCart);
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  const handleInputBlur = () => {
    if (editingItemId === null) return;
    const newQty = parseInt(inputValue, 10);
    if (!isNaN(newQty)) {
      handleQuantityChange(editingItemId, newQty);
    }
    setEditingItemId(null);
    setInputValue("");
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingItemId(null);
      setInputValue("");
    }
  };

  // Xử lý áp dụng voucher
  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      setVoucherError("Vui lòng nhập mã giảm giá");
      return;
    }

    const voucher = VOUCHERS.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
    
    if (!voucher) {
      setVoucherError("Mã giảm giá không hợp lệ");
      toast.error("Mã giảm giá không hợp lệ");
      return;
    }

    if (finalSubtotal < voucher.minOrder) {
      setVoucherError(`Đơn hàng tối thiểu ${formatCurrency(voucher.minOrder)}`);
      toast.error(`Đơn hàng tối thiểu ${formatCurrency(voucher.minOrder)}`);
      return;
    }

    setAppliedVoucher(voucher);
    localStorage.setItem("appliedVoucher", JSON.stringify(voucher));
    setVoucherError("");
    setVoucherCode("");
    toast.success(`Đã áp dụng mã ${voucher.code}`);
  };

  // Xóa voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    localStorage.removeItem("appliedVoucher");
    toast.info("Đã xóa mã giảm giá");
  };

  const totalItemCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const originalSubtotal = cartItems.reduce(
    (acc, item) => {
      const price = (item.giaGoc && item.giaGoc > 0) ? item.giaGoc : item.gia;
      return acc + price * item.quantity;
    }, 0
  );

  const finalSubtotal = cartItems.reduce(
    (acc, item) => acc + item.gia * item.quantity,
    0
  );

  const productDiscount = originalSubtotal - finalSubtotal;

  // Tính giảm giá từ voucher
  const voucherDiscount = appliedVoucher ? (
    appliedVoucher.discount > 100 
      ? appliedVoucher.discount // Giảm theo số tiền
      : (finalSubtotal * appliedVoucher.discount / 100) // Giảm theo %
  ) : 0;

  const shippingFee = (appliedVoucher?.freeShip || finalSubtotal >= 300000) ? 0 : 30000;
  const totalAmount = finalSubtotal - voucherDiscount + shippingFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
      <div className="container mx-auto max-w-7xl p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Giỏ hàng của bạn</h1>
          <p className="text-gray-600">
            {totalItemCount > 0 ? `${totalItemCount} sản phẩm` : 'Chưa có sản phẩm'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              
              <div className="divide-y divide-gray-100">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => {
                    const hasDiscount = item.giaGoc && item.giaGoc > item.gia;
                    const discountAmount = hasDiscount ? item.giaGoc - item.gia : 0;
                    const discountPercent = hasDiscount ? Math.round((discountAmount / item.giaGoc) * 100) : 0;

                    return (
                      <div
                        key={item.id}
                        className="p-5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex gap-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={item.hinhAnh}
                              alt={item.tenSanPham}
                              className="w-24 h-28 object-cover rounded-lg"
                            />
                            {hasDiscount && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                                -{discountPercent}%
                              </div>
                            )}
                          </div>

                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-grow pr-4">
                                <h3 className="font-semibold text-gray-800 mb-1 leading-tight">
                                  {item.tenSanPham}
                                </h3>
                                <div className="flex gap-2 text-sm text-gray-500">
                                  {item.mauSac && <span>{item.mauSac}</span>}
                                  <span>•</span>
                                  <span>Size {item.size}</span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors"
                                title="Xóa sản phẩm"
                              >
                                <Trash size={18} />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-end justify-between gap-3 mt-3">
                              <div>
                                {hasDiscount && (
                                  <span className="text-sm text-gray-400 line-through block mb-0.5">
                                    {formatCurrency(item.giaGoc)}
                                  </span>
                                )}
                                <span className="text-lg font-bold text-orange-600">
                                  {formatCurrency(item.gia)}
                                </span>
                              </div>

                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
                                >
                                  <Minus size={14} weight="bold" className="text-gray-600" />
                                </button>
                                
                                {editingItemId === item.id ? (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={inputValue}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9]/g, '');
                                      setInputValue(val);
                                    }}
                                    onBlur={handleInputBlur}
                                    onKeyDown={handleInputKeyDown}
                                    autoFocus
                                    className="w-12 py-1.5 text-sm font-semibold text-center border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                  />
                                ) : (
                                  <span
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setInputValue(item.quantity.toString());
                                    }}
                                    className="px-4 py-1.5 text-sm font-semibold min-w-[40px] text-center border-x border-gray-300 cursor-pointer"
                                  >
                                    {item.quantity}
                                  </span>
                                )}

                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
                                >
                                  <Plus size={14} weight="bold" className="text-gray-600" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-gray-500 mb-0.5">Thành tiền</p>
                                <p className="text-lg font-bold text-gray-800">
                                  {formatCurrency(item.gia * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart size={40} className="text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-800 mb-2">Giỏ hàng trống</p>
                    <p className="text-gray-500 mb-6">Thêm sản phẩm vào giỏ để tiếp tục mua sắm</p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                      Khám phá sản phẩm
                    </Link>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-5 border-t border-gray-100">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    <ArrowLeft size={18} weight="bold" />
                    Tiếp tục mua hàng
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Package size={20} weight="duotone" className="text-orange-500" />
                    Tóm tắt đơn hàng
                  </h2>
                </div>

                <div className="p-6">
                  {/* Chi tiết */}
                  <div className="space-y-3 pb-4 border-b border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính ({totalItemCount} sản phẩm)</span>
                      <span className="font-medium text-gray-800">
                        {formatCurrency(originalSubtotal)}
                      </span>
                    </div>

                    {productDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giảm giá sản phẩm</span>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(productDiscount)}
                        </span>
                      </div>
                    )}

                    {appliedVoucher && (
                      <div className="flex justify-between items-center text-sm bg-green-50 -mx-2 px-2 py-2 rounded">
                        <div className="flex items-center gap-2">
                          <Check size={16} weight="bold" className="text-green-600" />
                          <div>
                            <span className="text-green-700 font-medium">{appliedVoucher.code}</span>
                            <p className="text-xs text-green-600">{appliedVoucher.description}</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleRemoveVoucher}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} weight="bold" />
                        </button>
                      </div>
                    )}

                    {voucherDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giảm giá voucher</span>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(voucherDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển</span>
                      <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                        {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                      </span>
                    </div>
                  </div>

                  {/* Tổng cộng */}
                  <div className="py-4 border-b border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-semibold text-gray-800">Tổng cộng</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">(Đã bao gồm VAT nếu có)</p>
                  </div>

               

                  {/* Thông báo */}
                  <div className="py-4">
                    <div className="flex gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg text-xs text-gray-700">
                      <Info size={16} weight="fill" className="flex-shrink-0 text-orange-500 mt-0.5" />
                      <p className="leading-relaxed">
                        Sản phẩm giảm giá trên 50% không hỗ trợ đổi trả. 
                        <span className="font-semibold"> Không thanh toán</span> khi chưa nhận hàng.
                      </p>
                    </div>
                  </div>

                  {/* Nút đặt hàng */}
                  <button
                    onClick={() => navigate("/checkout")}
                    disabled={cartItems.length === 0}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {cartItems.length === 0 ? "Giỏ hàng trống" : "Tiến hành đặt hàng"}
                  </button>
                  {/* Benefits */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>Miễn phí vận chuyển</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}