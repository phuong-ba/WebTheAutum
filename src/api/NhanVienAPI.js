import axios from 'axios';

const API_URL = 'http://localhost:8080/api/nhan-vien';

const nhanVienApi = {
  getAll() {
    return axios.get(API_URL);
  }
};

export default nhanVienApi;