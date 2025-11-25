import { configureStore } from "@reduxjs/toolkit";

import nhanVienSlice from "../slices/nhanVienSlice";
import chucvuSlice from "../slices/chucVuSlice";
import vanChuyenReducer from '../slices/vanChuyenSlice';
import phieuGiamGiaSlice from "../slices/phieuGiamGiaSlice";
import khachHangSlice from "../slices/khachHangSlice";
import dotGiamGiaSilce from "../slices/DotGiamGiaSlice";
import sanPhamSlice from "../slices/sanPhamSlice";
import chiTietSanPhamSice from "../slices/chiTietSanPhamSlice";
import giamGiaKhachHangSlice from "../slices/giamGiaKhachHangSlice";
import phuongThucThanhToanSlice from "../slices/phuongThucThanhToanSlice";
import giaoCaSlice from "../slices/giaoCaSlice";

const store = configureStore({
  reducer: {
    nhanvien: nhanVienSlice,
    chucvu: chucvuSlice,
    phieuGiamGia: phieuGiamGiaSlice,
    khachHang: khachHangSlice,
    dotGiamGia: dotGiamGiaSilce,
    sanPham: sanPhamSlice,
    chiTietSanPham: chiTietSanPhamSice,
    giamGiaKhachHang: giamGiaKhachHangSlice,
    phuongThucThanhToan: phuongThucThanhToanSlice,
    giaoCa: giaoCaSlice,
    vanChuyen: vanChuyenReducer,
  },
});

export default store;
