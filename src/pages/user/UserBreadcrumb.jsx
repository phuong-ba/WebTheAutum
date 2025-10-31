import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function UserBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/user") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý nhân viên" },
    ];
  } else if (path === "/admin/add-user") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/user">Quản lý nhân viên</Link> },
      { title: "Thêm nhân viên" },
    ];
  } else if (path === "/admin/update-user") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/user">Quản lý nhân viên</Link> },
      { title: "Cập nhật nhân viên" },
    ];
  }

  return <Breadcrumb items={items} />;
}
