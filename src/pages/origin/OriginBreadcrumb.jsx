import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function OriginBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/origin") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý xuất xứ" },
    ];
  } else if (path === "/admin/add-origin") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/origin">Quản lý xuất xứ</Link> },
      { title: "Thêm xuất xứ" },
    ];
  } else if (path === "/admin/update-origin") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/origin">Quản lý xuất xứ</Link> },
      { title: "Cập nhật xuất xứ" },
    ];
  }

  return <Breadcrumb items={items} />;
}
