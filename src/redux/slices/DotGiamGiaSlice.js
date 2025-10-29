import { fetchDotGiamGia,searchDotGiamGia } from "@/services/dotGiamGiaService";
import { createSlice } from "@reduxjs/toolkit";

const dotGiamGiaSlice = createSlice({
  name: "dotGiamGia",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
  },
  reducers: {
    prependItem: (state, action) => {
      if (action.payload) {
        state.data = [action.payload, ...state.data];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDotGiamGia.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchDotGiamGia.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchDotGiamGia.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(searchDotGiamGia.pending, (state) => {
        state.status = "pending";
        state.loading = true;
      })
      .addCase(searchDotGiamGia.fulfilled, (state, action) => {
        state.status = "successfully";
        state.loading = false;
        state.data = action.payload.data || action.payload || [];
      })
      .addCase(searchDotGiamGia.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.error.message;
      });
  },
});
export const { prependItem } = dotGiamGiaSlice.actions;
export default dotGiamGiaSlice.reducer;
