import { createAsyncThunk } from "@reduxjs/toolkit";
import baseUrl from "@/api/instance";

export const fetchChiTietSanPham = createAsyncThunk(
  "chi-tiet-san-pham",
  async () => {
    try {
      const response = await baseUrl.get(`chi-tiet-san-pham`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
    }
  }
);

export const getChiTietSanPhamBySanPham = createAsyncThunk(
  "chi-tiet-san-pham/get-by-san-pham",
  async (idSanPham) => {
    const response = await baseUrl.get(
      `chi-tiet-san-pham/by-san-pham/${idSanPham}`
    );
    return response.data;
  }
);