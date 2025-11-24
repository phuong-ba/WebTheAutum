import { endGiaoCa, fetchCaDangHoatDong, startGiaoCa } from "@/services/giaoCaService";
import { fetchNhanVien, searchNhanVien } from "@/services/nhanVienService";
import { createSlice } from "@reduxjs/toolkit";

const giaoCaSlice = createSlice({
  name: "giaoca",
  initialState: {
    status: "idle",
    currentShift: null,
    newDetail: null,
    error: null,
  },
  reducers: {

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCaDangHoatDong.pending, (state) => { state.loading = true; })
      .addCase(fetchCaDangHoatDong.fulfilled, (state, action) => {
        state.loading = false;
        state.currentShift = action.payload;
      })

  },
});
export default giaoCaSlice.reducer;
