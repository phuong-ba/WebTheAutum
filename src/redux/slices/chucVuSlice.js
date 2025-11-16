import { fetchAllChucVu } from "@/services/chucVuService";
import { createSlice } from "@reduxjs/toolkit";

const chucVuSlice = createSlice({
  name: "chucvu",
  initialState: {
    status: "idle",
    data: [],
    newDetail: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllChucVu.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchAllChucVu.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
      })
      .addCase(fetchAllChucVu.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export default chucVuSlice.reducer;
