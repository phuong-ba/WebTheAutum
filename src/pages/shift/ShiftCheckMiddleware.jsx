import React, { useState, useEffect } from "react";
import { Spin, message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { checkRemainingShift } from "@/services/giaoCaService";

const API_BASE = "http://localhost:8080/api";

// ROUTES THAT DO NOT REQUIRE AN ACTIVE SHIFT
// Only authentication and shift management routes are excluded
const EXCLUDED_ROUTES = [
  "/admin/changeShifts", // Giao ca management - access to start/end shift
  "/login",
  "/register",
  "/forgotpass",
  "/reset-password",
];

// Routes that require ACTIVE SHIFT (all other /admin/* routes)
// Employees WITHOUT active shift will be redirected to /admin/changeShifts
const ADMIN_ROUTES_REQUIRE_SHIFT = [
  "/admin/sell",
  "/admin/bill",
  "/admin/product",
  "/admin/category",
  "/admin/collection",
  "/admin/warehouse",
  "/admin/discount",
  "/admin/user",
  "/admin/customer",
  "/admin/promo",
  "/admin/statistical",
  "/admin/chatbot",
  "/admin/dateWork",
];

const ShiftCheckMiddleware = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const getCurrentUser = () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (userId) return { id: parseInt(userId, 10) };
      return null;
    } catch (e) {
      return null;
    }
  };

  const checkActiveShift = async () => {
    console.log("🔍 Kiểm tra giao ca cho route:", location.pathname);

    // 1. If currently on an excluded route -> Allow immediately
    if (EXCLUDED_ROUTES.some((route) => location.pathname.startsWith(route))) {
      console.log("✅ Route excluded - Cho phép");
      setIsChecking(false);
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log("❌ Không có user - Chuyển hướng login");
      navigate("/login");
      return;
    }

    // 2. If user is Admin/Manager -> Allow immediately (Full Access)
    const userRole = (localStorage.getItem("user_role") || "")
      .toString()
      .trim()
      .toLowerCase();
    if (
      userRole === "quản lý" ||
      userRole === "admin" ||
      userRole.includes("quản lý")
    ) {
      console.log("✅ Admin/Quản lý - Cho phép truy cập toàn bộ");
      setIsChecking(false);
      return;
    }

    console.log("📋 User role:", userRole, "| User ID:", currentUser.id);

    // 3. For employees, check localStorage first (cached shift status + verify ownership)
    const cachedShiftStatus = localStorage.getItem("giao_ca_status");
    const cachedShiftInfo = localStorage.getItem("giao_ca_info");
    console.log("💾 Cached shift status:", cachedShiftStatus);

    // 3.5. Double-check via API to verify shift status is still valid (especially after end shift)
    // This prevents stale cache after shift completion
    if (cachedShiftStatus === "inactive") {
      console.log("🔄 Cached status is inactive, re-verify via API...");
      try {
        const verifyResult = await checkRemainingShift();
        if (verifyResult.hasShift) {
          console.log("✅ API verification: Nhân viên có ca, cập nhật cache");
          setIsChecking(false);
          return;
        } else {
          console.log("❌ API verification: Nhân viên không có ca");
          // Continue to block access
        }
      } catch (e) {
        console.warn("⚠️ Lỗi khi verify shift:", e);
      }
    }

    if (cachedShiftStatus === "active" && cachedShiftInfo) {
      try {
        const shiftData = JSON.parse(cachedShiftInfo);
        // Verify that this shift belongs to current employee
        // Try common field names: idNhanVien, nhanVienId, id_nhan_vien
        const shiftEmployeeId =
          shiftData.idNhanVien ||
          shiftData.nhanVienId ||
          shiftData.id_nhan_vien;

        if (
          shiftEmployeeId &&
          String(shiftEmployeeId) === String(currentUser.id)
        ) {
          console.log(
            "✅ Nhân viên có giao ca đang hoạt động (cached) + ownership verified - Cho phép"
          );
          setIsChecking(false);
          return;
        } else {
          console.log(
            "⚠️ Giao ca tồn tại nhưng không thuộc nhân viên hiện tại (cached:",
            shiftEmployeeId,
            "vs current:",
            currentUser.id,
            ")"
          );
          localStorage.setItem("giao_ca_status", "inactive");
        }
      } catch (e) {
        console.warn("⚠️ Lỗi parse cached shift info:", e);
        localStorage.setItem("giao_ca_status", "inactive");
      }
    }

    // 4. Check for Active Shift via existing API GET /giao-ca (returns list for current user)
    try {
      console.log("🌐 Gọi API GET /giao-ca để lấy danh sách giao ca của user");
      const response = await fetch(`${API_BASE}/giao-ca`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        console.log("📦 API trả về danh sách giao ca (count):", list.length);

        // Find active shift that belongs to current user
        const activeShift = list.find((gc) => {
          if (!gc) return false;
          // Check if shift is active (no thoiGianKetThuc and not completed)
          const isActive = !gc.thoiGianKetThuc && gc.isCompleted !== true;
          if (!isActive) return false;

          // Verify shift belongs to current employee (try common field names)
          const shiftEmployeeId =
            gc.idNhanVien || gc.nhanVienId || gc.id_nhan_vien;
          return (
            shiftEmployeeId &&
            String(shiftEmployeeId) === String(currentUser.id)
          );
        });

        if (activeShift) {
          console.log(
            "✅ Nhân viên có giao ca đang hoạt động + ownership verified (API) - Cho phép"
          );
          localStorage.setItem("giao_ca_status", "active");
          localStorage.setItem("giao_ca_info", JSON.stringify(activeShift));
          setIsChecking(false);
          return;
        } else {
          console.log(
            "❌ Nhân viên không có giao ca hoạt động hoặc không sở hữu ca này (API) - Chuyển hướng"
          );
          localStorage.setItem("giao_ca_status", "inactive");
          message.error({
            content:
              "⚠️ Bạn không có ca làm việc đang hoạt động. Vui lòng bắt đầu ca làm việc trước.",
            duration: 3,
            icon: <ExclamationCircleOutlined />,
          });
          setIsChecking(false);
          setTimeout(() => navigate("/admin/changeShifts"), 500);
          return;
        }
      } else {
        console.warn(
          "⚠️ API /giao-ca lỗi (status:",
          response.status,
          "), kiểm tra cache"
        );
        if (cachedShiftStatus === "active") {
          console.log("✅ Dùng cached shift status - Cho phép");
          setIsChecking(false);
          return;
        } else {
          console.log("❌ Không có cached shift, chuyển hướng");
          message.error({
            content:
              "⚠️ Bạn không có ca làm việc đang hoạt động. Vui lòng bắt đầu ca làm việc trước.",
            duration: 3,
            icon: <ExclamationCircleOutlined />,
          });
          setIsChecking(false);
          setTimeout(() => navigate("/admin/changeShifts"), 500);
          return;
        }
      }
    } catch (error) {
      console.error("Shift check error:", error);
      // Network Error -> Use cache or redirect
      if (cachedShiftStatus === "active") {
        console.log("✅ Network lỗi, dùng cached shift - Cho phép");
        setIsChecking(false);
        return;
      } else {
        console.log("❌ Network lỗi, chuyển hướng");
        message.error({
          content:
            "⚠️ Lỗi kết nối. Không thể kiểm tra ca làm việc. Vui lòng thử lại.",
          duration: 3,
          icon: <ExclamationCircleOutlined />,
        });
        setIsChecking(false);
        setTimeout(() => navigate("/admin/changeShifts"), 500);
        return;
      }
    }
  };

  useEffect(() => {
    checkActiveShift();
  }, [location.pathname, navigate]);

  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Đang kiểm tra ca làm việc..." />
      </div>
    );
  }

  return <>{children}</>;
};

export default ShiftCheckMiddleware;
