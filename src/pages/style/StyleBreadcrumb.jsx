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
      { title: "Quản lý kiểu dáng" },
    ];
  } else if (path === "/admin/add-style") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/style">Quản lý kiểu dáng</Link> },
      { title: "Thêm kiểu dáng" },
    ];
  } else if (path === "/admin/update-style") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/style">Quản lý kiểu dáng</Link> },
      { title: "Cập nhật kiểu dáng" },
    ];
  }

  return <Breadcrumb items={items} />;
}
