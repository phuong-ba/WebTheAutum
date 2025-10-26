import axios from 'axios';

const API_URL = 'http://localhost:8080/api/chi-tiet-san-pham';

const chiTietSanPhamApi = {
  getAll() {
    return axios.get(API_URL);
  },
  
  getById(id) {
    return axios.get(`${API_URL}/${id}`);
  },
  
  getBySanPhamId(sanPhamId) {
    return axios.get(`${API_URL}/san-pham/${sanPhamId}`);
  }
};

export default chiTietSanPhamApi;