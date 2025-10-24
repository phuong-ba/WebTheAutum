import axios from "axios";

const API_URL = "http://localhost:8080/api/dot-giam-gia";

export const getAllDotGiamGia = () => axios.get(API_URL);

export const getDotGiamGiaById = (id) => axios.get(`${API_URL}/${id}`);

export const createDotGiamGia = (data) => axios.post(API_URL, data);

export const updateDotGiamGia = (id, data) =>
  axios.put(`${API_URL}/${id}`, data);

export const deleteDotGiamGia = (id) => axios.delete(`${API_URL}/${id}`);
