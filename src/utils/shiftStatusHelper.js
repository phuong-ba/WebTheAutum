/**
 * Utility helper để quản lý trạng thái ca làm việc
 * Giúp kiểm tra xem nhân viên có ca hoạt động hay không
 */

// Lấy trạng thái ca hiện tại
export const getShiftStatus = () => {
  return localStorage.getItem("giao_ca_status") || "inactive";
};

// Kiểm tra xem nhân viên có ca đang hoạt động không
export const isShiftActive = () => {
  return localStorage.getItem("giao_ca_status") === "active";
};

// Kiểm tra xem nhân viên kết thúc ca hay không
export const isShiftEnded = () => {
  return localStorage.getItem("giao_ca_status") === "inactive";
};

// Lấy thông tin ca hiện tại
export const getShiftInfo = () => {
  const shiftData = localStorage.getItem("giao_ca_info");
  return shiftData ? JSON.parse(shiftData) : null;
};

// Cập nhật trạng thái ca
export const setShiftStatus = (status) => {
  localStorage.setItem("giao_ca_status", status);
};

// Xóa thông tin ca
export const clearShiftStatus = () => {
  localStorage.removeItem("giao_ca_info");
  localStorage.removeItem("giao_ca_status");
};

// Log trạng thái ca (dùng để debug)
export const logShiftStatus = () => {
  const status = getShiftStatus();
  const info = getShiftInfo();
  console.log("📊 Shift Status Debug:");
  console.log("- Status:", status);
  console.log("- Info:", info);
  console.log("- IsActive:", isShiftActive());
  console.log("- IsEnded:", isShiftEnded());
};

/**
 * Kiểm tra xem nhân viên có thể sử dụng một chức năng hay không
 * Một số chức năng chỉ được sử dụng khi có ca hoạt động
 * @param {string} featureName - Tên chức năng (ví dụ: "sell", "bill", "inventory")
 * @returns {object} { canAccess: boolean, message: string }
 */
export const checkFeatureAccess = (featureName) => {
  const status = getShiftStatus();
  const shiftInfo = getShiftInfo();

  // Nếu ca đã kết thúc, không cho phép
  if (status === "inactive") {
    return {
      canAccess: false,
      message: `❌ Không thể sử dụng "${featureName}". Bạn cần bắt đầu ca làm việc trước.`,
      type: "no_shift",
    };
  }

  // Nếu có ca đang hoạt động, cho phép
  if (status === "active" && shiftInfo) {
    return {
      canAccess: true,
      message: `✅ Bạn có ca hoạt động. Có thể sử dụng "${featureName}".`,
      type: "active",
    };
  }

  // Trạng thái không xác định
  return {
    canAccess: false,
    message: `⚠️ Không thể xác định trạng thái ca. Vui lòng tải lại trang.`,
    type: "unknown",
  };
};

/**
 * Format thông tin ca để hiển thị
 */
export const formatShiftInfo = (shiftInfo) => {
  if (!shiftInfo) return null;

  return {
    id: shiftInfo.id,
    startTime: shiftInfo.thoiGianBatDau,
    endTime: shiftInfo.thoiGianKetThuc,
    initialCash: shiftInfo.soTienBatDau,
    finalCash: shiftInfo.soTienKetThuc,
    employeeId: shiftInfo.idNhanVien || shiftInfo.nhanVienId,
    notes: shiftInfo.ghiChu,
  };
};

/**
 * Cảnh báo khi kết thúc ca - kiểm tra xem nhân viên có ca tiếp theo không
 * Sử dụng checkRemainingShift từ giaoCaService
 */
export const createEndShiftWarning = (hasRemainingShift) => {
  if (hasRemainingShift) {
    return {
      type: "info",
      message:
        "ℹ️ Bạn có ca làm việc tiếp theo. Nhấn F5 hoặc tải lại để xem thông tin ca mới.",
    };
  } else {
    return {
      type: "warning",
      message:
        "⚠️ Bạn không có ca làm việc nào khác. Vui lòng liên hệ quản lý để được sắp xếp ca làm.",
    };
  }
};
