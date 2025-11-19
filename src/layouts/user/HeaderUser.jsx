import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/src/assets/login/logoAutumn.png";
import {
  PhoneIcon,
  ShoppingCartIcon,
  UserIcon,
  SignOutIcon,
  PackageIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { Input } from "antd";

export default function HeaderUser() {
  const navigate = useNavigate();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    setCartItemCount(totalItems);
  };

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      const userInfo = {
        id: localStorage.getItem("customer_id"),
        email: localStorage.getItem("customer_email"),
        hoTen: localStorage.getItem("customer_name"),
        sdt: localStorage.getItem("customer_phone"),
      };
      setCurrentUser(userInfo);
    }

    updateCartCount();

    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_type");
    localStorage.removeItem("customer_name");
    localStorage.removeItem("customer_email");
    localStorage.removeItem("customer_id");
    localStorage.removeItem("customer_phone");
    localStorage.removeItem("customer_login_success");
    setCurrentUser(null);
    setIsUserModalOpen(false);
    navigate("/customer/login");
  };

  const handleUserIconClick = () => {
    setIsUserModalOpen(true);
  };

  const handleCartClick = () => {
    navigate("/cart");
  };

  return (
    <>
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-8 lg:px-12 xl:px-16">
          <div className="flex justify-between items-center min-h-[80px]">
            <div className="flex-1 flex items-center gap-8 text-lg">
              <Link to="#" className="hover:text-orange-500 transition-colors">
                Nữ
              </Link>
              <Link to="#" className="hover:text-orange-500 transition-colors">
                Nam
              </Link>
              <Link
                to="#"
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                SALE OUTLET
              </Link>
              <Link to="#" className="hover:text-orange-500 transition-colors">
                Bộ sưu tập
              </Link>
              <Link to="#" className="hover:text-orange-500 transition-colors">
                Về Chúng Tôi
              </Link>
            </div>

            <div className="flex-shrink-0">
              <Link to="/">
                <img
                  width={80}
                  src={logo}
                  alt="logo"
                  className="hover:opacity-90 transition-opacity"
                />
              </Link>
            </div>

            <div className="flex-1 flex items-center justify-end gap-8">
              <div className="w-64">
                <Input
                  placeholder="Tìm kiếm..."
                  className="w-full"
                  size="large"
                />
              </div>

              <div className="flex gap-5">
                <button className="hover:opacity-70 transition-opacity">
                  <PhoneIcon size={24} />
                </button>

                <button
                  onClick={() => navigate("/orders")}
                  className="hover:opacity-70 transition-opacity"
                  title="Tra cứu đơn hàng"
                >
                  <PackageIcon size={24} />
                </button>

                <div className="relative">
                  <button
                    onClick={handleUserIconClick}
                    className="relative hover:opacity-70 transition-opacity"
                  >
                    <UserIcon size={24} />
                    {currentUser && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </button>

                  {isUserModalOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserModalOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-[400px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                        {currentUser ? (
                          <div className="py-4">
                            <div className="flex items-center gap-4 pb-6 border-b border-gray-200 px-6">
                              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                <UserCircleIcon
                                  size={40}
                                  className="text-orange-500"
                                  weight="fill"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-lg text-gray-800">
                                  {currentUser.hoTen || currentUser.email}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {currentUser.email}
                                </p>
                              </div>
                            </div>

                            <div className="py-4 space-y-2 px-4">
                              <button
                                onClick={() => {
                                  navigate("/orders");
                                  setIsUserModalOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-lg transition-colors text-left"
                              >
                                <PackageIcon
                                  size={22}
                                  className="text-gray-600"
                                />
                                <span className="font-medium text-gray-700">
                                  Đơn hàng của tôi
                                </span>
                              </button>

                              <button
                                onClick={() => {
                                  navigate("/cart");
                                  setIsUserModalOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-lg transition-colors text-left"
                              >
                                <ShoppingCartIcon
                                  size={22}
                                  className="text-gray-600"
                                />
                                <span className="font-medium text-gray-700">
                                  Giỏ hàng
                                </span>
                              </button>

                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-colors text-left"
                              >
                                <SignOutIcon
                                  size={22}
                                  className="text-red-600"
                                />
                                <span className="font-medium text-red-600">
                                  Đăng xuất
                                </span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center px-6">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <UserCircleIcon
                                size={48}
                                className="text-orange-500"
                              />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              Chào mừng bạn!
                            </h3>
                            <p className="text-gray-600 mb-6">
                              Đăng nhập để trải nghiệm mua sắm tốt nhất
                            </p>
                            <div className="space-y-3">
                              <button
                                onClick={() => {
                                  navigate("/customer/login");
                                  setIsUserModalOpen(false);
                                }}
                                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                              >
                                Đăng nhập
                              </button>
                              <button
                                onClick={() => {
                                  navigate("/customer/register");
                                  setIsUserModalOpen(false);
                                }}
                                className="w-full bg-white border-2 border-orange-500 text-orange-500 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                              >
                                Đăng ký
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleCartClick}
                  className="relative hover:opacity-70 transition-opacity"
                >
                  <ShoppingCartIcon size={24} />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
