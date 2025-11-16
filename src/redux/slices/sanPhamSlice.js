import { fetchSanPham } from "@/services/sanPhamService";
import { createSlice } from "@reduxjs/toolkit";

const sanPhamSlice = createSlice({
  name: "sanPham",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSanPham.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchSanPham.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchSanPham.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default sanPhamSlice.reducer;
