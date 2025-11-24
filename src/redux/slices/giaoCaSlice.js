import { createSlice } from "@reduxjs/toolkit";
import { startGiaoCa, endGiaoCa } from "@/services/giaoCaService";

const giaoCaSlice = createSlice({
  name: "giaoCa",
  initialState: {
    currentShift: null,  
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(startGiaoCa.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(startGiaoCa.fulfilled, (state, action) => {
      state.loading = false;
      state.currentShift = action.payload;
    });
    builder.addCase(startGiaoCa.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(endGiaoCa.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(endGiaoCa.fulfilled, (state, action) => {
      state.loading = false;
      state.currentShift = null;
    });
    builder.addCase(endGiaoCa.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default giaoCaSlice.reducer;
