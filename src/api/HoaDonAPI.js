import baseUrl from "./instance";

const hoaDonApi = {
  getAllHoaDon(page = 0, size = 5) {
    return baseUrl.get("hoa-don", {
      params: { page, size }
    });
  },

  getDetail: (id) => {
    return baseUrl.get(`hoa-don/detail/${id}`);
  },

  canEdit: (id) => {
    return baseUrl.get(`hoa-don/${id}/can-edit`);
  },

  updateHoaDon: (id, data) => {
    return baseUrl.put(`hoa-don/${id}`, data);
  },

  getById(id) {
    return baseUrl.get(`hoa-don/${id}`);
  },

  update(id, hoaDon) {
    return baseUrl.put(`hoa-don/${id}`, hoaDon);
  },

  canEditShippingStatus: (id) => {
    return baseUrl.get(`hoa-don/${id}/can-edit-shipping`);
  },

  searchAndFilter(params) {
    const cleanParams = {};

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    });

    return baseUrl.get("hoa-don", {
      params: cleanParams
    });
  },

  exportExcel() {
    return baseUrl.get("hoa-don/export", {
      responseType: 'blob'
    });
  },

  printInvoices(invoiceIds) {
    return baseUrl.post("hoa-don/print", invoiceIds, {
      responseType: 'blob'
    });
  },

  generateMaHoaDon() {
    return baseUrl.get("hoa-don/generate-ma");
  },

  getAllPhieuGiamGia: () => {
    return baseUrl.get("phieu-giam-gia");
  },

  getAllProducts: () => {
    return baseUrl.get("chi-tiet-san-pham");
  },

  updateStatus(id, trangThai) {
    return baseUrl.put(`hoa-don/${id}/trang-thai`, null, {
      params: { trangThai }
    });
  },

  updateService: (invoiceId, loaiHoaDon) => {
    return baseUrl.put(`hoa-don/${invoiceId}/service`, {
      loaiHoaDon
    });
  },

  getLichSu: (id) => {
    return baseUrl.get(`hoa-don/${id}/lich-su`);
  },

  sendEmail: (id, data) => {
    return baseUrl.post(`hoa-don/send-email/${id}`, data);
  },

  create(hoaDon) {
    return baseUrl.post("hoa-don/add", hoaDon);
  },

  getLichSuThanhToan: (id) => {
    return baseUrl.get(`hoa-don/${id}/lich-su-thanh-toan`);
  },

  xoaChiTietSanPham: (idHoaDon, idChiTietSanPham) => {
    return baseUrl.delete(`hoa-don/${idHoaDon}/chi-tiet/${idChiTietSanPham}`);
  },

  kiemTraHoanTien: (id) => {
    return baseUrl.get(`hoa-don/${id}/kiem-tra-hoan-tien`);
  },

  hoanTienHoaDon: (id, data) => {
    return baseUrl.post(`hoa-don/${id}/hoan-tien`, data);
  },

  getLichSuHoanTien: (id) => {
    return baseUrl.get(`hoa-don/${id}/lich-su-hoan-tien`);
  },

  getLyDoHoanTienMau: () => {
    return baseUrl.get("hoa-don/ly-do-hoan-tien-mau");
  },

  exportBaoCaoHoanTien: (tuNgay, denNgay) => {
    return baseUrl.get("hoa-don/bao-cao-hoan-tien", {
      params: {
        tuNgay: tuNgay ? tuNgay.toISOString().split('T')[0] : null,
        denNgay: denNgay ? denNgay.toISOString().split('T')[0] : null
      },
      responseType: 'blob'
    });
  },

  getHoaDonCoTheHoanTien: (page = 0, size = 10) => {
    return baseUrl.get("hoa-don/co-the-hoan-tien", {
      params: { page, size }
    });
  },

  createHoaDonRong(hoaDon) {
    return baseUrl.post("hoa-don/tao-hoa-don-rong", hoaDon);
  },

  getHoaDonCho () {
  return baseUrl.get("hoa-don/hoa-don-cho?trangThai=5");
  },

  deleteHoaDon (id) {
  return baseUrl.delete(`hoa-don/${id}`);
  },

  updateHoaDonRong: (id, data) => {
    return baseUrl.put(`hoa-don/update-hoa-don/${id}`, data);
  },

};

export default hoaDonApi;