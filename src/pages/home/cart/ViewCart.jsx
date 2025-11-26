import React, { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import ClientBreadcrumb from "../ClientBreadcrumb";
import logo from "/src/assets/login/logo.png";
import { NavLink, useNavigate } from "react-router";

export default function ViewCart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Legendary Whitetails Women's...",
      price: 76000000,
      qty: 1,
      image: logo,
    },
    {
      id: 2,
      name: "Tommy Hilfiger Women's Jaden",
      price: 76000000,
      qty: 1,
      image: logo,
    },
    {
      id: 3,
      name: "Simple Modern School Boys",
      price: 76000000,
      qty: 1,
      image: logo,
    },
    {
      id: 4,
      name: "Calvin Klein Gabrianna Novelty",
      price: 76000000,
      qty: 1,
      image: logo,
    },
  ]);

  const [coupon, setCoupon] = useState("");
  const [shipping, setShipping] = useState("flat"); // flat | pickup | free

  const updateQuantity = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCost =
    shipping === "flat" ? 200000 : shipping === "pickup" ? 250000 : 0;
  const total = subtotal + shippingCost;

  return (
    <div className=" px-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        <div>
          <div className="text-3xl font-bold text-gray-900">Giỏ hàng</div>
          <ClientBreadcrumb />
        </div>
        <div className="border-dashed border p-4 max-w-[600px]">
          <div className="text-gray-600">
            Bạn có phiếu giảm giá không? Nhấp vào đây để{" "}
            <NavLink
              to={`/coupons`}
              className="text-orange-600 hover:underline "
            >
              nhập mã của bạn
            </NavLink>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-100 text-sm font-medium text-gray-700 ">
                <div className="col-span-5 font-bold">Sản phẩm</div>
                <div className="col-span-2 text-center font-bold">Giá</div>
                <div className="col-span-3 text-center font-bold">Số lượng</div>
                <div className="col-span-2 text-right font-bold">Xóa</div>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-6 py-6 border-b border-gray-300 hover:bg-gray-50 transition"
                >
                  <div className="col-span-5 flex items-center gap-4 ">
                    <div className="bg-gray-100 min-w-[78px] min-h-[100px] max-w-[78px] max-h-[100px] flex items-center p-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className=" object-cover rounded"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-center">
                    <span className="font-bold">{item.price}đ</span>
                  </div>

                  <div className="col-span-3 flex items-center justify-center">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <div
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 transition cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </div>

                      <input
                        type="number"
                        value={item.qty}
                        min={1}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setItems((prev) =>
                            prev.map((it) =>
                              it.id === item.id
                                ? { ...it, qty: value >= 1 ? value : 1 }
                                : it
                            )
                          );
                        }}
                        className="w-12 text-center bg-transparent outline-none mx-2 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />

                      <div
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-end">
                    <div
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition cursor-pointer">
                  Áp dụng
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Tổng giỏ hàng</h2>

              <div className="space-y-4 text-gray-700">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-medium">{subtotal}đ</span>
                </div>

                <div>
                  <p className="font-medium mb-3">Vận chuyển</p>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shipping === "flat"}
                        onChange={() => setShipping("flat")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Phí cố định: 200000đ</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shipping === "pickup"}
                        onChange={() => setShipping("pickup")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Nhận tại cửa hàng: 200000đ</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shipping === "free"}
                        onChange={() => setShipping("free")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Miễn phí vận chuyển</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span>{total}đ</span>
                  </div>
                </div>

                <div
                  className="w-full mt-6 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition text-center cursor-pointer"
                  onClick={() => navigate(`/checkout`)}
                >
                  Tiến hành thanh toán
                </div>

                <div className="w-full mt-3 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-center cursor-pointer">
                  Tiếp tục mua sắm
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
