import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAllKhachHang = createAsyncThunk("khach-hang", async () => {
  try {
    const response = await baseUrl.get(`khach-hang`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
  }
});
