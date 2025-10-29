import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function PromoBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/promo") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: "Quản lý đợt giảm giá" },
    ];
  } else if (path === "/add-promo") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: <Link to="/promo">Quản lý phiếu giảm giá</Link> },
      { title: "Thêm phiếu giảm giá" },
    ];
  } else if (path === "/update-promo") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: <Link to="/promo">Quản lý phiếu giảm giá</Link> },
      { title: "Cập nhật phiếu giảm giá" },
    ];
  }

  return <Breadcrumb items={items} />;
}
