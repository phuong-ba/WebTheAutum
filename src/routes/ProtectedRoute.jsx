import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/services/authService";

/**
 * ProtectedRoute Component
 * Kiểm tra xác thực và quyền hạn người dùng
 *
 * Props:
 * - children: Component cần bảo vệ
 * - requiredRole: Role cần thiết (optional) - "admin" hoặc "nhân viên"
 * - requireActiveShift: Yêu cầu giao ca phải đang hoạt động (optional) - chỉ cho nhân viên
 */
export default function ProtectedRoute({
  children,
  requiredRole = null,
  requireActiveShift = false,
}) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    // Kiểm tra xác thực
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      console.log("❌ Chưa đăng nhập");
      setAllowed(false);
      return;
    }

    const userRole = authService.getUserRole();
    console.log("📋 User role:", userRole);

    // Kiểm tra role yêu cầu
    if (requiredRole) {
      // Normalize để tránh phân biệt hóa/thường
      // 'Quản lý' (server) = 'admin' (requiredRole)
      // 'Nhân viên' (server) = 'employee' (requiredRole)
      const normalizedRole = userRole?.trim().toLowerCase() || "";
      const normalizedRequired = requiredRole.trim().toLowerCase();

      // Nếu yêu cầu admin, kiểm tra xem có là Quản lý hay không
      if (normalizedRequired === "admin" && normalizedRole !== "quản lý") {
        console.log(
          "❌ Role không phù hợp. Required:",
          requiredRole,
          "Got:",
          userRole
        );
        setAllowed(false);
        return;
      }

      // Nếu yêu cầu employee, kiểm tra xem có là Nhân viên hay không
      if (normalizedRequired === "employee" && normalizedRole !== "nhân viên") {
        console.log(
          "❌ Role không phù hợp. Required:",
          requiredRole,
          "Got:",
          userRole
        );
        setAllowed(false);
        return;
      }
    }

    // Kiểm tra giao ca đang hoạt động (chỉ cho nhân viên)
    if (requireActiveShift && authService.isEmployee()) {
      const isShiftActive = authService.isShiftActive();
      if (!isShiftActive) {
        console.log("❌ Giao ca không đang hoạt động");
        setAllowed(false);
        return;
      }
      console.log("✅ Giao ca đang hoạt động");
    }

    console.log("✅ Phép truy cập được cấp");
    setAllowed(true);
  }, [requiredRole, requireActiveShift]);

  if (allowed === null) return null; // Loading state
  if (allowed === false) return <Navigate to="/login" replace />;

  return children;
}
