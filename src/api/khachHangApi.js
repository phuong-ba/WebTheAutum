import axios from "axios";

const API_URL = "http://localhost:8080/api/khach-hang";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  withCredentials: true,
});

export const khachHangApi = {
  getAll: async () => {
    const res = await axios.get(`${API_URL}/all`, authHeader());
    return res.data;
  },
  getById: async (id) => {
    const res = await axios.get(`${API_URL}/detail/${id}`, authHeader());
    return res.data;
  },
  
  create: async (data) => {
    const res = await axios.post(`${API_URL}/add`, data, authHeader());
    return res.data;
  },
  update: async (id, data) => {
    const res = await axios.put(`${API_URL}/update/${id}`, data, authHeader());
    return res.data;
  },
  delete: async (id) => {
    const res = await axios.delete(`${API_URL}/delete/${id}`, authHeader());
    return res.data;
  },
  search: async (keyword) => {
    const res = await axios.get(`${API_URL}/search`, {
      ...authHeader(),
      params: { keyword },
    });
    return res.data;
  },
  filter: async (gioiTinh, trangThai) => {
    const res = await axios.get(`${API_URL}/filter`, {
      ...authHeader(),
      params: { gioiTinh, trangThai },
    });
    return res.data;
  },
  checkEmailAndSDt: async (email, sdt) => {
    const res = await axios.get(`${API_URL}/check`, {
      params: { email, sdt },
      ...authHeader(),
    });
    return res.data;
  },
};
