import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function ClientBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/product") {
    items = [
      { title: <Link to="/">Trang chủ</Link> },
      { title: "Danh sách Sản phẩm" },
    ];
  } else if (path === "/category") {
    items = [
      { title: <Link to="/">Trang chủ</Link> },

      { title: "Danh mục sản phẩm" },
    ];
  } else if (path.startsWith("/productDetail")) {
    items = [
      { title: <Link to="/">Trang chủ</Link> },
      { title: <Link to="/product">Danh sách sản phẩm</Link> },
      { title: "Chi tiết sản phẩm" },
    ];
  } else if (path === "/coupons") {
    items = [{ title: <Link to="/">Trang chủ</Link> }, { title: "Ưu đãi" }];
  } else if (path === "/cart") {
    items = [{ title: <Link to="/">Trang chủ</Link> }, { title: "Giỏ hàng" }];
  } else if (path === "/checkout") {
    items = [{ title: <Link to="/">Trang chủ</Link> }, { title: "Thanh toán" }];
  } else if (path === "/your-bill") {
    items = [{ title: <Link to="/">Trang chủ</Link> }, { title: "Lịch sử đơn hàng" }];
  }

  return <Breadcrumb items={items} />;
}
