import { createAsyncThunk } from "@reduxjs/toolkit";
import baseUrl from "@/api/instance";

export const fetchChiTietSanPham = createAsyncThunk(
  "chiTietSanPham/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await baseUrl.get(`chi-tiet-san-pham`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu");
    }
  }
);

export const getChiTietSanPhamBySanPham = createAsyncThunk(
  "chiTietSanPham/getBySanPham",
  async (idSanPham, { rejectWithValue }) => {
    try {
      const response = await baseUrl.get(`chi-tiet-san-pham/by-san-pham/${idSanPham}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu");
    }
  }
);