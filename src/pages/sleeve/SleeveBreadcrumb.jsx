import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function SleeveBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/sleeve") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý tay áo" },
    ];
  } else if (path === "/admin/add-sleeve") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/sleeve">Quản lý tay áo</Link> },
      { title: "Thêm tay áo" },
    ];
  } else if (path === "/admin/update-sleeve") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/sleeve">Quản lý tay áo</Link> },
      { title: "Cập nhật tay áo" },
    ];
  }

  return <Breadcrumb items={items} />;
}
