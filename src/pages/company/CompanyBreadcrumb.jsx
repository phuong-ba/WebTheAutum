import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function CompanyBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/company") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý hãng" },
    ];
  } else if (path === "/admin/add-company") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/company">Quản lý hãng</Link> },
      { title: "Thêm hãng" },
    ];
  } else if (path === "/admin/update-company") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/company">Quản lý hãng</Link> },
      { title: "Cập nhật hãng" },
    ];
  }

  return <Breadcrumb items={items} />;
}
