import React, { useState, useEffect, useRef } from "react";
import { Spin, message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useShift } from "@/contexts/ShiftContext";

// ROUTES THAT DO NOT REQUIRE AN ACTIVE SHIFT
// Only authentication and shift management routes are excluded
const EXCLUDED_ROUTES = [
  "/admin/changeShifts", // Giao ca management - access to start/end shift
  "/login",
  "/register",
  "/forgotpass",
  "/reset-password",
];

const ShiftCheckMiddleware = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAllowed, setIsAllowed] = useState(null);
  const hasRedirected = useRef(false);
  
  // Use the ShiftContext for real-time shift status
  const { 
    shiftStatus, 
    isShiftActive, 
    isAdmin, 
    isChecking: contextIsChecking,
    refreshShiftStatus,
    shiftTimeExpired 
  } = useShift();

  // Check if current route is excluded
  const isExcludedRoute = EXCLUDED_ROUTES.some((route) => 
    location.pathname.startsWith(route)
  );

  // Reset redirect flag when navigating to changeShifts
  useEffect(() => {
    if (location.pathname.startsWith("/admin/changeShifts")) {
      hasRedirected.current = false;
    }
  }, [location.pathname]);

  // Main effect: React to shift status changes in real-time
  useEffect(() => {
    console.log("🔍 [ShiftCheckMiddleware] Checking access for:", location.pathname);
    console.log("📊 [ShiftCheckMiddleware] Shift status:", shiftStatus, "| isAdmin:", isAdmin);

    // 1. If on excluded route -> Allow
    if (isExcludedRoute) {
      console.log("✅ [ShiftCheckMiddleware] Excluded route - Allowed");
      setIsAllowed(true);
      return;
    }

    // 2. Check if user is logged in
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      console.log("❌ [ShiftCheckMiddleware] No user - Redirecting to login");
      setIsAllowed(false);
      navigate("/login");
      return;
    }

    // 3. If admin -> Always allow
    if (isAdmin) {
      console.log("✅ [ShiftCheckMiddleware] Admin user - Full access");
      setIsAllowed(true);
      return;
    }

    // 4. Wait for context to finish checking
    if (contextIsChecking) {
      console.log("⏳ [ShiftCheckMiddleware] Waiting for shift check...");
      setIsAllowed(null); // Loading state
      return;
    }

    // 5. For employees: Check shift status (including time expiration)
    if (isShiftActive && !shiftTimeExpired) {
      console.log("✅ [ShiftCheckMiddleware] Employee has active shift - Allowed");
      setIsAllowed(true);
      hasRedirected.current = false;
    } else {
      const reason = shiftTimeExpired 
        ? "Shift time expired" 
        : "No active shift";
      console.log(`❌ [ShiftCheckMiddleware] Employee blocked - ${reason}`);
      setIsAllowed(false);
      
      // Only show message and redirect once to prevent spam
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        const errorMessage = shiftTimeExpired
          ? "⏰ Thời gian ca làm việc của bạn đã hết. Vui lòng hoàn tất bàn giao ca!"
          : "⚠️ Bạn không có ca làm việc đang hoạt động. Vui lòng bắt đầu ca làm việc trước.";
        message.error({
          content: errorMessage,
          duration: 3,
          icon: <ExclamationCircleOutlined />,
        });
        setTimeout(() => navigate("/admin/changeShifts"), 500);
      }
    }
  }, [
    location.pathname, 
    shiftStatus, 
    isShiftActive, 
    isAdmin, 
    contextIsChecking, 
    isExcludedRoute, 
    navigate,
    shiftTimeExpired
  ]);

  // Refresh shift status when route changes (additional check)
  useEffect(() => {
    if (!isExcludedRoute && !isAdmin) {
      refreshShiftStatus();
    }
  }, [location.pathname]);

  // Loading state
  if (isAllowed === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Đang kiểm tra ca làm việc..." />
      </div>
    );
  }

  // Blocked state - show loading while redirecting
  if (isAllowed === false) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Đang chuyển hướng..." />
      </div>
    );
  }

  return <>{children}</>;
};

export default ShiftCheckMiddleware;
