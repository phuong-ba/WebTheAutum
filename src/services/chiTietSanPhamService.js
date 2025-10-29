import { createAsyncThunk } from "@reduxjs/toolkit";
import baseUrl from "@/api/instance";

export const getChiTietSanPhamBySanPham = createAsyncThunk(
  "chi-tiet-san-pham/get-by-san-pham",
  async (idSanPham) => {
    const response = await baseUrl.get(
      `chi-tiet-san-pham/by-san-pham/${idSanPham}`
    );
    return response.data;
  }
);
