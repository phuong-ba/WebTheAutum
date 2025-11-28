import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "/src/assets/login/logo.png";
import {
  IconAvt,
  IconCart,
  IconHeart,
  IconPhoneS,
} from "@/assets/svg/externalIcon";
import Search from "antd/es/input/Search";
import { PackageIcon } from "@phosphor-icons/react";
import { Dropdown, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
const onSearch = (value, _e, info) => console.log(info?.source, value);
export default function HeaderUser() {
  const [cartCount, setCartCount] = useState(0);
  const [customerName, setCustomerName] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const updateCart = () => {
      console.log(">>> Cart Updated");
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartCount(cart.length);
    };

    updateCart();
    window.addEventListener("cartUpdated", updateCart);
    return () => window.removeEventListener("cartUpdated", updateCart);
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      const name = localStorage.getItem("customer_name");
      setCustomerName(name);
    }
  }, []);
  useEffect(() => {
    const updateCustomer = () => {
      const name = localStorage.getItem("customer_name");
      setCustomerName(name);
    };

    updateCustomer(); // load lần đầu
    window.addEventListener("customerLogin", updateCustomer);

    return () => window.removeEventListener("customerLogin", updateCustomer);
  }, []);
  const logout = () => {
    localStorage.removeItem("customer_email");
    localStorage.removeItem("customer_id");
    localStorage.removeItem("customer_login_success");
    localStorage.removeItem("customer_name");
    localStorage.removeItem("customer_phone");
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_type");

    setCustomerName(null);
    navigate("/");
  };
  const navigate = useNavigate();
  const items = [
    {
      key: "1",
      label: (
        <div onClick={() => navigate("/customer/profile")}>Hồ sơ của tôi</div>
      ),
    },
    {
      key: "2",
      label: (
        <div className="text-red-500" onClick={logout}>
          Đăng xuất
        </div>
      ),
    },
  ];
  return (
    <>
      {contextHolder}
      <div className="flex justify-between items-center ">
        <div className="w-16 py-4 cursor-pointer" onClick={() => navigate(`/`)}>
          <img src={logo} alt="" />
        </div>
        <div className="flex gap-10 font-semibold text-sm">
          <NavLink to={"/"} className="hover:text-orange-600 transition">
            Trang chủ
          </NavLink>
          {/* <NavLink
            to={"/category"}
            className="hover:text-orange-600 transition"
          >
            Danh mục
          </NavLink> */}
          <NavLink to={"/product"} className="hover:text-orange-600 transition">
            Sản phẩm
          </NavLink>

          <NavLink to={"/coupons"} className="hover:text-orange-600 transition">
            Ưu đãi
          </NavLink>
          <NavLink className="hover:text-orange-600 transition">
            Liên hệ
          </NavLink>
        </div>

        <div className="flex items-center gap-10">
          <div className="xl:min-w-[400px] lg:min-w-[200px]">
            <Search
              size="large"
              placeholder="Tìm kiếm sản phẩm ..."
              onSearch={onSearch}
              enterButton
            />
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              {customerName ? (
                <Dropdown menu={{ items }} trigger={["click"]}>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className="border-2 border-gray-300 p-3 w-[44px] h-[44px] flex items-center rounded-full">
                      <IconAvt />
                    </div>

                    <div>
                      <div className="text-gray-500 text-sm">Xin chào</div>
                      <div className="font-semibold text-sm flex items-center gap-1">
                        {customerName}
                        <DownOutlined style={{ fontSize: 10 }} />
                      </div>
                    </div>
                  </div>
                </Dropdown>
              ) : (
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate("/customer/login")}
                >
                  <div className="border-2 border-gray-300 p-3 w-[44px] h-[44px] flex items-center rounded-full">
                    <IconAvt />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Xin chào</div>
                    {customerName ? (
                      <div className="font-semibold text-sm">
                        {customerName}
                      </div>
                    ) : (
                      <div className="font-semibold text-sm">Mời đăng nhập</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-6 items-center relative">
              {/* Heart Icon */}
              <div
                className="p-2 rounded-full border-2 border-gray-300 cursor-pointer"
                onClick={() => navigate(`/your-bill`)}
              >
                <PackageIcon size={24} />
              </div>

              {/* Cart Icon */}
              <div
                className="relative p-2 rounded-full border-2 border-gray-300 cursor-pointer"
                onClick={() => navigate(`/cart`)}
              >
                <IconCart />

                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
