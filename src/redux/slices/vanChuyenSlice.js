import { createSlice } from '@reduxjs/toolkit';
import { tinhPhiVanChuyen, fetchDonViVanChuyen } from '@/services/vanChuyenService';

const vanChuyenSlice = createSlice({
  name: 'vanChuyen',
  initialState: {
    phiVanChuyen: 0,
    donViVanChuyen: [],
    loading: false,
    error: null,
    selectedShipping: 'GHN'
  },
  reducers: {
    setSelectedShipping: (state, action) => {
      state.selectedShipping = action.payload;
    },
    resetShippingFee: (state) => {
      state.phiVanChuyen = 0;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(tinhPhiVanChuyen.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(tinhPhiVanChuyen.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.phiVanChuyen = action.payload.phiVanChuyen;
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(tinhPhiVanChuyen.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchDonViVanChuyen.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDonViVanChuyen.fulfilled, (state, action) => {
        state.loading = false;
        state.donViVanChuyen = action.payload;
      })
      .addCase(fetchDonViVanChuyen.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.donViVanChuyen = ['GHN', 'GHTK'];
      });
  }
});

export const { setSelectedShipping, resetShippingFee, clearError } = vanChuyenSlice.actions;
export default vanChuyenSlice.reducer;