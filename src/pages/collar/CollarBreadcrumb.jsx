import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function CollarBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/color") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý màu sắc" },
    ];
  } else if (path === "/admin/add-color") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/color">Quản lý màu sắc</Link> },
      { title: "Thêm màu sắc" },
    ];
  } else if (path === "/admin/update-color") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/color">Quản lý màu sắc</Link> },
      { title: "Cập nhật màu sắc" },
    ];
  }

  return <Breadcrumb items={items} />;
}
