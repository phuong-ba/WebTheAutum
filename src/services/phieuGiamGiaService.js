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
  async (phieuGiamGia) => {
    const response = await baseUrl.post("phieu-giam-gia/add", phieuGiamGia);
    return response.data;
  }
);

export const updatePhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia/update/id",
  async ({ id, phieuGiamGia }) => {
    const response = await baseUrl.put(
      `phieu-giam-gia/update/${id}`,
      phieuGiamGia
    );

    return response.data;
  }
);

export const getKhachHangTheoPhieuGiam = async (idPhieu) => {
  const response = await baseUrl.get(`phieu-giam-gia/khach-hang/${idPhieu}`);
  return response.data;
};

export const deletePhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia/id",
  async (id) => {
    await baseUrl.delete(`phieu-giam-gia/delete/${id}`);
    return id;
  }
);

export const changeStatusPhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia/change-status",
  async ({ id, trangThai }) => {
    const response = await baseUrl.put(
      `phieu-giam-gia/update-trang-thai/${id}?trangThai=${trangThai}`
    );
    return response.data;
  }
);

export const searchPhieuGiamGia = createAsyncThunk(
  "phieu-giam-gia/search",
  async (params) => {
    try {
      const cleanParams = {};
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== "" &&
          params[key] !== undefined &&
          params[key] !== null
        ) {
          cleanParams[key] = params[key];
        }
      });
      const queryParams = new URLSearchParams(cleanParams).toString();
      const response = await baseUrl.get(
        `phieu-giam-gia/search?${queryParams}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || "Đã xảy ra lỗi khi tìm kiếm";
    }
  }
);
