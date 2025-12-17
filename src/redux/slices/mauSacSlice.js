import { fetchMauSac } from "@/services/mauSacService";
import { fetchNhanVien, searchNhanVien } from "@/services/nhanVienService";
import { createSlice } from "@reduxjs/toolkit";

const mauSacSlice = createSlice({
  name: "mausac",
  initialState: {
    status: "idle",
    data: [],
    totalElement: 0,
    number: 0,
    size: 5,
    newDetail: null,
    error: null,
  },
  reducers: {

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMauSac.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(fetchMauSac.fulfilled, (state, action) => {
        state.status = "successfully";
        state.data = action.payload.data || [];
        state.totalElement = action.payload.totalElements;
        state.number = action.payload.number;
        state.size = action.payload.size;
      })
      .addCase(fetchMauSac.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
  },
});
export const { changePage } = mauSacSlice.actions;
export default mauSacSlice.reducer;
