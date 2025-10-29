import React, { useState } from "react";
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
  const items = [
    { key: "/", icon: <IconHome />, label: "Trang chủ" },
    {
      key: "/statistical",
      icon: <IconStatistical />,
      label: "Báo cáo & Thống kê",
    },
    { key: "/sell", icon: <IconBook />, label: "Quản lý bán hàng" },
    { key: "/bill", icon: <IconAlign />, label: "Quản lý hóa đơn" },
    {
      key: "sub1",
      label: "Quản lý sản phẩm",
      icon: <IconProduct />,
      children: [
        { key: "/product", label: "Danh mục sản phẩm" },
        { key: "/category", label: "Danh mục" },
        { key: "/collection", label: "Bộ sưu tập" },
        { key: "/warehouse", label: "Kho hàng" },
      ],
    },
    {
      key: "/discount",
      icon: <IconDiscount />,
      label: "Quản lý phiếu giảm giá",
    },

    { key: "/promo", icon: <IconDiscount />, label: "Quản lý đợt giảm giá" },
    { key: "/user", icon: <AppstoreOutlined />, label: "Quản lý nhân viên" },
    {
      key: "/customer",
      icon: <AppstoreOutlined />,
      label: "Quản lý khách hàng",
    },
  ];

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
        items={items}
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
