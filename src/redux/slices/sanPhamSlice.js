import { fetchBanChay, fetchDanhMuc, fetchSanPham, fetchSanPhamDetail } from "@/services/sanPhamService";
import { createSlice } from "@reduxjs/toolkit";

const sanPhamSlice = createSlice({
  name: "sanPham",
  initialState: {
    status: "idle",
    data: [],
    dataDetail: null,
    dataDanhMuc: [],
    dataBanChay: [],
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
      }).addCase(fetchDanhMuc.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchDanhMuc.fulfilled, (state, action) => {
        state.status = "successfully";
        state.dataDanhMuc = action.payload.data || [];
      })
      .addCase(fetchDanhMuc.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      }).addCase(fetchSanPhamDetail.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchSanPhamDetail.fulfilled, (state, action) => {
        state.status = "successfully";
        state.dataDetail = action.payload.data;
      })
      .addCase(fetchSanPhamDetail.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      }).addCase(fetchBanChay.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchBanChay.fulfilled, (state, action) => {
        state.status = "successfully";
        state.dataBanChay = action.payload.data;
      })
      .addCase(fetchBanChay.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default sanPhamSlice.reducer;
