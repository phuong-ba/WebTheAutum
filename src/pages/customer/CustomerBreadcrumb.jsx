import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function CustomerBreadcrumb() {
  const { pathname } = useLocation();

  const items =
    pathname === "/admin/customer"
      ? [
          { title: <Link to="/">Trang chủ</Link> },
          { title: "Quản lý khách hàng" },
        ]
      : pathname === "/admin/add-customer"
      ? [
          { title: <Link to="/#">Trang chủ</Link> },
          { title: <Link to="/admin/customer">Quản lý khách hàng</Link> },
          { title: "Thêm khách hàng" },
        ]
      : pathname === "/admin/update-customer"
      ? [
          { title: <Link to="/#">Trang chủ</Link> },
          { title: <Link to="/admin/customer">Quản lý khách hàng</Link> },
          { title: "Cập nhật khách hàng" },
        ]
      : [];

  return <Breadcrumb items={items} />;
}
