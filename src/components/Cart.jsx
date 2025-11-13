import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash, ArrowLeft, Info, Minus, Plus, ShoppingCart, Tag, Package } from "@phosphor-icons/react";

const formatCurrency = (amount) => {
  if (typeof amount !== "number") {
    return amount;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
  }, []);

  const updateCart = (newCart) => {
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCartItems(newCart);
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

  const totalDiscount = originalSubtotal - finalSubtotal;

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
              
              {/* Danh sách sản phẩm */}
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
                          {/* Hình ảnh */}
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

                          {/* Thông tin sản phẩm */}
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
                              {/* Giá */}
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

                              {/* Số lượng */}
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
                                >
                                  <Minus size={14} weight="bold" className="text-gray-600" />
                                </button>
                                <span className="px-4 py-1.5 text-sm font-semibold min-w-[40px] text-center border-x border-gray-300">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="px-3 py-1.5 hover:bg-gray-50 transition-colors"
                                >
                                  <Plus size={14} weight="bold" className="text-gray-600" />
                                </button>
                              </div>

                              {/* Tổng tiền */}
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
                
                {/* Header */}
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

                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giảm giá</span>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(totalDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển</span>
                      <span className="font-medium text-green-600">Miễn phí</span>
                    </div>
                  </div>

                  {/* Tổng cộng */}
                  <div className="py-4 border-b border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-semibold text-gray-800">Tổng cộng</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(finalSubtotal)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">(Đã bao gồm VAT nếu có)</p>
                  </div>

                  {/* Mã giảm giá */}
                  <div className="py-4 border-b border-gray-200">
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input 
                          type="text" 
                          placeholder="Mã giảm giá" 
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                        />
                      </div>
                      <button 
                        type="button" 
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Áp dụng
                      </button>
                    </div>
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
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>Đổi trả trong 7 ngày</span>
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