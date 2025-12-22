import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function CollarBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/collar") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý cổ áo" },
    ];
  } else if (path === "/admin/add-collar") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/collar">Quản lý cổ áo</Link> },
      { title: "Thêm cổ áo" },
    ];
  } else if (path === "/admin/update-collar") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/collar">Quản lý cổ áo</Link> },
      { title: "Cập nhật cổ áo" },
    ];
  }

  return <Breadcrumb items={items} />;
}
