import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchPhuongThuc = createAsyncThunk(
    "phuong-thuc-thanh-toan",
    async (
    ) => {
        try {
            const response = await baseUrl.get(`phuong-thuc-thanh-toan`);
            return response.data; // Trả về dữ liệu từ API
        } catch (error) {
            throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
        }
    }
);


