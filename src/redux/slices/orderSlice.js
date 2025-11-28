import { fetchChiTietSanPham, getChiTietSanPhamBySanPham } from "@/services/chiTietSanPhamService";
import { orderDetail, searchOrder } from "@/services/orderService";
import { createSlice } from "@reduxjs/toolkit";

const orderSlice = createSlice({
    name: "order",
    initialState: {
        status: "idle",
        data: [],
        dataDetail: [],
        newDetail: null,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(searchOrder.pending, (state, action) => {
                state.status = "pending";
            })
            .addCase(searchOrder.fulfilled, (state, action) => {
                state.status = "successfully";
                state.data = action.payload.content || [];
            })
            .addCase(searchOrder.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            }).addCase(orderDetail.pending, (state, action) => {
                state.status = "pending";
            })
            .addCase(orderDetail.fulfilled, (state, action) => {
                state.status = "successfully";
                state.dataDetail = action.payload || [];
                console.log("🚀 ~ action.payload:", action.payload)
            })
            .addCase(orderDetail.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            })
    },
});
export default orderSlice.reducer;
