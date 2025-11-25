import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const tinhPhiVanChuyen = createAsyncThunk(
    "van-chuyen/tinh-phi",
    async (requestData) => {
        try {
            const response = await baseUrl.post(`van-chuyen/tinh-phi`, requestData);
            return response.data;
        } catch (error) {
            throw error.response?.data || "Đã xảy ra lỗi khi tính phí vận chuyển";
        }
    }
);

export const fetchDonViVanChuyen = createAsyncThunk(
    "van-chuyen/don-vi",
    async () => {
        try {
            const response = await baseUrl.get(`van-chuyen/don-vi-van-chuyen`);
            return response.data;
        } catch (error) {
            throw error.response?.data || "Đã xảy ra lỗi khi lấy danh sách đơn vị vận chuyển";
        }
    }
);

const vanChuyenApi = {
    tinhPhiVanChuyen,
    fetchDonViVanChuyen
};

export default vanChuyenApi;