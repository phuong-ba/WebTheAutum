import { fetchChiTietSanPham, getChiTietSanPhamBySanPham } from "@/services/chiTietSanPhamService";
import { createSlice } from "@reduxjs/toolkit";

const chiTietSanPhamSlice = createSlice({
  name: "chiTietSanPham",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
    dataDetail: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChiTietSanPham.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchChiTietSanPham.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchChiTietSanPham.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(getChiTietSanPhamBySanPham.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(getChiTietSanPhamBySanPham.fulfilled, (state, action) => {
        state.status = "successfully";
        state.dataDetail = action.payload.data || [];
      })
      .addCase(getChiTietSanPhamBySanPham.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default chiTietSanPhamSlice.reducer;
