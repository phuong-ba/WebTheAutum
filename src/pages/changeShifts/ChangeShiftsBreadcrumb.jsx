import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function ChangeShiftsBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/changeShifts") {
    items = [
      { title: <Link to="/admin/">Trang chủ</Link> },
      { title: "Quản lý giao ca" },
    ];
  } else if (path === "/admin/add-user") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/changeShifts">Quản lý giao ca</Link> },
      { title: "Thêm giao ca" },
    ];
  } else if (path === "/admin/update-changeShifts") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/changeShifts">Quản lý giao ca</Link> },
      { title: "Cập nhật giao ca" },
    ];
  }

  return <Breadcrumb items={items} />;
}
