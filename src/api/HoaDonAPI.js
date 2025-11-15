import axios from 'axios';

const API_URL = 'http://localhost:8080/api/hoa-don';

const hoaDonApi = {
  getAllHoaDon(page = 0, size = 5) {
    return axios.get(API_URL, {
      params: { page, size }
    });
  },

  getDetail: (id) => {
    return axios.get(`${API_URL}/detail/${id}`);
  },

  canEdit: (id) => {
    return axios.get(`${API_URL}/${id}/can-edit`);
  },

  updateHoaDon: (id, data) => {
    return axios.put(`${API_URL}/${id}`, data);
  },

  getById(id) {
    return axios.get(`${API_URL}/${id}`);
  },

  update(id, hoaDon) {
    return axios.put(`${API_URL}/${id}`, hoaDon, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  
  canEditShippingStatus: (id) => {
    return axios.get(`${API_URL}/${id}/can-edit-shipping`);
  },

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

  exportExcel() {
    return axios.get(`${API_URL}/export`, {
      responseType: 'blob'
    });
  },

  printInvoices(invoiceIds) {
    return axios.post(`${API_URL}/print`, invoiceIds, {
      responseType: 'blob'
    });
  },

  generateMaHoaDon() {
    return axios.get(`${API_URL}/generate-ma`);
  },

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
  },

  updateService: (invoiceId, loaiHoaDon) => {
    return axios.put(`${API_URL}/${invoiceId}/service`, {
      loaiHoaDon
    });
  },

 getLichSu: (id) => {
    return axios.get(`${API_URL}/${id}/lich-su`);
  },

sendEmail: (id, data) => {
  return axios.post(`${API_URL}/send-email/${id}`, data);
},

create(hoaDon) {
  return axios.post(`${API_URL}/add`, hoaDon, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  },

  createAndPayWithVNPAY(hoaDon) {
  return axios.post(`${API_URL}/create-and-pay-vnpay`, hoaDon, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  },
  

};

export default hoaDonApi;