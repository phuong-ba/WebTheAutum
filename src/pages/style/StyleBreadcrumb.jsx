import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function StyleBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/style") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý màu sắc" },
    ];
  } else if (path === "/admin/add-style") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/style">Quản lý màu sắc</Link> },
      { title: "Thêm màu sắc" },
    ];
  } else if (path === "/admin/update-style") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/style">Quản lý màu sắc</Link> },
      { title: "Cập nhật màu sắc" },
    ];
  }

  return <Breadcrumb items={items} />;
}
