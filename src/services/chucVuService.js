import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAllChucVu = createAsyncThunk(
    "chuc-vu",
    async (
    ) => {
        try {
            const response = await baseUrl.get(`chuc-vu`);
            return response.data; // Trả về dữ liệu từ API
        } catch (error) {
            throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
        }
    }
);


