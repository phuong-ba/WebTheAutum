import { configureStore } from "@reduxjs/toolkit";

import nhanVienSlice from "../slices/nhanVienSlice";
import chucvuSlice from "../slices/chucVuSlice";

import phieuGiamGiaSlice from "../slices/phieuGiamGiaSlice";
import khachHangSlice from "../slices/khachHangSlice";

const store = configureStore({
  reducer: {
    nhanvien: nhanVienSlice,
    chucvu: chucvuSlice,
    phieuGiamGia: phieuGiamGiaSlice,
    khachHang: khachHangSlice,
  },
});

export default store;
