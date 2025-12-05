import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "./authService";

// Fetch today's assigned shift for an employee (phanCa)
export const fetchTodayAssignedShift = async (nhanVienId) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    console.log("📅 Fetching assigned shift for:", nhanVienId, "on date:", today);
    
    // Get all phanCa (shift assignments)
    const phanCaResponse = await baseUrl.get("phan-ca");
    const phanCaList = Array.isArray(phanCaResponse.data) ? phanCaResponse.data : [];
    
    // Find today's assignment for this employee
    const todayAssignment = phanCaList.find(
      (pc) => pc && 
      String(pc.idNhanVien) === String(nhanVienId) &&
      pc.ngayPhanCa === today
    );
    
    if (!todayAssignment) {
      console.log("❌ No assigned shift found for today");
      return null;
    }
    
    console.log("✅ Found today's assignment:", todayAssignment);
    
    // Get shift definition (caLamViec) to get the scheduled end time
    const caLamViecResponse = await baseUrl.get("ca-lam-viec");
    const caLamViecList = Array.isArray(caLamViecResponse.data) ? caLamViecResponse.data : [];
    
    const shiftDefinition = caLamViecList.find(
      (ca) => ca && String(ca.id) === String(todayAssignment.idCaLamViec)
    );
    
    if (!shiftDefinition) {
      console.log("⚠️ Shift definition not found for id:", todayAssignment.idCaLamViec);
      return todayAssignment;
    }
    
    console.log("📊 Shift definition:", shiftDefinition);
    
    // Combine assignment with shift definition
    return {
      ...todayAssignment,
      tenCa: shiftDefinition.tenCa,
      gioBatDau: shiftDefinition.gioBatDau, // e.g., "07:00"
      gioKetThuc: shiftDefinition.gioKetThuc, // e.g., "12:00"
      moTaCa: shiftDefinition.moTa
    };
  } catch (error) {
    console.error("⚠️ Error fetching today's assigned shift:", error);
    return null;
  }
};

// Check if current time has passed the scheduled shift end time
export const isShiftTimeExpired = (gioKetThuc) => {
  if (!gioKetThuc) return false;
  
  const now = new Date();
  const [endHour, endMinute] = gioKetThuc.split(":").map(Number);
  
  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);
  
  const isExpired = now > endTime;
  console.log(`⏰ Shift end check: Current time ${now.toLocaleTimeString()} vs End time ${gioKetThuc} -> Expired: ${isExpired}`);
  
  return isExpired;
};

// Get remaining time until shift ends (in minutes)
export const getShiftRemainingTime = (gioKetThuc) => {
  if (!gioKetThuc) return null;
  
  const now = new Date();
  const [endHour, endMinute] = gioKetThuc.split(":").map(Number);
  
  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);
  
  const diffMs = endTime - now;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return diffMinutes;
};

export const fetchCaDangHoatDong = createAsyncThunk(
  "giaoCa/fetchCurrent",
  async (nhanVienId, { rejectWithValue }) => {
    try {
      // Call the correct API endpoint that returns list of shifts for current user
      const response = await baseUrl.get("giao-ca");

      let data = response.data || [];
      const list = Array.isArray(data) ? data : [];
      console.log("📊 Lấy danh sách giao ca, count:", list.length);

      // Find the first active shift (no thoiGianKetThuc or isCompleted !== true) for this employee
      const activeShift = list.find(
        (gc) => gc && (!gc.thoiGianKetThuc || gc.isCompleted !== true) &&
        (gc.idNhanVien === nhanVienId || gc.nhanVienId === nhanVienId || gc.id_nhan_vien === nhanVienId)
      );

      if (activeShift) {
        console.log("📊 Tìm thấy giao ca đang hoạt động:", activeShift.id);
        authService.saveShiftInfo(activeShift);
        console.log(
          "💾 Shift status sau save:",
          localStorage.getItem("giao_ca_status")
        );
        return activeShift;
      } else {
        console.log("📊 Không tìm thấy giao ca đang hoạt động");
        authService.clearShiftInfo();
        return null;
      }
    } catch (error) {
      // Nếu lỗi, coi như không có giao ca đang hoạt động
      console.warn("⚠️ Lỗi API khi kiểm tra giao ca:", error.response?.status);
      authService.clearShiftInfo();
      return null;
    }
  }
);

export const startGiaoCa = createAsyncThunk(
  "giaoCa/start",
  async ({ nhanVienId, soTienBatDau, ghiChu = "" }, { rejectWithValue }) => {
    try {
      const response = await baseUrl.post("giao-ca/bat-dau", {
        nhanVienId,
        soTienBatDau: soTienBatDau.replace(/,/g, ""), // gửi dạng String
        ghiChu,
      });
      // Lưu thông tin giao ca vào localStorage
      if (response.data) {
        authService.saveShiftInfo(response.data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Không thể bắt đầu ca");
    }
  }
);

export const endGiaoCa = createAsyncThunk(
  "giaoCa/end",
  async ({ nhanVienId, soTienKetThuc, ghiChu = "" }, { rejectWithValue }) => {
    try {
      const response = await baseUrl.post("giao-ca/ket-thuc", {
        nhanVienId,
        soTienKetThuc: soTienKetThuc.replace(/,/g, ""),
        ghiChu,
      });
      // Clear shift info from localStorage after successful end
      if (response.data) {
        console.log("✅ Kết thúc ca thành công, xóa shift info khỏi cache");
        authService.clearShiftInfo();
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Không thể kết thúc ca");
    }
  }
);

// Hàm kiểm tra xem giao ca có đang hoạt động không
export const isShiftActive = () => {
  return authService.isShiftActive();
};

// Hàm kiểm tra xem giao ca có đã kết thúc không
export const isShiftCompleted = () => {
  const shiftInfo = authService.getShiftInfo();
  return shiftInfo && shiftInfo.isCompleted === true;
};

// Hàm lấy thông tin giao ca hiện tại
export const getCurrentShift = () => {
  return authService.getShiftInfo();
};

// Hàm lấy trạng thái giao ca
export const getShiftStatus = () => {
  return authService.getShiftStatus();
};

// Hàm kiểm tra xem nhân viên có ca làm tiếp theo hay không (gọi sau khi kết thúc ca)
export const checkRemainingShift = async () => {
  try {
    console.log("🔍 Kiểm tra xem nhân viên có ca tiếp theo không...");
    const response = await baseUrl.get("giao-ca");

    let data = response.data || [];
    const list = Array.isArray(data) ? data : [];
    console.log("📋 Danh sách giao ca còn lại:", list.length);

    // Find active shift that belongs to current user (no thoiGianKetThuc and not completed)
    const activeShift = list.find(
      (gc) => gc && !gc.thoiGianKetThuc && gc.isCompleted !== true &&
      (gc.idNhanVien === nhanVienId || gc.nhanVienId === nhanVienId || gc.id_nhan_vien === nhanVienId)
    );

    if (activeShift) {
      console.log("✅ Nhân viên còn ca hoạt động");
      authService.saveShiftInfo(activeShift);
      return { hasShift: true, shift: activeShift };
    } else {
      console.log("❌ Nhân viên không còn ca nào");
      authService.clearShiftInfo();
      localStorage.setItem("giao_ca_status", "inactive");
      return { hasShift: false, shift: null };
    }
  } catch (error) {
    console.error("⚠️ Lỗi khi kiểm tra ca tiếp theo:", error);
    // Assume no shift on error
    authService.clearShiftInfo();
    return { hasShift: false, shift: null, error: true };
  }
};
