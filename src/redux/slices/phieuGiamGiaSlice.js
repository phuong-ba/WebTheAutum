import { fetchPhieuGiamGia } from "@/services/phieuGiamGiaService";
import { createSlice } from "@reduxjs/toolkit";

const phieuGiamGiaSlice = createSlice({
  name: "phieuGiamGia",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhieuGiamGia.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchPhieuGiamGia.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchPhieuGiamGia.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default phieuGiamGiaSlice.reducer;
