import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAllGGKH = createAsyncThunk(
    "giam-gia-khach-hang",
    async (
    ) => {
        try {
            const response = await baseUrl.get(`giam-gia-khach-hang`);
            return response.data; // Trả về dữ liệu từ API
        } catch (error) {
            throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
        }
    }
);


