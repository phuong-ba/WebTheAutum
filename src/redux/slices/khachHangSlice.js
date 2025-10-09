import { fetchAllKhachHang } from "@/services/khachHangService";
import { createSlice } from "@reduxjs/toolkit";

const khachHangSlice = createSlice({
  name: "khachHang",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllKhachHang.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchAllKhachHang.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchAllKhachHang.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default khachHangSlice.reducer;
