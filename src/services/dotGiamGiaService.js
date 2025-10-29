import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchDotGiamGia = createAsyncThunk("dot-giam-gia", async () => {
  try {
    const response = await baseUrl.get(`dot-giam-gia`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
  }
});

export const addDotGiamGia = createAsyncThunk(
  "dot-giam-gia/add",
  async (dotGiamGia) => {
    const response = await baseUrl.post("dot-giam-gia/add", dotGiamGia);
    return response.data;
  }
);

export const updateDotGiamGia = createAsyncThunk(
  "dot-giam-gia/update/id",
  async ({ id, dotGiamGia }) => {
    const response = await baseUrl.put(`dot-giam-gia/update/${id}`, dotGiamGia);

    return response.data;
  }
);

export const changeStatusDotGiamGia = createAsyncThunk(
  "dot-giam-gia/change-status",
  async ({ id, trangThai }) => {
    const response = await baseUrl.put(
      `dot-giam-gia/update-trang-thai/${id}?trangThai=${trangThai}`
    );
    return response.data;
  }
);

export const searchDotGiamGia = createAsyncThunk(
  "dot-giam-gia/search",
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
      const response = await baseUrl.get(`dot-giam-gia/search?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Đã xảy ra lỗi khi tìm kiếm";
    }
  }
);

export const getSanPhamTheoDot = createAsyncThunk(
  "dot-giam-gia/san-pham",
  async (id) => {
    const res = await baseUrl.get(`dot-giam-gia/san-pham/${id}`);
    return res.data;
  }
);
