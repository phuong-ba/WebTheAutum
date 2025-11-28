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


export const fetchSanPhamDetail = createAsyncThunk(
  "sanPham/fetchDetail",
  async (id, { rejectWithValue }) => {
    try {
      const res = await baseUrl.get(`/san-pham/${id}/detail`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Lỗi khi lấy chi tiết sản phẩm");
    }
  }
);


export const fetchDanhMuc = createAsyncThunk("san-pham/danh-muc", async () => {
  try {
    const response = await baseUrl.get(`san-pham/danh-muc/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
  }
});

export const fetchBanChay = createAsyncThunk("san-pham/ban-chay", async () => {
  try {
    const response = await baseUrl.get(`san-pham/ban-chay`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
  }
});

