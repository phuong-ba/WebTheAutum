import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMauSac = createAsyncThunk("mau-sac", async () => {
  try {
    const response = await baseUrl.get(`mau-sac/playlist`);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
  }
});

export const addMauSac = createAsyncThunk(
  "mau-sac/add",
  async (mauSac) => {
    const response = await baseUrl.post("mau-sac/add", mauSac);
    return response.data;
  }
);

export const updateMauSac = createAsyncThunk(
  "mau-sac/update",
  async ({ id, mauSac }) => {
    const response = await baseUrl.put(`mau-sac/update/${id}`, mauSac);
    return response.data;
  }
);

export const deleteNhanVien = createAsyncThunk("mau-sac/id", async (id) => {
  await baseUrl.delete(`mau-sac/delete/${id}`);
  return id;
});

