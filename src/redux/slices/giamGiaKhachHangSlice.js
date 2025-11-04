import { fetchAllGGKH } from "@/services/giamGiaKhachHangService";
import { createSlice } from "@reduxjs/toolkit";

const giamGiaKhachHangSlice = createSlice({
  name: "giamGiaKhachHang",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllGGKH.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchAllGGKH.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchAllGGKH.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default giamGiaKhachHangSlice.reducer;
