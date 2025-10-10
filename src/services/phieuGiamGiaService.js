import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchPhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia",
  async () => {
    try {
      const response = await baseUrl.get(`phieu-giam-gia`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
    }
  }
);

export const addPhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia/add",
  async (nhanvien) => {
    const response = await baseUrl.post("phieu-giam-gia/add", nhanvien);
    return response.data;
  }
);

export const updatePhieuGiamGia = createAsyncThunk(
  "nhan-vien/update",
  async ({ id, nhanvien }) => {
    const response = await baseUrl.put(`phieu-giam-gia/update/${id}`, nhanvien);

    return response.data;
  }
);

export const deletePhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia/id",
  async (id) => {
    await baseUrl.delete(`phieu-giam-gia/delete/${id}`);
    return id;
  }
);

export const changeStatusPhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia/update-trang-thai/id",
  async (id) => {
    await baseUrl.put(`phieu-giam-gia/update-trang-thai/${id}`);

    return id;
  }
);

export const searchPGG = createAsyncThunk(
  "phieu-giam-gia/search-all",
  async (keyword) => {
    await baseUrl.get(`phieu-giam-gia/search-all?keyword=${keyword}`);
    return keyword;
  }
);

export const searchTheoNgay = createAsyncThunk(
  "phieu-giam-gia/search-by-date",
  async (ngayBatDau, ngayKetThuc) => {
    await baseUrl.get(
      `phieu-giam-gia/search-by-date?ngayBatDau=${ngayBatDau}&ngayKetThuc=${ngayKetThuc}`
    );
    return ngayBatDau, ngayKetThuc;
  }
);
