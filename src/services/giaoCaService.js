import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchCaDangHoatDong = createAsyncThunk(
  "giaoCa/fetchCurrent",
  async (nhanVienId, { rejectWithValue }) => {
    try {
      const response = await baseUrl.get(`giao-ca/dang-hoat-dong/${nhanVienId}`);
      return response.data; // có thể là null hoặc object GiaoCa
    } catch (error) {
      return rejectWithValue(error.response?.data || "Lỗi kiểm tra ca");
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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Không thể kết thúc ca");
    }
  }
);
