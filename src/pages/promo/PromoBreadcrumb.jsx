import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function PromoBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/promo") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: "Quản lý đợt giảm giá" },
    ];
  } else if (path === "/admin/add-promo") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/promo">Quản lý phiếu giảm giá</Link> },
      { title: "Thêm phiếu giảm giá" },
    ];
  } else if (path === "/admin/update-promo") {
    items = [
      { title: <Link to="/admin/#">Trang chủ</Link> },
      { title: <Link to="/admin/promo">Quản lý phiếu giảm giá</Link> },
      { title: "Cập nhật phiếu giảm giá" },
    ];
  }

  return <Breadcrumb items={items} />;
}
