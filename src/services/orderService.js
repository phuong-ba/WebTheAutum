
import baseUrl from "@/api/instance";
import { createAsyncThunk } from "@reduxjs/toolkit";

// ĐÚNG: nhận tham số orderRequest từ component
export const addOrder = createAsyncThunk(
    "order/addOrder",
    async (orderRequest, { rejectWithValue }) => {
        try {
            const response = await baseUrl.post("orders/place-order", orderRequest);

            console.log("Đặt hàng thành công:", response.data);
            return response.data; // { success: true, message: "...", data: { hoaDon, paymentUrl } }
        } catch (error) {
            console.error("Lỗi đặt hàng:", error.response?.data);
            // Trả về lỗi chi tiết để component bắt được
            return rejectWithValue(error.response?.data || { message: "Đặt hàng thất bại!" });
        }
    }
);

export const searchOrder = createAsyncThunk(
    "order/searchOrder",
    async (searchText) => {

        const response = await baseUrl.get(`hoa-don?searchText=${searchText}`);
        return response.data;

    }
);
export const orderDetail = createAsyncThunk(
    "order/orderDetail",
    async (id) => {
        const response = await baseUrl.get(`hoa-don/detail/${id}`);
        return response.data;

    }
);