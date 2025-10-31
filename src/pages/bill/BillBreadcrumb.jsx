import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

export default function BillBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  let items = [];

  if (path === "/admin/bill") {
    items = [
      { title: <Link to="/admin">Trang chủ</Link> },
      { title: "Quản lý hóa đơn" },
    ];
  } else if (path.startsWith("/admin/detail-bill/")) {
    items = [
      { title: <Link to="/admin">Trang chủ</Link> },
      { title: <Link to="/admin/bill">Quản lý hóa đơn</Link> },
      { title: "Chi tiết đơn hàng" },
    ];
  } else if (path.startsWith("/admin/bill/edit/")) {
    // Tách ID từ đường dẫn, ví dụ "/admin/bill/edit/1" → "1"
    const id = path.split("/").pop();

    items = [
      { title: <Link to="/admin">Trang chủ</Link> },
      { title: <Link to="/admin/bill">Quản lý hóa đơn</Link> },
      { title: <Link to={`/admin/detail-bill/${id}`}>Chi tiết đơn hàng</Link> },
      { title: "Cập nhật hóa đơn" },
    ];
  }

  return (
    <div className="mb-4">
      <Breadcrumb items={items} />
    </div>
  );
}
