import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function UserBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/user") {
    items = [
      { title: <Link to="/">Trang chủ</Link> },
      { title: "Quản lý nhân viên" },
    ];
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
