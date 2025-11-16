import React, { useState, useEffect } from "react";
import logo from "/src/assets/login/logoAutumn.png";
import "./Navbar.css";
import {
  IconAlign,
  IconBook,
  IconDiscount,
  IconHome,
  IconProduct,
  IconStatistical,
} from "@/assets/svg/externalIcon";
import {
  AppstoreOutlined,
  ContainerOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState("STAFF");

  // Lấy thông tin user từ localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role") || "STAFF";
    console.log("🎯 Navbar - User Role:", role);
    setUserRole(role);
  }, []);

  // Menu items cho ADMIN/QUẢN LÝ (Full quyền)
  const adminMenuItems = [
    {
      key: "/admin/statistical",
      icon: <IconStatistical />,
      label: "Báo cáo & Thống kê",
    },
    { key: "/admin/sell", icon: <IconBook />, label: "Quản lý bán hàng" },
    { key: "/admin/bill", icon: <IconAlign />, label: "Quản lý hóa đơn" },
    {
      key: "sub1",
      label: "Quản lý sản phẩm",
      icon: <IconProduct />,
      children: [
        { key: "/admin/product", label: "Danh mục sản phẩm" },
        { key: "/admin/category", label: "Danh mục" },
        { key: "/admin/collection", label: "Bộ sưu tập" },
        { key: "/admin/warehouse", label: "Kho hàng" },
      ],
    },
    {
      key: "/admin/discount",
      icon: <IconDiscount />,
      label: "Quản lý phiếu giảm giá",
    },
    { key: "/admin/promo", icon: <IconDiscount />, label: "Quản lý đợt giảm giá" },
    {
      key: "/admin/user",
      icon: <AppstoreOutlined />,
      label: "Quản lý nhân viên",
    },
    {
      key: "/admin/customer",
      icon: <AppstoreOutlined />,
      label: "Quản lý khách hàng",
    },
  ];

  // Menu items cho STAFF (Quyền hạn chế)
  const staffMenuItems = [
    { key: "/admin/sell", icon: <IconBook />, label: "Quản lý bán hàng" },
    { key: "/admin/bill", icon: <IconAlign />, label: "Quản lý hóa đơn" },
    {
      key: "sub1",
      label: "Quản lý sản phẩm",
      icon: <IconProduct />,
      children: [
        { key: "/admin/product", label: "Danh mục sản phẩm" },
        { key: "/admin/category", label: "Danh mục" },
        { key: "/admin/collection", label: "Bộ sưu tập" },
        { key: "/admin/warehouse", label: "Kho hàng" },
      ],
    },
    {
      key: "/admin/customer",
      icon: <AppstoreOutlined />,
      label: "Quản lý khách hàng",
    },
  ];

  // Chọn menu items dựa trên role - SỬA CHỖ NÀY
  const getMenuItems = () => {
    // Role "Quản lý" hoặc "ADMIN" đều có full quyền
    if (userRole === "ADMIN" || userRole === "Quản lý") {
      console.log("🎯 Hiển thị menu ADMIN/QUẢN LÝ - Full quyền");
      return adminMenuItems;
    } else {
      console.log("🎯 Hiển thị menu STAFF - Quyền hạn chế");
      return staffMenuItems;
    }
  };

  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <div
      className={`min-h-screen transition-all duration-300 flex flex-col items-center
        ${collapsed ? "w-[80px]" : "w-[300px]"} bg-[#FDF6EC]`}
    >
      <div className="p-4">
        {!collapsed && <img width={140} src={logo} alt="logo" />}
      </div>

      <Menu
        selectedKeys={[location.pathname]}
        defaultOpenKeys={["sub1"]}
        mode="inline"
        inlineCollapsed={collapsed}
        items={getMenuItems()}
        onClick={({ key }) => navigate(key)}
        className="custom-menu flex-1 w-full border-none"
        style={{
          backgroundColor: "#FDF6EC",
          color: "#8B4513",
        }}
      />

      <div className="p-2">
        <Button
          onClick={toggleCollapsed}
          className="!bg-[#ED7014] !text-white hover:!bg-[#F59C0A] !border-none"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
      </div>
    </div>
  );
}