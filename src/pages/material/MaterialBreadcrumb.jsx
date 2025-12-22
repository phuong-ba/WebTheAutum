import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function MaterialBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/material") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý chất liệu" },
    ];
  } else if (path === "/admin/add-material") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/material">Quản lý chất liệu</Link> },
      { title: "Thêm chất liệu" },
    ];
  } else if (path === "/admin/update-material") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/material">Quản lý chất liệu</Link> },
      { title: "Cập nhật chất liệu" },
    ];
  }

  return <Breadcrumb items={items} />;
}
