import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchSanPham = createAsyncThunk("san-pham", async () => {
  try {
    const response = await baseUrl.get(`san-pham`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
  }
});
