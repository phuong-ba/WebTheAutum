import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function SellBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/sell") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý bán hàng" },
    ];
  } else if (path === "/admin/add-sell") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/sell">Quản lý bán hàng</Link> },
      { title: "Thêm bán hàng" },
    ];
  } else if (path === "/admin/update-sell") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/sell">Quản lý bán hàng</Link> },
      { title: "Cập nhật bán hàng" },
    ];
  }

  return <Breadcrumb items={items} />;
}
