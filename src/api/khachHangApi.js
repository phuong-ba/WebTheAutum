import axios from "axios";

const API_URL = "http://localhost:8080/api/khachhang";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const khachHangApi = {
  getAll: async () => {
    const res = await axios.get(API_URL, authHeader());
    return res.data;
  },
  getById: async (id) => {
    const res = await axios.get(`${API_URL}/${id}`, authHeader());
    return res.data;
  },
  create: async (data) => {
    const res = await axios.post(API_URL, data, authHeader());
    return res.data;
  },
  update: async (id, data) => {
    const res = await axios.put(`${API_URL}/${id}`, data, authHeader());
    return res.data;
  },
  delete: async (id) => {
    const res = await axios.delete(`${API_URL}/${id}`, authHeader());
    return res.data;
  },
};
