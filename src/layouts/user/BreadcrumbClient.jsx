import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function BreadcrumbClient() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/category") {
    items = [{ title: <Link to="/">Trang chủ</Link> }, { title: "Danh mục" }];
  } else if (path === "/add-user") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: <Link to="/user">Quản lý nhân viên</Link> },
      { title: "Thêm nhân viên" },
    ];
  } else if (path === "/update-user") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: <Link to="/user">Quản lý nhân viên</Link> },
      { title: "Cập nhật nhân viên" },
    ];
  }

  return <Breadcrumb items={items} />;
}
