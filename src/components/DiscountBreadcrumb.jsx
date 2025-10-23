import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function DiscountBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/discount") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: "Quản lý phiếu giảm giá" },
    ];
  } else if (path === "/add-discount") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: <Link to="/discount">Quản lý phiếu giảm giá</Link> },
      { title: "Thêm phiếu giảm giá" },
    ];
  } else if (path === "/update-discount") {
    items = [
      { title: <Link to="/#">Trang chủ</Link> },
      { title: <Link to="/discount">Quản lý phiếu giảm giá</Link> },
      { title: "Cập nhật phiếu giảm giá" },
    ];
  }

  return <Breadcrumb items={items} />;
}
