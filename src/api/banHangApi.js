import axios from 'axios';

const BAN_HANG_API_URL = 'http://localhost:8080/api/ban-hang';

const banHangApi = {
  createHoaDonMoi: (idNhanVien = null) => 
    axios.post(`${BAN_HANG_API_URL}/tao-hoa-don?idNhanVien=${idNhanVien || ''}`),
  
  addSanPham: (idHoaDon, idChiTietSanPham, soLuong = 1) =>
    axios.post(`${BAN_HANG_API_URL}/them-san-pham?idHoaDon=${idHoaDon}&idChiTietSanPham=${idChiTietSanPham}&soLuong=${soLuong}`),
  
  xoaSanPham: (idHoaDonChiTiet) =>
    axios.delete(`${BAN_HANG_API_URL}/xoa-san-pham/${idHoaDonChiTiet}`),
  
  thanhToan: (idHoaDon, khachHangInfo) => {
    const params = new URLSearchParams();
    params.append('idHoaDon', idHoaDon);
    if (khachHangInfo.tenKhachHang) params.append('tenKhachHang', khachHangInfo.tenKhachHang);
    if (khachHangInfo.sdt) params.append('sdt', khachHangInfo.sdt);
    
    return axios.post(`${BAN_HANG_API_URL}/thanh-toan?${params.toString()}`);
  },

  checkoutCart: (cart, idNhanVien = null, tenKhachHang = null, sdt = null) => {
    return axios.post(`${BAN_HANG_API_URL}/checkout-cart`, cart, {
      params: { idNhanVien, tenKhachHang, sdt }
    });
  },
  
  getHoaDonById: (id) =>
    axios.get(`${BAN_HANG_API_URL}/hoa-don/${id}`),
  
  getHoaDonChoThanhToan: () =>
    axios.get(`${BAN_HANG_API_URL}/hoa-don-cho-thanh-toan`)
};

export default banHangApi;
