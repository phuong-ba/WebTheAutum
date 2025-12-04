import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "./authService";

export const fetchCaDangHoatDong = createAsyncThunk(
  "giaoCa/fetchCurrent",
  async (nhanVienId, { rejectWithValue }) => {
    try {
      // Call the correct API endpoint that returns list of shifts for current user
      const response = await baseUrl.get("giao-ca");

      let data = response.data || [];
      const list = Array.isArray(data) ? data : [];
      console.log("📊 Lấy danh sách giao ca, count:", list.length);

      // Find the first active shift (no thoiGianKetThuc or isCompleted !== true)
      const activeShift = list.find(
        (gc) => gc && (!gc.thoiGianKetThuc || gc.isCompleted !== true)
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

    // Find active shift (no thoiGianKetThuc and not completed)
    const activeShift = list.find(
      (gc) => gc && !gc.thoiGianKetThuc && gc.isCompleted !== true
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
