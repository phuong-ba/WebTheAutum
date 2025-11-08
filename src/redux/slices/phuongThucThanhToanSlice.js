import { fetchPhuongThuc } from "@/services/phuongThucThanhToanService";
import { createSlice } from "@reduxjs/toolkit";

const chucVuSlice = createSlice({
  name: "phuongThucThanhToan",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhuongThuc.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchPhuongThuc.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchPhuongThuc.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default chucVuSlice.reducer;
