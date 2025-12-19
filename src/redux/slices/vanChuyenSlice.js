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
      // Tìm phí tương ứng với đơn vị được chọn
      const selectedFee = state.shippingFees.find(
        fee => (fee.code || fee.ma || fee.id) === action.payload
      );
      if (selectedFee) {
        state.phiVanChuyen = selectedFee.phiVanChuyen || 0;
      }
    },
    resetShippingFee: (state) => {
      state.phiVanChuyen = 0;
      state.shippingFees = []; // Reset danh sách phí
    },
    setShippingFees: (state, action) => {
      state.shippingFees = action.payload; // THÊM REDUCER MỚI
      // Cập nhật phí vận chuyển nếu đã có đơn vị được chọn
      if (state.selectedShipping) {
        const selectedFee = action.payload.find(
          fee => (fee.code || fee.ma || fee.id) === state.selectedShipping
        );
        if (selectedFee) {
          state.phiVanChuyen = selectedFee.phiVanChuyen || 0;
        }
      }
    },
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

export const { setSelectedShipping, resetShippingFee, setShippingFees } = vanChuyenSlice.actions;
export default vanChuyenSlice.reducer;