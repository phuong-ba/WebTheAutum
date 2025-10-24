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


    // ⭐ THÊM METHOD NÀY
  generateMaHoaDon() {
    return axios.get(`${API_URL}/generate-ma`);
  },

  
  // ✅ Lấy danh sách phiếu giảm giá (điều chỉnh theo API của bạn)
  getAllPhieuGiamGia: () => {
    return axios.get('http://localhost:8080/api/phieu-giam-gia');
  },

   getAllProducts: () => {
    return axios.get('http://localhost:8080/api/chi-tiet-san-pham');
  },

updateStatus(id, trangThai) {
  return axios.put(`${API_URL}/${id}/trang-thai`, null, {
    params: { trangThai: trangThai }
  });
}





};

export default hoaDonApi;