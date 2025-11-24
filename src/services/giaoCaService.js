import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const startGiaoCa = createAsyncThunk(
  "giao-ca/start",
  async ({ idNhanVien, soTienBatDau }, { rejectWithValue }) => {
    try {
      const response = await baseUrl.post("giao-ca/start", {
        idNhanVien,
        soTienBatDau,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Lỗi khi bắt đầu ca làm"
      );
    }
  }
);

export const endGiaoCa = createAsyncThunk(
  "giao-ca/end",
  async ({ idGiaoCa, soTienKetThuc, tongDoanhThu, ghiChu }, { rejectWithValue }) => {
    try {
      const response = await baseUrl.put(`giao-ca/end/${idGiaoCa}`, {
        soTienKetThuc,
        tongDoanhThu,
        ghiChu,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Lỗi khi kết thúc ca làm"
      );
    }
  }
);
