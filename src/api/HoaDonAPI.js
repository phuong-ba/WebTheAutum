import axios from 'axios';

const API_URL = 'http://localhost:8080/api/hoa-don';

const hoaDonApi = {
  // Lấy danh sách hóa đơn có phân trang
  getAllHoaDon(page = 0, size = 5) {
    return axios.get(API_URL, {
      params: { page, size }
    });
  },

  getDetail: (id) => {
    return axios.get(`${API_URL}/detail/${id}`);
  },

  // ✅ Kiểm tra có thể sửa không
  canEdit: (id) => {
    return axios.get(`${API_URL}/${id}/can-edit`);
  },

  // ✅ Cập nhật hóa đơn
  updateHoaDon: (id, data) => {
    return axios.put(`${API_URL}/${id}`, data);
  },

  // Lấy hóa đơn theo ID
  getById(id) {
    return axios.get(`${API_URL}/${id}`);
  },

  // Cập nhật hóa đơn
  update(id, hoaDon) {
    return axios.put(`${API_URL}/${id}`, hoaDon, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  // Tìm kiếm/Lọc hóa đơn
  searchAndFilter(params) {
    const cleanParams = {};

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    });

    console.log('📤 Gửi params:', cleanParams);

    return axios.get(`${API_URL}`, {
      params: cleanParams
    });
  },

  // Xuất Excel
  exportExcel() {
    return axios.get(`${API_URL}/export`, {
      responseType: 'blob'
    });
  },

  // In danh sách
  printInvoices(invoiceIds) {
    return axios.post(`${API_URL}/print`, invoiceIds, {
      responseType: 'blob'
    });
  },

  // ⭐ Generate mã hóa đơn
  generateMaHoaDon() {
    return axios.get(`${API_URL}/generate-ma`);
  },

  // ✅ Lấy danh sách phiếu giảm giá
  getAllPhieuGiamGia: () => {
    return axios.get('http://localhost:8080/api/phieu-giam-gia');
  },

  getAllProducts: () => {
    return axios.get('http://localhost:8080/api/chi-tiet-san-pham');
  },

  // ✅ Cập nhật trạng thái
  updateStatus(id, trangThai) {
    return axios.put(`${API_URL}/${id}/trang-thai`, null, {
      params: { trangThai: trangThai }
    });
  },

  // ⭐ FIX: Cập nhật dịch vụ (loaiHoaDon)
  updateService: (invoiceId, loaiHoaDon) => {
    return axios.put(`${API_URL}/${invoiceId}/service`, {
      loaiHoaDon
    });
  },

 getLichSu: (id) => {
    return axios.get(`${API_URL}/${id}/lich-su`);
  },

};

export default hoaDonApi;