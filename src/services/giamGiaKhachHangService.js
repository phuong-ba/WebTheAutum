import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAllGGKH = createAsyncThunk(
    "giam-gia-khach-hang",
    async (
    ) => {
        try {
            const response = await baseUrl.get(`giam-gia-khach-hang`);
            return response.data;
        } catch (error) {
            throw error.response?.data || "Đã xảy ra lỗi khi lấy dữ liệu";
        }
    }
);

export const removeCustomerFromDiscount = async (discountId, customerId) => {
    try {
        const response = await baseUrl.delete(`giam-gia-khach-hang/${discountId}/customer/${customerId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || "Đã xảy ra lỗi khi xoá khách hàng khỏi giảm giá";
    }
};


