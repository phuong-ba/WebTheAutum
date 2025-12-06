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
import { useShift } from "@/contexts/ShiftContext";
import { ClockUserIcon } from "@phosphor-icons/react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState("STAFF");

  // Use ShiftContext for real-time shift status
  const {
    isShiftActive,
    isChecking: isCheckingShift,
    isAdmin: contextIsAdmin,
    shiftTimeExpired,
  } = useShift();

  // Lấy thông tin user từ localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role") || "STAFF";
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
    {
      key: "/admin/promo",
      icon: <IconDiscount />,
      label: "Quản lý đợt giảm giá",
    },
    {
      key: "/admin/user",
      icon: <AppstoreOutlined />,
      label: "Quản lý nhân viên",
    },
    {
      key: "/admin/customer",
      icon: <AppstoreOutlined className="w-6 h-6" />,
      label: "Quản lý khách hàng",
    },
    {
      key: "/admin/chatbot",
      icon: <AppstoreOutlined />,
      label: "Quản lý chat",
    },
    {
      key: "/admin/changeShifts",
      icon: <ClockUserIcon size={24} />,
      label: "Giao Ca",
    },
    {
      key: "/admin/dateWork",
      icon: <AppstoreOutlined />,
      label: "Lịch làm việc",
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
    {
      key: "/admin/changeShifts",
      icon: <AppstoreOutlined />,
      label: "Giao Ca",
    },
  ];

  // Chọn menu items dựa trên role - SỬA CHỖ NÀY
  const getMenuItems = () => {
    // Role "Quản lý" hoặc "ADMIN" đều có full quyền
    if (userRole === "ADMIN" || userRole === "Quản lý" || contextIsAdmin) {
      return adminMenuItems;
    } else {
      // Cho nhân viên: disable menu nếu đang kiểm tra, không có ca hoạt động, hoặc ca đã hết thời gian
      const shouldDisable =
        isCheckingShift || !isShiftActive || shiftTimeExpired;
      return staffMenuItems.map((item) => ({
        ...item,
        disabled:
          shouldDisable && !String(item.key).startsWith("/admin/changeShifts"),
        children: item.children?.map((child) => ({
          ...child,
          disabled:
            shouldDisable &&
            !String(child.key).startsWith("/admin/changeShifts"),
        })),
      }));
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
        onClick={({ key }) => {
          // Always allow navigating to changeShifts itself
          if (String(key).startsWith("/admin/changeShifts")) {
            navigate(key);
            return;
          }

          const roleNormalized = (userRole || "")
            .toString()
            .trim()
            .toLowerCase();
          const isManager =
            roleNormalized === "quản lý" ||
            roleNormalized === "admin" ||
            roleNormalized.includes("quản lý") ||
            contextIsAdmin;

          // If manager/admin -> allow all navigation
          if (isManager) {
            navigate(key);
            return;
          }

          // For staff: prevent navigation if checking, no active shift, or shift time expired
          if (isCheckingShift || !isShiftActive || shiftTimeExpired) {
            // Do nothing - prevent navigation
            return;
          }

          // If shift is active, allow navigation
          navigate(key);
        }}
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
