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

export const giamSoLuong = createAsyncThunk(
  "chiTietSanPham/giamSoLuong",
  async ({ id, soLuong }, { rejectWithValue }) => {
    try {
      const response = await baseUrl.put(`chi-tiet-san-pham/giam-so-luong/${id}?soLuong=${soLuong}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Lỗi khi giảm số lượng sản phẩm"
      );
    }
  }
);

export const tangSoLuong = createAsyncThunk(
  "chiTietSanPham/tangSoLuong",
  async ({ id, soLuong }, { rejectWithValue }) => {
    try {
      const response = await baseUrl.put(`chi-tiet-san-pham/tang-so-luong/${id}?soLuong=${soLuong}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Lỗi khi tăng số lượng sản phẩm"
      );
    }
  }
);