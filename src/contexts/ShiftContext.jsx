import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { message, Modal } from "antd";
import {
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  fetchTodayAssignedShift,
  isShiftTimeExpired,
  getShiftRemainingTime,
} from "@/services/giaoCaService";

const API_BASE = "http://localhost:8080/api";

// Polling interval in milliseconds (check every 5 seconds)
const SHIFT_CHECK_INTERVAL = 5000;

// Check shift time every minute
const SHIFT_TIME_CHECK_INTERVAL = 60000;

// Warning threshold in minutes (warn when 5 minutes remaining)
const SHIFT_END_WARNING_MINUTES = 5;

const ShiftContext = createContext(null);

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
};

export const ShiftProvider = ({ children }) => {
  const [shiftStatus, setShiftStatus] = useState(() => {
    return localStorage.getItem("giao_ca_status") || "inactive";
  });

  const [shiftInfo, setShiftInfo] = useState(() => {
    const cached = localStorage.getItem("giao_ca_info");
    return cached ? JSON.parse(cached) : null;
  });

  const [isChecking, setIsChecking] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Scheduled shift info (from phanCa + caLamViec)
  const [scheduledShiftInfo, setScheduledShiftInfo] = useState(null);
  const [shiftTimeExpired, setShiftTimeExpired] = useState(false);
  const [shiftEndWarningShown, setShiftEndWarningShown] = useState(false);

  const autoEndTriggeredRef = useRef(false);

  // Get current user from localStorage
  const getCurrentUser = useCallback(() => {
    try {
      const userId = localStorage.getItem("user_id");
      if (userId) return { id: parseInt(userId, 10) };
      return null;
    } catch (e) {
      return null;
    }
  }, []);

  // Check if user is admin/manager
  const isAdmin = useCallback(() => {
    const userRole = (localStorage.getItem("user_role") || "")
      .toString()
      .trim()
      .toLowerCase();
    return (
      userRole === "quản lý" ||
      userRole === "admin" ||
      userRole.includes("quản lý")
    );
  }, []);

  // Fetch today's scheduled shift info
  const fetchScheduledShiftInfo = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || isAdmin()) return;

    try {
      const assignedShift = await fetchTodayAssignedShift(currentUser.id);
      if (assignedShift) {
        console.log(
          "📅 [ShiftContext] Today's scheduled shift:",
          assignedShift
        );
        setScheduledShiftInfo(assignedShift);

        // Check if shift time is already expired
        if (
          assignedShift.gioKetThuc &&
          isShiftTimeExpired(assignedShift.gioKetThuc)
        ) {
          console.log("⏰ [ShiftContext] Shift time has already expired!");
          setShiftTimeExpired(true);
        }
      } else {
        setScheduledShiftInfo(null);
      }
    } catch (error) {
      console.error("⚠️ [ShiftContext] Error fetching scheduled shift:", error);
    }
  }, [getCurrentUser, isAdmin]);

  // Check if shift time has expired and handle auto-end
  const checkShiftTimeExpiration = useCallback(() => {
    if (
      !scheduledShiftInfo?.gioKetThuc ||
      isAdmin() ||
      autoEndTriggeredRef.current
    ) {
      return;
    }

    const remainingMinutes = getShiftRemainingTime(
      scheduledShiftInfo.gioKetThuc
    );
    console.log(
      `⏰ [ShiftContext] Remaining time: ${remainingMinutes} minutes`
    );

    // Show warning when approaching shift end (5 minutes remaining)
    if (
      remainingMinutes !== null &&
      remainingMinutes > 0 &&
      remainingMinutes <= SHIFT_END_WARNING_MINUTES &&
      !shiftEndWarningShown
    ) {
      setShiftEndWarningShown(true);
      message.warning({
        content: `⏰ Ca làm việc của bạn sẽ kết thúc trong ${remainingMinutes} phút. Vui lòng chuẩn bị bàn giao ca!`,
        duration: 10,
        icon: <ClockCircleOutlined />,
      });
    }

    // Check if shift time has expired
    if (isShiftTimeExpired(scheduledShiftInfo.gioKetThuc)) {
      console.log(
        "⏰ [ShiftContext] Shift time EXPIRED! Triggering auto-end..."
      );
      setShiftTimeExpired(true);

      // Only trigger auto-end once
      if (!autoEndTriggeredRef.current && shiftStatus === "active") {
        autoEndTriggeredRef.current = true;

        // Handle automatic shift end
        console.log(
          "🔴 [ShiftContext] Auto-ending shift due to time expiration..."
        );

        // Show modal notification and redirect to shift handover page
        Modal.warning({
          title: "⏰ Ca làm việc đã hết thời gian!",
          content: (
            <div>
              <p>Thời gian ca làm việc của bạn đã kết thúc.</p>
              <p>
                <strong>
                  Ca của bạn kết thúc lúc: {scheduledShiftInfo?.gioKetThuc}
                </strong>
              </p>
              <p>
                Bạn sẽ được chuyển đến trang giao ca để hoàn tất thủ tục bàn
                giao.
              </p>
            </div>
          ),
          okText: "Đến trang giao ca",
          centered: true,
          onOk: () => {
            // Redirect to shift handover page
            window.location.href = "/admin/changeShifts";
          },
          onCancel: () => {
            // Even if user closes modal, still redirect after a short delay
            setTimeout(() => {
              window.location.href = "/admin/changeShifts";
            }, 2000);
          },
        });
      }
    }
  }, [scheduledShiftInfo, isAdmin, shiftEndWarningShown, shiftStatus]);

  // Main shift check function
  const checkShiftStatus = useCallback(
    async (showMessage = false) => {
      const currentUser = getCurrentUser();

      // No user logged in
      if (!currentUser) {
        setShiftStatus("inactive");
        setShiftInfo(null);
        setIsChecking(false);
        return { hasShift: false, shift: null };
      }

      // Admin always has access
      if (isAdmin()) {
        setShiftStatus("admin");
        setIsChecking(false);
        return { hasShift: true, isAdmin: true };
      }

      try {
        console.log("🔄 [ShiftContext] Polling shift status...");
        const response = await fetch(`${API_BASE}/giao-ca`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];

          // Find active shift that belongs to current user
          const activeShift = list.find((gc) => {
            if (!gc) return false;

            const isActive = !gc.thoiGianKetThuc && gc.isCompleted !== true;
            if (!isActive) return false;

            const shiftEmployeeId =
              gc.idNhanVien || gc.nhanVienId || gc.id_nhan_vien;
            return (
              shiftEmployeeId &&
              String(shiftEmployeeId) === String(currentUser.id)
            );
          });

          if (activeShift) {
            console.log(
              "✅ [ShiftContext] Active shift found:",
              activeShift.id
            );
            setShiftStatus("active");
            setShiftInfo(activeShift);
            localStorage.setItem("giao_ca_status", "active");
            localStorage.setItem("giao_ca_info", JSON.stringify(activeShift));
            setIsChecking(false);
            setLastCheckTime(new Date());
            return { hasShift: true, shift: activeShift };
          } else {
            console.log("❌ [ShiftContext] No active shift found");

            // Check if shift was previously active (shift just ended)
            const previousStatus = shiftStatus;
            setShiftStatus("inactive");
            setShiftInfo(null);
            localStorage.setItem("giao_ca_status", "inactive");
            localStorage.removeItem("giao_ca_info");
            setIsChecking(false);
            setLastCheckTime(new Date());

            // Show message only if shift just ended (transition from active to inactive)
            if (previousStatus === "active" && showMessage) {
              message.warning({
                content:
                  "⚠️ Ca làm việc của bạn đã kết thúc. Bạn sẽ không thể thao tác cho đến khi bắt đầu ca mới.",
                duration: 5,
                icon: <ExclamationCircleOutlined />,
              });
            }

            return { hasShift: false, shift: null };
          }
        } else {
          console.warn("⚠️ [ShiftContext] API error:", response.status);
          setIsChecking(false);
          // Keep current state on API error
          return { hasShift: shiftStatus === "active", shift: shiftInfo };
        }
      } catch (error) {
        console.error("❌ [ShiftContext] Shift check error:", error);
        setIsChecking(false);
        // Keep current state on network error
        return { hasShift: shiftStatus === "active", shift: shiftInfo };
      }
    },
    [getCurrentUser, isAdmin, shiftStatus, shiftInfo]
  );

  // Manual refresh function
  const refreshShiftStatus = useCallback(async () => {
    setIsChecking(true);
    return await checkShiftStatus(true);
  }, [checkShiftStatus]);

  // Clear shift (called after ending shift)
  const clearShift = useCallback(() => {
    console.log("🗑️ [ShiftContext] Clearing shift info");
    setShiftStatus("inactive");
    setShiftInfo(null);
    localStorage.setItem("giao_ca_status", "inactive");
    localStorage.removeItem("giao_ca_info");
  }, []);

  // Set shift (called after starting shift)
  const setActiveShift = useCallback((shift) => {
    console.log("✅ [ShiftContext] Setting active shift:", shift?.id);
    setShiftStatus("active");
    setShiftInfo(shift);
    localStorage.setItem("giao_ca_status", "active");
    localStorage.setItem("giao_ca_info", JSON.stringify(shift));
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkShiftStatus(false);
  }, []);

  // Fetch scheduled shift info on mount and when shift status changes
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && !isAdmin() && shiftStatus === "active") {
      fetchScheduledShiftInfo();
      // Reset auto-end triggered flag when new shift starts
      autoEndTriggeredRef.current = false;
      setShiftEndWarningShown(false);
      setShiftTimeExpired(false);
    }
  }, [shiftStatus, getCurrentUser, isAdmin, fetchScheduledShiftInfo]);

  // Periodic check for shift time expiration
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (
      !currentUser ||
      isAdmin() ||
      shiftStatus !== "active" ||
      !scheduledShiftInfo?.gioKetThuc
    ) {
      return;
    }

    console.log("⏰ [ShiftContext] Starting shift time expiration check...");

    // Check immediately
    checkShiftTimeExpiration();

    // Then check every minute
    const intervalId = setInterval(() => {
      checkShiftTimeExpiration();
    }, SHIFT_TIME_CHECK_INTERVAL);

    return () => {
      console.log("⏹️ [ShiftContext] Stopping shift time expiration check");
      clearInterval(intervalId);
    };
  }, [
    getCurrentUser,
    isAdmin,
    shiftStatus,
    scheduledShiftInfo,
    checkShiftTimeExpiration,
  ]);

  // Periodic polling for shift status
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || isAdmin()) {
      return; // No need to poll for non-users or admins
    }

    console.log("🔄 [ShiftContext] Starting periodic shift check...");

    const intervalId = setInterval(() => {
      checkShiftStatus(true); // Show message on status change
    }, SHIFT_CHECK_INTERVAL);

    return () => {
      console.log("⏹️ [ShiftContext] Stopping periodic shift check");
      clearInterval(intervalId);
    };
  }, [getCurrentUser, isAdmin, checkShiftStatus]);

  // Listen for localStorage changes (from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "giao_ca_status") {
        console.log(
          "📢 [ShiftContext] localStorage change detected:",
          e.newValue
        );
        setShiftStatus(e.newValue || "inactive");
        if (e.newValue !== "active") {
          setShiftInfo(null);
        }
      }
      if (e.key === "giao_ca_info") {
        try {
          setShiftInfo(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (err) {
          setShiftInfo(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = {
    shiftStatus,
    shiftInfo,
    isChecking,
    isShiftActive:
      (shiftStatus === "active" || shiftStatus === "admin") &&
      !shiftTimeExpired,
    isAdmin: isAdmin(),
    lastCheckTime,
    refreshShiftStatus,
    clearShift,
    setActiveShift,
    checkShiftStatus,
    // Scheduled shift info
    scheduledShiftInfo,
    shiftTimeExpired,
    fetchScheduledShiftInfo,
  };

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
};

export default ShiftContext;
