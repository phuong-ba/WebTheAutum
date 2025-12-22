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
import orderSlice from "../slices/orderSlice";
import mauSacSlice from "../slices/mauSacSlice";
import chatLieuSlice from "../slices/chatLieuSlice";
import xuatXuSlice from "../slices/xuatXuSlice";
import hangSlice from "../slices/hangSlice";
import kieuDangSlice from "../slices/kieuDangSlice";
import coAoSlice from "../slices/coAoSlice";
import tayAoSlice from "../slices/tayAoSlice";

const store = configureStore({
  reducer: {
    nhanvien: nhanVienSlice,
    chucvu: chucvuSlice,
    phieuGiamGia: phieuGiamGiaSlice,
    khachHang: khachHangSlice,
    dotGiamGia: dotGiamGiaSilce,
    sanPham: sanPhamSlice,
    order: orderSlice,
    chiTietSanPham: chiTietSanPhamSice,
    giamGiaKhachHang: giamGiaKhachHangSlice,
    phuongThucThanhToan: phuongThucThanhToanSlice,
    giaoCa: giaoCaSlice,
    vanChuyen: vanChuyenReducer,
    mausac: mauSacSlice,
    chatlieu: chatLieuSlice,
    xuatxu: xuatXuSlice,
    hang: hangSlice,
    kieudang: kieuDangSlice,
    coao: coAoSlice,
    tayao: tayAoSlice
  },
});

export default store;
