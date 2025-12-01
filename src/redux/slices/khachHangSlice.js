import { fetchAllKhachHang, getByIdKhachHang } from "@/services/khachHangService";
import { createSlice } from "@reduxjs/toolkit";

const khachHangSlice = createSlice({
  name: "khachHang",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null, dataById: null,
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
      }).addCase(getByIdKhachHang.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(getByIdKhachHang.fulfilled, (state, action) => {
        state.status = "successfully";
        state.dataById = action.payload || [];
        console.log("🚀 ~ action.payload:", action.payload)
      })
      .addCase(getByIdKhachHang.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default khachHangSlice.reducer;
